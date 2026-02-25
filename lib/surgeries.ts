import { apiFetch } from './api';
import type { ApiResponse } from './auth';

export type SurgeryStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Surgery {
  id: number;
  patient_id: number;
  surgeon_id: number;
  scheduled_date: string;
  operation_type: string;
  eye: string;
  status: SurgeryStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getSurgeries(
  page = 1,
  limit = 20,
): Promise<ApiResponse<Surgery[]>> {
  return apiFetch<ApiResponse<Surgery[]>>(
    `/api/v1/surgeries?page=${page}&limit=${limit}`,
  );
}

export async function getSurgery(id: number): Promise<ApiResponse<Surgery>> {
  return apiFetch<ApiResponse<Surgery>>(`/api/v1/surgeries/${id}`);
}

export const SURGERY_STATUS_LABELS: Record<SurgeryStatus, string> = {
  SCHEDULED: 'Запланирована',
  COMPLETED: 'Проведена',
  CANCELLED: 'Отменена',
};

export const SURGERY_STATUS_COLORS: Record<SurgeryStatus, string> = {
  SCHEDULED: '#3B82F6',
  COMPLETED: '#22C55E',
  CANCELLED: '#EF4444',
};
