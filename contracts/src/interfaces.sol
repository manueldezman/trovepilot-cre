// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IComet {
    struct AssetInfo {
        uint8 offset;
        address asset;
        address priceFeed;
        uint64 scale;
        uint64 borrowCollateralFactor;
        uint64 liquidateCollateralFactor;
        uint64 liquidationFactor;
        uint128 supplyCap;
    }

    function baseToken() external view returns (address);
    function baseTokenPriceFeed() external view returns (address);
    function baseScale() external view returns (uint256);
    function getPrice(address priceFeed) external view returns (uint256);
    function getAssetInfoByAddress(address asset) external view returns (AssetInfo memory);
    function collateralBalanceOf(address account, address asset) external view returns (uint128);
    function borrowBalanceOf(address account) external view returns (uint256);
    function supplyTo(address dst, address asset, uint256 amount) external;
}
