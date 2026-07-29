'use client'

import { useTrovePilot } from '@/components/TrovePilotProvider'

export function ReservePanel() {
  const { reserve, amount, pending, message, setAmount, deposit, withdraw } = useTrovePilot()

  return (
    <section className="panel">
      <p className="eyebrow">REPAYMENT CAPACITY</p><h3>USDC automation reserve</h3>
      <div className="reserveAmount">{reserve} <span>USDC</span></div>
      <p className="muted">Funds can only repay your Compound USDC debt or return to your wallet.</p>
      <input className="amountInput" inputMode="decimal" placeholder="Amount in USDC" value={amount} onChange={(event) => setAmount(event.target.value)} />
      <div className="buttonRow"><button disabled={pending} className="primary" onClick={deposit}>Deposit</button><button disabled={pending || !amount} className="secondary" onClick={withdraw}>Withdraw</button></div>
      {message && <p className="txMessage">{message}</p>}
    </section>
  )
}
