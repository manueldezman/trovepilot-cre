export enum Action {
  NO_ACTION = 0,
  REPAY = 1,
}

export type DecisionReason =
  | 'REPAY'
  | 'NO_ACTION_SAFE_RANGE'
  | 'NO_ACTION_UPPER_BAND'
  | 'NO_ACTION_NO_RESERVE'
  | 'NO_ACTION_DISABLED'
  | 'NO_ACTION_NO_DEBT'

export interface PositionSnapshot {
  ratio: bigint
  lowerRatio: bigint
  upperRatio: bigint
  debtBalance: bigint
  reserveBalance: bigint
  enabled: boolean
}

export interface CompoundPositionInput {
  collateralBalance: bigint
  collateralScale: bigint
  collateralPrice: bigint
  borrowCollateralFactor: bigint
  debtBalance: bigint
  baseScale: bigint
  basePrice: bigint
}

export interface CompoundPosition {
  ratio: bigint
  adjustedCollateralValue: bigint
  debtValue: bigint
}

const FACTOR_SCALE = 10n ** 18n
const MAX_UINT256 = 2n ** 256n - 1n

export function calculateCompoundPosition(input: CompoundPositionInput): CompoundPosition {
  if (input.collateralScale <= 0n || input.baseScale <= 0n || input.basePrice <= 0n) {
    throw new Error('Invalid Compound market configuration')
  }
  const adjustedCollateralValue =
    input.collateralBalance * input.collateralPrice / input.collateralScale
    * input.borrowCollateralFactor / FACTOR_SCALE
  const debtValue = input.debtBalance * input.basePrice / input.baseScale
  return {
    adjustedCollateralValue,
    debtValue,
    ratio: debtValue === 0n ? MAX_UINT256 : adjustedCollateralValue * FACTOR_SCALE / debtValue,
  }
}

export function calculateSuggestedRepay(
  position: CompoundPosition,
  debtBalance: bigint,
  reserveBalance: bigint,
  baseScale: bigint,
  basePrice: bigint,
  targetRatio: bigint,
) {
  if (debtBalance === 0n || reserveBalance === 0n || basePrice <= 0n || targetRatio <= 0n) return 0n
  const targetDebt =
    position.adjustedCollateralValue * baseScale * FACTOR_SCALE / basePrice / targetRatio
  const needed = debtBalance > targetDebt ? debtBalance - targetDebt : 0n
  return needed < reserveBalance ? needed : reserveBalance
}

/** Financial policy is pure and shared by every trigger. The receiver remains authoritative. */
export function decide(snapshot: PositionSnapshot): { action: Action; reason: DecisionReason } {
  if (!snapshot.enabled) return { action: Action.NO_ACTION, reason: 'NO_ACTION_DISABLED' }
  if (snapshot.debtBalance === 0n) return { action: Action.NO_ACTION, reason: 'NO_ACTION_NO_DEBT' }
  if (snapshot.ratio >= snapshot.upperRatio) {
    return { action: Action.NO_ACTION, reason: 'NO_ACTION_UPPER_BAND' }
  }
  if (snapshot.ratio >= snapshot.lowerRatio) {
    return { action: Action.NO_ACTION, reason: 'NO_ACTION_SAFE_RANGE' }
  }
  if (snapshot.reserveBalance === 0n) {
    return { action: Action.NO_ACTION, reason: 'NO_ACTION_NO_RESERVE' }
  }
  return { action: Action.REPAY, reason: 'REPAY' }
}
