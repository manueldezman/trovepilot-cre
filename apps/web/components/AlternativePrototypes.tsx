'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import styles from './AlternativePrototypes.module.css'

function usePrototypeState() {
  const [connected, setConnected] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [borrow, setBorrow] = useState(18)
  const ratio = useMemo(() => (45.13 / borrow).toFixed(2), [borrow])
  return { connected, setConnected, enabled, setEnabled, borrow, setBorrow, ratio }
}

const data = [
  ['WBTC SUPPLIED', '0.001', '$64.45'],
  ['USDC BORROWED', '18.00', '28% CAPACITY'],
  ['USDC RESERVE', '500.00', 'READY'],
  ['WBTC / USD', '$64,454', '+1.8%'],
]

export function AtlasPrototype() {
  const state = usePrototypeState()
  return (
    <main className={styles.atlas}>
      <header>
        <div className={styles.atlasBrand}><b>TP</b><span>TROVEPILOT<br /><small>COLLATERAL FIELD / 01</small></span></div>
        <nav><a href="#position">POSITION</a><a href="#policy">POLICY</a><a href="#signals">SIGNALS</a></nav>
        <button onClick={() => state.setConnected(!state.connected)}>{state.connected ? '0x6E58…6AF5' : 'CONNECT ↗'}</button>
      </header>

      <section className={styles.atlasField} id="position">
        <div className={styles.coordinates}>ETHEREUM SEPOLIA<br />BLOCK 11,374,922<br />11:35:29 WAT</div>
        <div className={styles.atlasRatio}><span>LIVE SAFETY RATIO</span><strong>2.51</strong><em>SAFE TERRITORY</em></div>
        <div className={styles.orbitLine}><i /><i /><i /><i /><span>1.00<br /><small>LIQUIDATION</small></span><span>1.58<br /><small>LOWER</small></span><span>1.60<br /><small>TARGET</small></span><span>2.51<br /><small>YOU ARE HERE</small></span></div>
        <p className={styles.atlasNote}>Your position is <b>0.93 points</b> above the intervention boundary. CRE checks this field on every WBTC oracle update and every five minutes.</p>
      </section>

      <section className={styles.atlasData}>
        {data.map(([label, value, note]) => <div key={label}><span>{label}</span><b>{value}</b><small>{note}</small></div>)}
      </section>

      <section className={styles.atlasControl} id="policy">
        <div><span>PROTECTION VECTOR</span><h2>{state.enabled ? 'AUTOMATION IS TRACKING' : 'AUTOMATION PAUSED'}</h2><button onClick={() => state.setEnabled(!state.enabled)}>{state.enabled ? 'PAUSE' : 'RESUME'} PROTECTION</button></div>
        <div className={styles.atlasBorrow}><label>SIMULATE DEBT <b>{state.borrow} USDC</b></label><input type="range" min="5" max="28" value={state.borrow} onChange={(e) => state.setBorrow(Number(e.target.value))} /><p>PROJECTED RATIO <strong>{state.ratio}</strong></p></div>
      </section>

      <section className={styles.atlasSignals} id="signals">
        <h2>SIGNAL TERMINAL</h2>
        <div className={styles.terminal}>
          <div className={styles.terminalBar}>
            <span><i /><i /><i /></span>
            <b>cre://trovepilot/compound-monitor --follow</b>
            <em>CONNECTED</em>
          </div>
          <div className={styles.terminalBody}>
            <p><time>10:55:12</time><b>REPORT_EXECUTED</b><span>repay=5.000000_USDC</span><span>target_ratio=1.600</span><em>tx=0x91ac…f02e</em></p>
            <p><time>11:30:04</time><b>ORACLE_EVENT</b><span>wbtc_usd=64454.20</span><span>block=11374891</span><em>FINALIZED</em></p>
            <p><time>11:35:29</time><b>HEARTBEAT</b><span>ratio=2.5069</span><span>decision=NO_ACTION_UPPER_BAND</span><em>OK</em></p>
            <p className={styles.prompt}><time>$</time><span>awaiting next finalized trigger</span><i /></p>
          </div>
        </div>
      </section>
      <Link className={styles.back} href="/designs">← ALL CONCEPTS</Link>
    </main>
  )
}

export function IndexPrototype() {
  const state = usePrototypeState()
  return (
    <main className={styles.index}>
      <div className={styles.indexTicker}><span>CRE ONLINE</span><span>WBTC $64,454 ↑1.8%</span><span>NEXT HEARTBEAT 03:42</span><span>SEPOLIA 11,374,922</span></div>
      <header><div><b>TROVE</b><i>PILOT</i></div><p>THE AUTONOMOUS COLLATERAL REGISTER</p><button onClick={() => state.setConnected(!state.connected)}>{state.connected ? '0x6E58…6AF5' : 'CONNECT WALLET'}</button></header>
      <nav><a href="#brief">DAILY BRIEF</a><a href="#position">POSITION</a><a href="#rules">RULES</a><a href="#activity">ACTIVITY</a><Link href="/designs">CONCEPTS</Link></nav>

      <section className={styles.indexLead} id="brief">
        <div><span>POSITION BULLETIN · 29 JUL 2026</span><h1>Collateral remains well clear of intervention.</h1><p>The live safety ratio is 2.51 against a lower boundary of 1.58. No repayment is required.</p></div>
        <div className={styles.indexRatio}><small>LIVE RATIO</small><strong>2.51</strong><b>SAFE</b></div>
      </section>

      <section className={styles.indexBody}>
        <div className={styles.indexMain}>
          <div className={styles.indexRows} id="position">{data.map(([label, value, note]) => <p key={label}><span>{label}</span><b>{value}</b><em>{note}</em></p>)}</div>
          <div className={styles.indexRules} id="rules">
            <div><span>THE STANDING ORDER</span><h2>Repay toward 1.60 whenever safety falls below 1.58.</h2><button onClick={() => state.setEnabled(!state.enabled)}>{state.enabled ? '● ACTIVE — CLICK TO PAUSE' : '○ PAUSED — CLICK TO RESUME'}</button></div>
            <ol><li><b>1.58</b><span>LOWER</span></li><li><b>1.60</b><span>TARGET</span></li><li><b>1.62</b><span>UPPER</span></li></ol>
          </div>
          <div className={styles.indexBorrow}><label>BORROW SCENARIO: {state.borrow} USDC</label><input type="range" min="5" max="28" value={state.borrow} onChange={(e) => state.setBorrow(Number(e.target.value))} /><p>Projected ratio after borrowing <b>{state.ratio}</b></p></div>
        </div>
        <aside id="activity"><span>WIRE / LATEST</span><article><time>11:35</time><b>HEARTBEAT CLEARS POSITION</b><p>Ratio 2.51. No report submitted.</p></article><article><time>11:30</time><b>WBTC FEED ADVANCES</b><p>Finalized price: $64,454.</p></article><article><time>10:55</time><b>RESERVE DEPLOYED</b><p>5 USDC repaid to Compound.</p></article></aside>
      </section>
    </main>
  )
}
