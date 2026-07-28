export const poolAbi = [{
  type: 'function', name: 'getUserAccountData', stateMutability: 'view',
  inputs: [{ name: 'user', type: 'address' }],
  outputs: [
    { name: 'totalCollateralBase', type: 'uint256' }, { name: 'totalDebtBase', type: 'uint256' },
    { name: 'availableBorrowsBase', type: 'uint256' }, { name: 'currentLiquidationThreshold', type: 'uint256' },
    { name: 'ltv', type: 'uint256' }, { name: 'healthFactor', type: 'uint256' },
  ],
}] as const

export const receiverAbi = [
  { type: 'function', name: 'rules', stateMutability: 'view', inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: 'lowerHF', type: 'uint128' }, { name: 'targetHF', type: 'uint128' }, { name: 'upperHF', type: 'uint128' }, { name: 'enabled', type: 'bool' }] },
  { type: 'function', name: 'reserves', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'lastEvaluationId', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'bytes32' }] },
  { type: 'function', name: 'setRules', stateMutability: 'nonpayable',
    inputs: [{ name: 'lowerHF', type: 'uint128' }, { name: 'targetHF', type: 'uint128' }, { name: 'upperHF', type: 'uint128' }, { name: 'enabled', type: 'bool' }], outputs: [] },
  { type: 'function', name: 'depositReserve', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'withdrawReserve', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
] as const

export const erc20Abi = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const

