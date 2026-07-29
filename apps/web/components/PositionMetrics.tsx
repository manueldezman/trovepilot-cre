'use client'

import { useTrovePilot } from '@/components/TrovePilotProvider'

export function PositionMetrics() {
  const { healthFactor, collateral, debt, reserve } = useTrovePilot()

  return (
    <section className="metrics">
      <article><label>Health Factor</label><strong>{healthFactor}</strong><small>Live Aave account data</small></article>
      <article><label>Collateral base</label><strong>{collateral}</strong><small>Aave oracle USD base</small></article>
      <article><label>Debt base</label><strong>{debt}</strong><small>Repay-only automation</small></article>
      <article><label>Automation reserve</label><strong>{reserve}</strong><small>User-funded USDC</small></article>
    </section>
  )
}
