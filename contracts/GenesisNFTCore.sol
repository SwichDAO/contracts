// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GenesisNFTCore
 * @dev Ownership must be transferred to GenesisNFTManager
 * Implement core logic of Swich Genesis NFT
 * This contract cannot be upgraded
 */
contract GenesisNFTCore is
    Ownable,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable
{
    using Strings for uint256;
    using Counters for Counters.Counter;

    uint256 public constant cap = 10000;
    mapping(uint256 => uint256) public cid;
    string public baseURI;

    Counters.Counter private _tokenIdTracker;

    event Mint(address to, uint256 tokenId);
    event SetCid(uint256 tokenId, uint256 cid);
    event SetBaseURI(string baseURI);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI_
    ) ERC721(name, symbol) {
        _setBaseURI(baseURI_);
        _tokenIdTracker.increment();
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function setBaseURI(string memory baseURI_) public onlyOwner {
        _setBaseURI(baseURI_);
    }

    function safeMint(address to) public onlyOwner returns (uint256) {
        return _safeMintPrivate(to);
    }

    function safeMintBatch(
        address[] calldata tos
    ) public onlyOwner returns (uint256[] memory tokenIds) {
        require(tos.length > 0);
        tokenIds = new uint256[](tos.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenIds[i] = _safeMintPrivate(tos[i]);
        }
    }

    function reveal(uint256 tokenId, uint256 cid_) public onlyOwner {
        _requireMinted(tokenId);
        require(cid[tokenId] == 0);
        _setCid(tokenId, cid_);
    }

    function revealBatch(
        uint256[] calldata tokenIds,
        uint256[] calldata cids
    ) public onlyOwner {
        require(tokenIds.length > 0 && tokenIds.length == cids.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _requireMinted(tokenIds[i]);
            require(cid[tokenIds[i]] == 0);
            _setCid(tokenIds[i], cids[i]);
        }
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must be owner.
     */
    function pause() public virtual onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must be owner.
     */
    function unpause() public virtual onlyOwner {
        _unpause();
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        uint256 _cid = cid[tokenId] > 0 ? cid[tokenId] : 0;
        return string(abi.encodePacked(baseURI, _cid.toString()));
    }

    function tokenIdTracker() public view returns (uint256) {
        return _tokenIdTracker.current();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _setBaseURI(string memory baseURI_) private {
        baseURI = baseURI_;
        emit SetBaseURI(baseURI_);
    }

    function _safeMintPrivate(address to) private returns (uint256) {
        // Check cap
        require(
            ERC721Enumerable.totalSupply() < cap,
            "GenesisNFTCore: cap exceeded"
        );

        // We cannot just use balanceOf to create the new tokenId because tokens
        // can be burned (destroyed), so we need a separate counter.
        uint256 tokenId = _tokenIdTracker.current();
        _tokenIdTracker.increment();

        _safeMint(to, tokenId);
        emit Mint(to, tokenId);

        _setCid(tokenId, 0);
        return tokenId;
    }

    function _setCid(uint256 tokenId, uint256 cid_) private {
        cid[tokenId] = cid_;
        emit SetCid(tokenId, cid_);
    }
}
