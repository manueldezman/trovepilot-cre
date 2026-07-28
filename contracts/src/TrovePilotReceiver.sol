// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, IAavePool, IAaveOracle} from "./interfaces.sol";

/// @notice CRE-controlled Aave V3 repayment reserve. Borrowers keep ownership of their Aave position.
contract TrovePilotReceiver {
    enum Action { NO_ACTION, REPAY }
    enum SkipReason { NONE, DUPLICATE, EXPIRED, STALE_BLOCK, DISABLED, SAFE_RANGE, UPPER_BAND, NO_RESERVE, NO_DEBT }

    struct Rules {
        uint128 lowerHF;
        uint128 targetHF;
        uint128 upperHF;
        bool enabled;
    }

    struct Instruction {
        address borrower;
        Action action;
        uint256 observedHealthFactor;
        uint256 sourceBlock;
        uint256 validUntil;
        bytes32 evaluationId;
        uint256 suggestedRepayAmount;
    }

    IAavePool public immutable pool;
    IAaveOracle public immutable oracle;
    IERC20 public immutable usdc;
    IERC20 public immutable variableDebtUSDC;
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

    event RulesUpdated(address indexed borrower, uint256 lowerHF, uint256 targetHF, uint256 upperHF, bool enabled);
    event ReserveDeposited(address indexed borrower, uint256 amount);
    event ReserveWithdrawn(address indexed borrower, uint256 amount);
    event WorkflowAuthorizationUpdated(address indexed forwarder, address indexed workflowOwner, bytes32 workflowId);
    event InstructionAccepted(bytes32 indexed evaluationId, address indexed borrower, Action action, uint256 observedHF);
    event InstructionSkipped(bytes32 indexed evaluationId, address indexed borrower, SkipReason reason, uint256 liveHF);
    event RepaymentExecuted(bytes32 indexed evaluationId, address indexed borrower, uint256 amount, uint256 liveHF);

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
        address pool_,
        address oracle_,
        address usdc_,
        address variableDebtUSDC_,
        address forwarder_,
        address workflowOwner_,
        bytes32 workflowId_
    ) {
        if (
            pool_ == address(0) || oracle_ == address(0) || usdc_ == address(0)
                || variableDebtUSDC_ == address(0) || forwarder_ == address(0)
        ) revert InvalidAddress();
        pool = IAavePool(pool_);
        oracle = IAaveOracle(oracle_);
        usdc = IERC20(usdc_);
        variableDebtUSDC = IERC20(variableDebtUSDC_);
        owner = msg.sender;
        _setWorkflowAuthorization(forwarder_, workflowOwner_, workflowId_);
        if (!IERC20(usdc_).approve(pool_, type(uint256).max)) revert TransferFailed();
    }

    function setRules(uint128 lowerHF, uint128 targetHF, uint128 upperHF, bool enabled) external {
        if (lowerHF <= 1e18 || lowerHF > targetHF || targetHF > upperHF) revert InvalidRules();
        rules[msg.sender] = Rules(lowerHF, targetHF, upperHF, enabled);
        emit RulesUpdated(msg.sender, lowerHF, targetHF, upperHF, enabled);
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

    function previewRepay(address borrower) public view returns (uint256 amount, uint256 healthFactor) {
        Rules memory userRules = rules[borrower];
        (uint256 collateralBase, uint256 debtBase,,, , uint256 hf) = pool.getUserAccountData(borrower);
        healthFactor = hf;
        if (!userRules.enabled || hf >= userRules.lowerHF || debtBase == 0) return (0, hf);

        (, , , uint256 liquidationThreshold,,) = pool.getUserAccountData(borrower);
        uint256 adjustedCollateralBase = collateralBase * liquidationThreshold / 10_000;
        uint256 targetDebtBase = adjustedCollateralBase * 1e18 / userRules.targetHF;
        if (debtBase <= targetDebtBase) return (0, hf);

        uint256 debtToRepayBase = debtBase - targetDebtBase;
        uint256 price = oracle.getAssetPrice(address(usdc));
        if (price == 0 || oracle.BASE_CURRENCY_UNIT() == 0) return (0, hf);
        // Aave account-data values and asset prices share the oracle's base-currency decimals.
        amount = _ceilDiv(debtToRepayBase * 1e6, price);
        uint256 debtBalance = variableDebtUSDC.balanceOf(borrower);
        if (amount > debtBalance) amount = debtBalance;
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
        (, uint256 debtBase,,, , uint256 liveHF) = pool.getUserAccountData(instruction.borrower);
        emit InstructionAccepted(instruction.evaluationId, instruction.borrower, instruction.action, instruction.observedHealthFactor);

        if (instruction.validUntil < block.timestamp) return _skip(instruction, SkipReason.EXPIRED, liveHF);
        if (
            instruction.sourceBlock == 0 || instruction.sourceBlock > block.number
                || block.number - instruction.sourceBlock > MAX_REPORT_BLOCK_AGE
        ) return _skip(instruction, SkipReason.STALE_BLOCK, liveHF);
        if (!userRules.enabled) return _skip(instruction, SkipReason.DISABLED, liveHF);
        if (liveHF >= userRules.upperHF) return _skip(instruction, SkipReason.UPPER_BAND, liveHF);
        if (liveHF >= userRules.lowerHF || instruction.action != Action.REPAY) {
            return _skip(instruction, SkipReason.SAFE_RANGE, liveHF);
        }
        if (debtBase == 0) return _skip(instruction, SkipReason.NO_DEBT, liveHF);
        (uint256 amount,) = previewRepay(instruction.borrower);
        if (amount == 0) return _skip(instruction, SkipReason.NO_RESERVE, liveHF);
        if (instruction.suggestedRepayAmount != 0 && amount > instruction.suggestedRepayAmount) {
            amount = instruction.suggestedRepayAmount;
        }

        reserves[instruction.borrower] -= amount;
        uint256 repaid = pool.repay(address(usdc), amount, 2, instruction.borrower);
        if (repaid < amount) reserves[instruction.borrower] += amount - repaid;
        emit RepaymentExecuted(instruction.evaluationId, instruction.borrower, repaid, liveHF);
    }

    function _skip(Instruction memory instruction, SkipReason reason, uint256 liveHF) private {
        emit InstructionSkipped(instruction.evaluationId, instruction.borrower, reason, liveHF);
    }

    function _setWorkflowAuthorization(address forwarder_, address workflowOwner_, bytes32 workflowId_) private {
        if (forwarder_ == address(0) || workflowOwner_ == address(0) || workflowId_ == bytes32(0)) revert InvalidAddress();
        forwarder = forwarder_;
        expectedWorkflowOwner = workflowOwner_;
        expectedWorkflowId = workflowId_;
        emit WorkflowAuthorizationUpdated(forwarder_, workflowOwner_, workflowId_);
    }

    function _ceilDiv(uint256 a, uint256 b) private pure returns (uint256) {
        return a == 0 ? 0 : (a - 1) / b + 1;
    }
}
