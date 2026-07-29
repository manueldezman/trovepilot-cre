import { describe, expect, it } from 'vitest'
import {
  calculateBorrowCapacity, formatAllowance, hasPositiveAmount, isBorrowAmountAllowed,
} from './compoundSetup'

describe('hasPositiveAmount', () => {
  it('accepts positive decimal values', () => {
    expect(hasPositiveAmount('0.01')).toBe(true)
    expect(hasPositiveAmount('100')).toBe(true)
  })

  it('rejects empty, zero, negative, and invalid values', () => {
    expect(hasPositiveAmount('')).toBe(false)
    expect(hasPositiveAmount('0')).toBe(false)
    expect(hasPositiveAmount('-1')).toBe(false)
    expect(hasPositiveAmount('abc')).toBe(false)
  })
})

describe('calculateBorrowCapacity', () => {
  const market = {
    collateralAmount: 100_000_000n,
    collateralScale: 100_000_000n,
    collateralPrice: 100_000_000_000n,
    borrowCollateralFactor: 700_000_000_000_000_000n,
    basePrice: 100_000_000n,
    baseScale: 1_000_000n,
    targetRatio: 1_600_000_000_000_000_000n,
  }

  it('calculates the exact additional borrow at the target ratio with no debt', () => {
    const result = calculateBorrowCapacity({ ...market, currentDebt: 0n })

    expect(result.adjustedCollateralValue).toBe(70_000_000_000n)
    expect(result.maximumTotalDebt).toBe(437_500_000n)
    expect(result.maximumAdditionalBorrow).toBe(437_500_000n)
    expect(result.currentRatio).toBeNull()
  })

  it('subtracts existing debt from additional capacity', () => {
    const result = calculateBorrowCapacity({
      ...market,
      currentDebt: 100_000_000n,
      additionalBorrow: 337_500_000n,
    })

    expect(result.maximumTotalDebt).toBe(437_500_000n)
    expect(result.maximumAdditionalBorrow).toBe(337_500_000n)
    expect(result.projectedRatio).toBe(1_600_000_000_000_000_000n)
  })

  it('returns zero when debt is already at or above the target limit', () => {
    const atLimit = calculateBorrowCapacity({ ...market, currentDebt: 437_500_000n })
    const aboveLimit = calculateBorrowCapacity({ ...market, currentDebt: 500_000_000n })

    expect(atLimit.maximumAdditionalBorrow).toBe(0n)
    expect(aboveLimit.maximumAdditionalBorrow).toBe(0n)
  })

  it('updates capacity when price or collateral factor changes', () => {
    const lowerPrice = calculateBorrowCapacity({
      ...market,
      collateralPrice: 80_000_000_000n,
      currentDebt: 0n,
    })
    const lowerFactor = calculateBorrowCapacity({
      ...market,
      borrowCollateralFactor: 600_000_000_000_000_000n,
      currentDebt: 0n,
    })

    expect(lowerPrice.maximumAdditionalBorrow).toBe(350_000_000n)
    expect(lowerFactor.maximumAdditionalBorrow).toBe(375_000_000n)
  })
})

describe('isBorrowAmountAllowed', () => {
  it('allows the exact maximum and rejects an amount above it', () => {
    expect(isBorrowAmountAllowed(337_500_000n, 337_500_000n)).toBe(true)
    expect(isBorrowAmountAllowed(337_500_001n, 337_500_000n)).toBe(false)
  })

  it('rejects missing and zero amounts', () => {
    expect(isBorrowAmountAllowed(null, 337_500_000n)).toBe(false)
    expect(isBorrowAmountAllowed(0n, 337_500_000n)).toBe(false)
  })
})

describe('formatAllowance', () => {
  it('shows maximum approvals as Unlimited', () => {
    expect(formatAllowance(2n ** 256n - 1n, 6)).toBe('Unlimited')
  })

  it('rounds finite allowances without trailing zeroes', () => {
    expect(formatAllowance(123_456_789n, 8)).toBe('1.234568')
    expect(formatAllowance(18_000_000n, 6)).toBe('18')
  })
})
