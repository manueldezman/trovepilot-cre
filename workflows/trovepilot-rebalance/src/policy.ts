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
  healthFactor: bigint
  lowerHF: bigint
  upperHF: bigint
  debtBalance: bigint
  reserveBalance: bigint
  enabled: boolean
}

export interface Decision {
  action: Action
  reason: DecisionReason
}

/** Financial policy is pure and shared by every trigger. The receiver remains authoritative. */
export function decide(snapshot: PositionSnapshot): Decision {
  if (!snapshot.enabled) return { action: Action.NO_ACTION, reason: 'NO_ACTION_DISABLED' }
  if (snapshot.debtBalance === 0n) return { action: Action.NO_ACTION, reason: 'NO_ACTION_NO_DEBT' }
  if (snapshot.healthFactor >= snapshot.upperHF) {
    return { action: Action.NO_ACTION, reason: 'NO_ACTION_UPPER_BAND' }
  }
  if (snapshot.healthFactor >= snapshot.lowerHF) {
    return { action: Action.NO_ACTION, reason: 'NO_ACTION_SAFE_RANGE' }
  }
  if (snapshot.reserveBalance === 0n) {
    return { action: Action.NO_ACTION, reason: 'NO_ACTION_NO_RESERVE' }
  }
  return { action: Action.REPAY, reason: 'REPAY' }
}

