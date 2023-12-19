// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INFTManager {
    function mintNFT(address to) external returns (uint256);

    function mintNFTs(
        address to,
        uint256 amount
    ) external returns (uint256[] memory);

    function mintAndRevealNFTs(
        address to,
        uint256 amount
    ) external returns (uint256[] memory);

    function revealTimestamp() external view returns (uint256);
}
