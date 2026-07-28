export const poolAbi = [{
  type: 'function', name: 'getUserAccountData', stateMutability: 'view',
  inputs: [{ name: 'user', type: 'address' }],
  outputs: [
    { name: 'totalCollateralBase', type: 'uint256' },
    { name: 'totalDebtBase', type: 'uint256' },
    { name: 'availableBorrowsBase', type: 'uint256' },
    { name: 'currentLiquidationThreshold', type: 'uint256' },
    { name: 'ltv', type: 'uint256' },
    { name: 'healthFactor', type: 'uint256' },
  ],
}] as const

export const receiverAbi = [
  {
    type: 'function', name: 'rules', stateMutability: 'view',
    inputs: [{ name: 'borrower', type: 'address' }],
    outputs: [
      { name: 'lowerHF', type: 'uint128' },
      { name: 'targetHF', type: 'uint128' },
      { name: 'upperHF', type: 'uint128' },
      { name: 'enabled', type: 'bool' },
    ],
  },
  {
    type: 'function', name: 'reserves', stateMutability: 'view',
    inputs: [{ name: 'borrower', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'previewRepay', stateMutability: 'view',
    inputs: [{ name: 'borrower', type: 'address' }],
    outputs: [{ name: 'amount', type: 'uint256' }, { name: 'healthFactor', type: 'uint256' }],
  },
] as const

export const erc20Abi = [{
  type: 'function', name: 'balanceOf', stateMutability: 'view',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }],
}] as const

