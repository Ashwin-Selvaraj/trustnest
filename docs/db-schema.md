# Database Schema — TypeORM Entities

Database: PostgreSQL.
ORM: TypeORM with `strict` mode and `decimal` column type for all INR amounts.
All UUIDs generated with `uuid_generate_v4()`.

---

## User

```typescript
// packages/backend/src/users/user.entity.ts

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 15 })
  phone: string;

  @Column({ nullable: true, length: 100 })
  name: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT })
  role: UserRole;  // TENANT | OWNER

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  kycStatus: KycStatus;  // PENDING | VERIFIED | REJECTED

  @Column({ nullable: true, length: 50 })
  kycJobId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Wallet, (w) => w.user, { cascade: true })
  wallet: Wallet;

  @OneToMany(() => Agreement, (a) => a.tenant)
  tenantAgreements: Agreement[];

  @OneToMany(() => Agreement, (a) => a.owner)
  ownerAgreements: Agreement[];
}
```

---

## Wallet

Stores the custodial wallet per user. Private key is AES-256-GCM encrypted — **never** select the `encryptedKey` column in any query that returns data to the client.

```typescript
// packages/backend/src/blockchain/wallet.entity.ts

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ unique: true, length: 42 })
  address: string;  // 0x...

  @Column({ select: false })  // NEVER returned in default queries
  encryptedKey: string;  // AES-256-GCM ciphertext, base64

  @Column({ select: false })
  keyIv: string;  // base64 IV

  @Column({ default: false })
  registeredOnChain: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## Agreement

```typescript
// packages/backend/src/agreements/agreement.entity.ts

@Entity('agreements')
export class Agreement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.tenantAgreements)
  tenant: User;

  @Column()
  tenantId: string;

  @ManyToOne(() => User, (u) => u.ownerAgreements)
  owner: User;

  @Column()
  ownerId: string;

  @Column({ type: 'enum', enum: AgreementStatus, default: AgreementStatus.DRAFT })
  status: AgreementStatus;
  // DRAFT | PENDING_DEPOSIT | ACTIVE | RELEASING | DISPUTED | CLOSED

  @Column({ length: 300 })
  propertyAddress: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthlyRentINR: string;  // TypeORM returns decimal columns as string

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  depositINR: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ nullable: true, length: 100 })
  pdfIpfsHash: string | null;

  // On-chain references
  @Column({ nullable: true, length: 66 })
  onChainAgreementId: string | null;  // bytes32 hex

  @Column({ nullable: true, type: 'int' })
  nftTokenIdTenant: number | null;

  @Column({ nullable: true, type: 'int' })
  nftTokenIdOwner: number | null;

  // Confirmation tracking
  @Column({ default: false })
  tenantConfirmed: boolean;

  @Column({ default: false })
  ownerConfirmed: boolean;

  // Dispute
  @Column({ nullable: true, text: true })
  disputeReason: string | null;

  @Column({ nullable: true, length: 100 })
  disputeEvidenceIpfsHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => PaymentEvent, (p) => p.agreement)
  payments: PaymentEvent[];

  @OneToMany(() => BlockchainJob, (j) => j.agreement)
  jobs: BlockchainJob[];
}
```

---

## PaymentEvent

Written **before** the on-chain tx (event-first rule). `txHash` and `status` are updated after confirmation.

```typescript
// packages/backend/src/payments/payment-event.entity.ts

@Entity('payment_events')
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Agreement, (a) => a.payments)
  agreement: Agreement;

  @Column()
  agreementId: string;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;  // DEPOSIT | RELEASE | REFUND | DEDUCTION

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amountINR: string;

  @Column({ type: 'bigint', nullable: true })
  usdcWei: string | null;  // stored as string; bigint in contract calls

  @Column({ nullable: true, length: 18 })
  forexRate: string | null;  // INR per USDC at time of conversion, decimal string

  // Gateway fields
  @Column({ nullable: true, length: 100 })
  gatewayOrderId: string | null;

  @Column({ nullable: true, length: 100 })
  gatewayPaymentId: string | null;

  // On-chain fields
  @Column({ nullable: true, length: 66 })
  txHash: string | null;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;  // PENDING | CONFIRMED | FAILED

  @Column({ nullable: true, type: 'int' })
  retryCount: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## BlockchainJob

Retry queue for failed or pending on-chain transactions. The NestJS cron job polls this table every 30 seconds.

```typescript
// packages/backend/src/blockchain/blockchain-job.entity.ts

@Entity('blockchain_jobs')
export class BlockchainJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Agreement, (a) => a.jobs, { nullable: true })
  agreement: Agreement | null;

  @Column({ nullable: true })
  agreementId: string | null;

  @Column({ type: 'enum', enum: JobType })
  type: JobType;
  // REGISTER_USER | MINT_AGREEMENT_NFT | DEPOSIT_ESCROW
  // RELEASE_ESCROW | RESOLVE_DISPUTE | MINT_REPUTATION_SBT

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;  // args to pass to SDK method

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;  // PENDING | PROCESSING | DONE | FAILED

  @Column({ default: 0 })
  attempts: number;

  @Column({ nullable: true, length: 66 })
  txHash: string | null;

  @Column({ nullable: true, text: true })
  lastError: string | null;

  @Column({ nullable: true })
  processAfter: Date | null;  // for exponential backoff

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## ReputationToken

Mirrors the on-chain SBT for fast reads (avoids RPC calls on every profile load).

```typescript
// packages/backend/src/reputation/reputation-token.entity.ts

@Entity('reputation_tokens')
export class ReputationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Agreement)
  agreement: Agreement;

  @Column()
  agreementId: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;  // TENANT | OWNER (role the user played in this agreement)

  @Column({ type: 'smallint' })
  score: number;  // 1–5

  @Column({ nullable: true, text: true })
  review: string | null;

  @Column({ nullable: true, type: 'int' })
  sbtTokenId: number | null;  // on-chain token ID once minted

  @CreateDateColumn()
  mintedAt: Date;
}
```

---

## Indexes

```sql
-- Performance-critical queries
CREATE INDEX idx_agreements_tenant    ON agreements(tenant_id, status);
CREATE INDEX idx_agreements_owner     ON agreements(owner_id, status);
CREATE INDEX idx_payment_events_agr   ON payment_events(agreement_id, type, status);
CREATE INDEX idx_blockchain_jobs_poll ON blockchain_jobs(status, process_after)
    WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX idx_reputation_user      ON reputation_tokens(user_id);
```

---

## Enum Definitions

```typescript
// packages/shared/src/types/enums.ts

export enum UserRole        { TENANT = 'TENANT', OWNER = 'OWNER' }
export enum KycStatus       { PENDING = 'PENDING', VERIFIED = 'VERIFIED', REJECTED = 'REJECTED' }
export enum AgreementStatus {
  DRAFT = 'DRAFT',
  PENDING_DEPOSIT = 'PENDING_DEPOSIT',
  ACTIVE = 'ACTIVE',
  RELEASING = 'RELEASING',
  DISPUTED = 'DISPUTED',
  CLOSED = 'CLOSED',
}
export enum PaymentType   { DEPOSIT = 'DEPOSIT', RELEASE = 'RELEASE', REFUND = 'REFUND', DEDUCTION = 'DEDUCTION' }
export enum PaymentStatus { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', FAILED = 'FAILED' }
export enum JobType {
  REGISTER_USER       = 'REGISTER_USER',
  MINT_AGREEMENT_NFT  = 'MINT_AGREEMENT_NFT',
  DEPOSIT_ESCROW      = 'DEPOSIT_ESCROW',
  RELEASE_ESCROW      = 'RELEASE_ESCROW',
  RESOLVE_DISPUTE     = 'RESOLVE_DISPUTE',
  MINT_REPUTATION_SBT = 'MINT_REPUTATION_SBT',
}
export enum JobStatus { PENDING = 'PENDING', PROCESSING = 'PROCESSING', DONE = 'DONE', FAILED = 'FAILED' }
```
