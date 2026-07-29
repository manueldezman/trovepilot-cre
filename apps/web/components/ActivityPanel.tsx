'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { useTrovePilot } from '@/components/TrovePilotProvider'
import { compoundSepolia, sepolia } from '@/lib/config'
import { receiverAbi } from '@/lib/contracts'

const publicClient = createPublicClient({ chain: sepolia, transport: http() })
const zeroEvaluation = `0x${'0'.repeat(64)}`

export function ActivityPanel() {
  const { account, connect, receiver } = useTrovePilot()
  const [lastEvaluation, setLastEvaluation] = useState<string>('-')
  const [status, setStatus] = useState('Connect the borrower wallet to monitor its automation.')

  useEffect(() => {
    if (!account || !receiver) return
    void (async () => {
      try {
        const receiverComet = await publicClient.readContract({
          address: receiver, abi: receiverAbi, functionName: 'comet',
        })
        if (receiverComet.toLowerCase() !== compoundSepolia.comet.toLowerCase()) {
          setStatus('Configured receiver is incompatible. Deploy the Compound receiver.')
          return
        }
        const evaluation = await publicClient.readContract({
          address: receiver, abi: receiverAbi, functionName: 'lastEvaluationId', args: [account],
        })
        setLastEvaluation(evaluation === zeroEvaluation ? 'No report processed yet' : evaluation)
        setStatus('Receiver verified for the Compound Sepolia market.')
      } catch {
        setStatus('Compound receiver is not deployed or could not be read.')
      }
    })()
  }, [account, receiver])

  return (
    <section className="panel activity">
      <div className="panelHead">
        <div><p className="eyebrow">LIVE MONITORING</p><h3>CRE and receiver activity</h3></div>
        <button className="secondary" onClick={account ? () => window.location.reload() : connect}>Refresh</button>
      </div>
      <div className="event"><time>Every 5 min</time><i /><div><b>CRE heartbeat</b><p>Rechecks price, accrued interest, and borrower activity.</p></div></div>
      <div className="event"><time>Oracle event</time><i /><div><b>WBTC price update</b><p>Runs the same finalized-state evaluation immediately.</p></div></div>
      <div className="event"><time>Latest</time><i /><div><b>Evaluation ID</b><p className="mono">{lastEvaluation}</p></div></div>
      <p className="muted">{status}</p>
      {receiver && (
        <a href={`${sepolia.blockExplorers.default.url}/address/${receiver}#events`} target="_blank" rel="noreferrer">
          View accepted, skipped, and repayment events on Etherscan
        </a>
      )}
    </section>
  )
}
