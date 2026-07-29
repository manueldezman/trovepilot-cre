import Link from 'next/link'
import styles from './page.module.css'

const concepts = [
  { href: '/designs/atlas', number: '01', name: 'Atlas Field', detail: 'A spatial risk map built around one continuous threshold landscape.' },
  { href: '/designs/index', number: '02', name: 'Index Sheet', detail: 'An editorial market sheet using type, rules, tables, and an event tape.' },
  { href: '/designs/signal', number: '03', name: 'Signal Terminal', detail: 'High-contrast technical console for active monitoring.' },
]

export default function DesignsPage() {
  return (
    <main className={styles.gallery}>
      <div className={styles.intro}><Link href="/">← Current dashboard</Link><p>UI EXPLORATION</p><h1>Choose a new direction for TrovePilot.</h1><span>Each concept is responsive and interactive. Resize the browser, change the borrow preview, toggle protection, and test its navigation.</span></div>
      <section>{concepts.map((concept) => <Link href={concept.href} key={concept.href}><i>{concept.number}</i><div><h2>{concept.name}</h2><p>{concept.detail}</p></div><b>Open concept →</b></Link>)}</section>
    </main>
  )
}
