# Trust Nest — monorepo

## What this project is
Blockchain-based rental escrow platform for Indian real estate.
Tenants and owners transact via UPI; blockchain is invisible to users.
Stack: Turborepo monorepo, Polygon smart contracts, NestJS backend, React Native app.

## Packages and what they own
- `@trustnest/contracts` — Solidity (Hardhat). Four contracts: TrustNestRegistry, EscrowVault, ReputationSBT, AgreementNFT.
- `@trustnest/shared` — Zero-dependency TypeScript. Types, constants, pure utils. No imports from other @trustnest packages.
- `@trustnest/sdk` — ethers.js blockchain abstractions. Depends on shared + contracts only. No React, no NestJS.
- `@trustnest/ui-kit` — React Native components. Depends on shared only. No blockchain code ever.
- `@trustnest/backend` — NestJS API. Imports sdk and shared. Never exposes private keys or blockchain to clients.
- `@trustnest/mobile` — Expo React Native app. Imports ui-kit and shared. Never calls contracts directly.

## Dependency rule — NEVER BREAK THIS
shared and contracts have no internal deps.
sdk depends on shared + contracts.
ui-kit depends on shared only.
backend depends on sdk + shared.
mobile depends on ui-kit + shared.
No upward imports. No circular imports.

## Build commands
- `turbo run build` — build everything in dependency order
- `turbo run dev --filter=@trustnest/backend` — run backend in watch mode
- `turbo run test --filter=@trustnest/contracts` — run contract tests
- `turbo run typecheck` — typecheck all packages

## Blockchain
- Network: Polygon (mainnet) / Amoy (testnet)
- USDC address on Polygon mainnet: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
- Contract addresses live in packages/shared/src/constants/contracts.ts — update after each deploy
- Solidity version: 0.8.24 with OpenZeppelin v5
- TypeChain target: ethers-v6 (auto-generated into packages/contracts/typechain-types/)

## Code conventions
- TypeScript strict mode everywhere
- No default exports (named exports only)
- All INR amounts stored as decimal in Postgres, never floats
- All USDC amounts as bigint (wei) in contract calls, 6 decimals
- Wallet private keys: AES-256-GCM encrypted, never logged, never returned by any API endpoint
- Event-first: write to Postgres BEFORE sending on-chain tx. If tx fails, retry from DB record.

## NestJS conventions
- One module per domain: auth, users, agreements, payments, blockchain, reputation
- BlockchainService instantiates TrustNestSDK — all other services call it, never ethers.js directly
- All payment amounts travel as INR integers in API layer, converted to USDC only inside BlockchainService

## Testing
- Contracts: Hardhat tests in packages/contracts/test/
- Backend: Jest + supertest, mock BlockchainService in unit tests
- Run typecheck after every series of file changes

## What we are NOT building yet (Phase 1 scope)
- Kleros dispute resolution (Phase 2)
- Aave yield on deposits (Phase 3)
- Non-custodial / MPC wallets (Phase 3)
- Chainlink Automation (Phase 2 — use NestJS cron for now)