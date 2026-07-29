'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import styles from './DesignPrototype.module.css'

type Variant = 'orbit' | 'ledger' | 'signal'

const copy = {
  orbit: { name: 'Orbit Control', mark: 'TP', tagline: 'Autonomous collateral command' },
  ledger: { name: 'TrovePilot', mark: 'T', tagline: 'Your position, kept in balance.' },
  signal: { name: 'TROVEPILOT//CRE', mark: 'T//', tagline: 'COLLATERAL_RISK_TERMINAL' },
}

export function DesignPrototype({ variant }: { variant: Variant }) {
  const [section, setSection] = useState('Overview')
  const [connected, setConnected] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [borrow, setBorrow] = useState(18)
  const projectedRatio = useMemo(() => (45.13 / Math.max(borrow, 0.01)).toFixed(2), [borrow])
  const concept = copy[variant]

  return (
    <div className={`${styles.prototype} ${styles[variant]}`}>
      <aside className={styles.rail}>
        <div className={styles.identity}><span>{concept.mark}</span><div><b>{concept.name}</b><small>COMPOUND · SEPOLIA</small></div></div>
        <nav className={styles.nav}>
          {['Overview', 'Position', 'Automation', 'Activity'].map((item) => (
            <button className={section === item ? styles.active : ''} key={item} onClick={() => setSection(item)}>
              <i />{item}
            </button>
          ))}
        </nav>
        <div className={styles.creState}><span /><div><b>CRE ONLINE</b><small>Next check in 03:42</small></div></div>
      </aside>

      <main className={styles.stage}>
        <header className={styles.topbar}>
          <div><p>{concept.tagline}</p><h1>{section}</h1></div>
          <div className={styles.topActions}>
            <Link href="/designs">All concepts</Link>
            <button onClick={() => setConnected(!connected)}>{connected ? '0x6E58…6AF5' : 'Connect wallet'}</button>
          </div>
        </header>

        <section className={styles.hero}>
          <div>
            <span className={styles.kicker}>POSITION SAFETY</span>
            <div className={styles.ratioLine}><strong>2.51</strong><em>SAFE</em></div>
            <p>Comfortably above your 1.58 intervention threshold.</p>
          </div>
          <div className={styles.gauge} aria-label="Safety ratio 2.51">
            <span>2.51</span><small>TARGET 1.60</small>
          </div>
        </section>

        <section className={styles.metrics}>
          <article><span>WBTC supplied</span><strong>0.001</strong><small>$64.45 collateral</small></article>
          <article><span>USDC borrowed</span><strong>18.00</strong><small>28% utilization</small></article>
          <article><span>Repayment reserve</span><strong>500.00</strong><small>USDC available</small></article>
          <article><span>WBTC price</span><strong>$64,454</strong><small className={styles.positive}>+1.8% today</small></article>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.card}>
            <div className={styles.cardHead}><div><span>AUTOMATION POLICY</span><h2>Safety band</h2></div><button className={`${styles.switch} ${enabled ? styles.on : ''}`} onClick={() => setEnabled(!enabled)}><i /></button></div>
            <div className={styles.band}>
              <div><span>LOWER</span><b>1.58</b></div><div><span>TARGET</span><b>1.60</b></div><div><span>UPPER</span><b>1.62</b></div>
            </div>
            <div className={styles.rule}><i /><p><b>{enabled ? 'Protection enabled' : 'Protection paused'}</b><small>Repay toward 1.60 when the ratio crosses below 1.58.</small></p></div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}><div><span>POSITION LAB</span><h2>Borrow preview</h2></div><b>{borrow.toFixed(0)} USDC</b></div>
            <input className={styles.slider} type="range" min="5" max="28" value={borrow} onChange={(event) => setBorrow(Number(event.target.value))} />
            <div className={styles.preview}><span>Projected ratio</span><strong>{projectedRatio}</strong></div>
            <button className={styles.action}>Review transaction</button>
          </section>
        </div>

        <section className={`${styles.card} ${styles.timeline}`}>
          <div className={styles.cardHead}><div><span>RECENT SIGNALS</span><h2>Automation activity</h2></div><Link href="/activity">Open monitor</Link></div>
          <div className={styles.events}>
            <article><time>11:35</time><i /><div><b>Heartbeat evaluated</b><small>Ratio 2.51 · no action required</small></div></article>
            <article><time>11:30</time><i /><div><b>WBTC price updated</b><small>$64,454 · finalized oracle event</small></div></article>
            <article><time>10:55</time><i /><div><b>Position repaid</b><small>5.00 USDC · target restored</small></div></article>
          </div>
        </section>

        <nav className={styles.mobileNav}>
          {['Overview', 'Position', 'Automation', 'Activity'].map((item) => (
            <button className={section === item ? styles.active : ''} key={item} onClick={() => setSection(item)}>{item.slice(0, 4)}</button>
          ))}
        </nav>
      </main>
    </div>
  )
}
