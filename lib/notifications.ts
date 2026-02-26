import { apiFetch } from './api';
import type { ApiResponse } from './auth';

export type NotificationType =
  | 'status_change'
  | 'doctor_assigned'
  | 'surgeon_assigned'
  | 'surgery_scheduled'
  | 'diagnosis_set'
  | 'operation_type_set'
  | 'comment'
  | 'checklist_update'
  | 'iol_calculation'
  | 'media_uploaded';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
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
