import { apiClient } from './client';
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  AuthTokens,
} from '../types/api';

export const authApi = {
  sendOtp: (data: SendOtpRequest): Promise<SendOtpResponse> =>
    apiClient.post<SendOtpResponse>('/auth/send-otp', data),

  verifyOtp: (data: VerifyOtpRequest): Promise<AuthTokens> =>
    apiClient.post<AuthTokens>('/auth/verify-otp', data),

  refresh: (refreshToken: string): Promise<AuthTokens> =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),
};
