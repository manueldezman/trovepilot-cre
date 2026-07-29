export const cometAbi = [
  {
    type: 'function', name: 'collateralBalanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }, { name: 'asset', type: 'address' }],
    outputs: [{ name: '', type: 'uint128' }],
  },
  {
    type: 'function', name: 'borrowBalanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'baseTokenPriceFeed', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'baseScale', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'getPrice', stateMutability: 'view',
    inputs: [{ name: 'priceFeed', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'getAssetInfoByAddress', stateMutability: 'view',
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

export const receiverAbi = [
  {
    type: 'function', name: 'rules', stateMutability: 'view',
    inputs: [{ name: 'borrower', type: 'address' }],
    outputs: [
      { name: 'lowerRatio', type: 'uint128' },
      { name: 'targetRatio', type: 'uint128' },
      { name: 'upperRatio', type: 'uint128' },
      { name: 'enabled', type: 'bool' },
    ],
  },
  {
    type: 'function', name: 'reserves', stateMutability: 'view',
    inputs: [{ name: 'borrower', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
