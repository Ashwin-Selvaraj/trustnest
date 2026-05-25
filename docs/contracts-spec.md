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

**Key architectural decision:** the on-chain contract is a *score storage layer only*. It stores whatever `uint8 score` the backend passes to `mint()`. All scoring logic — whether simple peer ratings (Phase 1) or rich behavioural signals (Phase 2) — is computed **off-chain in the backend** and passed as the final composite score. The contract never needs to change between phases.

### Key Storage
```solidity
mapping(address => uint256[]) public tokensByOwner;
mapping(uint256 tokenId => ReputationData) public reputationOf;

struct ReputationData {
    bytes32 agreementId;
    Role role;              // TENANT | OWNER
    uint8 score;            // 1–100 composite (see scoring model below)
    uint256 mintedAt;
}
```

> Note: score range changed from 1–5 to **1–100** to give headroom for the weighted composite in Phase 2 without a contract change. The frontend divides by 20 to display a 1–5 star rating.

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

### Reputation Scoring Model

The backend computes a composite score (1–100) before calling `mint`. The model evolves by phase:

#### Phase 1 — Peer Rating Only
Score = peer rating submitted by the counterparty at agreement close, mapped to 1–100.

| Stars given | Score stored |
|---|---|
| 5 ⭐ | 100 |
| 4 ⭐ | 80 |
| 3 ⭐ | 60 |
| 2 ⭐ | 40 |
| 1 ⭐ | 20 |

If a counterparty does not submit a rating within 7 days of close, the backend defaults to 60 (neutral).

#### Phase 2 — Behavioural Signals (weighted composite)

The backend will compute a weighted score from multiple signals before calling `mint`. Proposed weights (to be tuned):

**Tenant signals**

| Signal | Weight | How measured |
|---|---|---|
| Peer rating by owner | 40% | Submitted at close |
| Rent payment timeliness | 40% | DB: due date vs `PaymentEvent.createdAt` per monthly payment |
| Dispute raised (tenant-initiated) | −10% flat penalty | DB: `Agreement.disputeRaisedBy == TENANT` |
| Dispute outcome (if raised) | ±10% | Kleros ruling in tenant's favour = +10, against = −10 |

Rent timeliness sub-score:
- Paid on or before due date → 100
- 1–2 days late → 80
- 3–7 days late → 50
- >7 days late or missed → 0
- Sub-score = average across all monthly payments in the agreement.

**Owner signals**

| Signal | Weight | How measured |
|---|---|---|
| Peer rating by tenant | 40% | Submitted at close |
| Deposit release promptness | 30% | DB: `Agreement.endDate` vs `PaymentEvent(RELEASE).createdAt` |
| Dispute resolution speed | 20% | DB: `disputeRaisedAt` vs `disputeResolvedAt` |
| Dispute outcome (if raised) | ±10% | Kleros ruling |

Release promptness sub-score:
- Released within 3 days of end date → 100
- 4–7 days → 80
- 8–14 days → 50
- >14 days → 0

Dispute resolution speed sub-score (Phase 2 when owner can resolve without Kleros):
- Resolved within 3 days of dispute raised → 100
- 4–7 days → 80
- 8–14 days → 50
- >14 days or escalated to Kleros → 20

### Design Decisions
- **Soulbound (ERC-5192)**: `locked()` always returns `true`; `transfer` reverts. Reputation cannot be sold or gamed by wallet swapping.
- **Off-chain scoring, on-chain storage**: behavioural signals are observable only in the backend (Postgres payment events, timestamps). Computing them on-chain would require oracle feeds or state that isn't worth the gas cost. The contract is the tamper-proof ledger; the scoring formula lives in the backend and is documented here for auditability.
- **1–100 range**: gives enough integer precision for weighted averages without floating point. Frontend always displays as stars (÷20).
- `scoreOf` computes the on-chain average across all SBTs for a wallet. The backend also maintains a denormalised `reputationScore` column on the `User` row for fast API reads.

---

## Shared Design Decisions

### Event-First Writes
The backend writes a DB record **before** calling any contract function. If the on-chain tx fails, a NestJS cron job retries from the DB record. This prevents lost payments.

### Gas Sponsorship (Phase 1)
Backend pays gas from an operator wallet funded with MATIC. Users never hold MATIC. Phase 3 will evaluate Biconomy / ERC-4337 paymasters.

### Upgrade Strategy
Phase 1 contracts are **not upgradeable** (no proxy). If a critical bug is found, we redeploy and migrate the registry mapping. Phase 2 will evaluate OpenZeppelin TransparentProxy for EscrowVault.
