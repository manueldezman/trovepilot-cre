import { defineChain } from 'viem'

export const sepolia = defineChain({
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
})

export const compoundSepolia = {
  comet: '0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e',
  faucet: '0x68793eA49297eB75DFB4610B68e076D2A5c7646C',
  usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  wbtc: '0xa035b9e130F2B1AedC733eEFb1C67Ba4c503491F',
  wbtcPriceFeed: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
} as const

export const addresses = {
  usdc: compoundSepolia.usdc,
  wbtc: compoundSepolia.wbtc,
  receiver: process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as `0x${string}` | undefined,
} as const
