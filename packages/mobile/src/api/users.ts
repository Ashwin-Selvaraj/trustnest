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

  /**
   * Upload the selfie and run the liveness check.
   *
   * @param imageUri  Local file URI from expo-image-picker (e.g. file:///…).
   *                  When undefined the request is still sent but without an image
   *                  (stub provider will still pass, real providers will reject).
   */
  verifySelfie: (imageUri?: string): Promise<{ success: boolean; kycStatus: string; selfieUrl: string | null }> => {
    if (!imageUri) {
      // No image captured — send an empty JSON body so the endpoint still works
      // (stub provider auto-passes; this shouldn't happen in a real flow).
      return apiClient.post<{ success: boolean; kycStatus: string; selfieUrl: string | null }>(
        '/users/me/kyc/selfie',
        {},
      );
    }

    const formData = new FormData();
    // React Native's FormData accepts { uri, name, type } as a file entry.
    const mimeType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const fileName = imageUri.endsWith('.png') ? 'selfie.png' : 'selfie.jpg';
    formData.append('selfie', { uri: imageUri, name: fileName, type: mimeType } as unknown as Blob);

    return apiClient.postFormData<{ success: boolean; kycStatus: string; selfieUrl: string | null }>(
      '/users/me/kyc/selfie',
      formData,
    );
  },

  // ─── Payment Details ───────────────────────────────────────────────────────

  savePaymentDetails: (data: PaymentDetailsRequest): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>('/users/me/payment-details', data),

  getPaymentDetails: (): Promise<PaymentDetailsResponse> =>
    apiClient.get<PaymentDetailsResponse>('/users/me/payment-details'),

  deletePaymentDetails: (): Promise<{ success: boolean }> =>
    apiClient.delete<{ success: boolean }>('/users/me/payment-details'),
};
