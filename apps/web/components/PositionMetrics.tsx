'use client'

import { useTrovePilot } from '@/components/TrovePilotProvider'

export function PositionMetrics() {
  const { ratio, collateral, debt, reserve } = useTrovePilot()

  return (
    <section className="metrics">
      <article><label>Safety ratio</label><strong>{ratio}</strong><small>Live Compound position</small></article>
      <article><label>Supplied WBTC</label><strong>{collateral}</strong><small>Compound collateral</small></article>
      <article><label>Borrowed USDC</label><strong>{debt}</strong><small>Repay-only automation</small></article>
      <article><label>Automation reserve</label><strong>{reserve}</strong><small>User-funded USDC</small></article>
    </section>
  )
}
