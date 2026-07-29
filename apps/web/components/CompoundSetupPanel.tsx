'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPublicClient, createWalletClient, custom, formatUnits, http, maxUint256, parseUnits, type Address } from 'viem'
import { compoundSepolia, sepolia } from '@/lib/config'
import { cometAbi, compoundFaucetAbi, erc20Abi } from '@/lib/contracts'
import {
  calculateBorrowCapacity,
  formatAllowance,
  hasPositiveAmount,
  isBorrowAmountAllowed,
  positionAmountDefaults,
  type BorrowCapacityInput,
} from '@/lib/compoundSetup'
import { useTrovePilot } from '@/components/TrovePilotProvider'

const publicClient = createPublicClient({ chain: sepolia, transport: http() })

type CompoundBalances = {
  walletWbtc: string
  walletUsdc: string
  suppliedWbtc: string
  borrowedUsdc: string
  wbtcAllowance: string
  usdcAllowance: string
  totalUsdcSupply: string
  totalUsdcBorrow: string
  wbtcSupplyCap: string
  wbtcMarketSupply: string
  collateralized: string
  liquidatable: string
}

const emptyBalances: CompoundBalances = {
  walletWbtc: '-',
  walletUsdc: '-',
  suppliedWbtc: '-',
  borrowedUsdc: '-',
  wbtcAllowance: '-',
  usdcAllowance: '-',
  totalUsdcSupply: '-',
  totalUsdcBorrow: '-',
  wbtcSupplyCap: '-',
  wbtcMarketSupply: '-',
  collateralized: '-',
  liquidatable: '-',
}

type BorrowMarketState = Omit<BorrowCapacityInput, 'targetRatio' | 'additionalBorrow'>

function formatRatio(value: bigint | null | undefined) {
  if (value === null) return '∞'
  if (value === undefined) return '-'
  return Number(formatUnits(value, 18)).toFixed(3)
}

function parseAmount(value: string, decimals: number) {
  try {
    return hasPositiveAmount(value) ? parseUnits(value, decimals) : null
  } catch {
    return null
  }
}

export function CompoundSetupPanel() {
  const { account, connect, target } = useTrovePilot()
  const [balances, setBalances] = useState<CompoundBalances>(emptyBalances)
  const [borrowMarket, setBorrowMarket] = useState<BorrowMarketState>()
  const [wbtcAmount, setWbtcAmount] = useState<string>(positionAmountDefaults.wbtc)
  const [borrowUsdcAmount, setBorrowUsdcAmount] = useState<string>(positionAmountDefaults.borrowUsdc)
  const [repayUsdcAmount, setRepayUsdcAmount] = useState<string>(positionAmountDefaults.repayUsdc)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async (user?: Address) => {
    if (!user) return
    const [walletWbtc, walletUsdc, suppliedWbtc, borrowedUsdc, wbtcAllowance, usdcAllowance, totalUsdcSupply, totalUsdcBorrow, wbtcInfo, wbtcMarketSupply, collateralized, liquidatable, basePriceFeed, baseScale] = await Promise.all([
      publicClient.readContract({ address: compoundSepolia.wbtc, abi: erc20Abi, functionName: 'balanceOf', args: [user] }),
      publicClient.readContract({ address: compoundSepolia.usdc, abi: erc20Abi, functionName: 'balanceOf', args: [user] }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'collateralBalanceOf', args: [user, compoundSepolia.wbtc] }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'borrowBalanceOf', args: [user] }),
      publicClient.readContract({ address: compoundSepolia.wbtc, abi: erc20Abi, functionName: 'allowance', args: [user, compoundSepolia.comet] }),
      publicClient.readContract({ address: compoundSepolia.usdc, abi: erc20Abi, functionName: 'allowance', args: [user, compoundSepolia.comet] }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'totalSupply' }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'totalBorrow' }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'getAssetInfoByAddress', args: [compoundSepolia.wbtc] }),
      publicClient.readContract({ address: compoundSepolia.wbtc, abi: erc20Abi, functionName: 'balanceOf', args: [compoundSepolia.comet] }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'isBorrowCollateralized', args: [user] }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'isLiquidatable', args: [user] }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'baseTokenPriceFeed' }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'baseScale' }),
    ])
    const [collateralPrice, basePrice] = await Promise.all([
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'getPrice', args: [wbtcInfo.priceFeed] }),
      publicClient.readContract({ address: compoundSepolia.comet, abi: cometAbi, functionName: 'getPrice', args: [basePriceFeed] }),
    ])
    setBalances({
      walletWbtc: formatUnits(walletWbtc, 8),
      walletUsdc: formatUnits(walletUsdc, 6),
      suppliedWbtc: formatUnits(suppliedWbtc, 8),
      borrowedUsdc: formatUnits(borrowedUsdc, 6),
      wbtcAllowance: formatAllowance(wbtcAllowance, 8),
      usdcAllowance: formatAllowance(usdcAllowance, 6),
      totalUsdcSupply: formatUnits(totalUsdcSupply, 6),
      totalUsdcBorrow: formatUnits(totalUsdcBorrow, 6),
      wbtcSupplyCap: formatUnits(wbtcInfo.supplyCap, 8),
      wbtcMarketSupply: formatUnits(wbtcMarketSupply, 8),
      collateralized: collateralized ? 'Yes' : 'No',
      liquidatable: liquidatable ? 'Yes' : 'No',
    })
    setBorrowMarket({
      collateralAmount: suppliedWbtc,
      collateralScale: wbtcInfo.scale,
      collateralPrice,
      borrowCollateralFactor: wbtcInfo.borrowCollateralFactor,
      basePrice,
      baseScale,
      currentDebt: borrowedUsdc,
    })
  }, [])

  useEffect(() => {
    void refresh(account)
  }, [account, refresh])

  async function wallet() {
    if (!window.ethereum) throw new Error('Install an EIP-1193 wallet such as MetaMask')
    const client = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) })
    const [selected] = await client.requestAddresses()
    return { client, selected }
  }

  async function transact(run: (client: ReturnType<typeof createWalletClient>, selected: Address) => Promise<`0x${string}`>) {
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
  }

  const requestFaucet = (asset: Address) => transact((client, selected) => client.writeContract({
    account: selected,
    chain: sepolia,
    address: compoundSepolia.faucet,
    abi: compoundFaucetAbi,
    functionName: 'drip',
    args: [asset],
  }))

  const approve = (asset: Address) => transact((client, selected) => client.writeContract({
    account: selected,
    chain: sepolia,
    address: asset,
    abi: erc20Abi,
    functionName: 'approve',
    args: [compoundSepolia.comet, maxUint256],
  }))

  const supplyWbtc = () => transact((client, selected) => client.writeContract({
    account: selected,
    chain: sepolia,
    address: compoundSepolia.comet,
    abi: cometAbi,
    functionName: 'supply',
    args: [compoundSepolia.wbtc, parseUnits(wbtcAmount, 8)],
  }))

  const borrowUsdc = () => transact((client, selected) => client.writeContract({
    account: selected,
    chain: sepolia,
    address: compoundSepolia.comet,
    abi: cometAbi,
    functionName: 'withdraw',
    args: [compoundSepolia.usdc, parseUnits(borrowUsdcAmount, 6)],
  }))

  const repayUsdc = () => transact((client, selected) => client.writeContract({
    account: selected,
    chain: sepolia,
    address: compoundSepolia.comet,
    abi: cometAbi,
    functionName: 'supply',
    args: [compoundSepolia.usdc, parseUnits(repayUsdcAmount, 6)],
  }))

  const wbtcReady = hasPositiveAmount(wbtcAmount)
  const borrowAmount = parseAmount(borrowUsdcAmount, 6)
  const repayUsdcReady = hasPositiveAmount(repayUsdcAmount)
  const borrowCapacity = useMemo(() => {
    if (!borrowMarket) return undefined
    try {
      return calculateBorrowCapacity({
        ...borrowMarket,
        targetRatio: parseUnits(target, 18),
        additionalBorrow: borrowAmount ?? 0n,
      })
    } catch {
      return undefined
    }
  }, [borrowAmount, borrowMarket, target])
  const borrowExceedsTarget = Boolean(
    borrowAmount !== null
    && borrowCapacity
    && borrowAmount > borrowCapacity.maximumAdditionalBorrow,
  )
  const borrowUsdcReady = borrowCapacity
    ? isBorrowAmountAllowed(borrowAmount, borrowCapacity.maximumAdditionalBorrow)
    : false

  return (
    <>
      <section className="notice pageIntro">
        <b>Compound setup is a test-position helper.</b>
        <p>This page is not wired into CRE automation yet. Use it only to request Compound Sepolia test tokens and create a WBTC collateral / USDC borrow position.</p>
      </section>

      <section className="metrics">
        <article><label>Wallet WBTC</label><strong>{balances.walletWbtc}</strong><small>Compound Sepolia test WBTC</small></article>
        <article><label>Supplied WBTC</label><strong>{balances.suppliedWbtc}</strong><small>Collateral in cUSDCv3</small></article>
        <article><label>Wallet USDC</label><strong>{balances.walletUsdc}</strong><small>Base token for borrow/repay</small></article>
        <article><label>Borrowed USDC</label><strong>{balances.borrowedUsdc}</strong><small>Compound borrow balance</small></article>
      </section>

      <div className="columns">
        <section className="panel">
          <div className="panelHead"><div><p className="eyebrow">FAUCET</p><h3>Request test tokens</h3></div><span className="dry">SEPOLIA</span></div>
          <p className="muted">The buttons call the Compound testnet faucet contract directly from your wallet. Faucet amounts are set by the faucet contract; you still need Sepolia ETH for gas.</p>
          <div className="buttonRow">
            <button disabled={pending} className="primary" onClick={() => requestFaucet(compoundSepolia.wbtc)}>Get WBTC</button>
            <button disabled={pending} className="secondary" onClick={() => requestFaucet(compoundSepolia.usdc)}>Get USDC</button>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">MARKET CAPACITY</p><h3>cUSDCv3 status</h3>
          <dl className="kv">
            <div><dt>WBTC cap</dt><dd>{balances.wbtcSupplyCap}</dd></div>
            <div><dt>WBTC supplied</dt><dd>{balances.wbtcMarketSupply}</dd></div>
            <div><dt>Total USDC supply</dt><dd>{balances.totalUsdcSupply}</dd></div>
            <div><dt>Total USDC borrow</dt><dd>{balances.totalUsdcBorrow}</dd></div>
            <div><dt>Borrow collateralized</dt><dd>{balances.collateralized}</dd></div>
            <div><dt>Liquidatable</dt><dd>{balances.liquidatable}</dd></div>
          </dl>
        </section>
      </div>

      <section className="panel">
        <div className="panelHead"><div><p className="eyebrow">POSITION SETUP</p><h3>Supply, borrow, repay</h3></div><button className="secondary" onClick={account ? () => refresh(account) : connect}>Refresh</button></div>
        <div className="setupGrid">
          <article>
            <h3>1. Approve collateral</h3>
            <p className="muted">Current WBTC allowance: {balances.wbtcAllowance}</p>
            <button disabled={pending} className="primary" onClick={() => approve(compoundSepolia.wbtc)}>Approve WBTC</button>
          </article>
          <article>
            <h3>2. Supply WBTC</h3>
            <p className="muted">Adds WBTC as collateral in the Compound USDC market.</p>
            <label>
              WBTC amount
              <input
                inputMode="decimal"
                min="0"
                step="0.00000001"
                type="number"
                value={wbtcAmount}
                onChange={(event) => setWbtcAmount(event.target.value)}
              />
            </label>
            <button disabled={pending || !wbtcReady} className="primary" onClick={supplyWbtc}>Supply WBTC</button>
          </article>
          <article>
            <h3>3. Borrow USDC</h3>
            <p className="muted">
              Current ratio: {formatRatio(borrowCapacity?.currentRatio)} · Maximum additional borrow at {target}: {borrowCapacity ? formatUnits(borrowCapacity.maximumAdditionalBorrow, 6) : '-'} USDC
            </p>
            <label>
              USDC amount
              <input
                inputMode="decimal"
                min="0"
                step="0.000001"
                type="number"
                value={borrowUsdcAmount}
                onChange={(event) => setBorrowUsdcAmount(event.target.value)}
              />
            </label>
            <div className="buttonRow">
              <button
                disabled={pending || !borrowCapacity || borrowCapacity.maximumAdditionalBorrow === 0n}
                className="secondary"
                onClick={() => borrowCapacity && setBorrowUsdcAmount(formatUnits(borrowCapacity.maximumAdditionalBorrow, 6))}
              >
                Use max
              </button>
              <button disabled={pending || !borrowUsdcReady} className="primary" onClick={borrowUsdc}>Borrow USDC</button>
            </div>
            {borrowExceedsTarget && <p className="error">Amount exceeds the maximum additional borrow allowed at the {target} target ratio.</p>}
            {borrowAmount !== null && borrowCapacity && !borrowExceedsTarget && (
              <p className="muted">Projected ratio: {formatRatio(borrowCapacity.projectedRatio)}</p>
            )}
          </article>
          <article>
            <h3>4. Repay USDC</h3>
            <p className="muted">Current USDC allowance: {balances.usdcAllowance}</p>
            <label>
              USDC amount
              <input
                inputMode="decimal"
                min="0"
                step="0.000001"
                type="number"
                value={repayUsdcAmount}
                onChange={(event) => setRepayUsdcAmount(event.target.value)}
              />
            </label>
            <div className="buttonRow">
              <button disabled={pending} className="secondary" onClick={() => approve(compoundSepolia.usdc)}>Approve USDC</button>
              <button disabled={pending || !repayUsdcReady} className="primary" onClick={repayUsdc}>Repay USDC</button>
            </div>
          </article>
        </div>
        {message && <p className="txMessage">{message}</p>}
      </section>
    </>
  )
}
