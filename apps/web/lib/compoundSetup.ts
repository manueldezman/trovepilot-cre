export const positionAmountDefaults = {
  wbtc: '0.01',
  borrowUsdc: '100',
  repayUsdc: '100',
} as const

const RATIO_SCALE = 10n ** 18n

export type BorrowCapacityInput = {
  collateralAmount: bigint
  collateralScale: bigint
  collateralPrice: bigint
  borrowCollateralFactor: bigint
  basePrice: bigint
  baseScale: bigint
  currentDebt: bigint
  targetRatio: bigint
  additionalBorrow?: bigint
}

export type BorrowCapacity = {
  adjustedCollateralValue: bigint
  maximumTotalDebt: bigint
  maximumAdditionalBorrow: bigint
  currentRatio: bigint | null
  projectedRatio: bigint | null
}

export function calculateBorrowCapacity({
  collateralAmount,
  collateralScale,
  collateralPrice,
  borrowCollateralFactor,
  basePrice,
  baseScale,
  currentDebt,
  targetRatio,
  additionalBorrow = 0n,
}: BorrowCapacityInput): BorrowCapacity {
  if (collateralScale <= 0n || basePrice <= 0n || baseScale <= 0n || targetRatio <= 0n) {
    throw new Error('Invalid Compound market configuration')
  }

  const collateralValue = collateralAmount * collateralPrice / collateralScale
  const adjustedCollateralValue = collateralValue * borrowCollateralFactor / RATIO_SCALE
  const maximumTotalDebt = adjustedCollateralValue * baseScale * RATIO_SCALE / basePrice / targetRatio
  const maximumAdditionalBorrow = maximumTotalDebt > currentDebt ? maximumTotalDebt - currentDebt : 0n

  const ratioForDebt = (debt: bigint) => debt === 0n
    ? null
    : adjustedCollateralValue * baseScale * RATIO_SCALE / (debt * basePrice)

  return {
    adjustedCollateralValue,
    maximumTotalDebt,
    maximumAdditionalBorrow,
    currentRatio: ratioForDebt(currentDebt),
    projectedRatio: ratioForDebt(currentDebt + additionalBorrow),
  }
}

export function isBorrowAmountAllowed(amount: bigint | null, maximumAdditionalBorrow: bigint) {
  return amount !== null && amount > 0n && amount <= maximumAdditionalBorrow
}

export function formatAllowance(value: bigint, decimals: number, maximumFractionDigits = 6) {
  if (value >= (2n ** 256n - 1n) / 2n) return 'Unlimited'

  const digitsToRemove = Math.max(decimals - maximumFractionDigits, 0)
  const roundingScale = 10n ** BigInt(digitsToRemove)
  const rounded = digitsToRemove === 0
    ? value
    : (value + roundingScale / 2n) / roundingScale * roundingScale
  const [whole, fraction = ''] = formatUnits(rounded, decimals).split('.')
  const trimmedFraction = fraction.replace(/0+$/, '')
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole
}

export function hasPositiveAmount(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
}
import { formatUnits } from 'viem'
