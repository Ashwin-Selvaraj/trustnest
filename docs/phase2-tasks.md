# Phase 2 Task Checklist

> **How this plan was derived:** audit of `phase1-tasks.md` against the actual codebase
> (July 2026). Phase 1 delivered more than its own Done Criteria admit — full marketplace,
> guest browsing, in-app notifications, role gating — but several items marked `[x]` were
> stubs, and the on-chain path has never run against a live network. Phase 2 therefore has
> two jobs: **close out Phase 1 honestly** (§1–§3) and **build the Phase 2 feature set**
> (§4–§12) that CLAUDE.md scopes: Kleros disputes, Chainlink Automation, behavioural
> reputation — plus the product layer (payments v2, chat, eSign) that makes them matter.
>
> **Phase 2 scope:** real providers end-to-end on Amoy testnet, recurring rent, disputes,
> behavioural reputation, push notifications, chat, and a UI polish pass to production bar.
> **Still out of scope (Phase 3):** Aave yield on deposits, MPC/non-custodial wallets,
> mainnet launch.

---

## 1. Phase 1 Closeout — On-Chain Path (blocker for everything below)

> The blockchain job queue has never successfully processed a job: the operator wallet
> env vars are empty and the wallet has no gas. Until this section is done, escrow,
> NFTs and SBTs exist only as Postgres rows.

- [ ] Write `scripts/generate-operator-key.ts` — generates a random wallet, encrypts the
      private key with `MASTER_ENCRYPTION_KEY` via `crypto.util.ts#encryptValue`, prints
      `OPERATOR_KEY_ENCRYPTED` / `OPERATOR_KEY_IV` / address to fund
- [ ] Fund operator wallet with Amoy MATIC (faucet) + testnet USDC
- [ ] Deploy all 4 contracts to Amoy; update `CONTRACT_ADDRESSES` in `@trustnest/shared`
- [ ] Clear stale `blockchain_jobs` backlog (600+ failed REGISTER_USER retries in dev DB)
- [ ] Add `MAX_ATTEMPTS` dead-letter behaviour: after N failures, mark job `DEAD` and
      surface in admin — never retry forever again (the attempt-616 incident)
- [ ] Smoke test: register → mint agreement NFT → deposit → release → SBT, all on Amoy

## 2. Phase 1 Closeout — Real Providers

> All provider integrations are currently stubs behind clean interfaces. Wire the real
> ones per §12d of phase1-tasks.md; the factory pattern means zero mobile changes.

### KYC (Sandbox.co.in for dev, Digio for prod)
- [ ] `SandboxKycService`: Aadhaar OTP init/verify, PAN lookup, penny-drop (spec in §12d.B)
- [ ] `DigioKycService`: KYC + liveness (spec in §12d.C)
- [ ] `POST /kyc/webhook` with HMAC-SHA256 validation + idempotency (spec in §12d.F)
- [ ] Env plumbing: `KYC_PROVIDER`, provider keys, Joi conditional requirements (§12d.A)

### Payments (Razorpay)
- [ ] Razorpay sandbox keys in staging env; remove silent stub fallback in
      `payments.service.ts` when `NODE_ENV !== 'development'` (fail loud, not fake)
- [ ] Verify webhook HMAC validation with real Razorpay sandbox events (integration test)
- [ ] Payment receipt object: store Razorpay payment id, method, VPA on `PaymentEvent`

## 3. Phase 1 Closeout — Testing, QA & Deployment (§13–§14 of phase1, never done)

- [ ] Contract tests green on CI (GitHub Actions: hardhat test on every PR)
- [ ] Backend unit tests for new Phase 1 code: notifications, interests (incl. notification
      side-effects), guards, KYC factory
- [ ] Backend e2e: OTP → profile → KYC(stub) → list property → interest → accept →
      agreement → deposit(stub) → release, against local Hardhat + Postgres
- [ ] `turbo run test && turbo run typecheck` green across all packages in CI
- [ ] Backend deployed to staging (Railway/Render); migrations run; env set
- [ ] Expo EAS preview build distributed for device QA
- [ ] Fix known dev-DB drift: `synchronize: true` in dev has diverged from migrations —
      generate a catch-up migration (notifications table, kycSelfieUrl, etc.) so staging
      boots from migrations alone

---

## 4. Payments v2 — Recurring Rent (foundation for behavioural reputation)

> Phase 1 only handles the security deposit. Monthly rent through the platform is what
> makes rent-timeliness reputation possible (§7) and makes TrustNest sticky after move-in.

### Backend
- [ ] `RentSchedule` entity: `agreementId`, `dueDay` (1–28), `amountINR`, `startMonth`,
      `endMonth`, `status`
- [ ] Auto-create schedule when agreement goes `ACTIVE` (dueDay from `startDate`)
- [ ] Monthly cron (Chainlink Automation later, §6): materialise `RentPayment` rows
      (`DUE`, `PAID`, `LATE`, `MISSED`) with `dueDate`, `paidAt`
- [ ] `POST /rent/:rentPaymentId/pay` — Razorpay order, same webhook flow as deposit
- [ ] Rent is **fiat-only** (INR → owner's verified UPI/bank via Razorpay Route payout);
      no on-chain leg — escrow stays deposit-only in Phase 2
- [ ] Owner payout ledger: `GET /payments/payouts` (owner sees settlement status)
- [ ] Notifications: `RENT_DUE` (T-3 days), `RENT_OVERDUE` (T+1), `RENT_RECEIVED` (owner)

### Mobile
- [ ] Home tab: active agreement card gains rent status strip ("Rent due in 3 days · ₹38,000")
- [ ] **Pay Rent screen** — reuses deposit UPI flow; shows schedule history (paid/late chips)
- [ ] Owner: **Rent Ledger screen** per property — month grid, paid/late/missed at a glance

## 5. Kleros Dispute Resolution (replaces manual admin path)

> Phase 1 disputes freeze escrow and wait for an admin. Phase 2 hands evidence-based
> arbitration to Kleros; the admin path remains as fallback via feature flag.

- [ ] `EscrowVault` v2: `escalateToArbitrator(agreementId)` — implements IArbitrable;
      ruling maps to tenant/owner split; deploy behind upgrade or new address in
      `CONTRACT_ADDRESSES`
- [ ] Evidence standard: dispute evidence (photos, text) pinned to IPFS, ERC-1497 format
- [ ] Backend `DisputesModule`: `POST /agreements/:id/dispute/evidence` (multipart → IPFS),
      `GET /agreements/:id/dispute` timeline (raised → evidence window → ruling)
- [ ] `DISPUTE_*` notification types (raised, evidence requested, ruling issued)
- [ ] Mobile: **Dispute timeline screen** — stepper UI (Raised → Evidence → Arbitration →
      Ruling), evidence upload gallery, ruling result card
- [ ] Feature flag `DISPUTE_MODE=admin|kleros` — Amoy has no Kleros court; use
      a `MockArbitrator` contract on testnet, real Kleros only at mainnet

## 6. Chainlink Automation (replace NestJS cron for on-chain jobs)

- [ ] Register Automation upkeep for escrow timeout paths (auto-release N days after
      `endDate` if owner unresponsive — this also feeds owner reputation)
- [ ] `EscrowVault.checkUpkeep/performUpkeep` for expiry-based transitions
- [ ] Keep NestJS cron for off-chain jobs (rent materialisation, retries); document the
      split in architecture.md
- [ ] Fund upkeep with testnet LINK; alarm when balance low (admin notification)

## 7. Behavioural Reputation Engine (spec already at bottom of phase1-tasks.md)

> Off-chain computation, on-chain SBT unchanged. Requires §4 (rent data) and §5/§6
> (dispute + release timing data). Weights per the Phase 2 section of phase1-tasks.md.

- [ ] Tenant signals: rent timeliness sub-score (100/80/50/0 bands), dispute penalty,
      dispute outcome
- [ ] Owner signals: release promptness relative to `endDate` (auto-release = 0-band),
      dispute resolution speed, dispute outcome
- [ ] `ReputationService.computeTenantScore/computeOwnerScore` (1–100 composite)
- [ ] `mintReputation` uses composite; store `formulaVersion` on `ReputationToken`
- [ ] `GET /reputation/:userId` returns `reputationBreakdown` (per-signal sub-scores)
- [ ] Mobile: **Reputation detail screen** — radial score + per-signal bars ("Rent
      timeliness 92 · Dispute-free · Prompt releases"); shown from profile and from
      owner/tenant cards in marketplace (trust is the product — make it visible)

## 8. Notifications v2 — Push (FCM) & Deep Links

> In-app feed shipped in Phase 1 (§12e.F). `NotificationsService.create()` is the choke
> point; add delivery channels behind it.

- [ ] Firebase project; `expo-notifications` push token registration on login →
      `DeviceToken` entity (multi-device per user)
- [ ] `PushDispatcher` in backend: FCM send on `NotificationsService.create()` (fire-and-
      forget, DB write is source of truth; failures logged, never block the request)
- [ ] Deep links: notification `data` → `trustnest://property/:id`, `agreement/:id`,
      `dispute/:id` — wire tap-navigation in Alerts tab (Phase 1 open item) AND from
      OS push tap (cold start + warm)
- [ ] Notification preferences screen (per-category mute); respect in dispatcher
- [ ] Badge count on app icon (expo-notifications setBadgeCountAsync)

## 9. Marketplace v2 — Discovery & Media

- [ ] **Photo upload UI** (backend endpoints already exist; mobile Step 5 is a placeholder):
      expo-image-picker multi-select → `POST /properties/:id/photos` multipart, upload
      progress, drag-reorder, set-cover — unblock "at least 1 photo to publish" for real
- [ ] S3 presigned upload flow (backend returns presigned PUT; mobile uploads direct —
      keeps images off the API server)
- [ ] Locality autocomplete (static city/locality dataset for the 3 launch cities;
      no Google Places dependency yet)
- [ ] Saved properties (♥): `SavedProperty` entity, heart on `PropertyCard`, Saved list
      under Profile
- [ ] "Similar properties" rail on detail screen (same city + BHK ± rent band)
- [ ] Post-login redirect return (Phase 1 open item): gated CTA stores intended route,
      login flow returns to it (`redirectTo` param through phone → OTP → back)
- [ ] Role upgrade: Profile → "Also list properties" / "Also rent a place" →
      `PATCH /users/me` role → `BOTH` (unblocks the owner browse banner CTA)

## 10. Agreements v2 — eSign & Lifecycle

- [ ] Digio Aadhaar eSign on confirm (replaces bare confirm tap): backend initiates
      eSign request, webhook stores `signedPdfUrl` on Agreement (spec §12d.C)
- [ ] Agreement PDF generation (server-side template → S3) — the artifact both parties
      keep; linked from agreement detail
- [ ] **Move-in / move-out checklist**: photo-documented property condition at start and
      end of tenancy, stored per agreement — the evidence base for deposit deductions
      and Kleros disputes (§5)
- [ ] Renewal flow: T-30 days before `endDate`, both parties prompted; renewal clones
      agreement with new dates + optional rent revision
- [ ] Notification types for the full lifecycle (confirm pending, signed, renewal due,
      deposit released)

## 11. Chat — Tenant ↔ Owner Messaging

> Every marketplace converges on chat; interest `message` is a dead-end today. Scope
> deliberately small: text-only, per-interest thread, polling not websockets.

- [ ] `MessageThread` (1 per interest) + `Message` entities; REST: list threads, list
      messages (cursor), send
- [ ] Thread opens when interest is created; interest message becomes first message
- [ ] Mobile: **Inbox** (threads list with unread badge — lives inside Alerts tab as a
      second segment: "Notifications | Messages") and **Thread screen** (bubbles,
      property context header, "Accept interest" shortcut for owner)
- [ ] Unread counts share the notifications polling cycle (single `GET /inbox/summary`)
- [ ] Phase 3 note: upgrade polling → SSE/websocket; do not build it now

## 12. UI/UX System Pass — production visual bar

> Principles: one design language (tokens already exist in `design-reference/tokens.js`
> and ui-kit theme — consolidate, don't invent); motion communicates state; every screen
> has designed loading/empty/error states; accessibility is not optional.

- [ ] **Token consolidation**: single source of truth in `@trustnest/ui-kit/theme` —
      port anything still hardcoded (`#FFFFFF`, `#F3F4F6` litter several screens)
- [ ] **Skeleton loaders** (ui-kit `Skeleton` component): browse feed, property detail,
      agreements list, alerts — replace bare spinners
- [ ] **Micro-interactions** (react-native-reanimated): filter sheet spring, heart pop on
      save, pull-to-refresh, button press scale, badge count transitions
- [ ] **Empty/error states**: designed illustrations + retry actions on every list screen
      (browse no-results shipped in Phase 1; bring the rest to that bar)
- [ ] **Toast system**: unified non-blocking feedback (replace remaining `Alert.alert`
      success cases; keep Alert for destructive confirms)
- [ ] **Tab bar icons**: replace emoji with the ui-kit SVG icon set (Phase 1 §12c.B note)
- [ ] **DOB auto-format** on profile setup (same digits→slashes formatter as
      DatePickerInput — Phase 1 §12e.A open item)
- [ ] **Dark mode**: token-level light/dark palettes; `useColorScheme` plumbing through
      ui-kit; audit every screen (guarded by a settings toggle first release)
- [ ] **Accessibility**: labels on all touchables, 44pt hit targets, dynamic type audit,
      contrast check on chip/badge palettes
- [ ] **App icon + splash final art**; store listing screenshots (device frames exist in
      `design-reference/ios-frame.jsx`)

---

## 13. Security & Ops Hardening

- [ ] Rate limiting (`@nestjs/throttler`): OTP endpoints especially (SMS cost + enumeration)
- [ ] Refresh-token reuse detection (rotate + revoke family on reuse)
- [ ] Audit log table for admin actions and dispute resolutions
- [ ] Sentry (backend + mobile); structured pino logging; `/health` + `/ready` endpoints
- [ ] Secrets out of `.env` files on staging → platform secret manager
- [ ] Backup/restore runbook for Postgres (staging first)

## 14. Phase 2 Done Criteria

- [ ] Full flow on Amoy with REAL providers: signup → Aadhaar KYC (Sandbox.co.in) →
      list property with photos → interest + chat → accept → eSign → UPI deposit
      (Razorpay sandbox) → USDC locked on-chain → monthly rent paid → release →
      behavioural SBT minted — no stubs anywhere in the path
- [ ] A dispute resolved end-to-end through the arbitration path (MockArbitrator on Amoy)
- [ ] Push notification received on a physical device for each notification type
- [ ] Reputation breakdown visible in-app and derived from real behavioural data
- [ ] CI green (tests + typecheck) on every PR; staging auto-deploys from main
- [ ] Zero `Alert.alert`-based flows for non-destructive feedback; skeletons everywhere;
      dark mode shippable behind toggle

---

## Suggested build order (dependencies, not priorities)

```
§1 on-chain closeout ──► §5 Kleros ──► §6 Automation ─┐
§2 real providers ──► §3 deploy/QA                    ├─► §7 reputation ─► §14
§4 recurring rent ────────────────────────────────────┘
§8 push ──► §11 chat        (independent track)
§9 marketplace v2, §10 eSign, §12 UI pass  (parallel, low coupling)
```

---

## 15. Phase 3 Candidate: Rent Stream Marketplace (RWA tokenization)

> **Origin:** product ideation session (see conversation), captured here so it isn't lost.
> **Not Phase 2 scope** — listed here only because it directly depends on Phase 2 work
> (§4 recurring rent, §7 reputation, §10 eSign) and should shape those sections so this
> stays buildable later without rework. Promote to its own `phase3-tasks.md` when picked up.
>
> **The idea:** a lease creates two separable things — a **liability** (the tenant's duty
> to pay, which must never be transferable) and an **asset** (the owner's claim on future
> rent, which can be sold for upfront liquidity). Tokenize only the asset side, and let
> owners sell their remaining rent stream on a platform-internal marketplace. The buyer
> takes over collecting rent (fiat, via the existing Razorpay payout rail) for the
> remaining lease term; the tenant's payment experience never changes.

### Why this is worth building (not just clever)
- Real product precedent: this is invoice-factoring / receivables-discounting, applied to
  rent. It already exists in India in manual, illiquid forms — TrustNest can make it liquid
  and transparent because it already sits in the payment path.
- **Reputation becomes a pricing engine, not just trust theater** — a tenant's rent-
  timeliness score (§7) directly prices what their landlord's income stream is worth to a
  buyer. No other rental platform has this data attached to a sellable asset.
- Clean separation of concerns: `EscrowVault` (deposit) is untouched; this only affects
  the *rent* leg introduced in §4.

### Why the naive version (transfer the AgreementNFT) is wrong
- `AgreementNFT` is the **legal record** that both parties were party to the lease —
  conflating "who was in this lease" with "who gets paid" corrupts that record.
- Today `AgreementNFT` has **no transfer restriction at all** on either token — worth
  fixing regardless of this feature: the *tenant's* token should be soulbound (liability
  can't be reassigned by transferring an NFT out from under someone), matching the
  `ReputationSBT` pattern already in the codebase.
- The owner's copy of `AgreementNFT` is economically inert today — nothing reads its
  `ownerOf()`. Rent settles fiat straight to `agreement.ownerId`'s verified bank account.
  Transferring that NFT would change nothing without new plumbing anyway — so build the
  new plumbing as its own token, not by repurposing the agreement record.

### Design: a third token type
- [ ] `RentStreamNFT.sol` — new contract, **owner-side only**, transferable (not soulbound).
      Minted alongside `AgreementNFT` when an agreement goes `ACTIVE`. Carries
      `agreementId`, `monthlyAmountINR`, `monthsRemaining` — a claim on remaining rent,
      nothing else (no deposit rights, no repair/damage liability, no dispute exposure —
      those stay with the true property owner, never bundled into the tradeable claim)
- [ ] `AgreementNFT` hardening: make the **tenant's** token soulbound (same `_update`
      override pattern as `ReputationSBT`) — liability isn't reassignable. Leave the
      owner's `AgreementNFT` token as the non-transferable *record*; `RentStreamNFT` is
      the separate, transferable *claim*
- [ ] Rent settlement lookup changes one indirection: pay whoever currently holds
      `RentStreamNFT` for that agreement (via their verified payment details), not
      hard-coded `agreement.ownerId` — this is the entire unlock

### Marketplace mechanics
- [ ] Platform-internal order book, not an open marketplace — custodial wallets (per
      CLAUDE.md's current architecture) mean the platform's operator key executes every
      transfer; this is a feature, not a limitation, because it keeps KYC intact on every
      buyer, which a public marketplace couldn't guarantee
- [ ] Every sale executes an **eSigned assignment-of-receivables deed** (Digio, from §10)
      alongside the on-chain transfer — Transfer of Property Act §130 requires a written
      instrument for a valid assignment; the deed makes it enforceable, the token makes
      it liquid and trackable
- [ ] Pricing: discount-to-face-value, informed by the tenant's reputation score (§7) as
      the underwriting signal — higher rent-timeliness score → smaller discount required
- [ ] Default risk sits with the buyer (non-recourse) — if the tenant stops paying, the
      buyer's claim just stops producing, same as any receivables purchase
- [ ] v1 sells the **whole remaining stream** per sale (no fractionalization). Splitting
      into month-range tranches (e.g. months 1–6 vs 7–12) is a real v2 idea but adds
      real complexity — defer

### Legal / regulatory — resolve before writing contract code
- [ ] **Do not fractionalize** (ERC-20 shares of a rent stream) without securities counsel
      — that crosses into SEBI-regulated territory. Whole-stream, KYC'd-buyer-only
      transfers are the defensible v1 shape
- [ ] Confirm the assignment-of-receivables structure with counsel — specifically notice-
      to-tenant requirements and whether platform-mediated notice (vs. direct notice)
      satisfies TOPA §130
- [ ] RBI angle: confirm this doesn't require an NBFC license or P2P lending registration
      — it's a receivables sale, not a loan, but get that confirmed, not assumed

### Dependencies (why this is Phase 3, not Phase 2)
```
§4 recurring rent (nothing to sell without a rent pipeline)
  └─► §7 reputation (the pricing signal)
  └─► §10 eSign (the legal wrapper for each sale)
       └─► §15 Rent Stream Marketplace
```
