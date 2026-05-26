import { AgreementStatus, KycStatus, UserRole } from '@trustnest/shared';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  sessionId: string;
}

export interface VerifyOtpRequest {
  sessionId: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  role: UserRole;
  kycStatus: KycStatus;
  walletAddress: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
}

// ─── Reputation ──────────────────────────────────────────────────────────────

export interface ReputationScore {
  averageScore: number;
  totalReviews: number;
  tokens: ReputationTokenItem[];
}

export interface ReputationTokenItem {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

// ─── Agreements ──────────────────────────────────────────────────────────────

export interface Agreement {
  id: string;
  propertyAddress: string;
  status: AgreementStatus;
  rentINR: number;
  depositINR: number;
  startDate: string;
  endDate: string;
  tenantId: string;
  tenantName: string;
  ownerId: string;
  ownerName: string;
  tenantConfirmedAt: string | null;
  ownerConfirmedAt: string | null;
  nftTokenIdTenant: string | null;
  nftTokenIdOwner: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementsListResponse {
  data: Agreement[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAgreementRequest {
  propertyAddress: string;
  rentINR: number;
  depositINR: number;
  startDate: string;
  endDate: string;
  counterpartyPhone: string;
}

export interface RateAgreementRequest {
  score: number;
  comment?: string;
}

export interface DisputeRequest {
  reason: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface InitiatePaymentRequest {
  agreementId: string;
}

export interface InitiatePaymentResponse {
  orderId: string;
  upiDeepLink: string;
  amountINR: number;
}

export interface PaymentHistoryItem {
  id: string;
  type: string;
  status: string;
  amountINR: number;
  createdAt: string;
}

// ─── API error ───────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
}
