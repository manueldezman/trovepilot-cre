// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TrovePilotReceiver} from "../src/TrovePilotReceiver.sol";

interface Vm {
    function envUint(string calldata name) external returns (uint256);
    function envAddress(string calldata name) external returns (address);
    function envBytes32(string calldata name) external returns (bytes32);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract Deploy {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant COMET = 0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e;
    address constant WBTC = 0xa035b9e130F2B1AedC733eEFb1C67Ba4c503491F;
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant SEPOLIA_FORWARDER = 0x15fC6ae953E024d975e77382eEeC56A9101f9F88;

    function run() external returns (TrovePilotReceiver receiver) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address workflowOwner = vm.envAddress("EXPECTED_WORKFLOW_OWNER");
        bytes32 workflowId = vm.envBytes32("EXPECTED_WORKFLOW_ID");
        vm.startBroadcast(deployerKey);
        receiver = new TrovePilotReceiver(COMET, WBTC, USDC, SEPOLIA_FORWARDER, workflowOwner, workflowId);
        vm.stopBroadcast();
    }

    function deploy(address workflowOwner, bytes32 workflowId) external returns (TrovePilotReceiver) {
        return new TrovePilotReceiver(COMET, WBTC, USDC, SEPOLIA_FORWARDER, workflowOwner, workflowId);
    }
}
