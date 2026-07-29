import { parseUnits } from 'viem'

export function validateThresholds(lower: string, target: string, upper: string) {
  const values = [lower, target, upper].map((value) => parseUnits(value, 18))
  if (values[0] <= BigInt('1000000000000000000')) return 'Lower safety ratio must be greater than 1.0'
  if (values[0] > values[1] || values[1] > values[2]) return 'Use lower ≤ target ≤ upper'
  return null
}
