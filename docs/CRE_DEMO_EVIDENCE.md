# CRE Sepolia Broadcast Evidence

This document records a **local Chainlink CRE workflow simulation with Sepolia broadcast**. It does not
claim that the workflow was registered with or continuously hosted by a production DON.

## Reproducible source

| Evidence | Value |
| --- | --- |
| Git commit | Pending |
| Git tag | Pending (`cre-sepolia-demo-v1`) |
| CRE CLI version | `1.27.0` |
| Compressed workflow binary hash | `5254a6f166a04e7d0cc2186e59f1b331d500882139543862fbad115bd727b3b3` |
| Raw simulation WASM hash | `8108aa1c93875b21da4807ce749b9ade33ad385d9175ba69cab83fae04ee95bd` |
| Workflow configuration hash | `c137e1884633de28280a2af57d3f942768ceed25f9576f995f921817a01380b6` |
| Workflow ID/hash | `0x003adb9b51d50f00d86b770fb38b0cb75b1660698a5f069eacb382fab3df2b8a` |
| Simulator metadata workflow ID | `0x1111111111111111111111111111111111111111111111111111111111111111` |

## Sepolia execution

| Evidence | Value |
| --- | --- |
| Transaction signer / receiver owner | `0x6E5858D78b07f6D839d7D776d872Fc354b356AF5` |
| Simulator metadata workflow owner | `0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa` |
| Compound receiver | [`0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583`](https://sepolia.etherscan.io/address/0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583) |
| Receiver deployment transaction | [`0x58f9e52b27396466ca832ffa58b2f5e5690300974d203d24379b408d42fe2acb`](https://sepolia.etherscan.io/tx/0x58f9e52b27396466ca832ffa58b2f5e5690300974d203d24379b408d42fe2acb) |
| Forwarder-mismatch diagnostic | [`0x16291a5e6d31d64c34c8f04c80efe9d16cf7259f681aaf59c5fc2db3f73825f9`](https://sepolia.etherscan.io/tx/0x16291a5e6d31d64c34c8f04c80efe9d16cf7259f681aaf59c5fc2db3f73825f9) — no receiver execution |
| Metadata-mismatch diagnostic | [`0xfeff32ae4ba96c797241fbb491758f23bf5b0c5fd115124dd09500eadc6ef97b`](https://sepolia.etherscan.io/tx/0xfeff32ae4ba96c797241fbb491758f23bf5b0c5fd115124dd09500eadc6ef97b) — no receiver execution |
| Safe-range broadcast transaction | Pending |
| Controlled repayment transaction | Pending |
| Evaluation ID | Pending |
| Repaid USDC | Pending |

## Verification procedure

1. Check out the recorded Git commit and review the workflow, policy, and receiver source.
2. Verify the receiver source and constructor arguments on Etherscan.
3. Compare the recorded CRE binary/configuration/workflow hashes with the captured transcript.
4. Inspect the Sepolia receiver events for `InstructionAccepted`, `InstructionSkipped`, and
   `RepaymentExecuted`.
5. Verify that the receiver independently rereads Compound state and caps repayment by target ratio, live
   debt, and the borrower's deposited reserve.

Raw transcripts and SHA-256 checksums are stored under `evidence/runs/` after each demonstration run.

`cre workflow hash` hashes the Brotli-compressed deployment artifact when deriving the workflow ID. The
simulator displays the raw WASM hash, so the two binary hashes are expected to differ.
