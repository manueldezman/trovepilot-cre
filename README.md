# TrovePilot CRE

TrovePilot CRE is a repay-only Compound III Sepolia safety monitor. A Chainlink CRE workflow evaluates a
borrower's WBTC/USDC safety ratio when BTC/USD updates and every five minutes. Below the configured lower
band it sends a report to an onchain receiver, which independently recalculates and caps a USDC repayment.

There is no recurring automation wallet, VPS listener, browser private key, or custom transaction signer.

## How it works

See [the architecture and original-system mapping](docs/ARCHITECTURE.md). The default band is:

- Lower: `1.58`
- Target: `1.60`
- Upper: `1.62`

Below lower, the receiver repays enough USDC to move toward target, capped by the current debt, deposited
reserve, and CRE suggestion. Within range and above upper it takes no action. TrovePilot never borrows more
USDC just to lower a healthy position's ratio.

## Repository

```text
apps/web/                         Next.js dashboard
contracts/                        Foundry receiver, mocks, tests, deploy script
workflows/trovepilot-rebalance/   TypeScript CRE workflow and pure policy
docs/                             Architecture and deployment evidence
```

Prerequisites: Node.js 20+, npm, Foundry, Bun, and the Chainlink CRE CLI.

```bash
cp .env.example .env
npm install
npm run typecheck
npm test
npm run test:contracts
npm run build
```

Run the frontend with `npm run dev --workspace apps/web`. Configure
`NEXT_PUBLIC_RECEIVER_ADDRESS` only after deployment. Browser variables are public; never place a private
key in any `NEXT_PUBLIC_*` variable.

## Testnet position and reserve

1. Fund the user wallet with Sepolia ETH.
2. Use `/compound-setup` to request WBTC and USDC from the Compound Sepolia faucet.
3. Supply WBTC and borrow USDC through the Compound cUSDCv3 market.
4. Deploy the receiver and configure the borrower rules.
5. Approve the receiver for USDC, then call `depositReserve`.
6. Keep the safety ratio above `1.0`; test low-ratio behavior first with mocks/simulation.

Only the borrower can configure their rules, deposit reserve, or withdraw their accounted reserve.

## CRE configuration and simulation

Edit `workflows/trovepilot-rebalance/config.staging.json`:

- Set `receiverAddress` to the deployed receiver.
- Add borrower addresses.
- Keep `schedule` as `0 */5 * * * *`.
- Start with `dryRun: true`. Dry-run evaluates and logs decisions but submits no report.

The workflow has no secret file. The RPC URL is supplied through `CRE_ETHEREUM_RPC_URL`.

```bash
cd workflows/trovepilot-rebalance
npm install
cre workflow simulate ./workflow.yaml --target staging-settings
```

For the Sepolia demonstration, registration is not required. Keep `dryRun: true` for calculation-only
checks. After the receiver is deployed and authorized, switch `dryRun` to `false` and use
`cre workflow simulate . --broadcast` for a controlled chain write. This runs locally and does not provide
continuous hosted heartbeat or event monitoring.

Use `scripts/capture-cre-evidence.sh` to record the Git commit, CRE version, binary/config/workflow hashes,
full simulation transcript, transaction hash, and SHA-256 checksums. See
[`docs/CRE_DEMO_EVIDENCE.md`](docs/CRE_DEMO_EVIDENCE.md) for the public verification record.

## Contract deployment

`DEPLOYER_PRIVATE_KEY` is a one-time deployment credential. It is not read by the workflow or frontend.
Load it into the shell without printing it, compute the workflow ID using `cre workflow hash`, then run the
Foundry deployment script. The receiver constructor requires the broadcast-simulation owner and workflow ID.

After confirmation:

1. Put the receiver address in the CRE config and web environment.
2. Verify receiver source and constructor arguments.
3. Run an authorized safe-range report.
4. Prepare a controlled low-HF test position and execute one capped repayment.
5. Add contract, workflow, and transaction links to [deployment evidence](docs/DEPLOYMENTS.md).

## Logs and troubleshooting

CRE logs are structured JSON events:

- `check_started`: trigger, finalized block, and time.
- `position_evaluated`: ratio, live prices, collateral, debt, reserve, decision, and evaluation ID.
- `repayment_report_submitted`: transaction hash.
- `evaluation_error`: borrower-scoped failure.

No borrowers means `NO_BORROWERS_CONFIGURED`. A zero receiver address is intentionally invalid. RPC or
decoder failures are isolated per borrower and logged; a subsequent heartbeat retries from finalized state.
If event delivery is missed, the five-minute heartbeat provides bounded fallback.

For a report that reaches the receiver but does not repay, inspect `InstructionSkipped`. Common reasons are
duplicate evaluation, expiry, disabled rules, safe/upper ratio, no reserve, or no debt.

After deployment, use the `/activity` page for the latest processed evaluation ID and a direct receiver
event link. CRE structured logs show every heartbeat/event decision and report transaction hash; Etherscan
receiver events independently show accepted reports, skip reasons, and completed repayments.

## Security limitations

- The receiver treats CRE reports as instructions and rereads all critical Compound state.
- Evaluation IDs provide onchain event/heartbeat deduplication. Expiry bounds delayed execution.
- USDC can only repay the same borrower's Compound base debt or be withdrawn by that borrower.
- Sepolia uses a mock Keystone Forwarder. It does **not** provide production-equivalent report
  authentication, and metadata can be spoofed through test infrastructure. This repository is an
  end-to-end testnet demonstration, not a production mainnet deployment.
- Reverted EVM transactions cannot retain rejection events. Unauthorized and malformed calls therefore
  revert; authenticated, well-formed skips emit durable reason events.
- Frontend reads and user-signed writes require `NEXT_PUBLIC_RECEIVER_ADDRESS`; without it the dashboard
  remains safely read-only and explains that deployment configuration is missing.

## What was reused

The original dark-crimson TrovePilot visual language, three-threshold safety band, target-restoration
repayment intent, and reserve model were retained. Mezo ICR contracts, MUSD mint/repay calls, BTC simulation
routes, VPS listener, five-second block polling, and server-side signer were removed from the production path.
