// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TrovePilotReceiver} from "../src/TrovePilotReceiver.sol";
import {IERC20, IAavePool, IAaveOracle} from "../src/interfaces.sol";

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
        allowance[msg.sender][spender] = amount; return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount; balanceOf[to] += amount; return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount; balanceOf[to] += amount; return true;
    }
}

contract MockOracle is IAaveOracle {
    uint256 public price = 1e8;
    function setPrice(uint256 next) external { price = next; }
    function getAssetPrice(address) external view returns (uint256) { return price; }
    function BASE_CURRENCY_UNIT() external pure returns (uint256) { return 1e8; }
}

contract MockPool is IAavePool {
    MockToken public immutable token;
    uint256 public collateral = 2_000e8;
    uint256 public debt = 1_000e8;
    uint256 public threshold = 8_000;
    uint256 public hf = 1.55e18;
    uint256 public lastRepay;
    address public lastBorrower;
    constructor(MockToken token_) { token = token_; }
    function setState(uint256 debt_, uint256 hf_) external { debt = debt_; hf = hf_; }
    function getUserAccountData(address) external view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return (collateral, debt, 0, threshold, 0, hf);
    }
    function repay(address, uint256 amount, uint256 mode, address borrower) external returns (uint256) {
        require(mode == 2);
        token.transferFrom(msg.sender, address(this), amount);
        lastRepay = amount;
        lastBorrower = borrower;
        return amount;
    }
}

contract TrovePilotReceiverTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant BORROWER = address(0xB0);
    address constant FORWARDER = address(0xF0);
    address constant WORKFLOW_OWNER = address(0xA0);
    bytes32 constant WORKFLOW_ID = keccak256("trovepilot");
    MockToken usdc;
    MockToken debtToken;
    MockOracle oracle;
    MockPool pool;
    TrovePilotReceiver receiver;

    function setUp() public {
        usdc = new MockToken();
        debtToken = new MockToken();
        oracle = new MockOracle();
        pool = new MockPool(usdc);
        receiver = new TrovePilotReceiver(
            address(pool), address(oracle), address(usdc), address(debtToken),
            FORWARDER, WORKFLOW_OWNER, WORKFLOW_ID
        );
        debtToken.mint(BORROWER, 1_000e6);
        usdc.mint(BORROWER, 500e6);
        vm.prank(BORROWER);
        usdc.approve(address(receiver), type(uint256).max);
        vm.prank(BORROWER);
        receiver.setRules(uint128(1.58e18), uint128(1.60e18), uint128(1.62e18), true);
        vm.prank(BORROWER);
        receiver.depositReserve(500e6);
    }

    function testLowHealthFactorRepaysToComputedCap() public {
        _report(bytes32("low"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 500e6);
        require(pool.lastRepay() == 0, "position formula says no repay for this state");
        pool.setState(1_100e8, 1.45e18);
        _report(bytes32("low2"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 500e6);
        require(pool.lastRepay() == 100e6, "incorrect repay");
        require(receiver.reserves(BORROWER) == 400e6, "reserve not debited");
    }

    function testSafeRangeSkips() public {
        pool.setState(1_000e8, 1.60e18);
        _report(bytes32("safe"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 500e6);
        require(pool.lastRepay() == 0, "unexpected repay");
    }

    function testUpperBandSkips() public {
        pool.setState(1_000e8, 1.70e18);
        _report(bytes32("upper"), TrovePilotReceiver.Action.NO_ACTION, block.timestamp + 60, 0);
        require(pool.lastRepay() == 0, "unexpected repay");
    }

    function testDuplicateIsIdempotent() public {
        pool.setState(1_100e8, 1.45e18);
        _report(bytes32("same"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 50e6);
        uint256 first = pool.lastRepay();
        _report(bytes32("same"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 50e6);
        require(pool.lastRepay() == first, "duplicate changed state");
    }

    function testExpiredSkips() public {
        vm.warp(100);
        _report(bytes32("old"), TrovePilotReceiver.Action.REPAY, 99, 500e6);
        require(pool.lastRepay() == 0, "expired report executed");
    }

    function testStaleBlockSkips() public {
        vm.roll(300);
        vm.prank(FORWARDER);
        receiver.onReport(
            _metadata(),
            abi.encode(TrovePilotReceiver.Instruction(
                BORROWER, TrovePilotReceiver.Action.REPAY, 1.45e18, 1, block.timestamp + 60, bytes32("stale"), 500e6
            ))
        );
        require(pool.lastRepay() == 0, "stale report executed");
    }

    function testMalformedReportReverts() public {
        vm.prank(FORWARDER);
        vm.expectRevert();
        receiver.onReport(_metadata(), hex"1234");
    }

    function testWrongWorkflowReverts() public {
        vm.prank(FORWARDER);
        vm.expectRevert();
        receiver.onReport(
            abi.encodePacked(bytes32("wrong"), bytes10(0), WORKFLOW_OWNER),
            _encoded(bytes32("wrong"), TrovePilotReceiver.Action.REPAY, block.timestamp + 60, 1e6)
        );
    }

    function testUnauthorizedForwarderReverts() public {
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
        return abi.encode(TrovePilotReceiver.Instruction(BORROWER, action, 1.45e18, block.number, expiry, id, amount));
    }
}
