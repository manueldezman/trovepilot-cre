import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/ibm-plex-mono/500.css'
import './globals.css'
import { AppShell } from '@/components/AppShell'

export const metadata = {
  title: 'TrovePilot CRE',
  description: 'Keyless Compound III position monitoring powered by Chainlink CRE',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>
}
