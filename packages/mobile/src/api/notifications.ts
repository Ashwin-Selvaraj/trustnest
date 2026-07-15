import { apiClient } from './client';
import type { NotificationListResponse } from '../types/api';

export const notificationsApi = {
  list: (page = 1, limit = 30): Promise<NotificationListResponse> =>
    apiClient.get<NotificationListResponse>(`/notifications?page=${page}&limit=${limit}`),

  markRead: (id: string): Promise<{ ok: boolean }> =>
    apiClient.patch<{ ok: boolean }>(`/notifications/${id}/read`),

  markAllRead: (): Promise<{ ok: boolean }> =>
    apiClient.patch<{ ok: boolean }>('/notifications/read-all'),
};
