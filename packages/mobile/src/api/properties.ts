import { apiClient } from './client';
import type {
  Property,
  PropertyListResponse,
  CreatePropertyRequest,
  PropertyInterest,
  CreateInterestRequest,
  AcceptInterestResponse,
  PropertySearchParams,
} from '../types/api';

export const propertiesApi = {
  search: (params: PropertySearchParams = {}): Promise<PropertyListResponse> => {
    const qs = new URLSearchParams();
    (Object.entries(params) as [string, unknown][]).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v));
    });
    const query = qs.toString();
    return apiClient.get<PropertyListResponse>(`/properties${query ? `?${query}` : ''}`);
  },

  get: (id: string): Promise<Property> =>
    apiClient.get<Property>(`/properties/${id}`),

  create: (data: CreatePropertyRequest): Promise<Property> =>
    apiClient.post<Property>('/properties', data),

  update: (id: string, data: Partial<CreatePropertyRequest>): Promise<Property> =>
    apiClient.patch<Property>(`/properties/${id}`, data),

  updateStatus: (id: string, status: string): Promise<Property> =>
    apiClient.patch<Property>(`/properties/${id}/status`, { status }),

  delete: (id: string): Promise<void> =>
    apiClient.delete<void>(`/properties/${id}`),

  addPhoto: (id: string, url: string, s3Key: string): Promise<void> =>
    apiClient.post<void>(`/properties/${id}/photos`, { url, s3Key }),

  setPrimaryPhoto: (id: string, photoId: string): Promise<void> =>
    apiClient.patch<void>(`/properties/${id}/photos/${photoId}/primary`),

  deletePhoto: (id: string, photoId: string): Promise<void> =>
    apiClient.delete<void>(`/properties/${id}/photos/${photoId}`),

  // ── Interests ──────────────────────────────────────────────────────────────

  expressInterest: (id: string, data: CreateInterestRequest): Promise<PropertyInterest> =>
    apiClient.post<PropertyInterest>(`/properties/${id}/interest`, data),

  getInterests: (id: string): Promise<PropertyInterest[]> =>
    apiClient.get<PropertyInterest[]>(`/properties/${id}/interests`),

  acceptInterest: (propertyId: string, interestId: string): Promise<AcceptInterestResponse> =>
    apiClient.patch<AcceptInterestResponse>(
      `/properties/${propertyId}/interests/${interestId}/accept`,
    ),

  declineInterest: (propertyId: string, interestId: string): Promise<void> =>
    apiClient.patch<void>(
      `/properties/${propertyId}/interests/${interestId}/decline`,
    ),

  withdrawInterest: (propertyId: string, interestId: string): Promise<void> =>
    apiClient.delete<void>(`/properties/${propertyId}/interests/${interestId}`),

  getMyInterests: (): Promise<PropertyInterest[]> =>
    apiClient.get<PropertyInterest[]>('/users/me/interests'),
};
