// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INFTCore {
    function transferOwnership(address newOwner) external;

    function pause() external;

    function unpause() external;

    function ownerOf(uint256 tokenId) external returns (address);

    function safeMint(address to) external returns (uint256);

    function safeMintBatch(
        address[] memory tos
    ) external returns (uint256[] memory);

    function reveal(uint256 tokenId, uint256 cid) external;

    function revealBatch(
        uint256[] memory tokenIds,
        uint256[] memory cids
    ) external;

    function setBaseURI(string memory baseURI) external;

    function cid(uint256 tokenId) external view returns (uint256);
}
