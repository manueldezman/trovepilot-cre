export const receiverAbi = [
  { type: 'function', name: 'comet', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'rules', stateMutability: 'view', inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: 'lowerRatio', type: 'uint128' }, { name: 'targetRatio', type: 'uint128' }, { name: 'upperRatio', type: 'uint128' }, { name: 'enabled', type: 'bool' }] },
  { type: 'function', name: 'reserves', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'lastEvaluationId', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'bytes32' }] },
  { type: 'function', name: 'setRules', stateMutability: 'nonpayable',
    inputs: [{ name: 'lowerRatio', type: 'uint128' }, { name: 'targetRatio', type: 'uint128' }, { name: 'upperRatio', type: 'uint128' }, { name: 'enabled', type: 'bool' }], outputs: [] },
  { type: 'function', name: 'depositReserve', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'withdrawReserve', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
] as const

export const erc20Abi = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const

export const cometAbi = [
  { type: 'function', name: 'supply', stateMutability: 'nonpayable', inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'baseScale', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'baseTokenPriceFeed', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'getPrice', stateMutability: 'view', inputs: [{ name: 'priceFeed', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'borrowBalanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'collateralBalanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }, { name: 'asset', type: 'address' }], outputs: [{ name: '', type: 'uint128' }] },
  { type: 'function', name: 'isBorrowCollateralized', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'isLiquidatable', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'totalBorrow', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  {
    type: 'function',
    name: 'getAssetInfoByAddress',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'offset', type: 'uint8' },
        { name: 'asset', type: 'address' },
        { name: 'priceFeed', type: 'address' },
        { name: 'scale', type: 'uint64' },
        { name: 'borrowCollateralFactor', type: 'uint64' },
        { name: 'liquidateCollateralFactor', type: 'uint64' },
        { name: 'liquidationFactor', type: 'uint64' },
        { name: 'supplyCap', type: 'uint128' },
      ],
    }],
  },
] as const

export const compoundFaucetAbi = [
  { type: 'function', name: 'drip', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }], outputs: [] },
] as const
