# CRE Sepolia Broadcast Evidence

This document records a **local Chainlink CRE workflow simulation with Sepolia broadcast**. It does not
claim that the workflow was registered with or continuously hosted by a production DON.

## Reproducible source

| Evidence | Value |
| --- | --- |
| Workflow source commit | [`19a6cfd`](https://github.com/manueldezman/trovepilot-cre/commit/19a6cfd) |
| Git tag | `cre-sepolia-demo-v1` |
| CRE CLI version | `1.27.0` |
| Compressed workflow binary hash | `5254a6f166a04e7d0cc2186e59f1b331d500882139543862fbad115bd727b3b3` |
| Raw simulation WASM hash | `8108aa1c93875b21da4807ce749b9ade33ad385d9175ba69cab83fae04ee95bd` |
| Workflow configuration hash | `061ffdb7e5c630db4f13ee958b2f9a0483333cc1484a0610e24c7a9b5635824e` |
| Workflow ID/hash | `0x004154dddbcf8076fcb6a584cd7974933ddd25eecdc6aa13a35f7d20460f7903` |
| Simulator metadata workflow ID | `0x1111111111111111111111111111111111111111111111111111111111111111` |

## Sepolia execution

| Evidence | Value |
| --- | --- |
| Transaction signer / receiver owner | `0x6E5858D78b07f6D839d7D776d872Fc354b356AF5` |
| Simulator metadata workflow owner | `0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa` |
| Compound receiver | [`0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583`](https://sepolia.etherscan.io/address/0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583) |
| Verified receiver source | [Sepolia Blockscout](https://eth-sepolia.blockscout.com/address/0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583?tab=contract) |
| Receiver deployment transaction | [`0x58f9e52b27396466ca832ffa58b2f5e5690300974d203d24379b408d42fe2acb`](https://sepolia.etherscan.io/tx/0x58f9e52b27396466ca832ffa58b2f5e5690300974d203d24379b408d42fe2acb) |
| Forwarder-mismatch diagnostic | [`0x16291a5e6d31d64c34c8f04c80efe9d16cf7259f681aaf59c5fc2db3f73825f9`](https://sepolia.etherscan.io/tx/0x16291a5e6d31d64c34c8f04c80efe9d16cf7259f681aaf59c5fc2db3f73825f9) — no receiver execution |
| Metadata-mismatch diagnostic | [`0xfeff32ae4ba96c797241fbb491758f23bf5b0c5fd115124dd09500eadc6ef97b`](https://sepolia.etherscan.io/tx/0xfeff32ae4ba96c797241fbb491758f23bf5b0c5fd115124dd09500eadc6ef97b) — no receiver execution |
| Expiry-guard transaction | [`0xbed79bfe7ee985cd96527f44968aac0a65308a07796a0a079aacb11d7b50126a`](https://sepolia.etherscan.io/tx/0xbed79bfe7ee985cd96527f44968aac0a65308a07796a0a079aacb11d7b50126a) — `InstructionSkipped(EXPIRED)` |
| Safe-range broadcast transaction | Not submitted; the no-action path intentionally performs no chain write |
| Controlled repayment transaction | [`0x9677805924b2dd83598133caf65d54757fc3d89ddf5391db9f3f7d16f992a492`](https://sepolia.etherscan.io/tx/0x9677805924b2dd83598133caf65d54757fc3d89ddf5391db9f3f7d16f992a492) |
| Evaluation ID | `0x85f4de4c0e073c1095f3ea86d27b00f981fef36f88b05cb78d1015934b36be02` |
| Repaid USDC | `0.101487` |
| Final rules | `1.58 / 1.60 / 1.62`, enabled |
| Final receiver reserve | `0 USDC` |
| Successful raw transcript | [`evidence/runs/20260801T075120Z-broadcast/cre-transcript.txt`](../evidence/runs/20260801T075120Z-broadcast/cre-transcript.txt) |

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
