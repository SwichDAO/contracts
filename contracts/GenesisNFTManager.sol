// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {INFTCore} from "./interfaces/INFTCore.sol";

contract GenesisNFTManager is ReentrancyGuard, AccessControlEnumerable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    uint256 public constant COMMON_NFT_CID = 1;
    uint256 public constant STANDARD_NFT_CID = 2;
    uint256 public constant RARE_NFT_CID = 3;
    uint256 public constant EPIC_NFT_CID = 4;

    INFTCore public immutable nftCore;
    uint256 public revealBatchMaxSize = 255; // limitation of blockhash function
    uint256 public revealTimestamp;

    uint256 public numberOfNFTsAvailable = 10000; // total: 10000 NFTs
    uint256 public commonUpperBoundaryValue = 5600; // 56%
    uint256 public standardUpperBoundaryValue = commonUpperBoundaryValue + 3000; // 30%
    uint256 public rareUpperBoundaryValue = standardUpperBoundaryValue + 1200; // 12%
    uint256 public epicUpperBoundaryValue = rareUpperBoundaryValue + 200; // 2%

    Counters.Counter private _requestIdTracker;

    modifier onlyTokenOwner(uint256 tokenId, address owner) {
        require(
            nftCore.ownerOf(tokenId) == owner,
            "GenesisNFTManager: caller is not owner"
        );
        _;
    }

    modifier verifyRevealDate() {
        require(
            block.timestamp >= revealTimestamp,
            "GenesisNFTManager: the reveal date has not come"
        );
        _;
    }

    modifier onlyNotRevealYet(uint256 tokenId) {
        require(
            nftCore.cid(tokenId) == 0,
            "GenesisNFTManager: already revealed"
        );
        _;
    }

    constructor(address nftCore_, uint256 revealTs) {
        nftCore = INFTCore(nftCore_);
        revealTimestamp = revealTs;

        _requestIdTracker.increment();

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(MANAGER_ROLE, _msgSender());
    }

    function updateRevealTimestamp(
        uint256 revealTs
    ) external onlyRole(MANAGER_ROLE) {
        revealTimestamp = revealTs;
    }

    function setRevealBatchMaxSize(
        uint256 size
    ) external onlyRole(MANAGER_ROLE) {
        require(size > 0 && size <= 255); // limitation of blockhash function
        revealBatchMaxSize = size;
    }

    function mintNFT(
        address to
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        return nftCore.safeMint(to);
    }

    function mintNFTs(
        address to,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) returns (uint256[] memory) {
        require(amount > 0);
        address[] memory tos = new address[](amount);
        for (uint256 i = 0; i < amount; i++) {
            tos[i] = to;
        }
        return nftCore.safeMintBatch(tos);
    }

    function mintNFTBatch(
        address[] calldata tos
    ) external onlyRole(MINTER_ROLE) returns (uint256[] memory) {
        return nftCore.safeMintBatch(tos);
    }

    function revealNFT(
        uint256 tokenId
    )
        external
        verifyRevealDate
        onlyTokenOwner(tokenId, _msgSender())
        onlyNotRevealYet(tokenId)
        nonReentrant
    {
        bytes32 randomseed = blockhash(block.number - 1);
        _revealNFT(tokenId, randomseed);
    }

    function revealNFTBatch(
        uint256[] memory tokenIds
    ) external verifyRevealDate nonReentrant {
        require(
            tokenIds.length > 0 && tokenIds.length < revealBatchMaxSize,
            "GenesisNFTManager: too many tokens in one batch"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                nftCore.ownerOf(tokenIds[i]) == _msgSender(),
                "GenesisNFTManager: caller is not owner"
            );
            require(
                nftCore.cid(tokenIds[i]) == 0,
                "GenesisNFTManager: already revealed"
            );

            bytes32 randomseed = blockhash(block.number - 1 - i);
            _revealNFT(tokenIds[i], randomseed);
        }
    }

    function mintAndRevealNFT(
        address to
    )
        external
        onlyRole(MINTER_ROLE)
        verifyRevealDate
        returns (uint256 tokenId)
    {
        tokenId = nftCore.safeMint(to);
        bytes32 randomseed = blockhash(block.number - 1);
        _revealNFT(tokenId, randomseed);
    }

    function mintAndRevealNFTs(
        address to,
        uint256 amount
    )
        external
        onlyRole(MINTER_ROLE)
        verifyRevealDate
        returns (uint256[] memory tokenIds)
    {
        require(
            amount > 0 && amount < revealBatchMaxSize,
            "GenesisNFTManager: too many tokens in one batch"
        );
        address[] memory tos = new address[](amount);
        for (uint256 i = 0; i < amount; i++) {
            tos[i] = to;
        }

        tokenIds = nftCore.safeMintBatch(tos);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            bytes32 randomseed = blockhash(block.number - 1 - i);
            _revealNFT(tokenIds[i], randomseed);
        }
    }

    function mintAndRevealNFTBatch(
        address[] memory tos
    )
        external
        onlyRole(MINTER_ROLE)
        verifyRevealDate
        returns (uint256[] memory tokenIds)
    {
        require(
            tos.length > 0 && tos.length < revealBatchMaxSize,
            "GenesisNFTManager: too many tokens in one batch"
        );

        tokenIds = nftCore.safeMintBatch(tos);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            bytes32 randomseed = blockhash(block.number - 1 - i);
            _revealNFT(tokenIds[i], randomseed);
        }
    }

    function pauseNFTCore() external onlyRole(PAUSER_ROLE) {
        nftCore.pause();
    }

    function unpauseNFTCore() external onlyRole(PAUSER_ROLE) {
        nftCore.unpause();
    }

    function transferOwnership(
        address newOwner
    ) external onlyRole(MANAGER_ROLE) {
        nftCore.transferOwnership(newOwner);
    }

    function setBaseURI(string memory baseURI) external onlyRole(MANAGER_ROLE) {
        nftCore.setBaseURI(baseURI);
    }

    function _revealNFT(uint256 tokenId, bytes32 randomseed) private {
        uint256 requestId = _requestIdTracker.current();
        _requestIdTracker.increment();

        uint256 randomness = uint256(
            keccak256(
                abi.encodePacked(randomseed, requestId.toString(), _msgSender())
            )
        );
        uint256 cid = _getCid(randomness);
        nftCore.reveal(tokenId, cid);
    }

    function _getCid(uint256 randomness) private returns (uint256 cid) {
        require(
            numberOfNFTsAvailable > 0,
            "GenesisNFTManager: hardcap reached"
        );

        randomness %= numberOfNFTsAvailable;

        if (randomness < commonUpperBoundaryValue) {
            numberOfNFTsAvailable--;
            commonUpperBoundaryValue--;
            standardUpperBoundaryValue--;
            rareUpperBoundaryValue--;
            epicUpperBoundaryValue--;
            return COMMON_NFT_CID;
        }
        if (randomness < standardUpperBoundaryValue) {
            numberOfNFTsAvailable--;
            standardUpperBoundaryValue--;
            rareUpperBoundaryValue--;
            epicUpperBoundaryValue--;
            return STANDARD_NFT_CID;
        }
        if (randomness < rareUpperBoundaryValue) {
            numberOfNFTsAvailable--;
            rareUpperBoundaryValue--;
            epicUpperBoundaryValue--;
            return RARE_NFT_CID;
        }
        if (randomness < epicUpperBoundaryValue) {
            numberOfNFTsAvailable--;
            epicUpperBoundaryValue--;
            return EPIC_NFT_CID;
        }
    }
}
