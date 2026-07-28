// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TrovePilotReceiver} from "../src/TrovePilotReceiver.sol";

contract Deploy {
    address constant POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    address constant ORACLE = 0x2da88497588bf89281816106C7259e31AF45a663;
    address constant USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
    address constant VARIABLE_DEBT_USDC = 0x36B5dE936eF1710E1d22EabE5231b28581a92ECc;
    address constant SEPOLIA_FORWARDER = 0x15fC6ae953E024d975e77382eEeC56A9101f9F88;

    function deploy(address workflowOwner, bytes32 workflowId) external returns (TrovePilotReceiver) {
        return new TrovePilotReceiver(
            POOL, ORACLE, USDC, VARIABLE_DEBT_USDC, SEPOLIA_FORWARDER, workflowOwner, workflowId
        );
    }
}
