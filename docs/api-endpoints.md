# REST API Reference

Base URL: `https://api.trustnest.in/v1` (prod) · `http://localhost:3000/v1` (local)

All amounts in request/response bodies are **INR integers (rupees)** unless noted otherwise.
Authentication: Bearer JWT in `Authorization` header (except `/auth/*`).

---

## Auth

### `POST /auth/send-otp`
Send OTP to phone number.
```json
// Request
{ "phone": "+919876543210" }

// Response 200
{ "sessionId": "uuid" }
```

### `POST /auth/verify-otp`
Verify OTP and issue JWT.
```json
// Request
{ "sessionId": "uuid", "otp": "123456" }

// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "phone": "+919876543210", "role": "TENANT" }
}
```

### `POST /auth/refresh`
Exchange refresh token for new access token.
```json
// Request
{ "refreshToken": "eyJ..." }

// Response 200
{ "accessToken": "eyJ..." }
```

---

## Users

### `GET /users/me`
Return authenticated user's profile.
```json
// Response 200
{
  "id": "uuid",
  "phone": "+919876543210",
  "name": "Ashwin S",
  "role": "TENANT",          // TENANT | OWNER
  "kycStatus": "VERIFIED",   // PENDING | VERIFIED | REJECTED
  "walletAddress": "0x...",
  "reputationScore": 4.7,
  "reputationCount": 3
}
```

### `PATCH /users/me`
Update name or notification preferences.
```json
// Request
{ "name": "Ashwin Selvaraj" }

// Response 200 — same shape as GET /users/me
```

### `POST /users/me/kyc`
Submit KYC documents (multipart form, Aadhaar + PAN images). Returns job ID; status polled via GET.
```
Content-Type: multipart/form-data
Fields: aadhaar (file), pan (file)

// Response 202
{ "kycJobId": "uuid" }
```

### `GET /users/:id/reputation`
Public reputation summary for any user.
```json
// Response 200
{
  "userId": "uuid",
  "averageScore": 4.5,
  "totalAgreements": 5,
  "role": "OWNER"
}
```

---

## Agreements

### `POST /agreements`
Create a new draft agreement. Both parties must be registered.
```json
// Request
{
  "tenantId": "uuid",
  "ownerId": "uuid",
  "propertyAddress": "12 MG Road, Bengaluru 560001",
  "monthlyRentINR": 25000,
  "depositINR": 75000,
  "startDate": "2026-06-01",
  "endDate": "2027-05-31",
  "pdfIpfsHash": "Qm..."   // optional at creation; required before activation
}

// Response 201
{
  "id": "uuid",
  "status": "DRAFT",
  "nftTokenId": null,
  "createdAt": "2026-05-23T10:00:00Z"
}
```

### `GET /agreements/:id`
Fetch full agreement detail.
```json
// Response 200
{
  "id": "uuid",
  "status": "ACTIVE",         // DRAFT | PENDING_DEPOSIT | ACTIVE | DISPUTED | CLOSED
  "tenantId": "uuid",
  "ownerId": "uuid",
  "propertyAddress": "...",
  "monthlyRentINR": 25000,
  "depositINR": 75000,
  "depositUsdcWei": "75000000",  // 6 decimals, string to avoid JS bigint issues
  "startDate": "2026-06-01",
  "endDate": "2027-05-31",
  "nftTokenId": 42,
  "pdfIpfsHash": "Qm...",
  "onChainAgreementId": "0x..."  // keccak bytes32
}
```

### `GET /agreements`
List agreements for the authenticated user (as tenant or owner).
```
Query params:
  status   — filter by status (optional)
  page     — default 1
  limit    — default 20, max 100

// Response 200
{
  "data": [ ...agreement objects... ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

### `POST /agreements/:id/confirm`
Both parties must call this to move from DRAFT → PENDING_DEPOSIT. Triggers AgreementNFT mint.
```json
// Response 200
{ "status": "PENDING_DEPOSIT", "nftTokenId": 42 }
```

### `POST /agreements/:id/release`
Owner initiates deposit release at end of tenancy. Optional deductions.
```json
// Request
{
  "deductionINR": 5000,
  "deductionReason": "Broken window repair"
}

// Response 202
{ "status": "RELEASING", "jobId": "uuid" }
```

### `POST /agreements/:id/dispute`
Either party raises a dispute. Locks the escrow.
```json
// Request
{
  "reason": "Owner refusing to return deposit",
  "evidenceIpfsHash": "Qm..."   // optional
}

// Response 200
{ "status": "DISPUTED" }
```

### `POST /agreements/:id/rate`
Submit counterparty rating after agreement closes (1–5).
```json
// Request
{ "score": 5, "review": "Excellent tenant, kept the place spotless." }

// Response 200
{ "ok": true }
```

---

## Payments

### `POST /payments/initiate`
Initiate UPI payment for deposit. Returns payment gateway order.
```json
// Request
{ "agreementId": "uuid" }

// Response 201
{
  "orderId": "rzp_order_...",
  "amountINR": 75000,
  "gatewayKey": "rzp_live_...",
  "upiDeepLink": "upi://pay?..."
}
```

### `POST /payments/webhook`
**Internal** — called by payment gateway (Razorpay/PayU). Validates HMAC signature, writes PaymentEvent to DB, triggers EscrowVault.deposit. Not accessible by clients.
```
Headers: X-Razorpay-Signature: <hmac>

// Response 200
{ "ok": true }
```

### `GET /payments/:agreementId`
Payment history for an agreement.
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "type": "DEPOSIT",       // DEPOSIT | RELEASE | REFUND | DEDUCTION
      "amountINR": 75000,
      "usdcWei": "75000000",
      "txHash": "0x...",
      "status": "CONFIRMED",   // PENDING | CONFIRMED | FAILED
      "createdAt": "2026-05-23T10:05:00Z"
    }
  ]
}
```

---

## Reputation (read-only)

### `GET /reputation/:userId`
Detailed reputation with per-agreement breakdown (public).
```json
// Response 200
{
  "userId": "uuid",
  "averageScore": 4.7,
  "totalAgreements": 3,
  "tokens": [
    {
      "sbtTokenId": 7,
      "agreementId": "uuid",
      "role": "TENANT",
      "score": 5,
      "mintedAt": "2026-03-01T00:00:00Z"
    }
  ]
}
```

---

## Admin (internal — IP-whitelisted)

### `POST /admin/disputes/:agreementId/resolve`
Manually resolve a dispute (Phase 1).
```json
// Request
{
  "tenantShareINR": 50000,
  "ownerShareINR": 25000
}

// Response 200
{ "status": "CLOSED" }
```

### `GET /admin/jobs`
List pending blockchain retry jobs.

### `POST /admin/jobs/:id/retry`
Manually trigger a retry for a failed on-chain job.

---

## Error Format

All errors return:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "depositINR must be a positive integer"
}
```

Standard HTTP status codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict (e.g., agreement already confirmed), `422` blockchain tx failed, `500` internal.
