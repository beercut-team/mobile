import { apiFetch } from './api';
import type { ApiResponse, MessageResponse } from './auth';

export type SurgeryStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Surgery {
  id: number;
  patient_id: number;
  surgeon_id: number;
  scheduled_date: string;
  status: SurgeryStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSurgeryRequest {
  patient_id: number;
  surgeon_id: number;
  scheduled_date: string;
  notes?: string;
}

export interface UpdateSurgeryRequest {
  scheduled_date?: string;
  status?: SurgeryStatus;
  notes?: string;
}

export interface SurgeryListParams {
  page?: number;
  limit?: number;
}

/**
 * Получить список операций с пагинацией
 */
export async function getSurgeries(params?: SurgeryListParams): Promise<ApiResponse<Surgery[]>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch<ApiResponse<Surgery[]>>(`/api/v1/surgeries${qs ? `?${qs}` : ''}`);
}

/**
 * Получить операцию по ID
 */
export async function getSurgery(id: number): Promise<ApiResponse<Surgery>> {
  return apiFetch<ApiResponse<Surgery>>(`/api/v1/surgeries/${id}`);
}

/**
 * Создать новую операцию (только SURGEON/ADMIN)
 */
export async function createSurgery(data: CreateSurgeryRequest): Promise<ApiResponse<Surgery>> {
  return apiFetch<ApiResponse<Surgery>>('/api/v1/surgeries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Обновить операцию (только SURGEON/ADMIN)
 */
export async function updateSurgery(
  id: number,
  data: UpdateSurgeryRequest,
): Promise<ApiResponse<Surgery>> {
  return apiFetch<ApiResponse<Surgery>>(`/api/v1/surgeries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Удалить операцию (только SURGEON/ADMIN)
 * Автоматически возвращает пациента в статус APPROVED
 */
export async function deleteSurgery(id: number): Promise<ApiResponse<MessageResponse>> {
  return apiFetch<ApiResponse<MessageResponse>>(`/api/v1/surgeries/${id}`, {
    method: 'DELETE',
  });
}

export const SURGERY_STATUS_LABELS: Record<SurgeryStatus, string> = {
  SCHEDULED: 'Запланирована',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

export const SURGERY_STATUS_COLORS: Record<SurgeryStatus, string> = {
  SCHEDULED: '#06B6D4',
  COMPLETED: '#22C55E',
  CANCELLED: '#EF4444',
};
