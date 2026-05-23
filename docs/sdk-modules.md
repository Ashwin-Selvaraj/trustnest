# SDK Module Specifications

Package: `@trustnest/sdk`
Depends on: `@trustnest/shared`, `@trustnest/contracts` (TypeChain types)
Runtime dep: `ethers` v6
No React, no NestJS — pure TypeScript library usable in any Node.js context.

---

## Entry Point

```typescript
// packages/sdk/src/index.ts

export { TrustNestSDK } from './TrustNestSDK';
export { RegistryModule } from './modules/RegistryModule';
export { EscrowModule } from './modules/EscrowModule';
export { AgreementModule } from './modules/AgreementModule';
export { ReputationModule } from './modules/ReputationModule';
export type { SDKConfig, TxResult } from './types';
```

---

## TrustNestSDK (root class)

```typescript
// packages/sdk/src/TrustNestSDK.ts

export class TrustNestSDK {
  readonly registry:   RegistryModule;
  readonly escrow:     EscrowModule;
  readonly agreement:  AgreementModule;
  readonly reputation: ReputationModule;

  constructor(config: SDKConfig) {
    // config.rpcUrl       — Polygon / Amoy RPC endpoint
    // config.operatorKey  — AES-decrypted private key of backend operator wallet
    // config.contracts    — ContractAddresses from @trustnest/shared
    const provider = new JsonRpcProvider(config.rpcUrl);
    const signer   = new Wallet(config.operatorKey, provider);

    this.registry   = new RegistryModule(signer, config.contracts.registry);
    this.escrow     = new EscrowModule(signer, config.contracts.escrowVault);
    this.agreement  = new AgreementModule(signer, config.contracts.agreementNFT);
    this.reputation = new ReputationModule(signer, config.contracts.reputationSBT);
  }
}
```

### SDKConfig type
```typescript
export interface SDKConfig {
  rpcUrl:       string;
  operatorKey:  string;   // hex private key — caller must decrypt before passing
  contracts:    ContractAddresses;
  gasLimitOverride?: bigint;  // optional ceiling for all txs
}
```

### TxResult type
```typescript
export interface TxResult {
  txHash:    string;
  blockNumber: number;
  gasUsed:   bigint;
}
```

---

## RegistryModule

Wraps `TrustNestRegistry` contract.

```typescript
// packages/sdk/src/modules/RegistryModule.ts

export class RegistryModule {
  async registerUser(userId: string, walletAddress: string): Promise<TxResult>
  // userId: Postgres UUID string → keccak256'd internally to bytes32

  async deregisterUser(userId: string): Promise<TxResult>

  async getWalletAddress(userId: string): Promise<string>
  // Returns '0x0000...' if not registered

  async getUserId(walletAddress: string): Promise<string | null>
  // Returns null if wallet not registered
}
```

### Notes
- `userId` → `bytes32` conversion: `ethers.keccak256(ethers.toUtf8Bytes(userId))`.
- All write methods wait for 1 confirmation before resolving.

---

## EscrowModule

Wraps `EscrowVault` contract. All amounts are `bigint` in USDC 6-decimal wei.

```typescript
// packages/sdk/src/modules/EscrowModule.ts

export class EscrowModule {
  async deposit(params: {
    agreementId:   string;   // Postgres UUID → bytes32
    tenantAddress: string;
    ownerAddress:  string;
    usdcAmount:    bigint;
  }): Promise<TxResult>

  async release(params: {
    agreementId:     string;
    deductionAmount: bigint;  // 0n if no deductions
  }): Promise<TxResult>

  async raiseDispute(agreementId: string): Promise<TxResult>

  async resolveDispute(params: {
    agreementId:  string;
    tenantShare:  bigint;
    ownerShare:   bigint;
  }): Promise<TxResult>

  async getEscrow(agreementId: string): Promise<EscrowState>
}

export interface EscrowState {
  amount:      bigint;
  status:      EscrowStatus;  // from @trustnest/shared
  depositedAt: Date;
}
```

### Notes
- Before calling `deposit`, the operator wallet must have approved EscrowVault to spend USDC on its behalf (`USDC.approve`). The SDK handles this automatically if the allowance is insufficient.
- `release` and `resolveDispute` assert `tenantShare + ownerShare === escrow.amount` locally before sending tx to fail fast.

---

## AgreementModule

Wraps `AgreementNFT` contract.

```typescript
// packages/sdk/src/modules/AgreementModule.ts

export class AgreementModule {
  async mintAgreement(params: {
    agreementId:   string;   // Postgres UUID → bytes32
    tenantAddress: string;
    ownerAddress:  string;
    metadataURI:   string;   // ipfs://...
  }): Promise<{ tenantTokenId: bigint; ownerTokenId: bigint; txHash: string }>

  async updateMetadata(params: {
    tokenId:     bigint;
    metadataURI: string;
  }): Promise<TxResult>

  async getTokenByAgreement(agreementId: string): Promise<{
    tenantTokenId: bigint | null;
    ownerTokenId:  bigint | null;
  }>

  async getMetadataURI(tokenId: bigint): Promise<string>
}
```

### Metadata JSON structure (IPFS)
```json
{
  "name": "TrustNest Agreement #42",
  "description": "Rental agreement for 12 MG Road, Bengaluru",
  "properties": {
    "agreementId": "uuid",
    "tenantId":    "uuid",
    "ownerId":     "uuid",
    "propertyAddress": "12 MG Road, Bengaluru 560001",
    "monthlyRentINR":  25000,
    "depositINR":      75000,
    "startDate":       "2026-06-01",
    "endDate":         "2027-05-31",
    "pdfHash":         "Qm..."
  }
}
```

---

## ReputationModule

Wraps `ReputationSBT` contract.

```typescript
// packages/sdk/src/modules/ReputationModule.ts

export class ReputationModule {
  async mintReputation(params: {
    agreementId:   string;
    tenantAddress: string;
    tenantScore:   number;   // 1–5
    ownerAddress:  string;
    ownerScore:    number;   // 1–5
  }): Promise<{
    tenantTokenId: bigint;
    ownerTokenId:  bigint;
    txHash:        string;
  }>

  async getScore(walletAddress: string): Promise<{
    average: number;   // floating point, computed from on-chain average * 10 / 10
    count:   number;
  }>

  async getTokensByOwner(walletAddress: string): Promise<ReputationTokenData[]>
}

export interface ReputationTokenData {
  tokenId:     bigint;
  agreementId: string;
  role:        UserRole;
  score:       number;
  mintedAt:    Date;
}
```

---

## Error Handling

The SDK throws typed errors so the backend can distinguish retryable vs fatal failures:

```typescript
// packages/sdk/src/errors.ts

export class ContractRevertError extends Error {
  constructor(
    public readonly method: string,
    public readonly reason: string,
    public readonly txHash?: string,
  ) { super(`Contract reverted in ${method}: ${reason}`); }
}

export class InsufficientGasError extends Error {}
export class RpcConnectionError extends Error {}
```

The backend's `BlockchainService` catches `RpcConnectionError` and `InsufficientGasError` and re-queues the `BlockchainJob`. `ContractRevertError` is treated as fatal and transitions the job to `FAILED`.

---

## Usage in BlockchainService

```typescript
// packages/backend/src/blockchain/blockchain.service.ts (sketch)

@Injectable()
export class BlockchainService {
  private sdk: TrustNestSDK;

  constructor(private config: ConfigService) {
    this.sdk = new TrustNestSDK({
      rpcUrl:      config.get('POLYGON_RPC_URL'),
      operatorKey: decrypt(config.get('OPERATOR_KEY_ENCRYPTED'), config.get('OPERATOR_KEY_IV')),
      contracts:   CONTRACT_ADDRESSES[config.get('NETWORK')],
    });
  }

  async depositEscrow(agreementId: string, usdcAmount: bigint) {
    return this.sdk.escrow.deposit({ agreementId, /* ... */ usdcAmount });
  }
}
```

All other NestJS services call `BlockchainService` — they never import from `@trustnest/sdk` directly.
