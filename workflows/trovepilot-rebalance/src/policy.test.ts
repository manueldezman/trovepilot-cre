import { describe, expect, it } from 'vitest'
import { Action, decide, type PositionSnapshot } from './policy'

const safe: PositionSnapshot = {
  healthFactor: 1_600_000_000_000_000_000n,
  lowerHF: 1_580_000_000_000_000_000n,
  upperHF: 1_620_000_000_000_000_000n,
  debtBalance: 1_000_000n,
  reserveBalance: 500_000n,
  enabled: true,
}

describe('health-factor policy', () => {
  it('repays below the lower threshold', () => {
    expect(decide({ ...safe, healthFactor: 1_570_000_000_000_000_000n }))
      .toEqual({ action: Action.REPAY, reason: 'REPAY' })
  })
  it('does nothing in range', () => expect(decide(safe).reason).toBe('NO_ACTION_SAFE_RANGE'))
  it('does not increase debt above upper band', () => {
    expect(decide({ ...safe, healthFactor: safe.upperHF }).reason).toBe('NO_ACTION_UPPER_BAND')
  })
  it('skips without reserve', () => {
    expect(decide({ ...safe, healthFactor: 1n, reserveBalance: 0n }).reason)
      .toBe('NO_ACTION_NO_RESERVE')
  })
  it('skips disabled and debt-free positions', () => {
    expect(decide({ ...safe, enabled: false }).reason).toBe('NO_ACTION_DISABLED')
    expect(decide({ ...safe, debtBalance: 0n }).reason).toBe('NO_ACTION_NO_DEBT')
  })
})

