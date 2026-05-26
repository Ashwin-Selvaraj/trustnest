export enum UserRole {
  TENANT = 'TENANT',
  OWNER  = 'OWNER',
  BOTH   = 'BOTH',
}

export enum KycStatus {
  PENDING  = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum KycMethod {
  AADHAAR = 'AADHAAR',
  PAN     = 'PAN',
}

export enum PaymentDetailsStatus {
  NONE                 = 'NONE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED             = 'VERIFIED',
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

// ─── Property Marketplace ─────────────────────────────────────────────────────

export enum BhkType {
  STUDIO            = 'STUDIO',
  ONE_BHK           = 'ONE_BHK',
  TWO_BHK           = 'TWO_BHK',
  THREE_BHK         = 'THREE_BHK',
  FOUR_BHK_PLUS     = 'FOUR_BHK_PLUS',
  VILLA             = 'VILLA',
  INDEPENDENT_HOUSE = 'INDEPENDENT_HOUSE',
}

export enum FurnishingStatus {
  UNFURNISHED    = 'UNFURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  FULLY_FURNISHED = 'FULLY_FURNISHED',
}

export enum PropertyStatus {
  DRAFT  = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  RENTED = 'RENTED',
}

export enum InterestStatus {
  PENDING   = 'PENDING',
  ACCEPTED  = 'ACCEPTED',
  DECLINED  = 'DECLINED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum TenantPreference {
  FAMILY               = 'FAMILY',
  BACHELORS            = 'BACHELORS',
  WORKING_PROFESSIONAL = 'WORKING_PROFESSIONAL',
  STUDENTS             = 'STUDENTS',
  ANY                  = 'ANY',
}
