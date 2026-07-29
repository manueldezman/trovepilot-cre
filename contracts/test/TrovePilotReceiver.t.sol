// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TrovePilotReceiver} from "../src/TrovePilotReceiver.sol";
import {IERC20, IComet} from "../src/interfaces.sol";

interface Vm {
    function prank(address) external;
    function warp(uint256) external;
    function roll(uint256) external;
    function expectRevert() external;
}

contract MockToken is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockComet is IComet {
    MockToken public immutable token;
    address public immutable collateral;
    address public constant COLLATERAL_FEED = address(0xCA);
    address public constant BASE_FEED = address(0xBA);
    uint256 public collateralPrice = 1_000e8;
    uint256 public basePrice = 1e8;
    uint256 public lastRepay;
    address public lastBorrower;
    mapping(address => uint128) public collateralBalances;
    mapping(address => uint256) public debts;

    constructor(MockToken token_, address collateral_) {
        token = token_;
        collateral = collateral_;
    }

    function baseToken() external view returns (address) { return address(token); }
    function baseTokenPriceFeed() external pure returns (address) { return BASE_FEED; }
    function baseScale() external pure returns (uint256) { return 1e6; }
    function getPrice(address feed) external view returns (uint256) {
        return feed == COLLATERAL_FEED ? collateralPrice : basePrice;
    }
    function getAssetInfoByAddress(address asset) external view returns (AssetInfo memory) {
        require(asset == collateral);
        return AssetInfo(0, collateral, COLLATERAL_FEED, 1e8, 0.70e18, 0.75e18, 0.93e18, 35_000e8);
    }
    function collateralBalanceOf(address account, address asset) external view returns (uint128) {
        require(asset == collateral);
        return collateralBalances[account];
    }
    function borrowBalanceOf(address account) external view returns (uint256) { return debts[account]; }
    function supplyTo(address dst, address asset, uint256 amount) external {
        require(asset == address(token));
        token.transferFrom(msg.sender, address(this), amount);
        uint256 repaid = amount > debts[dst] ? debts[dst] : amount;
        debts[dst] -= repaid;
        lastRepay = repaid;
        lastBorrower = dst;
    }
    function setPosition(address account, uint128 collateralAmount, uint256 debt) external {
        collateralBalances[account] = collateralAmount;
        debts[account] = debt;
    }
    function setCollateralPrice(uint256 price) external { collateralPrice = price; }
}

contract TrovePilotReceiverTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant BORROWER = address(0xB0);
    address constant FORWARDER = address(0xF0);
    address constant WORKFLOW_OWNER = address(0xA0);
    address constant WBTC = address(0xBC);
    bytes32 constant WORKFLOW_ID = keccak256("trovepilot");
    MockToken usdc;
    MockComet comet;
    TrovePilotReceiver receiver;

    function setUp() public {
        usdc = new MockToken();
        comet = new MockComet(usdc, WBTC);
        receiver = new TrovePilotReceiver(
            address(comet), WBTC, address(usdc), FORWARDER, WORKFLOW_OWNER, WORKFLOW_ID
        );
        comet.setPosition(BORROWER, 1e8, 450e6);
        usdc.mint(BORROWER, 500e6);
        vm.prank(BORROWER);
        usdc.approve(address(receiver), type(uint256).max);
        vm.prank(BORROWER);
        receiver.setRules(uint128(1.58e18), uint128(1.60e18), uint128(1.62e18), true);
        vm.prank(BORROWER);
        receiver.depositReserve(500e6);
    }

    function testLowRatioRepaysToTarget() public {
        _report(bytes32("low"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 500e6);
        require(comet.lastRepay() == 12_500_000, "incorrect repayment");
        require(comet.debts(BORROWER) == 437_500_000, "target debt not restored");
        require(receiver.reserves(BORROWER) == 487_500_000, "reserve not debited");
        (uint256 ratio,,) = receiver.currentRatio(BORROWER);
        require(ratio == 1.60e18, "target ratio not restored");
    }

    function testSuggestedAmountCapsRepayment() public {
        _report(bytes32("cap"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 5e6);
        require(comet.lastRepay() == 5e6, "suggested cap ignored");
    }

    function testReserveCapsRepayment() public {
        vm.prank(BORROWER);
        receiver.withdrawReserve(495e6);
        _report(bytes32("reserve"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 500e6);
        require(comet.lastRepay() == 5e6, "reserve cap ignored");
    }

    function testSafeRangeSkips() public {
        comet.setPosition(BORROWER, 1e8, 437_500_000);
        _report(bytes32("safe"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 500e6);
        require(comet.lastRepay() == 0, "unexpected repay");
    }

    function testUpperBandSkips() public {
        comet.setPosition(BORROWER, 1e8, 400e6);
        _report(bytes32("upper"), TrovePilotReceiver.Action.NO_ACTION, block.timestamp + 60, 0);
        require(comet.lastRepay() == 0, "unexpected repay");
    }

    function testPriceDropChangesRatioAndRepayment() public {
        comet.setPosition(BORROWER, 1e8, 437_500_000);
        comet.setCollateralPrice(900e8);
        (uint256 amount, uint256 ratio) = receiver.previewRepay(BORROWER);
        require(ratio == 1.44e18, "live price not used");
        require(amount == 43_750_000, "price-adjusted repay incorrect");
    }

    function testDuplicateIsIdempotent() public {
        _report(bytes32("same"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 5e6);
        uint256 debt = comet.debts(BORROWER);
        _report(bytes32("same"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 5e6);
        require(comet.debts(BORROWER) == debt, "duplicate changed state");
    }

    function testExpiredAndStaleReportsSkip() public {
        vm.warp(100);
        _report(bytes32("old"), TrovePilotReceiver.Action.REPAY, 99, 500e6);
        require(comet.lastRepay() == 0, "expired report executed");

        vm.roll(300);
        vm.prank(FORWARDER);
        receiver.onReport(
            _metadata(),
            abi.encode(TrovePilotReceiver.Instruction(
                BORROWER, TrovePilotReceiver.Action.REPAY, 1.5e18, 1, block.timestamp + 60, bytes32("stale"), 500e6
            ))
        );
        require(comet.lastRepay() == 0, "stale report executed");
    }

    function testMalformedUnauthorizedAndWrongWorkflowRevert() public {
        vm.prank(FORWARDER);
        vm.expectRevert();
        receiver.onReport(_metadata(), hex"1234");

        vm.prank(FORWARDER);
        vm.expectRevert();
        receiver.onReport(
            abi.encodePacked(bytes32("wrong"), bytes10(0), WORKFLOW_OWNER),
            _encoded(bytes32("wrong"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 1e6)
        );

        vm.expectRevert();
        receiver.onReport(_metadata(), _encoded(bytes32("bad"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 1e6));
    }

    function testOnlyBorrowerCanWithdraw() public {
        vm.expectRevert();
        receiver.withdrawReserve(1e6);
        vm.prank(BORROWER);
        receiver.withdrawReserve(1e6);
        require(receiver.reserves(BORROWER) == 499e6);
    }

    function _report(bytes32 id, TrovePilotReceiver.Action action, uint256 expiry, uint256 amount) private {
        vm.prank(FORWARDER);
        receiver.onReport(_metadata(), _encoded(id, action, expiry, amount));
    }

    function _metadata() private pure returns (bytes memory) {
        return abi.encodePacked(WORKFLOW_ID, bytes10(0), WORKFLOW_OWNER);
    }

    function _encoded(bytes32 id, TrovePilotReceiver.Action action, uint256 expiry, uint256 amount)
        private view returns (bytes memory)
    {
        return abi.encode(TrovePilotReceiver.Instruction(BORROWER, action, 1.5e18, block.number, expiry, id, amount));
    }
}
