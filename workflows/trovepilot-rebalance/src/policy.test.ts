import { describe, expect, it } from 'vitest'
import {
  Action, calculateCompoundPosition, calculateSuggestedRepay, decide, type PositionSnapshot,
} from './policy'

const safe: PositionSnapshot = {
  ratio: 1_600_000_000_000_000_000n,
  lowerRatio: 1_580_000_000_000_000_000n,
  upperRatio: 1_620_000_000_000_000_000n,
  debtBalance: 437_500_000n,
  reserveBalance: 500_000_000n,
  enabled: true,
}

describe('Compound ratio policy', () => {
  it('calculates ratio from live Compound values', () => {
    const position = calculateCompoundPosition({
      collateralBalance: 100_000_000n,
      collateralScale: 100_000_000n,
      collateralPrice: 100_000_000_000n,
      borrowCollateralFactor: 700_000_000_000_000_000n,
      debtBalance: 437_500_000n,
      baseScale: 1_000_000n,
      basePrice: 100_000_000n,
    })
    expect(position.ratio).toBe(1_600_000_000_000_000_000n)
  })

  it('calculates repayment to target and caps it by reserve', () => {
    const position = { ratio: 1_555_555_555_555_555_555n, adjustedCollateralValue: 70_000_000_000n, debtValue: 45_000_000_000n }
    expect(calculateSuggestedRepay(position, 450_000_000n, 500_000_000n, 1_000_000n, 100_000_000n, 1_600_000_000_000_000_000n))
      .toBe(12_500_000n)
    expect(calculateSuggestedRepay(position, 450_000_000n, 5_000_000n, 1_000_000n, 100_000_000n, 1_600_000_000_000_000_000n))
      .toBe(5_000_000n)
  })

  it('repays below lower and skips safe, upper, disabled, debt-free, and reserve-free states', () => {
    expect(decide({ ...safe, ratio: 1_570_000_000_000_000_000n }).action).toBe(Action.REPAY)
    expect(decide(safe).reason).toBe('NO_ACTION_SAFE_RANGE')
    expect(decide({ ...safe, ratio: safe.upperRatio }).reason).toBe('NO_ACTION_UPPER_BAND')
    expect(decide({ ...safe, ratio: 1n, reserveBalance: 0n }).reason).toBe('NO_ACTION_NO_RESERVE')
    expect(decide({ ...safe, enabled: false }).reason).toBe('NO_ACTION_DISABLED')
    expect(decide({ ...safe, debtBalance: 0n }).reason).toBe('NO_ACTION_NO_DEBT')
  })
})
