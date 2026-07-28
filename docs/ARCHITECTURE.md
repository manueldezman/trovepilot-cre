# Architecture

```text
Chainlink BTC/USD aggregator ── AnswerUpdated ──┐
                                                ├─ CRE workflow
CRE scheduler ───────────── every 5 minutes ────┘      │
                                                       ├─ reads Aave Pool + debt token
                                                       ├─ reads receiver rules + reserve
                                                       └─ signed report (only below lower HF)
                                                                  │
                                                    Keystone Forwarder
                                                                  │
User wallet ─ rules / USDC reserve ── TrovePilotReceiver ◄────────┘
                                              │
                                              ├─ verifies CRE identity and replay/expiry
                                              ├─ rereads live Aave state
                                              └─ Aave Pool.repay(USDC, variable, borrower)
```

## Responsibility boundaries

- `src/policy.ts` owns the pure Health Factor classification and has no CRE or RPC dependency.
- `workflow.ts` owns trigger orchestration, finalized-state reads, structured logs, and report delivery.
- `TrovePilotReceiver.sol` owns authorization, live financial verification, reserve accounting, and execution.
- The web application owns presentation and user-initiated, wallet-signed configuration/reserve actions only.

Both the event trigger and heartbeat call `evaluate`. The event improves reaction time; the heartbeat is the
authoritative fallback for interest accrual, user actions, Aave configuration changes, missed events, and the
fact that the Sepolia Aave WBTC source is a static test adapter.

## Original-to-CRE mapping

| TrovePilot / Mezo | TrovePilot CRE / Aave V3 |
| --- | --- |
| Trove ICR | Aave Health Factor |
| MUSD debt | USDC variable debt |
| BTC-down repayment | `Pool.repay` using deposited USDC |
| BTC-up minting | Deliberate no-action; debt is never increased |
| VPS block/oracle polling | CRE event plus five-minute heartbeat |
| VPS automation private key | CRE report and constrained receiver |

## Oracle verification

Verified against Sepolia on 2026-07-28:

- `AaveOracle.getSourceOfAsset(WBTC)` resolves to
  `0x784B90bA1E9a8cf3C9939c2e072F058B024C4b8a`.
- That source exposes `latestAnswer()` and returns a fixed Sepolia test price, but does not expose the
  Chainlink aggregator proxy interface.
- Chainlink BTC/USD proxy `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43` resolves to event-emitting
  aggregator `0x17Dac87b07EAC97De4E182Fc51C925ebB7E723e2`.

The BTC/USD event is therefore a wake-up signal only. Every evaluation and every receiver execution uses
Aave's own live account data; the Chainlink feed value is never substituted into Aave's Health Factor.

