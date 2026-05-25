import { apiClient } from './client';
import type { UserProfile, UpdateProfileRequest, ReputationScore } from '../types/api';

export const usersApi = {
  getMe: (): Promise<UserProfile> => apiClient.get<UserProfile>('/users/me'),

  updateMe: (data: UpdateProfileRequest): Promise<UserProfile> =>
    apiClient.patch<UserProfile>('/users/me', data),

  getReputation: (userId: string): Promise<ReputationScore> =>
    apiClient.get<ReputationScore>(`/users/${userId}/reputation`),
};
