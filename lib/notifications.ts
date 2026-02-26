import { apiFetch } from './api';
import type { ApiResponse } from './auth';

// Backend notification types (UPPER_SNAKE_CASE)
// Only 5 types are supported by the backend API
export type NotificationType =
  | 'STATUS_CHANGE'
  | 'NEW_COMMENT'
  | 'SURGERY_SCHEDULED'
  | 'CHECKLIST_EXPIRY'
  | 'SURGERY_REMINDER';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  entity_id?: number;
  entity_type?: string;
  created_at: string;
}

// Helper to get icon name for notification type
export function getNotificationIcon(type: NotificationType): string {
  const iconMap: Record<NotificationType, string> = {
    STATUS_CHANGE: 'arrow.triangle.2.circlepath',
    NEW_COMMENT: 'bubble.left.and.bubble.right',
    SURGERY_SCHEDULED: 'calendar.badge.clock',
    CHECKLIST_EXPIRY: 'exclamationmark.triangle',
    SURGERY_REMINDER: 'bell.badge',
  };
  return iconMap[type] || 'bell.fill';
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
