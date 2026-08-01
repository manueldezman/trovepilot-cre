import Link from 'next/link'
import type { ReactNode } from 'react'
import { caseStudy } from '@/lib/caseStudy'

const navItems = [
  { href: '#aim', label: 'Aim' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#thresholds', label: 'Thresholds' },
  { href: '#execution', label: 'Execution' },
  { href: '#proof', label: 'References' },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="atlasApp">
      <header className="storyHeader">
        <Link className="atlasBrand" href="/"><b>TP</b><span>TROVEPILOT<small>ENGINEERING TEST REPORT</small></span></Link>
        <nav className="storyNav" aria-label="Case study sections">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>{item.label}</a>
          ))}
        </nav>
        <a className="storyRepo" href={caseStudy.links.creRepository} target="_blank" rel="noreferrer">SOURCE ↗</a>
      </header>
      <div className="atlasContext"><span>COMPOUND III · ETHEREUM SEPOLIA</span><b>CRE TEST REPORT</b><span><i /> SEPOLIA TX CONFIRMED</span></div>
      <main className="storyMain">{children}</main>
      <footer className="storyFooter"><span>TROVEPILOT CRE · 2026</span><span>LOCAL CRE SIMULATION / SEPOLIA BROADCAST</span></footer>
    </div>
  )
}
