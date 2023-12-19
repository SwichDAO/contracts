// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {INFTManager} from "./interfaces/INFTManager.sol";

contract GenesisNFTSale is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    address public constant fsn = 0x000000000000000000000000000000000000dEaD; // Use dead address to represent native token

    address public nftManager;
    uint256 public hardCap;
    uint256 public start;
    uint256 public end;
    uint256 public sold = 0;
    mapping(address => uint256) public price;
    mapping(address => uint256) public soldByToken;

    event UpdateNFTManager(address nftManager);
    event UpdateInfo(uint256 hardCap, uint256 start, uint256 end);
    event Deposit(
        address indexed user,
        address paymentToken,
        uint256 paymentAmount,
        uint256 amount
    );
    event SetPrice(address token, uint256 amount);
    event Purchase(address token, uint256 amount);
    event Withdraw(
        address sender,
        address recipient,
        address token,
        uint256 amount
    );

    modifier onlyPurchasable() {
        require(purchasable(), "GenesisNFTSale: cannot purchase");
        _;
    }

    modifier acceptPayment(address token) {
        require(price[token] > 0, "GenesisNFTSale: invalid payment");
        _;
    }

    constructor(
        address nftManager_,
        uint256 hardCap_,
        uint256 start_,
        uint256 end_
    ) {
        require(start_ <= end_);
        _updateNFTManager(nftManager_);
        _updateInfo(hardCap_, start_, end_);
    }

    function updateNFTManager(address nftManager_) external onlyOwner {
        _updateNFTManager(nftManager_);
    }

    function updateInfo(
        uint256 hardCap_,
        uint256 start_,
        uint256 end_
    ) external onlyOwner {
        require(start_ <= end_);
        _updateInfo(hardCap_, start_, end_);
    }

    function setPrice(address token, uint256 amount) external onlyOwner {
        _setPrice(token, amount);
    }

    function setPrices(
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(tokens.length == amounts.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            _setPrice(tokens[i], amounts[i]);
        }
    }

    function withdraw(
        address recipient,
        address token,
        uint256 amount
    ) external onlyOwner {
        if (token != fsn) {
            IERC20(token).safeTransfer(recipient, amount);
        } else {
            (bool success, ) = address(recipient).call{value: amount}(
                new bytes(0)
            );
            require(success, "GenesisNFTSale: insufficient FSN");
        }

        emit Withdraw(msg.sender, recipient, token, amount);
    }

    function purchase(
        address token,
        uint256 amount
    )
        external
        payable
        onlyPurchasable
        acceptPayment(token)
        nonReentrant
        returns (uint256[] memory tokenIds)
    {
        require(amount > 0);
        require(sold + amount <= hardCap, "GenesisNFTSale: sold out");
        uint256 total = amount * price[token];

        sold += amount;
        soldByToken[token] += amount;
        if (token != fsn) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), total);
        } else {
            require(msg.value >= total, "GenesisNFTSale: insuffient payment");
        }

        tokenIds = INFTManager(nftManager).mintNFTs(msg.sender, amount);

        emit Purchase(token, amount);
    }

    function purchasable() public view returns (bool) {
        return
            block.timestamp >= start &&
            block.timestamp <= end &&
            sold < hardCap;
    }

    function _setPrice(address token, uint256 amount) private {
        price[token] = amount;
        emit SetPrice(token, amount);
    }

    function _updateInfo(
        uint256 hardCap_,
        uint256 start_,
        uint256 end_
    ) private {
        hardCap = hardCap_;
        start = start_;
        end = end_;
        emit UpdateInfo(hardCap_, start_, end_);
    }

    function _updateNFTManager(address nftManager_) private {
        nftManager = nftManager_;
        emit UpdateNFTManager(nftManager_);
    }
}
