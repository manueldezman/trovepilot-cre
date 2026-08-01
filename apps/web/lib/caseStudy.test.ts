import { describe, expect, it } from 'vitest'
import { caseStudy } from './caseStudy'

describe('case study content', () => {
  it('states the normal repayment policy in threshold order', () => {
    expect(caseStudy.thresholds.map(({ value }) => Number(value))).toEqual([1.58, 1.6, 1.62])
    expect(caseStudy.thresholds[0].behavior).toContain('REPAY')
    expect(caseStudy.thresholds[2].behavior).toContain('no action')
  })

  it('identifies the CRE implementation as a redesign of the original VPS system', () => {
    expect(caseStudy.redesign).toContain('redesign')
    expect(caseStudy.redesign).toContain('VPS')
    expect(caseStudy.links.originalRepository).toBe('https://github.com/manueldezman/trovepilot')
  })

  it('keeps the demonstrated result distinct from the normal target', () => {
    expect(caseStudy.result.demoTarget).toBe('2.460000')
    expect(caseStudy.thresholds.find(({ label }) => label === 'Target')?.value).toBe('1.60')
    expect(caseStudy.result.amount).toBe('0.101487 USDC')
  })

  it('uses engineering-report headings instead of promotional claims', () => {
    expect(Object.values(caseStudy.sections).map(({ title }) => title)).toEqual([
      'Project objective',
      'From VPS monitoring to Chainlink CRE',
      'Repayment policy',
      'Simulation and broadcast result',
      'Source and test artifacts',
    ])

    const copy = JSON.stringify(caseStudy)
    expect(copy).not.toContain('Every claim')
    expect(copy).not.toContain('one confirmed repayment')
    expect(copy).not.toContain('verifiable execution')
  })
})
