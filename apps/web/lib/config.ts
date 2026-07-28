import { defineChain } from 'viem'

export const sepolia = defineChain({
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
})

export const addresses = {
  pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
  oracle: '0x2da88497588bf89281816106C7259e31AF45a663',
  usdc: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  variableDebtUsdc: '0x36B5dE936eF1710E1d22EabE5231b28581a92ECc',
  wbtc: '0x29f2D40B0605204364af54EC677bD022dA425d03',
  receiver: process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as `0x${string}` | undefined,
} as const

