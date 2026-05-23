# Smart Contracts Specification

Solidity `0.8.24`, OpenZeppelin v5, TypeChain target `ethers-v6`.
Network: Polygon mainnet / Amoy testnet.
All contract addresses are kept in `packages/shared/src/constants/contracts.ts` and updated after each deploy.

---

## Contract Overview

| Contract | Standard | Purpose |
|---|---|---|
| `TrustNestRegistry` | Custom | Registers landlords and tenants; links user IDs to wallet addresses |
| `EscrowVault` | Custom | Holds USDC security deposits; controls release/refund |
| `AgreementNFT` | ERC-721 | Minted per rental agreement; encodes terms on-chain |
| `ReputationSBT` | ERC-5192 (soulbound) | Non-transferable reputation token minted at agreement close |

---

## TrustNestRegistry

### Responsibility
Authoritative on-chain map between the backend's UUID users and their Polygon wallet addresses. Allows the backend to verify that a wallet was registered by its own system.

### Key Storage
```solidity
mapping(bytes32 userId => address wallet) public userWallet;
mapping(address wallet => bytes32 userId) public walletUser;
```

### Functions
```solidity
function register(bytes32 userId, address wallet) external onlyOperator;
function deregister(bytes32 userId) external onlyOperator;
function getWallet(bytes32 userId) external view returns (address);
function getUserId(address wallet) external view returns (bytes32);
```

### Access Control
- `OPERATOR_ROLE` (granted to backend hot wallet) can register/deregister.
- Public read only.

### Design Decisions
- `userId` is a `bytes32` keccak of the Postgres UUID — avoids string storage gas cost.
- No ENS or off-chain resolver; Phase 1 is fully custodial so the backend controls the mapping.

---

## EscrowVault

### Responsibility
Custodian of USDC security deposits for the duration of a tenancy. Only releases funds when:
1. Owner initiates release (tenancy ends normally), or
2. Admin resolves a dispute (Phase 1), or
3. Kleros arbitration completes (Phase 2).

### Key Storage
```solidity
struct Escrow {
    bytes32 agreementId;   // keccak of Postgres agreement UUID
    address tenant;
    address owner;
    uint256 amount;        // USDC in 6-decimal wei
    EscrowStatus status;   // PENDING | ACTIVE | RELEASED | REFUNDED | DISPUTED
    uint256 depositedAt;
}

mapping(bytes32 agreementId => Escrow) public escrows;
```

### Functions
```solidity
// Called by backend after UPI payment confirmed
function deposit(bytes32 agreementId, address tenant, address owner, uint256 usdcAmount)
    external onlyOperator;

// Called by backend on owner-initiated release
function release(bytes32 agreementId, uint256 deductionAmount)
    external onlyOperator;

// Called by backend on dispute resolution (Phase 1: admin; Phase 2: Kleros)
function resolveDispute(bytes32 agreementId, uint256 tenantShare, uint256 ownerShare)
    external onlyOperator;

// Emergency refund — only ADMIN_ROLE
function emergencyRefund(bytes32 agreementId) external onlyAdmin;
```

### Events
```solidity
event Deposited(bytes32 indexed agreementId, address tenant, uint256 amount);
event Released(bytes32 indexed agreementId, address owner, uint256 netAmount, uint256 deduction);
event DisputeRaised(bytes32 indexed agreementId);
event DisputeResolved(bytes32 indexed agreementId, uint256 tenantShare, uint256 ownerShare);
```

### Design Decisions
- **Operator pattern**: backend hot-wallet has `OPERATOR_ROLE`. The vault never accepts direct user calls — this lets us enforce UPI confirmation before on-chain state changes.
- **Deduction logic on-chain**: deductions (damages, unpaid rent) are passed as a `uint256` argument to `release()`. The backend calculates the amount from itemised claims stored in Postgres; the contract just enforces that `deductionAmount <= escrow.amount`.
- **No partial releases**: Phase 1 releases the full deposit minus one deduction figure. Itemised multi-party splits are Phase 2.
- **USDC only**: no native MATIC handled here. This avoids native-value accounting complexity and aligns with the no-float rule.
- **Re-entrancy**: uses OpenZeppelin `ReentrancyGuard` on `release` and `resolveDispute`.

---

## AgreementNFT

### Responsibility
ERC-721 token that represents a signed rental agreement. Minted when both parties confirm terms. Token metadata includes a hash of the off-chain PDF agreement stored on IPFS.

### Key Storage
```solidity
mapping(uint256 tokenId => bytes32 agreementId) public tokenAgreement;
mapping(bytes32 agreementId => uint256 tokenId) public agreementToken;
mapping(uint256 tokenId => string) private _metadataURI;   // ipfs://...
```

### Functions
```solidity
function mint(bytes32 agreementId, address tenant, address owner, string calldata metadataURI)
    external onlyOperator returns (uint256 tokenId);

function updateMetadata(uint256 tokenId, string calldata newURI)
    external onlyOperator;

function tokenURI(uint256 tokenId) public view override returns (string memory);
```

### Design Decisions
- Both tenant and owner receive a copy — `mint` transfers one to the owner and keeps one for the tenant via dual-mint (two `tokenId`s for one agreement).
- Metadata URI points to IPFS-hosted JSON containing: parties, property address, monthly rent (INR), deposit amount (INR), start/end dates, PDF hash.
- `updateMetadata` exists for addendum scenarios (Phase 2). Phase 1 agreements are immutable once minted.
- Token is **transferable** (unlike SBT) so it can be used as collateral in future (Phase 3).

---

## ReputationSBT

### Responsibility
ERC-5192 soulbound token minted to tenant and owner at successful agreement close. Accumulates silently — each close adds one token to each party's address. Scores can be read by any frontend.

### Key Storage
```solidity
mapping(address => uint256[]) public tokensByOwner;
mapping(uint256 tokenId => ReputationData) public reputationOf;

struct ReputationData {
    bytes32 agreementId;
    Role role;              // TENANT | OWNER
    uint8 score;            // 1–5, set by counterparty rating
    uint256 mintedAt;
}
```

### Functions
```solidity
function mint(bytes32 agreementId, address tenant, uint8 tenantScore,
              address owner, uint8 ownerScore)
    external onlyOperator;

function locked(uint256 tokenId) external pure override returns (bool) {
    return true;  // ERC-5192: always locked
}

function scoreOf(address user) external view returns (uint256 average, uint256 count);
```

### Design Decisions
- **Soulbound (ERC-5192)**: `locked()` always returns `true`; `transfer` reverts. Reputation cannot be sold or gamed by wallet swapping.
- Rating (1–5) is submitted by the counterparty at close via the backend and passed into `mint`. On-chain only stores the numeric score — written review text lives in Postgres.
- `scoreOf` computes average in Solidity to avoid exposing raw token lists to the frontend (gas concern managed by keeping list short in Phase 1).

---

## Shared Design Decisions

### Event-First Writes
The backend writes a DB record **before** calling any contract function. If the on-chain tx fails, a NestJS cron job retries from the DB record. This prevents lost payments.

### Gas Sponsorship (Phase 1)
Backend pays gas from an operator wallet funded with MATIC. Users never hold MATIC. Phase 3 will evaluate Biconomy / ERC-4337 paymasters.

### Upgrade Strategy
Phase 1 contracts are **not upgradeable** (no proxy). If a critical bug is found, we redeploy and migrate the registry mapping. Phase 2 will evaluate OpenZeppelin TransparentProxy for EscrowVault.
