import { describe, expect, it } from 'vitest'
import { creDemoEvidence } from './creDemoEvidence'

describe('CRE demo evidence', () => {
  it('keeps the curated events in chronological order', () => {
    const times = creDemoEvidence.events.map(({ time }) => time)
    expect(times).toEqual([...times].sort())
  })

  it('identifies the confirmed repayment and immutable evidence links', () => {
    const repayment = creDemoEvidence.events.find(({ event }) => event === 'REPAYMENT')

    expect(repayment).toMatchObject({ status: 'CONFIRMED' })
    expect(repayment?.detail).toContain('0.101487 USDC')
    expect(creDemoEvidence.links.transaction).toContain(
      '0x9677805924b2dd83598133caf65d54757fc3d89ddf5391db9f3f7d16f992a492',
    )
    expect(creDemoEvidence.links.rawTranscript).toContain('cre-sepolia-demo-v1')
    expect(creDemoEvidence.links.checksums).toContain('checksums.sha256')
  })

  it('contains display-safe curated text rather than raw terminal control data', () => {
    const text = JSON.stringify(creDemoEvidence.events)

    expect(text).not.toMatch(/[\u001b\u0000-\u0008\u000b\u000c\u000e-\u001f]/)
    expect(text).not.toContain('PRIVATE_KEY')
  })
})
