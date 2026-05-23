# Trust Nest — High-Level Architecture

## System Overview

Trust Nest is a blockchain-backed rental escrow platform targeting the Indian residential real estate market. Users (tenants and landlords) interact exclusively through a UPI-native mobile app; Polygon smart contracts handle escrow, reputation, and agreement NFTs invisibly in the background.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                        │
│   @trustnest/mobile  +  @trustnest/ui-kit  +  @trustnest/shared│
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Backend API                         │
│                     @trustnest/backend                          │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌───────────────┐  │
│  │   Auth   │ │ Agreements │ │ Payments  │ │  Reputation   │  │
│  └──────────┘ └────────────┘ └───────────┘ └───────────────┘  │
│                       BlockchainService                         │
│                     (@trustnest/sdk)                            │
└──────────┬──────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────┐           ┌──────────────────────┐
│   PostgreSQL DB  │           │  Polygon / Amoy RPC  │
│  (Decimal INR,   │           │  USDC escrow, SBT,   │
│   event log)     │           │  Agreement NFT       │
└──────────────────┘           └──────────────────────┘
```

---

## Package Dependency Graph

```
@trustnest/shared        (zero deps — types, constants, pure utils)
@trustnest/contracts     (zero internal deps — Solidity + TypeChain)
        │
        ▼
@trustnest/sdk           (ethers-v6, depends on shared + contracts)
        │
        ▼
@trustnest/backend       (NestJS, depends on sdk + shared)

@trustnest/ui-kit        (React Native, depends on shared only)
        │
        ▼
@trustnest/mobile        (Expo, depends on ui-kit + shared)
```

**Invariant:** No upward imports, no circular imports. `ui-kit` and `mobile` never touch ethers.js or smart contracts.

---

## Core User Flows

### 1. Agreement Creation
```
Tenant/Owner agree terms in app
  → POST /agreements  (backend stores draft in Postgres)
  → BlockchainService calls AgreementNFT.mint()
  → NFT tokenId stored back on Agreement row
  → Push notification to both parties
```

### 2. Security Deposit (Escrow)
```
Tenant initiates UPI payment (UPI PSP → Payment Gateway → Webhook)
  → Webhook hits POST /payments/webhook
  → Backend writes PaymentEvent to DB (event-first)
  → BlockchainService calls EscrowVault.deposit(agreementId, usdcAmount)
  → USDC locked on-chain; status updated in DB
  → Tenant sees "Deposit confirmed" in app
```

### 3. Deposit Release (End of Tenancy)
```
Owner calls POST /agreements/:id/release
  → Backend validates no active disputes
  → BlockchainService calls EscrowVault.release(agreementId, deductions)
  → USDC transferred to owner (minus deductions returned to tenant)
  → ReputationSBT.mint() for both parties
  → Agreement status → CLOSED in DB
```

### 4. Dispute (Phase 1 — manual)
```
Either party calls POST /agreements/:id/dispute
  → Agreement locked (no release possible)
  → Backend flags for manual admin review
  → Phase 2 will hand off to Kleros
```

---

## Technology Choices

| Layer | Choice | Reason |
|---|---|---|
| Blockchain | Polygon PoS | Low gas fees, USDC native, EVM compatible |
| Stablecoin | USDC (6 decimals) | Regulatory familiarity, no INR peg volatility |
| UPI gateway | Razorpay / PayU (TBD) | Webhook reliability, merchant dashboard |
| Backend | NestJS (TypeScript) | Module DI fits domain separation; easy to test |
| ORM | TypeORM | Native NestJS integration, Decimal type support |
| Mobile | Expo (React Native) | Managed workflow, OTA updates, easy UPI deep-link |
| Monorepo | Turborepo | Remote caching, topological build order |

---

## INR ↔ USDC Conversion

Conversion happens **only inside `BlockchainService`**. All API layers deal in INR integers (paise or rupees as documented per endpoint).

```
INR (rupees, integer)
  → forex rate lookup (CoinGecko / Chainlink Phase 2)
  → USDC amount (bigint, 6-decimal wei)
  → passed to EscrowVault
```

The rate used is stored on the PaymentEvent row for audit purposes.

---

## Security Model

- Custodial wallets: one HD-wallet per user, private key stored AES-256-GCM encrypted in Postgres.
- Keys are decrypted in-process for signing; never logged, never returned over HTTP.
- All on-chain funds are in the EscrowVault contract, not user wallets — minimises hot-wallet risk.
- Phase 3 will migrate to MPC / non-custodial.

---

## Deployment Targets

| Environment | Network | Notes |
|---|---|---|
| local | Hardhat node | `npx hardhat node` |
| staging | Polygon Amoy testnet | Testnet USDC faucet |
| production | Polygon mainnet | USDC: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
