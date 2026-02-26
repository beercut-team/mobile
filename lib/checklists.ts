import { apiFetch } from './api';
import type { ApiResponse } from './auth';

export type ChecklistStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

export interface ChecklistItem {
  id: number;
  patient_id: number;
  template_id: number;
  name: string;
  description: string;
  category: string;
  is_required: boolean;
  status: ChecklistStatus;
  result?: string;
  notes?: string;
  completed_at?: string | null;
  completed_by?: number | null;
  reviewed_by?: number | null;
  review_note?: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
  required: number;
  required_completed: number;
  percentage: number;
}

export interface UpdateChecklistItemRequest {
  status?: string;
  result?: string;
  notes?: string;
}

export interface ReviewChecklistItemRequest {
  status: 'COMPLETED' | 'REJECTED';
  review_note?: string;
}

export interface CreateChecklistItemRequest {
  patient_id: number;
  template_id: number;
  name: string;
  description: string;
  category: string;
  is_required: boolean;
  expires_at?: string;
}

export async function getPatientChecklist(patientId: number): Promise<ApiResponse<ChecklistItem[]>> {
  return apiFetch<ApiResponse<ChecklistItem[]>>(`/api/v1/checklists/patient/${patientId}`);
}

export async function getChecklistProgress(patientId: number): Promise<ApiResponse<ChecklistProgress>> {
  return apiFetch<ApiResponse<ChecklistProgress>>(`/api/v1/checklists/patient/${patientId}/progress`);
}

export async function updateChecklistItem(
  id: number,
  data: UpdateChecklistItemRequest,
): Promise<void> {
  await apiFetch(`/api/v1/checklists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function reviewChecklistItem(
  id: number,
  data: ReviewChecklistItemRequest,
): Promise<void> {
  await apiFetch(`/api/v1/checklists/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createChecklistItem(
  data: CreateChecklistItemRequest,
): Promise<ApiResponse<ChecklistItem>> {
  return apiFetch<ApiResponse<ChecklistItem>>('/api/v1/checklists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Выполнено',
  REJECTED: 'Отклонено',
  EXPIRED: 'Просрочено',
};

export const CHECKLIST_STATUS_COLORS: Record<ChecklistStatus, string> = {
  PENDING: '#94A3B8',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#10B981',
  REJECTED: '#EF4444',
  EXPIRED: '#6B7280',
};
