import { ActivityPanel } from '@/components/ActivityPanel'
import { PositionMetrics } from '@/components/PositionMetrics'

export default function Page() {
  return (
    <>
      <section className="hero">
        <div>
          <span className="status">AUTOMATION READY</span>
          <h2>Keyless monitoring.<br />Onchain-enforced repayment.</h2>
          <p>Chainlink CRE watches WBTC price events and performs a five-minute safety heartbeat. Your wallet remains in control.</p>
        </div>
        <div className="heartbeat"><span className="pulse" /><div><b>Next heartbeat</b><strong>04:27</strong><small>Oracle events run immediately</small></div></div>
      </section>
      <PositionMetrics />
      <ActivityPanel />
    </>
  )
}
