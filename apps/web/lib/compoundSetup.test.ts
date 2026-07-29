import { describe, expect, it } from 'vitest'
import { hasPositiveAmount } from './compoundSetup'

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
