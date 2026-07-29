'use client'

import { useTrovePilot } from '@/components/TrovePilotProvider'

export function AtlasPositionField() {
  const { ratio, lower, target, upper, account } = useTrovePilot()
  const numericRatio = Number(ratio)
  const safe = ratio === '∞' || (Number.isFinite(numericRatio) && numericRatio >= Number(lower))

  return (
    <section className="atlasPositionField">
      <div className="fieldCoordinates">
        ETHEREUM SEPOLIA<br />
        COMPOUND cUSDCv3<br />
        {account ? `${account.slice(0, 10)}…${account.slice(-6)}` : 'WALLET NOT CONNECTED'}
      </div>
      <div className="fieldRatio">
        <span>LIVE SAFETY RATIO</span>
        <strong>{ratio === '-' ? '0.00' : ratio}</strong>
        <em>{ratio === '-' ? 'AWAITING POSITION' : safe ? 'SAFE TERRITORY' : 'INTERVENTION ZONE'}</em>
      </div>
      <p className="fieldNote">CRE watches this position on every finalized WBTC oracle update and through a five-minute heartbeat. The receiver independently verifies every repayment.</p>
      <div className="fieldTrack">
        <i /><i /><i /><i />
        <span>1.00<small>LIQUIDATION</small></span>
        <span>{lower}<small>LOWER</small></span>
        <span>{target}<small>TARGET</small></span>
        <span>{ratio === '-' ? '--' : ratio}<small>YOU ARE HERE</small></span>
      </div>
    </section>
  )
}
