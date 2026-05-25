// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

enum EscrowStatus { PENDING, ACTIVE, RELEASED, REFUNDED, DISPUTED }

contract EscrowVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");

    IERC20 public immutable usdc;

    struct Escrow {
        address  tenant;
        address  owner;
        uint256  amount;
        EscrowStatus status;
        uint256  depositedAt;
    }

    mapping(bytes32 agreementId => Escrow) public escrows;

    event Deposited(bytes32 indexed agreementId, address tenant, uint256 amount);
    event Released(bytes32 indexed agreementId, address owner, uint256 tenantReturn, uint256 deduction);
    event DisputeRaised(bytes32 indexed agreementId);
    event DisputeResolved(bytes32 indexed agreementId, uint256 tenantShare, uint256 ownerShare);
    event EmergencyRefunded(bytes32 indexed agreementId, address tenant, uint256 amount);

    constructor(address admin, address operator, address usdcAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
        usdc = IERC20(usdcAddress);
    }

    /// Called by operator after UPI payment is confirmed. Pulls USDC from operator wallet.
    function deposit(
        bytes32 agreementId,
        address tenant,
        address owner,
        uint256 usdcAmount
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(escrows[agreementId].amount == 0, "Escrow: already exists");
        require(usdcAmount > 0, "Escrow: amount must be positive");

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        escrows[agreementId] = Escrow({
            tenant:      tenant,
            owner:       owner,
            amount:      usdcAmount,
            status:      EscrowStatus.ACTIVE,
            depositedAt: block.timestamp
        });

        emit Deposited(agreementId, tenant, usdcAmount);
    }

    /// Owner-initiated release. deductionAmount (damages) goes to owner; remainder to tenant.
    function release(
        bytes32 agreementId,
        uint256 deductionAmount
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        Escrow storage e = escrows[agreementId];
        require(e.status == EscrowStatus.ACTIVE, "Escrow: not active");
        require(deductionAmount <= e.amount, "Escrow: deduction exceeds deposit");

        uint256 tenantReturn = e.amount - deductionAmount;
        e.status = EscrowStatus.RELEASED;

        if (tenantReturn  > 0) usdc.safeTransfer(e.tenant, tenantReturn);
        if (deductionAmount > 0) usdc.safeTransfer(e.owner, deductionAmount);

        emit Released(agreementId, e.owner, tenantReturn, deductionAmount);
    }

    /// Locks escrow pending dispute resolution.
    function raiseDispute(bytes32 agreementId) external onlyRole(OPERATOR_ROLE) {
        Escrow storage e = escrows[agreementId];
        require(e.status == EscrowStatus.ACTIVE, "Escrow: not active");
        e.status = EscrowStatus.DISPUTED;
        emit DisputeRaised(agreementId);
    }

    /// Splits escrowed USDC between tenant and owner. tenantShare + ownerShare must equal deposit.
    function resolveDispute(
        bytes32 agreementId,
        uint256 tenantShare,
        uint256 ownerShare
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        Escrow storage e = escrows[agreementId];
        require(e.status == EscrowStatus.DISPUTED, "Escrow: not disputed");
        require(tenantShare + ownerShare == e.amount, "Escrow: shares must equal deposit");

        e.status = EscrowStatus.RELEASED;

        if (tenantShare > 0) usdc.safeTransfer(e.tenant, tenantShare);
        if (ownerShare  > 0) usdc.safeTransfer(e.owner,  ownerShare);

        emit DisputeResolved(agreementId, tenantShare, ownerShare);
    }

    /// Emergency full refund to tenant — only ADMIN_ROLE.
    function emergencyRefund(bytes32 agreementId) external onlyRole(ADMIN_ROLE) nonReentrant {
        Escrow storage e = escrows[agreementId];
        require(e.amount > 0, "Escrow: not found");
        require(
            e.status != EscrowStatus.RELEASED && e.status != EscrowStatus.REFUNDED,
            "Escrow: already settled"
        );

        uint256 amount = e.amount;
        address tenant = e.tenant;
        e.status = EscrowStatus.REFUNDED;

        usdc.safeTransfer(tenant, amount);
        emit EmergencyRefunded(agreementId, tenant, amount);
    }
}
