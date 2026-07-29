export const faucetDefaults = {
  wbtc: '0.01',
  usdc: '100',
} as const

export function hasPositiveAmount(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
}
