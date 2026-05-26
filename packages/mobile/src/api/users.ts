import { apiClient } from './client';
import type {
  UserProfile,
  UpdateProfileRequest,
  ReputationScore,
  KycAadhaarInitRequest,
  KycAadhaarInitResponse,
  KycAadhaarVerifyRequest,
  KycPanRequest,
  KycPanResponse,
  PaymentDetailsRequest,
  PaymentDetailsResponse,
} from '../types/api';

export const usersApi = {
  getMe: (): Promise<UserProfile> => apiClient.get<UserProfile>('/users/me'),

  updateMe: (data: UpdateProfileRequest): Promise<UserProfile> =>
    apiClient.patch<UserProfile>('/users/me', data),

  getReputation: (userId: string): Promise<ReputationScore> =>
    apiClient.get<ReputationScore>(`/users/${userId}/reputation`),

  // ─── KYC: Aadhaar ─────────────────────────────────────────────────────────

  initiateAadhaarKyc: (data: KycAadhaarInitRequest): Promise<KycAadhaarInitResponse> =>
    apiClient.post<KycAadhaarInitResponse>('/users/me/kyc/aadhaar/init', data),

  verifyAadhaarKyc: (data: KycAadhaarVerifyRequest): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>('/users/me/kyc/aadhaar/verify', data),

  // ─── KYC: PAN ─────────────────────────────────────────────────────────────

  initiatePanKyc: (data: KycPanRequest): Promise<KycPanResponse> =>
    apiClient.post<KycPanResponse>('/users/me/kyc/pan', data),

  // ─── KYC: Selfie ──────────────────────────────────────────────────────────

  verifySelfie: (): Promise<{ success: boolean; kycStatus: string }> =>
    apiClient.post<{ success: boolean; kycStatus: string }>('/users/me/kyc/selfie'),

  // ─── Payment Details ───────────────────────────────────────────────────────

  savePaymentDetails: (data: PaymentDetailsRequest): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>('/users/me/payment-details', data),

  getPaymentDetails: (): Promise<PaymentDetailsResponse> =>
    apiClient.get<PaymentDetailsResponse>('/users/me/payment-details'),

  deletePaymentDetails: (): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>('/users/me/payment-details'),
};
