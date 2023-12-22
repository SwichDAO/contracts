// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FSNAirdrop.
 * @dev Using for FSN airdrop
 * Addresses eligible to receive airdrops will be added by the owner
 */
contract FSNAirdrop is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(address => uint256) public totalRewards;
    mapping(address => uint256) public claimedRewards;
    EnumerableSet.AddressSet private _users;

    event Received(address sender, uint256 amount);
    event Withdraw(address requester, address recipient, uint256 amount);
    event SetReward(address user, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function addBatchRewards(
        address[] memory users,
        uint256[] memory amounts
    ) external onlyOwner {
        require(
            users.length > 0 && users.length == amounts.length,
            "FSNAirdrop: invalid params"
        );

        for (uint256 i = 0; i < users.length; i++) {
            uint256 _amount = totalRewards[users[i]] + amounts[i];
            _setRewards(users[i], _amount);
        }
    }

    function setBatchRewards(
        address[] memory users,
        uint256[] memory amounts
    ) external onlyOwner {
        require(
            users.length > 0 && users.length == amounts.length,
            "FSNAirdrop: invalid params"
        );

        for (uint256 i = 0; i < users.length; i++) {
            _setRewards(users[i], amounts[i]);
        }
    }

    function addRewards(address user, uint256 amount) external onlyOwner {
        uint256 _amount = totalRewards[user] + amount;
        _setRewards(user, _amount);
    }

    function setRewards(address user, uint256 amount) external onlyOwner {
        _setRewards(user, amount);
    }

    function claimRewards() external {
        uint256 reward = pendingRewards(msg.sender);
        require(reward > 0, "FSNAirdrop: rewards are not available");

        claimedRewards[msg.sender] += reward;
        (bool success, ) = address(msg.sender).call{value: reward}(
            new bytes(0)
        );
        require(success, "FSNAirdrop: insufficient FSN");
    }

    function withdraw(address recipient, uint256 amount) external onlyOwner {
        (bool success, ) = address(recipient).call{value: amount}(new bytes(0));
        require(success, "FSNAirdrop: insufficient FSN");

        emit Withdraw(msg.sender, recipient, amount);
    }

    function pendingRewards(address user) public view returns (uint256) {
        if (totalRewards[user] <= claimedRewards[user]) {
            return 0;
        }

        return totalRewards[user] - claimedRewards[user];
    }

    function _setRewards(address user, uint256 amount) private {
        _users.add(user);
        totalRewards[user] = amount;
        emit SetReward(user, amount);
    }
}
