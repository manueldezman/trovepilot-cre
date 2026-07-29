// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TrovePilotReceiver} from "../src/TrovePilotReceiver.sol";

contract Deploy {
    address constant COMET = 0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e;
    address constant WBTC = 0xa035b9e130F2B1AedC733eEFb1C67Ba4c503491F;
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant SEPOLIA_FORWARDER = 0x15fC6ae953E024d975e77382eEeC56A9101f9F88;

    function deploy(address workflowOwner, bytes32 workflowId) external returns (TrovePilotReceiver) {
        return new TrovePilotReceiver(COMET, WBTC, USDC, SEPOLIA_FORWARDER, workflowOwner, workflowId);
    }
}
