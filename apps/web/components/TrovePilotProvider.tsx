'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits, type Address } from 'viem'
import { validateThresholds } from '@/lib/thresholds'
import { addresses, sepolia } from '@/lib/config'
import { erc20Abi, poolAbi, receiverAbi } from '@/lib/contracts'

const publicClient = createPublicClient({ chain: sepolia, transport: http() })

type TrovePilotContextValue = {
  account?: Address
  lower: string
  target: string
  upper: string
  enabled: boolean
  healthFactor: string
  collateral: string
  debt: string
  reserve: string
  amount: string
  pending: boolean
  message: string
  thresholdError: string | null
  receiver?: Address
  setLower: (value: string) => void
  setTarget: (value: string) => void
  setUpper: (value: string) => void
  setEnabled: (value: boolean) => void
  setAmount: (value: string) => void
  connect: () => Promise<void>
  refreshConnected: () => Promise<void>
  saveRules: () => Promise<void>
  deposit: () => Promise<void>
  withdraw: () => Promise<void>
}

const TrovePilotContext = createContext<TrovePilotContextValue | null>(null)

export function TrovePilotProvider({ children }: { children: ReactNode }) {
  const [lower, setLower] = useState('1.58')
  const [target, setTarget] = useState('1.60')
  const [upper, setUpper] = useState('1.62')
  const [enabled, setEnabled] = useState(true)
  const [account, setAccount] = useState<Address>()
  const [healthFactor, setHealthFactor] = useState('-')
  const [collateral, setCollateral] = useState('-')
  const [debt, setDebt] = useState('-')
  const [reserve, setReserve] = useState('-')
  const [amount, setAmount] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const receiver = addresses.receiver
  const thresholdError = validateThresholds(lower, target, upper)

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
      setLower(formatUnits(userRules[0], 18))
      setTarget(formatUnits(userRules[1], 18))
      setUpper(formatUnits(userRules[2], 18))
      setEnabled(userRules[3])
    }
  }, [receiver])

  useEffect(() => {
    if (!account) return
    void refresh(account)
    const timer = setInterval(() => void refresh(account), 30_000)
    return () => clearInterval(timer)
  }, [account, refresh])

  const wallet = useCallback(async () => {
    if (!window.ethereum) throw new Error('Install an EIP-1193 wallet such as MetaMask')
    const client = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) })
    const [selected] = await client.requestAddresses()
    setAccount(selected)
    return { client, selected }
  }, [])

  const connect = useCallback(async () => {
    try {
      const { selected } = await wallet()
      await refresh(selected)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause))
    }
  }, [refresh, wallet])

  const refreshConnected = useCallback(async () => {
    if (account) await refresh(account)
  }, [account, refresh])

  const transact = useCallback(async (run: (client: ReturnType<typeof createWalletClient>, selected: Address) => Promise<`0x${string}`>) => {
    if (!receiver) {
      setMessage('Set NEXT_PUBLIC_RECEIVER_ADDRESS after deployment')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const { client, selected } = await wallet()
      const hash = await run(client, selected)
      await publicClient.waitForTransactionReceipt({ hash })
      setMessage(`Confirmed ${hash.slice(0, 10)}...`)
      await refresh(selected)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setPending(false)
    }
  }, [receiver, refresh, wallet])

  const saveRules = useCallback(() => transact((client, selected) => client.writeContract({
    account: selected,
    chain: sepolia,
    address: receiver!,
    abi: receiverAbi,
    functionName: 'setRules',
    args: [parseUnits(lower, 18), parseUnits(target, 18), parseUnits(upper, 18), enabled],
  })), [enabled, lower, receiver, target, transact, upper])

  const deposit = useCallback(async () => {
    if (!receiver || !amount) {
      setMessage('Enter a USDC amount and configure the receiver')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const { client, selected } = await wallet()
      const value = parseUnits(amount, 6)
      const approval = await client.writeContract({
        account: selected,
        chain: sepolia,
        address: addresses.usdc,
        abi: erc20Abi,
        functionName: 'approve',
        args: [receiver, value],
      })
      await publicClient.waitForTransactionReceipt({ hash: approval })
      const hash = await client.writeContract({
        account: selected,
        chain: sepolia,
        address: receiver,
        abi: receiverAbi,
        functionName: 'depositReserve',
        args: [value],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setMessage(`Deposit confirmed ${hash.slice(0, 10)}...`)
      await refresh(selected)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setPending(false)
    }
  }, [amount, receiver, refresh, wallet])

  const withdraw = useCallback(() => transact((client, selected) => client.writeContract({
    account: selected,
    chain: sepolia,
    address: receiver!,
    abi: receiverAbi,
    functionName: 'withdrawReserve',
    args: [parseUnits(amount, 6)],
  })), [amount, receiver, transact])

  const value = useMemo<TrovePilotContextValue>(() => ({
    account,
    lower,
    target,
    upper,
    enabled,
    healthFactor,
    collateral,
    debt,
    reserve,
    amount,
    pending,
    message,
    thresholdError,
    receiver,
    setLower,
    setTarget,
    setUpper,
    setEnabled,
    setAmount,
    connect,
    refreshConnected,
    saveRules,
    deposit,
    withdraw,
  }), [account, amount, collateral, connect, debt, deposit, enabled, healthFactor, lower, message, pending, receiver, refreshConnected, reserve, saveRules, target, thresholdError, upper, withdraw])

  return <TrovePilotContext.Provider value={value}>{children}</TrovePilotContext.Provider>
}

export function useTrovePilot() {
  const value = useContext(TrovePilotContext)
  if (!value) throw new Error('useTrovePilot must be used within TrovePilotProvider')
  return value
}
