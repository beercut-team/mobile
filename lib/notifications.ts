import { apiFetch } from './api';
import type { ApiResponse } from './auth';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  patient_id?: number;
  created_at: string;
}

export async function getNotifications(
  page = 1,
  limit = 20,
): Promise<ApiResponse<Notification[]>> {
  return apiFetch<ApiResponse<Notification[]>>(
    `/api/v1/notifications?page=${page}&limit=${limit}`,
  );
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch<{ success: boolean; data: { count: number } }>(
    '/api/v1/notifications/unread-count',
  );
  return res.data.count;
}

export async function markAsRead(id: number): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllAsRead(): Promise<void> {
  await apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
}
