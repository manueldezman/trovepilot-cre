'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits, type Address } from 'viem'
import { validateThresholds } from '@/lib/thresholds'
import { addresses, sepolia } from '@/lib/config'
import { erc20Abi, poolAbi, receiverAbi } from '@/lib/contracts'

const events = [
  { time: 'Every 5 min', title: 'CRE heartbeat', detail: 'Rechecks price, interest accrual, and borrower activity.' },
  { time: 'Event', title: 'WBTC oracle update', detail: 'Runs the same Health Factor evaluation immediately.' },
  { time: 'Onchain', title: 'Receiver verification', detail: 'Recalculates live state before any USDC repayment.' },
]
const publicClient = createPublicClient({ chain: sepolia, transport: http() })

export function Dashboard() {
  const [lower, setLower] = useState('1.58')
  const [target, setTarget] = useState('1.60')
  const [upper, setUpper] = useState('1.62')
  const [enabled, setEnabled] = useState(true)
  const [account, setAccount] = useState<Address>()
  const [healthFactor, setHealthFactor] = useState('—')
  const [collateral, setCollateral] = useState('—')
  const [debt, setDebt] = useState('—')
  const [reserve, setReserve] = useState('—')
  const [amount, setAmount] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const error = validateThresholds(lower, target, upper)
  const receiver = addresses.receiver
  const refresh = useCallback(async (borrower: Address) => {
    if (!receiver) return
    const [position, userRules, userReserve] = await Promise.all([
      publicClient.readContract({ address: addresses.pool, abi: poolAbi, functionName: 'getUserAccountData', args: [borrower] }),
      publicClient.readContract({ address: receiver, abi: receiverAbi, functionName: 'rules', args: [borrower] }),
      publicClient.readContract({ address: receiver, abi: receiverAbi, functionName: 'reserves', args: [borrower] }),
    ])
    setCollateral(formatUnits(position[0], 8))
    setDebt(formatUnits(position[1], 8))
    setHealthFactor(position[5] === (2n ** 256n - 1n) ? '∞' : Number(formatUnits(position[5], 18)).toFixed(3))
    setReserve(Number(formatUnits(userReserve, 6)).toFixed(2))
    if (userRules[0] > 0n) {
      setLower(formatUnits(userRules[0], 18)); setTarget(formatUnits(userRules[1], 18))
      setUpper(formatUnits(userRules[2], 18)); setEnabled(userRules[3])
    }
  }, [receiver])

  useEffect(() => {
    if (!account) return
    void refresh(account)
    const timer = setInterval(() => void refresh(account), 30_000)
    return () => clearInterval(timer)
  }, [account, refresh])

  async function wallet() {
    if (!window.ethereum) throw new Error('Install an EIP-1193 wallet such as MetaMask')
    const client = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) })
    const [selected] = await client.requestAddresses()
    setAccount(selected); return { client, selected }
  }

  async function transact(run: (client: ReturnType<typeof createWalletClient>, selected: Address) => Promise<`0x${string}`>) {
    if (!receiver) return setMessage('Set NEXT_PUBLIC_RECEIVER_ADDRESS after deployment')
    setPending(true); setMessage('')
    try {
      const { client, selected } = await wallet()
      const hash = await run(client, selected)
      await publicClient.waitForTransactionReceipt({ hash })
      setMessage(`Confirmed ${hash.slice(0, 10)}…`)
      await refresh(selected)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause))
    } finally { setPending(false) }
  }

  const saveRules = () => transact((client, selected) => client.writeContract({
    account: selected, chain: sepolia, address: receiver!, abi: receiverAbi, functionName: 'setRules',
    args: [parseUnits(lower, 18), parseUnits(target, 18), parseUnits(upper, 18), enabled],
  }))
  const deposit = async () => {
    if (!receiver || !amount) return setMessage('Enter a USDC amount and configure the receiver')
    setPending(true); setMessage('')
    try {
      const { client, selected } = await wallet()
      const value = parseUnits(amount, 6)
      const approval = await client.writeContract({ account: selected, chain: sepolia, address: addresses.usdc, abi: erc20Abi, functionName: 'approve', args: [receiver, value] })
      await publicClient.waitForTransactionReceipt({ hash: approval })
      const hash = await client.writeContract({ account: selected, chain: sepolia, address: receiver, abi: receiverAbi, functionName: 'depositReserve', args: [value] })
      await publicClient.waitForTransactionReceipt({ hash }); setMessage(`Deposit confirmed ${hash.slice(0, 10)}…`)
      await refresh(selected)
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : String(cause)) }
    finally { setPending(false) }
  }
  const withdraw = () => transact((client, selected) => client.writeContract({
    account: selected, chain: sepolia, address: receiver!, abi: receiverAbi,
    functionName: 'withdrawReserve', args: [parseUnits(amount, 6)],
  }))

  return (
    <div className="shell">
      <aside>
        <div className="brand"><span className="brandMark">T</span><div>TrovePilot<small>CRE / Sepolia</small></div></div>
        <nav>
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#rules">Automation rules</a>
          <a href="#reserve">USDC reserve</a>
          <a href="#activity">CRE activity</a>
          <a href="#simulation">Simulation</a>
        </nav>
        <div className="network"><i /> Ethereum Sepolia</div>
      </aside>
      <main>
        <header>
          <div><p className="eyebrow">AAVE V3 POSITION</p><h1>Collateral safety cockpit</h1></div>
          <button className="secondary" onClick={() => wallet().then(({ selected }) => refresh(selected)).catch((e) => setMessage(String(e)))}>
            {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Connect wallet'}
          </button>
        </header>

        <section id="dashboard" className="hero">
          <div><span className="status">AUTOMATION READY</span><h2>Keyless monitoring.<br />Onchain-enforced repayment.</h2>
            <p>Chainlink CRE watches WBTC price events and performs a five-minute safety heartbeat. Your wallet remains in control.</p></div>
          <div className="heartbeat"><span className="pulse" /><div><b>Next heartbeat</b><strong>04:27</strong><small>Oracle events run immediately</small></div></div>
        </section>

        <section className="metrics">
          <article><label>Health Factor</label><strong>{healthFactor}</strong><small>Live Aave account data</small></article>
          <article><label>Collateral base</label><strong>{collateral}</strong><small>Aave oracle USD base</small></article>
          <article><label>Debt base</label><strong>{debt}</strong><small>Repay-only automation</small></article>
          <article><label>Automation reserve</label><strong>{reserve}</strong><small>User-funded USDC</small></article>
        </section>

        <div className="columns">
          <section id="rules" className="panel">
            <div className="panelHead"><div><p className="eyebrow">POLICY</p><h3>Health Factor band</h3></div>
              <button className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled(!enabled)} aria-label="Toggle automation"><span /></button></div>
            <p className="muted">Below the lower band, repay USDC toward target. Above the upper band, take no action.</p>
            <div className="ruleGrid">
              <label>Lower<input value={lower} onChange={(e) => setLower(e.target.value)} /></label>
              <label>Target<input value={target} onChange={(e) => setTarget(e.target.value)} /></label>
              <label>Upper<input value={upper} onChange={(e) => setUpper(e.target.value)} /></label>
            </div>
            {error && <p className="error">{error}</p>}
            <button disabled={Boolean(error) || pending} className="primary" onClick={saveRules}>Save rules with wallet</button>
          </section>

          <section id="reserve" className="panel">
            <p className="eyebrow">REPAYMENT CAPACITY</p><h3>USDC automation reserve</h3>
            <div className="reserveAmount">{reserve} <span>USDC</span></div>
            <p className="muted">Funds can only repay your Aave variable USDC debt or return to your wallet.</p>
            <input className="amountInput" inputMode="decimal" placeholder="Amount in USDC" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="buttonRow"><button disabled={pending} className="primary" onClick={deposit}>Deposit</button><button disabled={pending || !amount} className="secondary" onClick={withdraw}>Withdraw</button></div>
            {message && <p className="txMessage">{message}</p>}
          </section>
        </div>

        <section id="activity" className="panel activity">
          <div className="panelHead"><div><p className="eyebrow">EXECUTION PATH</p><h3>CRE monitoring activity</h3></div><span className="dry">DRY RUN DEFAULT</span></div>
          {events.map((event) => <div className="event" key={event.title}><time>{event.time}</time><i /><div><b>{event.title}</b><p>{event.detail}</p></div></div>)}
        </section>

        <section id="simulation" className="notice">
          <b>Simulation is isolated from production monitoring.</b>
          <p>Use CRE CLI simulation and the local contract tests to demonstrate low, safe-range, upper-band, stale, and duplicate scenarios.</p>
        </section>
      </main>
    </div>
  )
}
