# Sepolia deployments

| Item | Value |
| --- | --- |
| TrovePilotReceiver | [`0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583`](https://sepolia.etherscan.io/address/0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583) |
| Verified receiver source | [Sepolia Blockscout](https://eth-sepolia.blockscout.com/address/0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583?tab=contract) |
| Workflow owner | `0x6E5858D78b07f6D839d7D776d872Fc354b356AF5` |
| Workflow ID | `0x004154dddbcf8076fcb6a584cd7974933ddd25eecdc6aa13a35f7d20460f7903` |
| Deployment transaction | [`0x58f9e52b27396466ca832ffa58b2f5e5690300974d203d24379b408d42fe2acb`](https://sepolia.etherscan.io/tx/0x58f9e52b27396466ca832ffa58b2f5e5690300974d203d24379b408d42fe2acb) |
| Workflow authorization transaction | [`0xb8714bf049b0378b50f4ab928857075a1765a6b387e40b15a3c51de296facd53`](https://sepolia.etherscan.io/tx/0xb8714bf049b0378b50f4ab928857075a1765a6b387e40b15a3c51de296facd53) |
| Broadcast-mode authorization | [`0x72553290c128ee77ea7b4239d31a23f49c7c2492c55cc874e725a0136bdab30f`](https://sepolia.etherscan.io/tx/0x72553290c128ee77ea7b4239d31a23f49c7c2492c55cc874e725a0136bdab30f) |
| CRE CLI Forwarder correction | [`0x30489f5cc04b32020d68e72c0311c7a54311d6ac828dab932129a5ce45f0355f`](https://sepolia.etherscan.io/tx/0x30489f5cc04b32020d68e72c0311c7a54311d6ac828dab932129a5ce45f0355f) |
| CRE simulator metadata authorization | [`0x44f048533288f02c117a4fcfabef71ae8ac3f4c62caca3952b893d2bcb00875c`](https://sepolia.etherscan.io/tx/0x44f048533288f02c117a4fcfabef71ae8ac3f4c62caca3952b893d2bcb00875c) |
| Expiry-guard demonstration | [`0xbed79bfe7ee985cd96527f44968aac0a65308a07796a0a079aacb11d7b50126a`](https://sepolia.etherscan.io/tx/0xbed79bfe7ee985cd96527f44968aac0a65308a07796a0a079aacb11d7b50126a) — accepted then safely skipped |
| Demonstration repayment | [`0x9677805924b2dd83598133caf65d54757fc3d89ddf5391db9f3f7d16f992a492`](https://sepolia.etherscan.io/tx/0x9677805924b2dd83598133caf65d54757fc3d89ddf5391db9f3f7d16f992a492) — `0.101487 USDC` |
| Rules restored | [`0xcd62cb40c86f62da9a3ddf9cfd2aab74a1100394591f8ab8e07cb5e88054844f`](https://sepolia.etherscan.io/tx/0xcd62cb40c86f62da9a3ddf9cfd2aab74a1100394591f8ab8e07cb5e88054844f) |
| Unused reserve withdrawn | [`0xa7ab13b17a5241e830c3c931dbcffc8ed1feab2b282735b89f0a746e6ba028ac`](https://sepolia.etherscan.io/tx/0xa7ab13b17a5241e830c3c931dbcffc8ed1feab2b282735b89f0a746e6ba028ac) |
| Real authorization restored | [`0xe05e32f3fe417d5516dbdc336817ce91f7d539a80913fa7024d1870744ff3abf`](https://sepolia.etherscan.io/tx/0xe05e32f3fe417d5516dbdc336817ce91f7d539a80913fa7024d1870744ff3abf) |

This is a local CRE simulation with Sepolia broadcast; it is not a registered or DON-hosted workflow.
The final state uses the normal `1.58 / 1.60 / 1.62` rules, zero receiver reserve, and the real workflow owner
and hash shown above.

The first broadcast, [`0x16291a5e6d31d64c34c8f04c80efe9d16cf7259f681aaf59c5fc2db3f73825f9`](https://sepolia.etherscan.io/tx/0x16291a5e6d31d64c34c8f04c80efe9d16cf7259f681aaf59c5fc2db3f73825f9),
proved that CRE CLI `1.27.0` routes simulation broadcasts through `0x15fC...9F88`. The receiver had been
configured for a newer Forwarder address, so that transaction emitted only the Forwarder event and did not
change the reserve, evaluation ID, or Compound debt. Authorization was corrected before retrying.

The second broadcast, [`0xfeff32ae4ba96c797241fbb491758f23bf5b0c5fd115124dd09500eadc6ef97b`](https://sepolia.etherscan.io/tx/0xfeff32ae4ba96c797241fbb491758f23bf5b0c5fd115124dd09500eadc6ef97b),
proved that local simulation reports use fixed mock metadata: workflow ID `0x1111...1111` and workflow owner
`0xaaaa...aaaa`. It also left reserve, evaluation ID, and Compound debt unchanged. The receiver temporarily
authorizes those simulator values only for the broadcast demonstration; real workflow authorization is
restored afterward.

The third broadcast reached the receiver and emitted `InstructionAccepted`, followed by
`InstructionSkipped(EXPIRED)`. Sepolia's finalized timestamp lag exceeded the original 300-second report
TTL. The demonstration TTL was increased to 1800 seconds; the receiver's independent 256-block age limit
continues to reject stale reports.

## Verified dependencies

| Dependency | Address |
| --- | --- |
| Compound cUSDCv3 | `0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e` |
| WBTC | `0xa035b9e130F2B1AedC733eEFb1C67Ba4c503491F` |
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| WBTC/USD proxy | `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43` |
| Mock Keystone Forwarder used by CRE CLI `1.27.0` | `0x15fC6Ae953e024d975E77382eeec56A9101f9F88` |
