import { EvidenceTerminal } from '@/components/EvidenceTerminal'
import { caseStudy } from '@/lib/caseStudy'

function SectionHeading({ number, eyebrow, title }: { number: string; eyebrow: string; title: string }) {
  return (
    <div className="storyHeading">
      <span>{number}</span>
      <div><p>{eyebrow}</p><h2>{title}</h2></div>
    </div>
  )
}

function ArchitectureFlow({ steps }: { steps: readonly string[] }) {
  return (
    <div className="architectureFlow">
      {steps.map((step, index) => <div key={step}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></div>)}
    </div>
  )
}

export default function Page() {
  return (
    <>
      <section className="caseHero">
        <div className="heroCopy">
          <p className="storyEyebrow">ENGINEERING TEST REPORT / CHAINLINK CRE / ETHEREUM SEPOLIA</p>
          <h1>{caseStudy.title}</h1>
          <p className="heroSubject">{caseStudy.subtitle}</p>
          <p className="heroSummary">{caseStudy.summary}</p>
          <a href="#execution">View test execution ↓</a>
        </div>
        <div className="heroResult">
          <span>ONCHAIN RESULT</span>
          <strong>0.101487</strong>
          <b>USDC REPAID</b>
          <small>SEPOLIA · CONFIRMED</small>
        </div>
      </section>

      <section className="storyMetrics" aria-label="Project summary">
        {caseStudy.metrics.map((metric) => (
          <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>
        ))}
      </section>

      <section className="storySection" id="aim">
        <SectionHeading number="01" eyebrow={caseStudy.sections.objective.label} title={caseStudy.sections.objective.title} />
        <div className="storyColumns">
          <p className="storyLead">{caseStudy.aim}</p>
          <div className="storyBody">
            <p>{caseStudy.redesign}</p>
            <a href={caseStudy.links.originalRepository} target="_blank" rel="noreferrer">View the original VPS implementation ↗</a>
          </div>
        </div>
      </section>

      <section className="storySection" id="architecture">
        <SectionHeading number="02" eyebrow={caseStudy.sections.architecture.label} title={caseStudy.sections.architecture.title} />
        <div className="architectureCompare">
          <article>
            <p>FORMER ARCHITECTURE</p>
            <h3>VPS monitor + borrower signer</h3>
            <ArchitectureFlow steps={caseStudy.previousArchitecture} />
            <a href={caseStudy.links.originalRepository} target="_blank" rel="noreferrer">github.com/manueldezman/trovepilot ↗</a>
          </article>
          <article>
            <p>CRE IMPLEMENTATION</p>
            <h3>CRE triggers + receiver contract</h3>
            <ArchitectureFlow steps={caseStudy.creArchitecture} />
            <a href={caseStudy.links.creArchitecture} target="_blank" rel="noreferrer">Read the CRE architecture ↗</a>
          </article>
        </div>
      </section>

      <section className="storySection" id="thresholds">
        <SectionHeading number="03" eyebrow={caseStudy.sections.thresholds.label} title={caseStudy.sections.thresholds.title} />
        <p className="sectionIntro">The normal policy is repay-only. It never borrows more debt when the position moves above the upper band.</p>
        <div className="thresholdAxis">
          {caseStudy.thresholds.map((threshold) => (
            <article key={threshold.label}>
              <span>{threshold.label}</span><strong>{threshold.value}</strong><p>{threshold.behavior}</p>
            </article>
          ))}
        </div>
        <div className="policyRule"><b>ICR &lt; 1.58</b><span>REPAY TOWARD 1.60</span><i /><b>ICR ≥ 1.58</b><span>NO ACTION</span></div>
      </section>

      <section className="storySection" id="execution">
        <SectionHeading number="04" eyebrow={caseStudy.sections.execution.label} title={caseStudy.sections.execution.title} />
        <div className="executionSummary">
          <article><span>OBSERVED RATIO</span><strong>{caseStudy.result.observedRatio}</strong><small>Before receiver execution</small></article>
          <article><span>CONTROLLED DEMO TARGET</span><strong>{caseStudy.result.demoTarget}</strong><small>Temporary test condition</small></article>
          <article><span>RESTORED RATIO</span><strong>{caseStudy.result.restoredRatio}</strong><small>After repayment</small></article>
          <article><span>REPAID</span><strong>{caseStudy.result.amount}</strong><small>From the funded reserve</small></article>
        </div>
        <p className="executionNote">{caseStudy.result.explanation}</p>
        <div className="terminalHeading"><p>CRE SIMULATION TRANSCRIPT</p><span>RUN 20260801T075120Z-BROADCAST</span></div>
        <EvidenceTerminal />
      </section>

      <section className="storySection" id="proof">
        <SectionHeading number="05" eyebrow={caseStudy.sections.references.label} title={caseStudy.sections.references.title} />
        <div className="proofLinks">
          <a href={caseStudy.links.evidence} target="_blank" rel="noreferrer"><span>01</span><b>Test evidence</b><em>Transcript, hashes, evaluation ID ↗</em></a>
          <a href={caseStudy.links.receiver} target="_blank" rel="noreferrer"><span>02</span><b>Verified receiver</b><em>Contract source on Blockscout ↗</em></a>
          <a href={caseStudy.links.tag} target="_blank" rel="noreferrer"><span>03</span><b>Immutable demo tag</b><em>cre-sepolia-demo-v1 ↗</em></a>
          <a href={caseStudy.links.creRepository} target="_blank" rel="noreferrer"><span>04</span><b>CRE source</b><em>Workflow, receiver, and tests ↗</em></a>
        </div>
        <p className="caseDisclosure"><b>SCOPE:</b> This is a local Chainlink CRE simulation with a real Sepolia broadcast. It is not a registered or DON-hosted production workflow.</p>
      </section>
    </>
  )
}
