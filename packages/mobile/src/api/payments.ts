import { apiClient } from './client';
import type {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentHistoryItem,
} from '../types/api';

export const paymentsApi = {
  initiate: (data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> =>
    apiClient.post<InitiatePaymentResponse>('/payments/initiate', data),

  getHistory: (agreementId: string): Promise<PaymentHistoryItem[]> =>
    apiClient.get<PaymentHistoryItem[]>(`/payments/${agreementId}`),
};
