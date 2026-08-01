import { creDemoEvidence } from '@/lib/creDemoEvidence'

export function EvidenceTerminal() {
  return (
    <div className="evidenceTerminal">
      <div className="terminalMeta">
        <strong>{creDemoEvidence.label}</strong>
        <span>{creDemoEvidence.period}</span>
        <em>LOCAL SIMULATION + SEPOLIA BROADCAST</em>
      </div>
      <div className="terminalRows">
        {creDemoEvidence.events.map((entry, index) => (
          <p key={`${entry.time}-${entry.event}-${index}`}>
            <time>{entry.time}</time>
            <b>{entry.stage}</b>
            <span><strong>{entry.event}</strong> · {entry.detail}</span>
            <em>{entry.status}</em>
          </p>
        ))}
      </div>
      <div className="terminalLinks" aria-label="CRE demonstration evidence">
        <a href={creDemoEvidence.links.transaction} target="_blank" rel="noreferrer">Verified transaction ↗</a>
        <a href={creDemoEvidence.links.rawTranscript} target="_blank" rel="noreferrer">Raw transcript ↗</a>
        <a href={creDemoEvidence.links.checksums} target="_blank" rel="noreferrer">Checksums ↗</a>
      </div>
    </div>
  )
}
