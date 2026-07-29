// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, IComet} from "./interfaces.sol";

/// @notice CRE-controlled Compound III repayment reserve. Borrowers retain ownership of their positions.
contract TrovePilotReceiver {
    enum Action { NO_ACTION, REPAY }
    enum SkipReason { NONE, DUPLICATE, EXPIRED, STALE_BLOCK, DISABLED, SAFE_RANGE, UPPER_BAND, NO_RESERVE, NO_DEBT }

    struct Rules {
        uint128 lowerRatio;
        uint128 targetRatio;
        uint128 upperRatio;
        bool enabled;
    }

    struct Instruction {
        address borrower;
        Action action;
        uint256 observedRatio;
        uint256 sourceBlock;
        uint256 validUntil;
        bytes32 evaluationId;
        uint256 suggestedRepayAmount;
    }

    uint256 private constant FACTOR_SCALE = 1e18;
    IComet public immutable comet;
    IERC20 public immutable usdc;
    address public immutable collateralAsset;
    address public owner;
    address public forwarder;
    address public expectedWorkflowOwner;
    bytes32 public expectedWorkflowId;
    uint256 private unlocked = 1;
    uint256 public constant MAX_REPORT_BLOCK_AGE = 256;

    mapping(address => Rules) public rules;
    mapping(address => uint256) public reserves;
    mapping(bytes32 => bool) public consumedEvaluations;
    mapping(address => bytes32) public lastEvaluationId;

    error Unauthorized();
    error InvalidAddress();
    error InvalidRules();
    error InvalidMetadata();
    error InvalidReport();
    error TransferFailed();
    error ReentrantCall();

    event RulesUpdated(address indexed borrower, uint256 lowerRatio, uint256 targetRatio, uint256 upperRatio, bool enabled);
    event ReserveDeposited(address indexed borrower, uint256 amount);
    event ReserveWithdrawn(address indexed borrower, uint256 amount);
    event WorkflowAuthorizationUpdated(address indexed forwarder, address indexed workflowOwner, bytes32 workflowId);
    event InstructionAccepted(bytes32 indexed evaluationId, address indexed borrower, Action action, uint256 observedRatio);
    event InstructionSkipped(bytes32 indexed evaluationId, address indexed borrower, SkipReason reason, uint256 liveRatio);
    event RepaymentExecuted(bytes32 indexed evaluationId, address indexed borrower, uint256 amount, uint256 liveRatio);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (unlocked != 1) revert ReentrantCall();
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(
        address comet_,
        address collateralAsset_,
        address usdc_,
        address forwarder_,
        address workflowOwner_,
        bytes32 workflowId_
    ) {
        if (
            comet_ == address(0) || collateralAsset_ == address(0) || usdc_ == address(0)
                || forwarder_ == address(0)
        ) revert InvalidAddress();
        comet = IComet(comet_);
        collateralAsset = collateralAsset_;
        usdc = IERC20(usdc_);
        if (IComet(comet_).baseToken() != usdc_) revert InvalidAddress();
        if (IComet(comet_).getAssetInfoByAddress(collateralAsset_).asset != collateralAsset_) revert InvalidAddress();
        owner = msg.sender;
        _setWorkflowAuthorization(forwarder_, workflowOwner_, workflowId_);
        if (!IERC20(usdc_).approve(comet_, type(uint256).max)) revert TransferFailed();
    }

    function setRules(uint128 lowerRatio, uint128 targetRatio, uint128 upperRatio, bool enabled) external {
        if (lowerRatio <= FACTOR_SCALE || lowerRatio > targetRatio || targetRatio > upperRatio) revert InvalidRules();
        rules[msg.sender] = Rules(lowerRatio, targetRatio, upperRatio, enabled);
        emit RulesUpdated(msg.sender, lowerRatio, targetRatio, upperRatio, enabled);
    }

    function depositReserve(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidReport();
        reserves[msg.sender] += amount;
        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit ReserveDeposited(msg.sender, amount);
    }

    function withdrawReserve(uint256 amount) external nonReentrant {
        if (amount == 0 || amount > reserves[msg.sender]) revert InvalidReport();
        reserves[msg.sender] -= amount;
        if (!usdc.transfer(msg.sender, amount)) revert TransferFailed();
        emit ReserveWithdrawn(msg.sender, amount);
    }

    function setWorkflowAuthorization(address forwarder_, address workflowOwner_, bytes32 workflowId_) external onlyOwner {
        _setWorkflowAuthorization(forwarder_, workflowOwner_, workflowId_);
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        if (nextOwner == address(0)) revert InvalidAddress();
        owner = nextOwner;
    }

    /// @dev CRE metadata is packed as workflowId (32), workflowName (10), workflowOwner (20).
    function onReport(bytes calldata metadata, bytes calldata report) external nonReentrant {
        if (msg.sender != forwarder) revert Unauthorized();
        if (metadata.length < 62) revert InvalidMetadata();
        bytes32 workflowId;
        address workflowOwner;
        assembly {
            workflowId := calldataload(metadata.offset)
            workflowOwner := shr(96, calldataload(add(metadata.offset, 42)))
        }
        if (workflowId != expectedWorkflowId || workflowOwner != expectedWorkflowOwner) revert Unauthorized();
        if (report.length != 32 * 7) revert InvalidReport();

        Instruction memory instruction = abi.decode(report, (Instruction));
        if (instruction.borrower == address(0) || instruction.evaluationId == bytes32(0)) revert InvalidReport();
        _process(instruction);
    }

    function currentRatio(address borrower)
        public view returns (uint256 ratio, uint256 adjustedCollateralValue, uint256 debtValue)
    {
        IComet.AssetInfo memory asset = comet.getAssetInfoByAddress(collateralAsset);
        uint256 collateral = comet.collateralBalanceOf(borrower, collateralAsset);
        uint256 debt = comet.borrowBalanceOf(borrower);
        uint256 collateralPrice = comet.getPrice(asset.priceFeed);
        uint256 basePrice = comet.getPrice(comet.baseTokenPriceFeed());

        adjustedCollateralValue =
            collateral * collateralPrice / asset.scale * asset.borrowCollateralFactor / FACTOR_SCALE;
        debtValue = debt * basePrice / comet.baseScale();
        ratio = debtValue == 0 ? type(uint256).max : adjustedCollateralValue * FACTOR_SCALE / debtValue;
    }

    function previewRepay(address borrower) public view returns (uint256 amount, uint256 ratio) {
        Rules memory userRules = rules[borrower];
        uint256 adjustedCollateralValue;
        (ratio, adjustedCollateralValue,) = currentRatio(borrower);
        uint256 debt = comet.borrowBalanceOf(borrower);
        if (!userRules.enabled || ratio >= userRules.lowerRatio || debt == 0) return (0, ratio);

        uint256 basePrice = comet.getPrice(comet.baseTokenPriceFeed());
        uint256 targetDebt =
            adjustedCollateralValue * comet.baseScale() * FACTOR_SCALE / basePrice / userRules.targetRatio;
        if (debt <= targetDebt) return (0, ratio);
        amount = debt - targetDebt;
        if (amount > reserves[borrower]) amount = reserves[borrower];
    }

    function _process(Instruction memory instruction) private {
        if (consumedEvaluations[instruction.evaluationId]) {
            emit InstructionSkipped(instruction.evaluationId, instruction.borrower, SkipReason.DUPLICATE, 0);
            return;
        }
        consumedEvaluations[instruction.evaluationId] = true;
        lastEvaluationId[instruction.borrower] = instruction.evaluationId;

        Rules memory userRules = rules[instruction.borrower];
        (uint256 liveRatio,,) = currentRatio(instruction.borrower);
        uint256 debt = comet.borrowBalanceOf(instruction.borrower);
        emit InstructionAccepted(instruction.evaluationId, instruction.borrower, instruction.action, instruction.observedRatio);

        if (instruction.validUntil < block.timestamp) return _skip(instruction, SkipReason.EXPIRED, liveRatio);
        if (
            instruction.sourceBlock == 0 || instruction.sourceBlock > block.number
                || block.number - instruction.sourceBlock > MAX_REPORT_BLOCK_AGE
        ) return _skip(instruction, SkipReason.STALE_BLOCK, liveRatio);
        if (!userRules.enabled) return _skip(instruction, SkipReason.DISABLED, liveRatio);
        if (liveRatio >= userRules.upperRatio) return _skip(instruction, SkipReason.UPPER_BAND, liveRatio);
        if (liveRatio >= userRules.lowerRatio || instruction.action != Action.REPAY) {
            return _skip(instruction, SkipReason.SAFE_RANGE, liveRatio);
        }
        if (debt == 0) return _skip(instruction, SkipReason.NO_DEBT, liveRatio);
        (uint256 amount,) = previewRepay(instruction.borrower);
        if (amount == 0) return _skip(instruction, SkipReason.NO_RESERVE, liveRatio);
        if (instruction.suggestedRepayAmount != 0 && amount > instruction.suggestedRepayAmount) {
            amount = instruction.suggestedRepayAmount;
        }

        reserves[instruction.borrower] -= amount;
        uint256 debtBefore = debt;
        comet.supplyTo(instruction.borrower, address(usdc), amount);
        uint256 debtAfter = comet.borrowBalanceOf(instruction.borrower);
        uint256 repaid = debtBefore - debtAfter;
        emit RepaymentExecuted(instruction.evaluationId, instruction.borrower, repaid, liveRatio);
    }

    function _skip(Instruction memory instruction, SkipReason reason, uint256 liveRatio) private {
        emit InstructionSkipped(instruction.evaluationId, instruction.borrower, reason, liveRatio);
    }

    function _setWorkflowAuthorization(address forwarder_, address workflowOwner_, bytes32 workflowId_) private {
        if (forwarder_ == address(0) || workflowOwner_ == address(0) || workflowId_ == bytes32(0)) revert InvalidAddress();
        forwarder = forwarder_;
        expectedWorkflowOwner = workflowOwner_;
        expectedWorkflowId = workflowId_;
        emit WorkflowAuthorizationUpdated(forwarder_, workflowOwner_, workflowId_);
    }
}
