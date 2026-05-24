export enum UserRole {
  TENANT = 'TENANT',
  OWNER  = 'OWNER',
}

export enum KycStatus {
  PENDING  = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum AgreementStatus {
  DRAFT           = 'DRAFT',
  PENDING_DEPOSIT = 'PENDING_DEPOSIT',
  ACTIVE          = 'ACTIVE',
  RELEASING       = 'RELEASING',
  DISPUTED        = 'DISPUTED',
  CLOSED          = 'CLOSED',
}

export enum PaymentType {
  DEPOSIT   = 'DEPOSIT',
  RELEASE   = 'RELEASE',
  REFUND    = 'REFUND',
  DEDUCTION = 'DEDUCTION',
}

export enum PaymentStatus {
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED    = 'FAILED',
}

export enum JobType {
  REGISTER_USER       = 'REGISTER_USER',
  MINT_AGREEMENT_NFT  = 'MINT_AGREEMENT_NFT',
  DEPOSIT_ESCROW      = 'DEPOSIT_ESCROW',
  RELEASE_ESCROW      = 'RELEASE_ESCROW',
  RESOLVE_DISPUTE     = 'RESOLVE_DISPUTE',
  MINT_REPUTATION_SBT = 'MINT_REPUTATION_SBT',
}

export enum JobStatus {
  PENDING    = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE       = 'DONE',
  FAILED     = 'FAILED',
}

// Mirrors the on-chain EscrowStatus enum in EscrowVault.sol
export enum EscrowStatus {
  PENDING  = 'PENDING',
  ACTIVE   = 'ACTIVE',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}
