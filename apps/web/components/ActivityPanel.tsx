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
    <section className="signalTerminal">
      <div className="panelHead">
        <div><p className="eyebrow">SIGNAL TERMINAL</p><h3>cre://trovepilot/compound-monitor --follow</h3></div>
        <button className="secondary" onClick={account ? () => window.location.reload() : connect}>Refresh</button>
      </div>
      <div className="terminalRows">
        <p><time>TRIGGER</time><b>HEARTBEAT</b><span>schedule=*/5_minutes</span><em>LISTENING</em></p>
        <p><time>TRIGGER</time><b>ORACLE_EVENT</b><span>feed=WBTC_USD · confidence=FINALIZED</span><em>LISTENING</em></p>
        <p><time>LATEST</time><b>EVALUATION_ID</b><span>{lastEvaluation}</span><em>ONCHAIN</em></p>
        <p><time>$</time><span>{status}</span><i /></p>
      </div>
      {receiver && (
        <a href={`${sepolia.blockExplorers.default.url}/address/${receiver}#events`} target="_blank" rel="noreferrer">
          View accepted, skipped, and repayment events on Etherscan
        </a>
      )}
    </section>
  )
}
