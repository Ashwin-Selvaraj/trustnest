# Phase 1 Task Checklist

Phase 1 scope: custodial wallets, UPI deposit/release flow, manual dispute handling, peer-rating reputation.
Out of scope: Kleros (Phase 2), Aave yield (Phase 3), MPC wallets (Phase 3), Chainlink Automation (Phase 2), behavioural reputation signals — rent timeliness / dispute resolution speed / release promptness (Phase 2).

---

## 1. Monorepo Scaffold

- [x] Init Turborepo with `pnpm` workspaces
- [x] Create `packages/shared`, `packages/contracts`, `packages/sdk`, `packages/ui-kit`, `packages/backend`, `packages/mobile` directories
- [x] Add `turbo.json` with `build`, `dev`, `test`, `typecheck` pipelines
- [x] Configure TypeScript `strict` mode in each package's `tsconfig.json`
- [x] Add root `.eslintrc` with no-default-export rule
- [x] Verify `turbo run build` succeeds end-to-end

---

## 2. @trustnest/shared

- [x] Define enums: `UserRole`, `KycStatus`, `AgreementStatus`, `PaymentType`, `PaymentStatus`, `JobType`, `JobStatus`
- [x] Define `ContractAddresses` type and `CONTRACT_ADDRESSES` constant (testnet values; mainnet TBD)
- [x] Add USDC mainnet address constant (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`)
- [x] Add INR→USDC conversion utility (pure function, takes forex rate as argument)
- [x] Add `agreementIdToBytes32` util (keccak256 of UUID string) — lives in `@trustnest/sdk/src/utils.ts`; ethers already a dep there; shared stays zero-dep
- [x] Export everything from `packages/shared/src/index.ts`
- [x] Zero external dependencies confirmed (`package.json` has no `dependencies`)

---

## 3. @trustnest/contracts

- [x] Init Hardhat project (`npx hardhat init`)
- [x] Install OpenZeppelin v5 (`@openzeppelin/contracts`)
- [x] Write `TrustNestRegistry.sol`
  - [x] `register`, `deregister`, `getWallet`, `getUserId`
  - [x] `OPERATOR_ROLE` via `AccessControl`
  - [x] Unit tests: register, deregister, duplicate register reverts
- [x] Write `EscrowVault.sol`
  - [x] `deposit`, `release`, `raiseDispute`, `resolveDispute`, `emergencyRefund`
  - [x] `ReentrancyGuard` on state-changing functions
  - [x] Unit tests: full deposit→release flow, deduction, dispute resolve, over-deduction reverts
- [x] Write `AgreementNFT.sol`
  - [x] Dual-mint (tenant + owner tokens per agreement)
  - [x] `updateMetadata` callable by operator
  - [x] Unit tests: mint, metadata URI, non-operator update reverts
- [x] Write `ReputationSBT.sol`
  - [x] ERC-5192 soulbound — `locked()` always `true`, transfer reverts
  - [x] `scoreOf` average computation
  - [x] Unit tests: mint, transfer revert, scoreOf average
- [x] Configure TypeChain (`ethers-v6` target) — generated types into `typechain-types/`
- [x] Write Hardhat deploy scripts for Amoy testnet
- [x] Run `turbo run test --filter=@trustnest/contracts` — all pass

---

## 4. @trustnest/sdk

- [x] Implement `RegistryModule` (`registerUser`, `deregisterUser`, `getWalletAddress`, `getUserId`)
- [x] Implement `EscrowModule` (`deposit`, `release`, `raiseDispute`, `resolveDispute`, `getEscrow`)
  - [x] Auto-approve USDC allowance if insufficient
- [x] Implement `AgreementModule` (`mintAgreement`, `updateMetadata`, `getTokenByAgreement`, `getMetadataURI`)
- [x] Implement `ReputationModule` (`mintReputation`, `getScore`, `getTokensByOwner`)
- [x] Implement `TrustNestSDK` root class
- [x] Define `ContractRevertError`, `InsufficientGasError`, `RpcConnectionError`
- [x] All methods wait for 1 confirmation
- [x] Unit tests with Hardhat local node

---

## 5. @trustnest/backend — Infrastructure

- [x] Init NestJS project (`nest new`)
- [x] Configure TypeORM with PostgreSQL (`@nestjs/typeorm`)
- [x] Set up `.env` schema with `@nestjs/config` + Joi validation
  - [x] `DATABASE_URL`, `JWT_SECRET`, `POLYGON_RPC_URL`, `OPERATOR_KEY_ENCRYPTED`, `OPERATOR_KEY_IV`, `NETWORK`
- [x] Write TypeORM migrations for all entities (User, Wallet, Agreement, PaymentEvent, BlockchainJob, ReputationToken)
- [x] Add all DB indexes (see `docs/db-schema.md`)
- [x] Configure `BlockchainService` to instantiate `TrustNestSDK` on startup
- [x] Add NestJS cron job (every 30 s) to retry `PENDING`/`FAILED` BlockchainJobs with exponential backoff
- [x] Global exception filter → standard error format

---

## 6. @trustnest/backend — Auth Module

- [x] `POST /auth/send-otp` — generate OTP, store in Redis with 5-min TTL
- [x] `POST /auth/verify-otp` — validate, create User + Wallet rows, issue JWT pair
- [x] `POST /auth/refresh` — rotate refresh token
- [x] JWT guard applied globally; `@Public()` decorator for unprotected routes
- [x] Auto-call `RegistryModule.registerUser` after wallet creation (via BlockchainJob queue)

---

## 7. @trustnest/backend — Users Module

- [x] `GET /users/me`
- [x] `PATCH /users/me`
- [x] `POST /users/me/kyc` — upload to S3, enqueue KYC provider job, return jobId
- [x] KYC webhook handler — update `kycStatus` on callback
- [x] `GET /users/:id/reputation` (public)

---

## 8. @trustnest/backend — Agreements Module

- [x] `POST /agreements` — create DRAFT
- [x] `GET /agreements/:id`
- [x] `GET /agreements` — paginated list for auth user
- [x] `POST /agreements/:id/confirm` — both parties must confirm; on second confirm → enqueue `MINT_AGREEMENT_NFT` job
- [x] On NFT job completion → update `nftTokenIdTenant`, `nftTokenIdOwner`, status → `PENDING_DEPOSIT`
- [x] `POST /agreements/:id/dispute` — sets status `DISPUTED`, emits `raiseDispute` on-chain via job
- [x] `POST /agreements/:id/rate` — save review to `ReputationToken`, trigger `MINT_REPUTATION_SBT` job if both parties rated
- [x] Guard: only parties to the agreement can access it

---

## 9. @trustnest/backend — Payments Module

- [x] `POST /payments/initiate` — create Razorpay order, return order ID + UPI deep link
- [x] `POST /payments/webhook` — validate HMAC, write `PaymentEvent` (PENDING), enqueue `DEPOSIT_ESCROW` job
- [x] On escrow job completion → update `PaymentEvent` status → CONFIRMED, agreement status → ACTIVE
- [x] `POST /agreements/:id/release` — validate no dispute, validate owner auth, write `PaymentEvent` (RELEASE), enqueue `RELEASE_ESCROW` job
- [x] `GET /payments/:agreementId` — payment history

---

## 10. @trustnest/backend — Admin Module

- [x] `GET /admin/jobs` — list pending/failed jobs (IP-whitelisted)
- [x] `POST /admin/jobs/:id/retry` — force-retry a job
- [x] `POST /admin/disputes/:agreementId/resolve` — write dispute resolution, enqueue `RESOLVE_DISPUTE` job, then `MINT_REPUTATION_SBT`

---

## 11. @trustnest/ui-kit

- [x] Set up React Native + TypeScript + Expo config
- [x] `Button` component (primary / secondary / destructive variants)
- [x] `TextInput` component (with INR formatting helper)
- [x] `AgreementCard` component
- [x] `ReputationBadge` component (score stars + count)
- [x] `StatusChip` component (agreement status colours)
- [x] `OtpInput` component (6-digit, auto-advance)
- [x] Storybook / Expo Go previews for all components
- [x] No blockchain imports — confirmed by ESLint rule

---

## 12. @trustnest/mobile

- [x] Init Expo project
- [x] Configure Expo Router (file-based routing)
- [x] Auth flow: phone entry → OTP verify → home
- [x] Home screen: active agreements list
- [x] Agreement detail screen: status, parties, deposit amount, action buttons
- [x] Create agreement screen (tenant invites owner or vice versa)
- [x] Confirm agreement screen (PDF preview + confirm CTA)
- [x] UPI payment screen: initiate deposit → poll status → success
- [x] Dispute screen: reason input + evidence upload
- [x] Profile screen: KYC status, reputation score, past agreements
- [x] Push notifications: FCM integration, receive agreement + payment events
- [x] Deep link handling for UPI return URLs

---

## 13. Testing & QA

- [ ] Contract tests: all pass on Hardhat local node
- [ ] Backend unit tests: all services with mocked BlockchainService
- [ ] Backend e2e tests: full deposit→release flow against local Hardhat + Postgres
- [ ] `turbo run typecheck` — zero errors across all packages
- [ ] Manual QA on Amoy testnet with real Razorpay sandbox

---

## 14. Deployment

- [ ] Deploy contracts to Amoy testnet; update `CONTRACT_ADDRESSES` in `@trustnest/shared`
- [ ] Backend deployed to staging (Railway / Render); env vars set
- [ ] PostgreSQL migrations run on staging DB
- [ ] Expo preview build (internal distribution) for mobile QA
- [ ] Fund operator wallet with Amoy MATIC (faucet) and testnet USDC
- [ ] Smoke test: end-to-end agreement flow on staging

---

## Done Criteria for Phase 1 Completion

- [ ] A tenant and owner can register, create an agreement, and confirm it
- [ ] Tenant can pay security deposit via UPI; USDC locked in EscrowVault on Amoy
- [ ] Owner can release deposit; USDC transferred; both parties receive reputation SBT
- [ ] Either party can raise a dispute; admin can resolve it via admin API
- [ ] All amounts tracked in Postgres; on-chain txs retried automatically on failure
- [ ] `turbo run test` and `turbo run typecheck` pass with zero errors

---

## Phase 2 — Behavioural Reputation (planned, not started)

These items depend on Phase 2 infrastructure (recurring rent payment flow, Kleros dispute resolution). The `ReputationSBT` contract does **not** need to change — score computation is off-chain in the backend.

### Tenant signals
- [ ] Track monthly rent due dates per agreement; record `PaymentEvent` with `dueDate` field
- [ ] Compute rent timeliness sub-score at close: average across all monthly payments
  - On time (≤ due date) → 100, 1–2 days late → 80, 3–7 days late → 50, >7 days late → 0
- [ ] Include rent timeliness in composite score (weight: 40%)
- [ ] Apply −10 flat penalty if tenant raised a dispute (weight: 10%)
- [ ] Include Kleros dispute outcome in composite score (weight: 10%)

### Owner signals
- [ ] Record `releaseInitiatedAt` on `Agreement`; compute release promptness relative to `endDate`
  - ≤3 days → 100, 4–7 days → 80, 8–14 days → 50, >14 days → 0
- [ ] Include release promptness in composite score (weight: 30%)
- [ ] Record `disputeRaisedAt` and `disputeResolvedAt` on `Agreement`; compute resolution speed
  - ≤3 days → 100, 4–7 days → 80, 8–14 days → 50, >14 days / escalated → 20
- [ ] Include dispute resolution speed in composite score (weight: 20%)
- [ ] Include Kleros dispute outcome in composite score (weight: 10%)

### Shared backend changes for Phase 2 reputation
- [ ] `ReputationService.computeTenantScore(agreementId)` — returns 1–100 composite
- [ ] `ReputationService.computeOwnerScore(agreementId)` — returns 1–100 composite
- [ ] Update `mintReputation` flow to call these instead of passing raw peer rating
- [ ] Expose `reputationBreakdown` field on `GET /reputation/:userId` — shows per-signal sub-scores
- [ ] Backfill score formula version on `ReputationToken` row so historic tokens are interpretable after formula changes
