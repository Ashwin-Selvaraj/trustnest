// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TrustNestRegistry is AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    mapping(bytes32 userId  => address wallet) public userWallet;
    mapping(address wallet  => bytes32 userId) public walletUser;

    event UserRegistered(bytes32 indexed userId, address indexed wallet);
    event UserDeregistered(bytes32 indexed userId, address indexed wallet);

    constructor(address admin, address operator) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
    }

    function register(bytes32 userId, address wallet) external onlyRole(OPERATOR_ROLE) {
        require(userWallet[userId] == address(0), "Registry: userId already registered");
        require(walletUser[wallet] == bytes32(0), "Registry: wallet already registered");
        userWallet[userId] = wallet;
        walletUser[wallet] = userId;
        emit UserRegistered(userId, wallet);
    }

    function deregister(bytes32 userId) external onlyRole(OPERATOR_ROLE) {
        address wallet = userWallet[userId];
        require(wallet != address(0), "Registry: userId not registered");
        delete walletUser[wallet];
        delete userWallet[userId];
        emit UserDeregistered(userId, wallet);
    }

    function getWallet(bytes32 userId) external view returns (address) {
        return userWallet[userId];
    }

    function getUserId(address wallet) external view returns (bytes32) {
        return walletUser[wallet];
    }
}
