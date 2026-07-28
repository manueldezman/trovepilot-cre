'use client'

import { useState } from 'react'
import { validateThresholds } from '@/lib/thresholds'

const events = [
  { time: 'Every 5 min', title: 'CRE heartbeat', detail: 'Rechecks price, interest accrual, and borrower activity.' },
  { time: 'Event', title: 'WBTC oracle update', detail: 'Runs the same Health Factor evaluation immediately.' },
  { time: 'Onchain', title: 'Receiver verification', detail: 'Recalculates live state before any USDC repayment.' },
]

export function Dashboard() {
  const [lower, setLower] = useState('1.58')
  const [target, setTarget] = useState('1.60')
  const [upper, setUpper] = useState('1.62')
  const [enabled, setEnabled] = useState(true)
  const error = validateThresholds(lower, target, upper)

  return (
    <div className="shell">
      <aside>
        <div className="brand"><span className="brandMark">T</span><div>TrovePilot<small>CRE / Sepolia</small></div></div>
        <nav>
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#rules">Automation rules</a>
          <a href="#reserve">USDC reserve</a>
          <a href="#activity">CRE activity</a>
          <a href="#simulation">Simulation</a>
        </nav>
        <div className="network"><i /> Ethereum Sepolia</div>
      </aside>
      <main>
        <header>
          <div><p className="eyebrow">AAVE V3 POSITION</p><h1>Collateral safety cockpit</h1></div>
          <button className="secondary">Connect wallet</button>
        </header>

        <section id="dashboard" className="hero">
          <div><span className="status">AUTOMATION READY</span><h2>Keyless monitoring.<br />Onchain-enforced repayment.</h2>
            <p>Chainlink CRE watches WBTC price events and performs a five-minute safety heartbeat. Your wallet remains in control.</p></div>
          <div className="heartbeat"><span className="pulse" /><div><b>Next heartbeat</b><strong>04:27</strong><small>Oracle events run immediately</small></div></div>
        </section>

        <section className="metrics">
          <article><label>Health Factor</label><strong>—</strong><small>Connect a borrower wallet</small></article>
          <article><label>WBTC collateral</label><strong>—</strong><small>Aave V3 Sepolia</small></article>
          <article><label>USDC variable debt</label><strong>—</strong><small>Repay-only automation</small></article>
          <article><label>Automation reserve</label><strong>—</strong><small>User-funded USDC</small></article>
        </section>

        <div className="columns">
          <section id="rules" className="panel">
            <div className="panelHead"><div><p className="eyebrow">POLICY</p><h3>Health Factor band</h3></div>
              <button className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled(!enabled)} aria-label="Toggle automation"><span /></button></div>
            <p className="muted">Below the lower band, repay USDC toward target. Above the upper band, take no action.</p>
            <div className="ruleGrid">
              <label>Lower<input value={lower} onChange={(e) => setLower(e.target.value)} /></label>
              <label>Target<input value={target} onChange={(e) => setTarget(e.target.value)} /></label>
              <label>Upper<input value={upper} onChange={(e) => setUpper(e.target.value)} /></label>
            </div>
            {error && <p className="error">{error}</p>}
            <button disabled={Boolean(error)} className="primary">Save rules with wallet</button>
          </section>

          <section id="reserve" className="panel">
            <p className="eyebrow">REPAYMENT CAPACITY</p><h3>USDC automation reserve</h3>
            <div className="reserveAmount">0.00 <span>USDC</span></div>
            <p className="muted">Funds can only repay your Aave variable USDC debt or return to your wallet.</p>
            <div className="buttonRow"><button className="primary">Deposit</button><button className="secondary">Withdraw</button></div>
          </section>
        </div>

        <section id="activity" className="panel activity">
          <div className="panelHead"><div><p className="eyebrow">EXECUTION PATH</p><h3>CRE monitoring activity</h3></div><span className="dry">DRY RUN DEFAULT</span></div>
          {events.map((event) => <div className="event" key={event.title}><time>{event.time}</time><i /><div><b>{event.title}</b><p>{event.detail}</p></div></div>)}
        </section>

        <section id="simulation" className="notice">
          <b>Simulation is isolated from production monitoring.</b>
          <p>Use CRE CLI simulation and the local contract tests to demonstrate low, safe-range, upper-band, stale, and duplicate scenarios.</p>
        </section>
      </main>
    </div>
  )
}

