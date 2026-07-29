'use client'

import { useTrovePilot } from '@/components/TrovePilotProvider'

export function RulesPanel() {
  const {
    lower,
    target,
    upper,
    enabled,
    pending,
    thresholdError,
    setLower,
    setTarget,
    setUpper,
    setEnabled,
    saveRules,
  } = useTrovePilot()

  return (
    <section className="panel">
      <div className="panelHead">
        <div><p className="eyebrow">POLICY</p><h3>Compound safety-ratio band</h3></div>
        <button className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled(!enabled)} aria-label="Toggle automation"><span /></button>
      </div>
      <p className="muted">Below the lower band, repay USDC toward target. Above the upper band, take no action.</p>
      <div className="ruleGrid">
        <label>Lower<input value={lower} onChange={(event) => setLower(event.target.value)} /></label>
        <label>Target<input value={target} onChange={(event) => setTarget(event.target.value)} /></label>
        <label>Upper<input value={upper} onChange={(event) => setUpper(event.target.value)} /></label>
      </div>
      {thresholdError && <p className="error">{thresholdError}</p>}
      <button disabled={Boolean(thresholdError) || pending} className="primary" onClick={saveRules}>Save rules with wallet</button>
    </section>
  )
}
