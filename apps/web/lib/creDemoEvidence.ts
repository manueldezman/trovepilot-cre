export type CreDemoEvent = Readonly<{
  time: string
  stage: string
  event: string
  detail: string
  status: string
}>

const evidenceRoot =
  'https://github.com/manueldezman/trovepilot-cre/blob/cre-sepolia-demo-v1/evidence/runs/20260801T075120Z-broadcast'

export const creDemoEvidence = Object.freeze({
  runId: '20260801T075120Z-broadcast',
  label: 'VERIFIED SEPOLIA DEMO',
  period: '2026-08-01 · 08:52:13–08:52:26 UTC',
  events: Object.freeze<readonly CreDemoEvent[]>([
    {
      time: '08:52:13',
      stage: 'RUNTIME',
      event: 'SIMULATION',
      detail: 'CRE CLI 1.27.0 initialized · network=Ethereum Sepolia',
      status: 'READY',
    },
    {
      time: '08:52:13',
      stage: 'TRIGGER',
      event: 'HEARTBEAT',
      detail: 'cron-trigger@1.0.0 fired',
      status: 'STARTED',
    },
    {
      time: '08:52:14',
      stage: 'CHECK',
      event: 'COMPOUND_STATE',
      detail: 'source_block=11394970 · reserve=1.000000 USDC',
      status: 'READ',
    },
    {
      time: '08:52:17',
      stage: 'POLICY',
      event: 'REPAY',
      detail: 'ratio=2.446165 · demo_target=2.460000 · suggested=0.101487 USDC',
      status: 'SELECTED',
    },
    {
      time: '08:52:26',
      stage: 'REPORT',
      event: 'BROADCAST',
      detail: 'evaluation=0x85f4de4c…6be02 · receiver report submitted',
      status: 'SUBMITTED',
    },
    {
      time: '08:52:26',
      stage: 'ONCHAIN',
      event: 'REPAYMENT',
      detail: '0.101487 USDC repaid · tx=0x96778059…a492',
      status: 'CONFIRMED',
    },
    {
      time: '08:52:26',
      stage: 'EVIDENCE',
      event: 'SHA256',
      detail: 'raw transcript and workflow hashes committed at cre-sepolia-demo-v1',
      status: 'VERIFIED',
    },
  ]),
  links: Object.freeze({
    transaction:
      'https://sepolia.etherscan.io/tx/0x9677805924b2dd83598133caf65d54757fc3d89ddf5391db9f3f7d16f992a492',
    rawTranscript: `${evidenceRoot}/cre-transcript.txt`,
    checksums: `${evidenceRoot}/checksums.sha256`,
  }),
})
