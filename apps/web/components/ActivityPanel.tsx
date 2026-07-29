const events = [
  { time: 'Every 5 min', title: 'CRE heartbeat', detail: 'Rechecks price, interest accrual, and borrower activity.' },
  { time: 'Event', title: 'WBTC oracle update', detail: 'Runs the same Health Factor evaluation immediately.' },
  { time: 'Onchain', title: 'Receiver verification', detail: 'Recalculates live state before any USDC repayment.' },
]

export function ActivityPanel() {
  return (
    <section className="panel activity">
      <div className="panelHead"><div><p className="eyebrow">EXECUTION PATH</p><h3>CRE monitoring activity</h3></div><span className="dry">DRY RUN DEFAULT</span></div>
      {events.map((event) => <div className="event" key={event.title}><time>{event.time}</time><i /><div><b>{event.title}</b><p>{event.detail}</p></div></div>)}
    </section>
  )
}
