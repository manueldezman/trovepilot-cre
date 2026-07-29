'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrovePilotProvider, useTrovePilot } from '@/components/TrovePilotProvider'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/compound-setup', label: 'Compound setup' },
  { href: '/rules', label: 'Automation rules' },
  { href: '/reserve', label: 'USDC reserve' },
  { href: '/activity', label: 'CRE activity' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/designs', label: 'UI concepts' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TrovePilotProvider>
      <ShellFrame>{children}</ShellFrame>
    </TrovePilotProvider>
  )
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { account, connect } = useTrovePilot()

  if (pathname.startsWith('/designs')) return <>{children}</>

  return (
    <div className="shell">
      <aside>
        <div className="brand"><span className="brandMark">T</span><div>TrovePilot<small>CRE / Sepolia</small></div></div>
        <nav>
          {navItems.map((item) => (
            <Link className={pathname === item.href ? 'active' : ''} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="network"><i /> Ethereum Sepolia</div>
      </aside>
      <main>
        <header>
          <div><p className="eyebrow">AAVE V3 POSITION</p><h1>Collateral safety cockpit</h1></div>
          <button className="secondary" onClick={connect}>
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect wallet'}
          </button>
        </header>
        {children}
      </main>
    </div>
  )
}
