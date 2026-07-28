import { describe, expect, it } from 'vitest'
import { validateThresholds } from './thresholds'

describe('threshold validation', () => {
  it('accepts the TrovePilot defaults', () => expect(validateThresholds('1.58', '1.60', '1.62')).toBeNull())
  it('rejects liquidation-level and unordered bands', () => {
    expect(validateThresholds('1', '1.6', '1.62')).toContain('greater')
    expect(validateThresholds('1.7', '1.6', '1.8')).toContain('lower')
  })
})

