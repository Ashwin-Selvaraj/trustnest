import { apiClient } from './client';
import type {
  Agreement,
  AgreementsListResponse,
  CreateAgreementRequest,
  RateAgreementRequest,
  DisputeRequest,
} from '../types/api';

export const agreementsApi = {
  list: (page = 1, limit = 20): Promise<AgreementsListResponse> =>
    apiClient.get<AgreementsListResponse>(`/agreements?page=${page}&limit=${limit}`),

  get: (id: string): Promise<Agreement> =>
    apiClient.get<Agreement>(`/agreements/${id}`),

  create: (data: CreateAgreementRequest): Promise<Agreement> =>
    apiClient.post<Agreement>('/agreements', data),

  confirm: (id: string): Promise<Agreement> =>
    apiClient.post<Agreement>(`/agreements/${id}/confirm`),

  rate: (id: string, data: RateAgreementRequest): Promise<void> =>
    apiClient.post<void>(`/agreements/${id}/rate`, data),

  raiseDispute: (id: string, data: DisputeRequest): Promise<Agreement> =>
    apiClient.post<Agreement>(`/agreements/${id}/dispute`, data),

  release: (id: string): Promise<void> =>
    apiClient.post<void>(`/agreements/${id}/release`),
};
