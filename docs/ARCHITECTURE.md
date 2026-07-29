# Architecture

```text
Chainlink WBTC/USD aggregator ─ AnswerUpdated ─┐
                                               ├─ CRE workflow
CRE scheduler ──────── every 5 minutes ────────┘      │
                                                      ├─ reads Compound Comet position/prices
                                                      ├─ reads receiver rules/reserve
                                                      └─ signed report below lower ratio
                                                                 │
                                                   Keystone Forwarder
                                                                 │
User wallet ─ rules / USDC reserve ─ TrovePilotReceiver ◄────────┘
                                             │
                                             ├─ verifies identity/replay/expiry
                                             ├─ rereads live Compound state
                                             └─ Comet.supplyTo(borrower, USDC)
```

The pure policy owns Compound ratio calculation and classification. Both the oracle-event trigger and the
five-minute heartbeat call the same evaluation function. The receiver is authoritative for repayment size
and uses live WBTC and USDC prices, the live borrow collateral factor, current debt, and deposited reserve.

The monitored ratio is:

`borrow-adjusted WBTC value / USDC debt value`

Below `1.58`, USDC is repaid toward `1.60`; at or above `1.58`, no repayment occurs. The `1.62` upper band
remains an explicit no-action classification.

## Verified Sepolia dependencies

- Compound cUSDCv3: `0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e`
- WBTC: `0xa035b9e130F2B1AedC733eEFb1C67Ba4c503491F`
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- WBTC/USD proxy: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- Event-emitting aggregator: `0x17Dac87b07EAC97De4E182Fc51C925ebB7E723e2`

The event wakes the workflow; every evaluation and receiver execution rereads Comet’s configured prices.
