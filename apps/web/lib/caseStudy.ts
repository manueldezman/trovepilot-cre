export const caseStudy = Object.freeze({
  title: 'TrovePilot CRE',
  subtitle: 'Compound III collateral repayment test on Ethereum Sepolia',
  summary:
    'Test scope: monitor a WBTC-backed Compound position and execute a constrained USDC repayment without keeping the borrower private key on an always-on VPS.',
  aim:
    'The workflow reads WBTC collateral and USDC debt, calculates the safety ratio, and submits a repayment report only when the ratio is below the configured lower threshold.',
  redesign:
    'This project is a Chainlink CRE redesign of the original TrovePilot Mezo implementation, which used a VPS block listener and a server-side borrower signer.',
  sections: Object.freeze({
    objective: { label: 'OBJECTIVE', title: 'Project objective' },
    architecture: { label: 'SYSTEM DESIGN', title: 'From VPS monitoring to Chainlink CRE' },
    thresholds: { label: 'CONFIGURATION', title: 'Repayment policy' },
    execution: { label: 'TEST RUN', title: 'Simulation and broadcast result' },
    references: { label: 'REFERENCES', title: 'Source and test artifacts' },
  }),
  metrics: Object.freeze([
    { label: 'Network', value: 'Ethereum Sepolia', note: 'Testnet execution' },
    { label: 'Market', value: 'Compound III', note: 'WBTC collateral / USDC debt' },
    { label: 'Monitoring', value: '2 triggers', note: 'Oracle event + 5-minute heartbeat' },
    { label: 'Result', value: '0.101487 USDC', note: 'Confirmed repayment' },
  ]),
  thresholds: Object.freeze([
    { label: 'Lower', value: '1.58', behavior: 'Below this ratio, select REPAY.' },
    { label: 'Target', value: '1.60', behavior: 'Repay only enough to restore this ratio.' },
    { label: 'Upper', value: '1.62', behavior: 'Above this ratio, take no action.' },
  ]),
  previousArchitecture: Object.freeze([
    'Mezo block listener',
    'VPS systemd service',
    'Server-side borrower key',
    'Direct protocol transaction',
  ]),
  creArchitecture: Object.freeze([
    'Oracle event + heartbeat',
    'Shared CRE evaluator',
    'Signed report + Forwarder',
    'Constrained receiver',
    'Compound repayment',
  ]),
  result: Object.freeze({
    observedRatio: '2.446165',
    demoTarget: '2.460000',
    restoredRatio: '≈2.459975',
    amount: '0.101487 USDC',
    explanation:
      'For the controlled broadcast demonstration, the target was temporarily raised to 2.46 so an already-safe test position could exercise the repayment path. The receiver reread Compound state and capped the repayment independently.',
  }),
  links: Object.freeze({
    originalRepository: 'https://github.com/manueldezman/trovepilot',
    creRepository: 'https://github.com/manueldezman/trovepilot-cre',
    creArchitecture:
      'https://github.com/manueldezman/trovepilot-cre/blob/main/docs/ARCHITECTURE.md',
    receiver:
      'https://eth-sepolia.blockscout.com/address/0x7C547dE17b7e2335cFDA59cCa83AB45Dff790583?tab=contract',
    evidence:
      'https://github.com/manueldezman/trovepilot-cre/blob/main/docs/CRE_DEMO_EVIDENCE.md',
    tag: 'https://github.com/manueldezman/trovepilot-cre/tree/cre-sepolia-demo-v1',
  }),
})
