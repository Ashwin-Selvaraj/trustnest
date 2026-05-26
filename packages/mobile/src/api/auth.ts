import { apiClient } from './client';
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  AuthTokens,
  CompleteProfileRequest,
} from '../types/api';

export const authApi = {
  sendOtp: (data: SendOtpRequest): Promise<SendOtpResponse> =>
    apiClient.post<SendOtpResponse>('/auth/send-otp', data),

  verifyOtp: (data: VerifyOtpRequest): Promise<AuthTokens> =>
    apiClient.post<AuthTokens>('/auth/verify-otp', data),

  refresh: (refreshToken: string): Promise<AuthTokens> =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  completeProfile: (data: CompleteProfileRequest): Promise<{ success: boolean }> =>
    apiClient.post<{ success: boolean }>('/auth/complete-profile', data),
};
