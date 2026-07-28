import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/ibm-plex-mono/500.css'
import './globals.css'

export const metadata = {
  title: 'TrovePilot CRE',
  description: 'Keyless Aave V3 position monitoring powered by Chainlink CRE',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}

