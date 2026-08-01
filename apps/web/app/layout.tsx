import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/ibm-plex-mono/500.css'
import './globals.css'
import { AppShell } from '@/components/AppShell'

export const metadata = {
  title: 'TrovePilot CRE — Engineering Test Report',
  description: 'Compound III collateral repayment test using Chainlink CRE on Ethereum Sepolia.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>
}
