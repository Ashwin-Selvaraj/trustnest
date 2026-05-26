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

## 12a. Three-Tier Onboarding & KYC Overhaul

> **Context:** phone-only signup is insufficient for a platform that holds real money in escrow and creates legally binding rental agreements. The revised model uses progressive disclosure — collect only what is needed at each moment, never block signup with a wall of forms.
>
> **Gate summary:**
> - Tier 1 (name + role + DOB) — required to complete signup
> - Tier 2 (KYC: Aadhaar or PAN + selfie) — required to create or confirm an agreement
> - Tier 3 (payment details: UPI ID or bank account) — required to initiate a deposit payment
>
> **Design files:** Figma/Claude Code screens to be supplied separately; this section covers backend + mobile implementation tasks only.

### A. @trustnest/shared changes

- [x] Add `BOTH` variant to `UserRole` enum — a user can be both a tenant and an owner (landlord who also rents elsewhere)
- [x] Add `KycMethod` enum: `AADHAAR | PAN`
- [x] Add `PaymentDetailsStatus` enum: `NONE | PENDING_VERIFICATION | VERIFIED`

### B. Backend — Data model additions

- [x] Add fields to `User` entity:
  - [x] `name: string` (required; legal name matching KYC document)
  - [x] `dob: Date` (date of birth; used for 18+ validation)
  - [x] `kycMethod: KycMethod | null`
  - [x] `maskedAadhaar: string | null` (last 4 digits only — never store full Aadhaar)
  - [x] `maskedPan: string | null` (e.g. `ABCDE1234F` → `ABCDE****F`)
- [x] Add `PaymentDetails` entity (separate table, one-to-one with User):
  - [x] `upiId: string | null`
  - [x] `bankAccountNumber: string | null` (AES-256-GCM encrypted at rest)
  - [x] `bankIfsc: string | null`
  - [x] `status: PaymentDetailsStatus`
  - [x] `verifiedAt: Date | null`
- [x] Write TypeORM migration for the above additions

### C. Backend — Auth Module changes

- [x] Extend `POST /auth/verify-otp` request body to accept `name`, `role` (`TENANT | OWNER | BOTH`), and `dob`
  - [x] Validate 18+ server-side (`dob` must be ≥ 18 years before today); return `422` with clear message if underage
  - [x] Persist `name`, `role`, `dob` to `User` row on account creation
  - [x] Keep `name` / `role` / `dob` optional for existing users upgrading (backward compat) — add `POST /auth/complete-profile` endpoint for users who signed up before this change
- [x] `POST /auth/complete-profile` *(new)* — one-time endpoint for users missing name/role/dob; marks profile as complete; JWT guard required

### D. Backend — Users Module changes

> Replace the single `POST /users/me/kyc` (file upload only) with a proper two-path KYC flow.

#### Aadhaar path (preferred — instant, OTP-based)
- [x] `POST /users/me/kyc/aadhaar/init` — accepts `aadhaarNumber`; calls UIDAI / DigiLocker API to send OTP to Aadhaar-linked mobile; returns `sessionId`
- [x] `POST /users/me/kyc/aadhaar/verify` — accepts `sessionId` + `otp`; on success stores `maskedAadhaar` (last 4 digits), sets `kycMethod = AADHAAR`, advances `kycStatus` to `PENDING` (selfie still required)
- [x] Mask Aadhaar before persisting — store only last 4 digits; full number never written to DB

#### PAN path (fallback — async, document upload)
- [x] `POST /users/me/kyc/pan` — accepts `panNumber` + PAN card image (multipart); uploads image to S3; calls KYC provider API (e.g. Karza / IDfy); returns `jobId`; sets `kycStatus = PENDING`
- [x] KYC provider webhook — on callback, store `maskedPan`, set `kycMethod = PAN`; advance to `PENDING_SELFIE` or `VERIFIED` depending on whether selfie is also required by provider
- [x] Validate PAN format server-side (`/^[A-Z]{5}[0-9]{4}[A-Z]$/`) before calling provider

#### Selfie / liveness (required for both paths)
- [x] `POST /users/me/kyc/selfie` — accepts selfie image (multipart); calls liveness-check API (e.g. Hyperverge / IDfy); on pass sets `kycStatus = VERIFIED`; on fail sets `kycStatus = REJECTED` with rejection reason stored in `kycRejectionReason` column
- [x] Add `kycRejectionReason: string | null` column to `User` entity

#### Payment details
- [x] `POST /users/me/payment-details` — accepts `upiId` OR `{ bankAccountNumber, bankIfsc }`; for bank accounts, verify via penny-drop (Razorpay / Cashfree); sets `status = VERIFIED`
- [x] `GET /users/me/payment-details` — return masked payment details (`upiId` as-is; account number masked to last 4 digits)
- [x] `DELETE /users/me/payment-details` — remove and reset status to `NONE`
- [x] `GET /users/me` — update response to include `profileComplete: boolean`, `kycStatus`, `kycMethod`, `paymentDetailsStatus`

### E. Backend — Progressive Access Gates

> Guards that block downstream actions until the user has completed the required tier.

- [x] `RequiresProfileComplete` guard — checks `name`, `role`, `dob` are set on `User`; applied to all routes except `/auth/*` and `GET /users/me`; returns `403` with `{ code: 'PROFILE_INCOMPLETE' }` if missing
- [x] `RequiresKyc` guard — checks `kycStatus === VERIFIED`; applied to:
  - `POST /agreements`
  - `POST /agreements/:id/confirm`
  - Returns `403` with `{ code: 'KYC_REQUIRED', kycStatus: '...' }`
- [x] `RequiresPaymentDetails` guard — checks `PaymentDetails.status === VERIFIED`; applied to:
  - `POST /payments/initiate`
  - Returns `403` with `{ code: 'PAYMENT_DETAILS_REQUIRED' }`
- [x] All three guards return a machine-readable `code` field so the mobile app can navigate the user to the right screen without string-matching error messages

### F. Mobile — Auth flow changes

> The existing phone → OTP → home flow becomes phone → OTP → profile completion → home.

- [x] **Profile completion screen** *(new, shown once after first OTP verify)*
  - Full legal name text input
  - Role picker: Tenant / Owner / Both (segmented control or radio)
  - Date of birth picker (date wheel; blocks if under 18 with inline error)
  - CTA: "Continue" → calls extended `POST /auth/verify-otp` or `POST /auth/complete-profile`
- [x] Skip profile completion screen if `name` + `role` + `dob` already set (returning user)

### G. Mobile — KYC screens *(new)*

- [x] **KYC entry screen** — shown when `RequiresKyc` gate returns `403`
  - Explains why verification is needed ("Required to create a rental agreement")
  - Two CTAs: "Verify with Aadhaar" / "Verify with PAN card"
- [x] **Aadhaar verification screen**
  - Step 1: Aadhaar number input (12-digit, masked after entry) → "Send OTP" → calls `POST /users/me/kyc/aadhaar/init`
  - Step 2: 6-digit OTP input (reuses `OtpInput` from ui-kit) → calls `POST /users/me/kyc/aadhaar/verify`
  - Success → advance to selfie screen
- [x] **PAN verification screen**
  - PAN number text input with format validation
  - PAN card image upload (camera or gallery)
  - Calls `POST /users/me/kyc/pan`; shows "Under review" pending state
- [x] **Selfie / liveness screen** *(required after both paths)*
  - Camera preview with oval face guide
  - Liveness instructions ("blink", "turn left" etc. — driven by provider SDK)
  - Calls `POST /users/me/kyc/selfie`
  - Shows success ✅ or failure with reason + "Try again" CTA
- [x] **KYC rejected screen** — shown when `kycStatus === REJECTED`; shows `kycRejectionReason`; CTAs to retry selfie or switch KYC method

### H. Mobile — Payment details screen *(new)*

- [x] **Payment details screen** — shown contextually when `RequiresPaymentDetails` gate returns `403`
  - Tab picker: "UPI ID" / "Bank Account"
  - UPI tab: text input for UPI ID (e.g. `ashwin@upi`); calls `POST /users/me/payment-details`
  - Bank tab: account number + IFSC inputs; penny-drop verification shown as "Verifying…" spinner
  - Success → navigates back to the blocked action (payment screen)

### I. Mobile — Progressive gate bottom sheets *(new)*

> Contextual prompts that appear inline when a gate blocks an action — no redirect, just a bottom sheet with a CTA.

- [x] `KycRequiredSheet` — shown on "Create Agreement" / "Confirm Agreement" CTA when `kycStatus !== VERIFIED`
  - Body: "Verify your identity to continue. Takes 2 minutes."
  - CTA: "Verify now" → navigates to KYC entry screen
- [x] `PaymentDetailsRequiredSheet` — shown on "Pay Deposit" CTA when payment details missing
  - Body: "Add a UPI ID or bank account to pay."
  - CTA: "Add payment details" → navigates to payment details screen
- [x] `ProfileIncompleteSheet` — shown on any gated action when profile is incomplete
  - CTA: "Complete your profile" → navigates to profile completion screen

### J. Mobile — Profile screen updates

- [x] Add "Verification" section: shows Aadhaar ✅ / PAN ✅ / Selfie ✅ with masked identifiers
- [x] Add "Payment Details" section: shows masked UPI ID or bank account + "Edit" CTA
- [x] Show inline "Action required" banners for incomplete tiers (e.g. "Add a UPI ID to enable payments")

---

## 12b. Property Marketplace (Listings & Discovery)

> **Context:** agreements currently require both parties to already know each other. This section adds a NoBroker-style discovery layer — owners list properties, tenants browse and express interest, and the platform auto-creates a pre-filled agreement draft when an owner accepts a tenant. The marketplace is the primary acquisition funnel for new agreements.
>
> **Critical join:** `POST /properties/:id/interests/:interestId/accept` → automatically creates an `Agreement` record pre-filled from the property listing and notifies both parties to review and sign it. This is what ties the marketplace to the escrow engine.
>
> **Design files:** Figma/Claude Code screens to be supplied separately; this section covers backend + mobile implementation tasks only.

### A. @trustnest/shared — new enums and types

- [ ] Add `BhkType` enum: `STUDIO | ONE_BHK | TWO_BHK | THREE_BHK | FOUR_BHK_PLUS | VILLA | INDEPENDENT_HOUSE`
- [ ] Add `FurnishingStatus` enum: `UNFURNISHED | SEMI_FURNISHED | FULLY_FURNISHED`
- [ ] Add `PropertyStatus` enum: `DRAFT | ACTIVE | PAUSED | RENTED`
- [ ] Add `InterestStatus` enum: `PENDING | ACCEPTED | DECLINED | WITHDRAWN`
- [ ] Add `TenantPreference` enum: `FAMILY | BACHELORS | WORKING_PROFESSIONAL | STUDENTS | ANY`

### B. Backend — Data model additions

- [ ] Add `Property` entity (`packages/backend/src/properties/property.entity.ts`):
  - [ ] `id: uuid`
  - [ ] `ownerId: uuid` (FK → User)
  - [ ] `title: string` (e.g. "2BHK in Indiranagar")
  - [ ] `address: string`
  - [ ] `city: string` (indexed — primary search field)
  - [ ] `locality: string` (indexed — secondary search field)
  - [ ] `bhkType: BhkType`
  - [ ] `furnishingStatus: FurnishingStatus`
  - [ ] `monthlyRentINR: decimal`
  - [ ] `depositINR: decimal`
  - [ ] `areaSqft: number | null`
  - [ ] `floorNumber: number | null`
  - [ ] `totalFloors: number | null`
  - [ ] `description: string | null`
  - [ ] `amenities: string[]` (jsonb column — parking, gym, lift, etc.)
  - [ ] `preferredTenants: TenantPreference[]` (jsonb column)
  - [ ] `availableFrom: Date`
  - [ ] `status: PropertyStatus` (default `DRAFT`)

- [ ] Add `PropertyImage` entity:
  - [ ] `id: uuid`
  - [ ] `propertyId: uuid` (FK → Property)
  - [ ] `s3Key: string`
  - [ ] `url: string`
  - [ ] `displayOrder: number` (lower = shown first)
  - [ ] `isPrimary: boolean` (cover photo for listing cards)

- [ ] Add `PropertyInterest` entity:
  - [ ] `id: uuid`
  - [ ] `propertyId: uuid` (FK → Property)
  - [ ] `tenantId: uuid` (FK → User)
  - [ ] `status: InterestStatus` (default `PENDING`)
  - [ ] `message: string | null` (optional note from tenant to owner)
  - [ ] `agreementId: uuid | null` (populated when owner accepts → auto-created Agreement)

- [ ] Write TypeORM migration covering all three new tables
- [ ] Add DB indexes:
  - `idx_properties_search` on `(city, locality, status, monthly_rent_inr)`
  - `idx_properties_owner` on `(owner_id, status)`
  - `idx_interests_property` on `(property_id, status)`
  - `idx_interests_tenant` on `(tenant_id, status)`

### C. Backend — Properties Module *(new NestJS module)*

#### Listing CRUD
- [ ] `POST /properties` — owner creates listing; requires `RequiresKyc` + `RequiresOwnerRole` guards; initial status `DRAFT`
- [ ] `GET /properties` — public search; query params: `city`, `locality`, `minRent`, `maxRent`, `bhkType`, `furnishingStatus`, `availableFrom`; paginated (default 20); returns listing cards (no sensitive owner data)
- [ ] `GET /properties/:id` — public detail view; includes owner's public profile (name + reputation score + KYC badge — no phone/wallet)
- [ ] `PATCH /properties/:id` — owner edits listing; auth + ownership check; cannot edit if `status === RENTED`
- [ ] `PATCH /properties/:id/status` — owner toggles `ACTIVE ↔ PAUSED`; separate endpoint to make intent explicit
- [ ] `DELETE /properties/:id` — soft delete (sets status to `DRAFT`); only if no `PENDING` or `ACCEPTED` interests exist

#### Photo management
- [ ] `POST /properties/:id/photos` — multipart upload; max 10 images per property; uploads to S3; creates `PropertyImage` rows; auto-sets first upload as `isPrimary`
- [ ] `PATCH /properties/:id/photos/:photoId/primary` — owner sets a different cover photo
- [ ] `DELETE /properties/:id/photos/:photoId` — removes photo from S3 and DB; blocks if it's the only photo on an `ACTIVE` listing

#### Publishing gate
- [ ] Block `PATCH /properties/:id/status` to `ACTIVE` if property is missing: title, address, at least 1 photo, `monthlyRentINR`, `depositINR`, `availableFrom` — return `422` with a list of missing fields

### D. Backend — Interests Module *(new NestJS module)*

- [ ] `POST /properties/:id/interest` — tenant expresses interest; requires `RequiresKyc` + `RequiresTenantRole` guards; one active interest per tenant per property (block duplicates); creates `PropertyInterest` with status `PENDING`; sends push notification to owner
- [ ] `GET /properties/:id/interests` — owner sees all interested tenants for their listing; each interest includes tenant's name, reputation score, KYC status badge; requires auth + ownership check
- [ ] `GET /users/me/interests` — tenant's full interest history with property summary + status chip
- [ ] `PATCH /properties/:id/interests/:interestId/accept` — **critical join endpoint**:
  - [ ] Validates caller is the property owner
  - [ ] Sets `PropertyInterest.status = ACCEPTED`
  - [ ] Sets all other `PENDING` interests on same property to `DECLINED` (one tenant per property)
  - [ ] Auto-creates `Agreement` record pre-filled from property: `tenantId`, `ownerId`, `propertyAddress`, `monthlyRentINR`, `depositINR`; status `DRAFT`
  - [ ] Writes `agreementId` back onto `PropertyInterest` row
  - [ ] Sends push to tenant: "Your interest was accepted — review and sign the agreement"
  - [ ] Sends push to owner: "Agreement draft created — review and sign"
- [ ] `PATCH /properties/:id/interests/:interestId/decline` — owner declines; sets status `DECLINED`; sends push to tenant
- [ ] `DELETE /properties/:id/interests/:interestId` — tenant withdraws interest; only allowed while `PENDING`; sets status `WITHDRAWN`

### E. Backend — New access guards

- [ ] `RequiresOwnerRole` guard — checks `user.role === OWNER || user.role === BOTH`; returns `403` with `{ code: 'OWNER_ROLE_REQUIRED' }`; applied to all property write endpoints
- [ ] `RequiresTenantRole` guard — checks `user.role === TENANT || user.role === BOTH`; returns `403` with `{ code: 'TENANT_ROLE_REQUIRED' }`; applied to `POST /properties/:id/interest`
- [ ] Both guards require `kycStatus === VERIFIED` (build on top of `RequiresKyc`)

### F. ui-kit — new components

- [ ] `PropertyCard` component — cover photo, title, locality, BHK chip, furnishing chip, rent, deposit, owner reputation badge; used in browse feed and My Properties list
- [ ] `PhotoGallery` component — swipeable full-width image carousel with dot indicators and image count badge
- [ ] `FilterBar` component — horizontal scrollable row of filter chips (BHK, rent range, furnishing, availability); selected chips highlighted; `onFilterChange` callback
- [ ] `InterestStatusChip` component — PENDING (yellow) / ACCEPTED (green) / DECLINED (red) / WITHDRAWN (grey) variants; extends existing `StatusChip` pattern
- [ ] `TenantSummaryCard` component — for owner's interest list: tenant avatar initials, name, reputation stars, KYC badge, interest message, Accept / Decline action buttons

### G. Mobile — Navigation changes

- [ ] Update bottom tab bar from 3 tabs to 4:
  - Tab 1: **Home** (agreements list) — existing
  - Tab 2: **Discover** (see below) — new
  - Tab 3: **Notifications** — existing (move here if not already)
  - Tab 4: **Profile** — existing
- [ ] **Discover tab** has role-aware sub-navigation:
  - `TENANT` role → shows Browse screen directly
  - `OWNER` role → shows My Properties screen directly
  - `BOTH` role → shows a segmented control "Browse / My Properties" at the top

### H. Mobile — Browse screens *(tenant-facing)*

- [ ] **Browse / Search screen**
  - Search bar (city or locality text input)
  - `FilterBar` component below search (BHK, rent range, furnishing)
  - Vertical `FlatList` of `PropertyCard` components; paginated with infinite scroll
  - Empty state: "No properties found — try adjusting your filters"
  - Pull-to-refresh
- [ ] **Property detail screen** (`/property/[id]`)
  - `PhotoGallery` full-width at top
  - Property specs: BHK, area, floor, furnishing, amenities chips
  - Rent + deposit prominently displayed (INR formatted)
  - Available from date
  - Owner section: name, reputation score (stars), KYC verified badge
  - "Express Interest" CTA button (full-width, primary)
  - Interest message optional text input (shown before CTA, collapsible)
  - If `InterestStatus === ACCEPTED` → replace CTA with "View Agreement" button
  - If `InterestStatus === PENDING` → show "Interest sent ✓" state with "Withdraw" option
- [ ] **My Interests screen** (`/interests`)
  - Accessible from Profile or Discover tab (tenant role)
  - List of `PropertyCard` + `InterestStatusChip` pairs
  - Tap → goes to property detail screen

### I. Mobile — My Properties screens *(owner-facing)*

- [ ] **My Properties screen**
  - List of owner's `PropertyCard`s with status chips (Draft / Active / Paused / Rented)
  - FAB: "Add Property" → navigates to listing creation flow
  - Tap on active listing → goes to Property Management screen
- [ ] **Property Management screen** (`/my-properties/[id]`)
  - Shows listing preview (same as public detail but with edit controls)
  - "Interested Tenants" count badge → taps into Interest Requests screen
  - Toggle: "Active / Paused"
  - "Edit listing" CTA
  - "Delete listing" (destructive, only if no accepted interests)
- [ ] **Interest Requests screen** (`/my-properties/[id]/interests`)
  - List of `TenantSummaryCard` components
  - Empty state: "No one has expressed interest yet"
  - Accept → shows confirmation bottom sheet → calls accept endpoint → on success navigates to the newly created agreement detail
  - Decline → calls decline endpoint; card greys out inline

### J. Mobile — Add / Edit Property flow *(owner-facing, multi-step)*

- [ ] **Step 1 — Location**
  - Property title text input
  - Full address text input
  - City text input (or picker from preset list of major Indian cities)
  - Locality text input
- [ ] **Step 2 — Property details**
  - BHK type picker (segmented or bottom sheet selector)
  - Furnishing status picker
  - Area in sqft (optional number input)
  - Floor number / total floors (optional)
- [ ] **Step 3 — Pricing**
  - Monthly rent (INR formatted number input)
  - Security deposit (INR formatted; auto-suggests 2× or 3× rent with quick-fill chips)
  - Available from date picker (calendar; minimum today)
- [ ] **Step 4 — Preferences & description**
  - Preferred tenants multi-select chips (Family, Bachelors, Working Professional, Students, Any)
  - Amenities multi-select chips (Parking, Lift, Gym, Swimming Pool, Power Backup, etc.)
  - Description optional text area (max 500 chars)
- [ ] **Step 5 — Photos**
  - Photo grid (up to 10); tap to add from camera or gallery
  - Drag-to-reorder for display order (or long-press reorder)
  - Tap existing photo → full preview + option to set as cover or remove
  - "At least 1 photo required to publish" validation
- [ ] **Step 6 — Review & Publish**
  - Preview card showing how the listing will look to tenants
  - "Save as Draft" and "Publish" CTAs
  - "Publish" validates all required fields; shows inline errors if any missing
- [ ] Progress indicator across all steps (step dots or numbered header)
- [ ] All steps auto-save to local state; navigating back does not lose data

---

## 12c. Mobile — Full Screen Build Plan

> **Reading guide:** §12a and §12b contain the full spec for every item listed here.
> This section re-orders all mobile work into a single linear build sequence — execute top-to-bottom.
> **Prerequisite:** all 19 ui-kit primitives are complete and typecheck clean (§11 ✅).
>
> **File location convention:**
> - Screens live in `packages/mobile/app/`
> - New ui-kit components live in `packages/ui-kit/src/components/`
> - Shared bottom-sheets live in `packages/mobile/components/sheets/`
> - Run `turbo run typecheck` after each phase before moving to the next.

---

### Phase A — Restyle existing screens

> Swap raw RN components for ui-kit primitives. No new API calls — purely visual.
> Each screen should use `NavHeader`, `Button` (children pattern), `TextInput`, and theme tokens.

- [ ] **`(auth)/phone.tsx`** — Phone entry
  - Replace header `Text` with `Logo` (size 56) + app name
  - Replace raw `TextInput` with ui-kit `TextInput` (`label="Mobile Number"`, `prefix="🇮🇳 +91"`, `keyboardType="phone-pad"`)
  - Replace `TouchableOpacity` CTA with `Button` variant `primary` fullWidth
  - Apply `colors.surface` page background and `spacing` padding

- [ ] **`(auth)/otp.tsx`** — OTP verify
  - Add `NavHeader` (`title="Verify OTP"`, `onBack`)
  - Wrap `OtpInput` in a centred `View`; pass `error` prop from error state
  - Replace CTA with `Button` (already done) — confirm `disabled={otp.length < 6}`
  - Add `Banner` variant `info` above OTP input: "Enter the 6-digit code sent to {phone}"
  - Resend link: keep as `Pressable` with `colors.primary` text

- [ ] **`(tabs)/index.tsx`** — Agreements list (Home)
  - Replace hardcoded header `Text` with a `View` showing `Logo` (size 32) + "TrustNest" wordmark inline
  - Wrap `FlatList` in correct padding using `spacing` tokens
  - `AgreementCard` already uses ui-kit — confirm `onPress` navigates to detail
  - Empty state: use `Banner` variant `info` ("No agreements yet. Create your first one.")
  - `FAB` already imported — confirm `bottom={96}` clears tab bar

- [ ] **`(tabs)/profile.tsx`** — Profile
  - Replace avatar `View` with `Avatar` component (`name={user.name}`, size 72)
  - Replace KYC status `Text` with `KycBadge` (`state` mapped from `KycStatus` enum)
  - Wrap reputation section in `Card` (`title="Reputation"`)
  - Wrap agreements overview in `Card` (`title="Agreement Overview"`)
  - Replace "Sign Out" `TouchableOpacity` with `Button` variant `secondary` (already done)

- [ ] **`agreement/[id].tsx`** — Agreement detail
  - Add `NavHeader` (`title="Agreement"`, `onBack={router.back}`, `right=<StatusChip>`)
  - Wrap details in `Card` (`title="Lease Details"`) + `InfoRow` for each field
  - Wrap parties section in `Card` (`title="Parties"`) + `InfoRow` rows
  - Action buttons already converted to children pattern — confirm styles use `spacing`

- [ ] **`agreement/create.tsx`** — Create agreement
  - Add `NavHeader` (`title="New Agreement"`, `onBack`)
  - Add `SectionHeader` before each logical group of inputs (Property, Financials, Dates, Counterparty)
  - All `TextInput` labels already in place — confirm `hint` text on financial fields
  - Buttons already converted — confirm `loading` spinner shows correctly

- [ ] **`agreement/[id]/confirm.tsx`** — Confirm agreement
  - Add `NavHeader` (`title="Review Agreement"`, `onBack`)
  - Wrap each summary block in `Card`
  - Add `Checkbox` + `Banner` variant `warning` disclaimer above CTAs:
    "By confirming you agree to the terms stored on-chain. This action cannot be undone."
  - Buttons already converted

- [ ] **`agreement/[id]/payment.tsx`** — UPI deposit payment
  - Add `NavHeader` (`title="Pay Deposit"`, `onBack`)
  - Add `Banner` variant `info` in idle state: "Your deposit will be locked in a smart-contract escrow until the lease ends."
  - Add `Banner` variant `success` in confirmed state (replace custom card)
  - Add `Banner` variant `warning` in failed state with retry instruction
  - Buttons already converted

- [ ] **`agreement/[id]/dispute.tsx`** — Raise dispute
  - Add `NavHeader` (`title="Raise Dispute"`, `onBack`)
  - Add `Banner` variant `danger` at top: "Filing a dispute pauses the escrow. Provide accurate details — false claims affect your reputation score."
  - Add `SectionHeader` above reason `TextInput`
  - Buttons already converted

---

### Phase B — Navigation overhaul (4-tab bar + role-aware Discover tab)

> Spec: §12b.G. Do this before building new screens so routing is in place.

- [ ] Update `app/(tabs)/_layout.tsx`:
  - Change from 2-tab (`index`, `profile`) to 4-tab layout:
    - Tab 1 `index` → **Home** (agreements list) — existing
    - Tab 2 `browse/index` → **Discover** — new (see below)
    - Tab 3 `notifications/index` → **Alerts** — new placeholder screen for now
    - Tab 4 `profile` → **Profile** — existing
  - Replace emoji `TabIcon` with imported ui-kit `TabBar` SVG icons (or keep emoji for now and swap in Phase E)
  - Bottom tab bar height: ensure `FAB` `bottom={96}` still clears it

- [ ] Create `app/(tabs)/browse/index.tsx` — **Discover tab shell**
  - Read `user.role` from auth store
  - `TENANT` → render `<BrowseScreen />`
  - `OWNER` → render `<MyPropertiesScreen />`
  - `BOTH` → segmented control at top: "Browse" / "My Properties"; toggles between both
  - Both sub-screens are stubs (`<View><Text>Coming soon</Text></View>`) until Phase D/E

- [ ] Create `app/(tabs)/notifications/index.tsx` — **Alerts tab placeholder**
  - Empty state `Banner` variant `info`: "Push notifications will appear here."

---

### Phase C — Onboarding & KYC screens (spec: §12a.F–J)

> These slot into the existing auth flow. Build in the order shown — each screen feeds into the next.

#### C1. Profile completion (§12a.F)
- [ ] Create `app/(auth)/complete-profile.tsx` — **Profile completion screen**
  - `NavHeader` (`title="Complete Your Profile"`) — no back button (required step)
  - `TextInput` for full legal name
  - `SectionHeader` "Your Role"
  - Two `SelectableCard`s: "I'm a Tenant" / "I'm an Owner" + a third "I'm Both" card
  - Date of birth text input (`keyboardType="numeric"`, hint "DD / MM / YYYY")
  - Inline 18+ validation error shown below DOB field
  - `Button` variant `primary` fullWidth "Continue" → `POST /auth/complete-profile` or extended `POST /auth/verify-otp`
  - `ProgressBar` step={1} total={2} at the top (Step 1 of 2: Profile, Step 2: Verification)

- [ ] Update `app/(auth)/otp.tsx` — after successful verify, check if `name + role + dob` set:
  - If not → `router.replace('/(auth)/complete-profile')`
  - If yes → `router.replace('/(tabs)')`

#### C2. KYC entry screen (§12a.G)
- [ ] Create `app/(auth)/kyc/index.tsx` — **KYC entry screen**
  - `NavHeader` (`title="Verify Your Identity"`, `onBack`)
  - `Banner` variant `info`: "Required to create or confirm a rental agreement."
  - Two `SelectableCard`s:
    - "Aadhaar Card" (subtitle: "Instant, OTP-based verification", badge: "Recommended")
    - "PAN Card" (subtitle: "Upload document — takes up to 24 hours")
  - `Button` variant `primary` fullWidth "Continue" → navigates to selected path

#### C3. Aadhaar verification (§12a.G)
- [ ] Create `app/(auth)/kyc/aadhaar.tsx` — **Aadhaar verification screen**
  - `ProgressBar` step={1} total={2} ("Step 1 of 2: Enter Aadhaar")
  - Step 1 — Aadhaar number input:
    - `TextInput` label="Aadhaar Number" maxLength={12} keyboardType="number-pad"
    - Mask digits after entry (show `XXXX XXXX 1234`)
    - `Button` "Send OTP" → `POST /users/me/kyc/aadhaar/init`; advances to Step 2 on success
  - Step 2 — OTP verify:
    - `ProgressBar` step={2} total={2}
    - `Banner` variant `info`: "Enter the OTP sent to your Aadhaar-linked mobile"
    - `OtpInput` `length={6}`
    - `Button` "Verify" → `POST /users/me/kyc/aadhaar/verify`; on success → `router.push('/(auth)/kyc/selfie')`

#### C4. PAN verification (§12a.G)
- [ ] Create `app/(auth)/kyc/pan.tsx` — **PAN card screen**
  - `TextInput` label="PAN Number" hint="e.g. ABCDE1234F" `autoCapitalize="characters"` `maxLength={10}`
  - Inline regex validation error if format invalid
  - Image upload area (camera icon + "Upload PAN card photo")
  - `Button` "Submit" → `POST /users/me/kyc/pan`
  - On submit: replace form with `Banner` variant `info` "Your PAN is under review — we'll notify you within 24 hours."

#### C5. Selfie / liveness (§12a.G)
- [ ] Create `app/(auth)/kyc/selfie.tsx` — **Selfie screen**
  - `NavHeader` (`title="Take a Selfie"`)
  - Camera preview placeholder with oval face-guide overlay (use `View` with `borderRadius` for now; replace with camera SDK later)
  - Instructions text: "Look directly at the camera in good lighting"
  - `Button` variant `primary` "Take Photo" → `POST /users/me/kyc/selfie`
  - On success → `Banner` variant `success` "Identity Verified ✅" + "Continue" CTA back to the blocked action
  - On failure → `Banner` variant `danger` showing `kycRejectionReason` + "Try Again" CTA

#### C6. KYC rejected screen (§12a.G)
- [ ] Create `app/(auth)/kyc/rejected.tsx` — **KYC rejected screen**
  - `NavHeader` (`title="Verification Failed"`)
  - `Banner` variant `danger` showing the `kycRejectionReason` text
  - `SelectableCard` "Retry selfie" + `SelectableCard` "Switch to PAN" (if currently on Aadhaar path)
  - `Button` "Try again" navigates back to the appropriate step

#### C7. Payment details screen (§12a.H)
- [ ] Create `app/(auth)/payment-details.tsx` — **Payment details screen**
  - `NavHeader` (`title="Payment Details"`, `onBack`)
  - `Banner` variant `info`: "Required to pay or receive rental deposits."
  - Segmented control / two `SelectableCard`s: "UPI ID" / "Bank Account"
  - **UPI tab:**
    - `TextInput` label="UPI ID" placeholder="yourname@upi" hint="e.g. ashwin@oksbi"
    - `Button` "Save" → `POST /users/me/payment-details`
  - **Bank tab:**
    - `TextInput` label="Account Number"
    - `TextInput` label="IFSC Code" `autoCapitalize="characters"`
    - `Button` "Verify & Save" → penny-drop call; show `ProgressBar` indeterminate-style spinner while verifying
  - On success → `Banner` variant `success` "Payment details saved" + navigate back

#### C8. Progressive gate bottom sheets (§12a.I)
- [ ] Create `components/sheets/KycRequiredSheet.tsx`
  - `Banner` variant `warning` title="KYC Required"
  - Body: "Verify your identity to continue. Takes 2 minutes."
  - `Button` "Verify Now" → `router.push('/(auth)/kyc')`
  - Shown via a `Modal` or `BottomSheet`

- [ ] Create `components/sheets/PaymentDetailsRequiredSheet.tsx`
  - `Banner` variant `warning` title="Payment Details Required"
  - Body: "Add a UPI ID or bank account to pay."
  - `Button` "Add Payment Details" → `router.push('/(auth)/payment-details')`

- [ ] Create `components/sheets/ProfileIncompleteSheet.tsx`
  - `Banner` variant `warning` title="Complete Your Profile"
  - Body: "Add your name, role, and date of birth to continue."
  - `Button` "Complete Profile" → `router.push('/(auth)/complete-profile')`

- [ ] Wire gate sheets to API error responses:
  - In all API call sites: intercept `403` with `code: 'KYC_REQUIRED'` → show `KycRequiredSheet`
  - `code: 'PAYMENT_DETAILS_REQUIRED'` → show `PaymentDetailsRequiredSheet`
  - `code: 'PROFILE_INCOMPLETE'` → show `ProfileIncompleteSheet`

#### C9. Profile screen — verification & payment sections (§12a.J)
- [ ] Add "Verification" `Card` section to `profile.tsx`:
  - `InfoRow` "Aadhaar" → `KycBadge` state derived from `kycStatus + kycMethod`
  - `InfoRow` "Selfie" → ✅ / pending text
  - Show masked identifier (e.g. `•••• •••• 1234`) below the badge
- [ ] Add "Payment Details" `Card` section to `profile.tsx`:
  - `InfoRow` showing masked UPI ID or `••••` + last 4 of account number
  - "Edit" ghost `Button` as `right` prop on `NavHeader` or inline CTA
- [ ] Add inline `Banner` variant `warning` for incomplete tiers:
  - If `kycStatus !== VERIFIED`: "Complete KYC to create agreements →"
  - If no payment details: "Add payment details to enable deposits →"
  - Each banner has a `Pressable` wrapper that navigates to the relevant screen

---

### Phase D — New ui-kit components for marketplace (spec: §12b.F)

> Add to `packages/ui-kit/src/components/` and export from `index.ts`.
> Run `turbo run typecheck --filter=@trustnest/ui-kit` after each component.

- [ ] **`PropertyCard.tsx`**
  - Props: `title`, `locality`, `city`, `bhkType`, `furnishingStatus`, `monthlyRentINR`, `depositINR`, `ownerName`, `ownerScore`, `isPrimary` image URL, `status: PropertyStatus`, `onPress`
  - Cover image (aspect 16:9) with `StatusChip`-style pill overlay for property status
  - BHK + furnishing chips using `colors.surface` background
  - Rent prominently in `fontSize.base` semibold; deposit in `fontSize.sm` textSec
  - Owner strip at bottom: `Avatar` (size 28) + name + `ReputationBadge` compact stars

- [ ] **`PhotoGallery.tsx`**
  - Props: `images: string[]`, `onImagePress?: (index) => void`
  - Full-width `ScrollView` horizontal paging (or `FlatList` with `pagingEnabled`)
  - Dot indicators below; image count badge top-right ("3 / 10")
  - Aspect ratio 4:3

- [ ] **`FilterBar.tsx`**
  - Props: `filters: FilterOption[]`, `selected: string[]`, `onFilterChange`
  - Horizontal `ScrollView` (no scroll indicator) of pill chips
  - Selected chip: `colors.primary` bg + white text
  - Unselected: `colors.surface` bg + `colors.text` text

- [ ] **`InterestStatusChip.tsx`**
  - Props: `status: InterestStatus`
  - `PENDING` → warning yellow; `ACCEPTED` → success green; `DECLINED` → danger red; `WITHDRAWN` → grey
  - Same visual pattern as `StatusChip` (dot + label + pill shape)

- [ ] **`TenantSummaryCard.tsx`**
  - Props: `tenantName`, `score`, `reviews`, `kycStatus`, `message?`, `onAccept`, `onDecline`, `isLoading?`
  - Left: `Avatar` (size 48) + name + `KycBadge`
  - Stars row using `ReputationBadge` compact mode
  - Optional `message` text block in `colors.surface` bg
  - Two CTAs: `Button` "Accept" variant `primary` + `Button` "Decline" variant `secondary`

- [ ] Update `packages/ui-kit/src/index.ts` with all 5 new exports
- [ ] Run `turbo run typecheck --filter=@trustnest/ui-kit` — zero errors

---

### Phase E — Property marketplace screens (spec: §12b.H–J)

#### E1. Browse / Search screen (§12b.H) — tenant-facing
- [ ] Create `app/(tabs)/browse/index.tsx` — **Browse screen** (replaces stub from Phase B)
  - `NavHeader` (`title="Discover"`, no back button — it's a tab)
  - Search bar: `TextInput` placeholder="Search city or locality…"
  - `FilterBar` below search with chips: BHK types, rent ranges (< ₹15k, ₹15–30k, > ₹30k), furnishing
  - `FlatList` of `PropertyCard` components; `onEndReached` → append next page
  - Pull-to-refresh (`refreshControl`)
  - Empty state: `Banner` variant `info` "No properties found — try adjusting your filters"
  - API: `GET /properties?city=&bhkType=&minRent=&maxRent=&page=`

- [ ] Create `app/property/[id].tsx` — **Property detail screen** (§12b.H)
  - `NavHeader` (`title=""`, `onBack`) — title shown below header
  - `PhotoGallery` full-width at top (images from property)
  - Property title in `fontSize.xl` semibold
  - Chips row: BHK chip + furnishing chip (use `StatusChip` pattern)
  - `Card` "Pricing": `InfoRow` "Monthly Rent" (highlight) + `InfoRow` "Deposit"
  - `Card` "Details": `InfoRow` "Available from" + `InfoRow` "Area" + `InfoRow` "Floor"
  - `Card` "Amenities": wrapping chip pills
  - `Card` "Owner": `Avatar` + name + `ReputationBadge` + `KycBadge`
  - Bottom bar (fixed): interest message `TextInput` (collapsible) + `Button` "Express Interest" fullWidth
  - Interest state logic:
    - `PENDING` interest → replace CTA with `Banner` "Interest sent ✓" + "Withdraw" ghost button
    - `ACCEPTED` interest → `Button` "View Agreement" navigates to agreement detail
  - API: `GET /properties/:id` + `POST /properties/:id/interest`

- [ ] Create `app/interests/index.tsx` — **My Interests screen** (§12b.H)
  - `NavHeader` (`title="My Interests"`)
  - `FlatList` of `PropertyCard` + `InterestStatusChip` pairs
  - Tap → navigate to `/property/[id]`
  - API: `GET /users/me/interests`

#### E2. My Properties screens (§12b.I) — owner-facing
- [ ] Create `app/(tabs)/browse/my-properties.tsx` — **My Properties screen**
  - `NavHeader` (`title="My Properties"`)
  - `FlatList` of `PropertyCard` with owner-facing status chips (Draft / Active / Paused / Rented)
  - `FAB` "+" → navigates to `/my-properties/create` (Step 1 of add flow)
  - Tap → navigates to `/my-properties/[id]`
  - Empty state: `Banner` variant `info` "List your first property to start receiving tenant requests."
  - API: `GET /properties?ownerId=me`

- [ ] Create `app/my-properties/[id]/index.tsx` — **Property Management screen** (§12b.I)
  - `NavHeader` (`title="Manage Property"`, `onBack`, right = `Button` "Edit" ghost)
  - `PropertyCard` preview (read-only, full detail)
  - `Card` "Interested Tenants": count badge + `Button` "View requests" → navigates to interests screen
  - Toggle row: Active / Paused switch (calls `PATCH /properties/:id/status`)
  - `Button` "Delete Listing" variant `destructive` (shown only if `status !== RENTED`)
  - Confirm delete: inline `Banner` variant `danger` with second "Confirm Delete" CTA

- [ ] Create `app/my-properties/[id]/interests.tsx` — **Interest Requests screen** (§12b.I)
  - `NavHeader` (`title="Interested Tenants"`, `onBack`)
  - `FlatList` of `TenantSummaryCard` components
  - Accept → confirmation `Banner` variant `warning` inline: "Accepting will decline all other requests and create a draft agreement." + "Confirm Accept" CTA → `POST /properties/:id/interests/:interestId/accept` → navigate to new agreement detail
  - Decline → card greys out optimistically; `PATCH` accept endpoint called
  - Empty state: `Banner` variant `info` "No one has expressed interest yet."
  - API: `GET /properties/:id/interests`

#### E3. Add / Edit Property flow (§12b.J) — owner-facing, multi-step
- [ ] Create `app/my-properties/create.tsx` — **Multi-step property form**
  - Local state stores all 6 steps; navigating back doesn't clear data (`useRef` or `zustand` slice)
  - `ProgressBar` `step={currentStep}` `total={6}` pinned below `NavHeader`

  - **Step 1 — Location:**
    - `SectionHeader` "Where is the property?"
    - `TextInput` label="Property Title" (e.g. "2BHK in Indiranagar")
    - `TextInput` label="Full Address" multiline
    - `TextInput` label="City"
    - `TextInput` label="Locality / Area"

  - **Step 2 — Property Details:**
    - `SectionHeader` "Property type"
    - `SelectableCard` grid for BHK type (Studio / 1BHK / 2BHK / 3BHK / 4BHK+ / Villa)
    - `SelectableCard` row for furnishing (Unfurnished / Semi / Fully)
    - `TextInput` label="Area (sq ft)" optional, `keyboardType="numeric"`
    - `TextInput` label="Floor" + `TextInput` label="Total Floors" side-by-side

  - **Step 3 — Pricing:**
    - `SectionHeader` "Rent & deposit"
    - `TextInput` label="Monthly Rent" `prefix="₹"` `keyboardType="numeric"`
    - `TextInput` label="Security Deposit" `prefix="₹"` with quick-fill chip row ("2× rent", "3× rent")
    - `TextInput` label="Available From" placeholder="DD/MM/YYYY"

  - **Step 4 — Preferences & Description:**
    - `SectionHeader` "Preferred tenants"
    - Multi-select chips: Family / Bachelors / Working Professional / Students / Any
    - `SectionHeader` "Amenities"
    - Multi-select chips: Parking / Lift / Gym / Pool / Power Backup / Security / Gas Pipeline
    - `TextInput` label="Description" multiline optional maxLength={500} with char counter hint

  - **Step 5 — Photos:**
    - `SectionHeader` "Photos (up to 10)"
    - Photo grid: 3-column `FlatList` of thumbnails; tap "+" to add from camera/gallery
    - Each thumbnail has a remove "×" badge and a "Set as cover" option on long-press
    - `Banner` variant `warning` shown if 0 photos: "At least 1 photo required to publish"

  - **Step 6 — Review & Publish:**
    - `SectionHeader` "Preview"
    - `PropertyCard` rendered with entered data (live preview)
    - `Button` "Save as Draft" variant `secondary` → `POST /properties` with `status: DRAFT`
    - `Button` "Publish Listing" variant `primary` → `POST /properties` + `PATCH /properties/:id/status` to ACTIVE
    - Inline validation: missing required fields shown as `Banner` variant `danger` listing gaps

  - "Next" / "Back" navigation buttons between steps; "Next" validates current step before advancing

---

### Phase F — Typecheck & smoke test pass

- [ ] Run `turbo run typecheck` across all packages — zero errors
- [ ] Start Expo Go on device/simulator: walk through every screen manually
- [ ] Verify `Banner` gate sheets appear correctly for each 403 code
- [ ] Verify FAB clears the 4-tab bar on all screens that use it
- [ ] Verify `ProgressBar` shows correct step on all multi-step flows
- [ ] Mark §13 Testing & QA items as ready to run

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
