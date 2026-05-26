import { AgreementStatus, KycStatus, KycMethod, PaymentDetailsStatus, UserRole } from '@trustnest/shared';

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

export interface CompleteProfileRequest {
  name: string;
  role: UserRole;
  dob: string; // YYYY-MM-DD
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  role: UserRole;
  kycStatus: KycStatus;
  kycMethod: KycMethod | null;
  maskedAadhaar: string | null;
  maskedPan: string | null;
  kycRejectionReason: string | null;
  profileComplete: boolean;
  paymentDetailsStatus: PaymentDetailsStatus;
  walletAddress: string | null;
  dob: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  role?: UserRole;
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export interface KycAadhaarInitRequest {
  aadhaarNumber: string;
}

export interface KycAadhaarInitResponse {
  sessionId: string;
}

export interface KycAadhaarVerifyRequest {
  sessionId: string;
  otp: string;
}

export interface KycPanRequest {
  panNumber: string;
}

export interface KycPanResponse {
  jobId: string;
}

// ─── Payment Details ─────────────────────────────────────────────────────────

export interface PaymentDetailsRequest {
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
}

export interface PaymentDetailsResponse {
  hasDetails: boolean;
  upiId: string | null;
  maskedBankAccount: string | null;
  bankIfsc: string | null;
  status: PaymentDetailsStatus;
  verifiedAt: string | null;
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

export type GateErrorCode = 'KYC_REQUIRED' | 'PAYMENT_DETAILS_REQUIRED' | 'PROFILE_INCOMPLETE';

export interface GateError {
  code: GateErrorCode;
  kycStatus?: string;
  message: string;
}
