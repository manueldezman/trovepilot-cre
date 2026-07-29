import { ActivityPanel } from '@/components/ActivityPanel'

export default function SimulationPage() {
  return (
    <>
      <section className="notice pageIntro">
        <b>Simulation is isolated from production monitoring.</b>
        <p>Use CRE CLI simulation and the local contract tests to demonstrate low, safe-range, upper-band, stale, and duplicate scenarios.</p>
      </section>
      <ActivityPanel />
    </>
  )
}
