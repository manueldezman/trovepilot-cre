'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrovePilotProvider, useTrovePilot } from '@/components/TrovePilotProvider'

const navItems = [
  { href: '/', label: 'Field' },
  { href: '/compound-setup', label: 'Position' },
  { href: '/rules', label: 'Policy' },
  { href: '/reserve', label: 'Reserve' },
  { href: '/activity', label: 'Signals' },
  { href: '/simulation', label: 'Simulation' },
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

  const current = navItems.find((item) => item.href === pathname)?.label ?? 'Collateral field'

  return (
    <div className="atlasApp">
      <header className="atlasHeader">
        <Link className="atlasBrand" href="/"><b>TP</b><span>TROVEPILOT<small>COLLATERAL FIELD / CRE</small></span></Link>
        <nav className="atlasNav">
          {navItems.map((item) => (
            <Link className={pathname === item.href ? 'active' : ''} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="atlasConnect" onClick={connect}>
          {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'CONNECT ↗'}
        </button>
      </header>
      <div className="atlasContext"><span>COMPOUND III · ETHEREUM SEPOLIA</span><b>{current.toUpperCase()}</b><span><i /> CRE MONITOR</span></div>
      <main className="atlasMain">
        {children}
      </main>
    </div>
  )
}
