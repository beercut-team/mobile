import { apiFetch } from './api';
import type { ApiResponse, UserResponse } from './auth';

export interface Comment {
  id: number;
  patient_id: number;
  author_id: number;
  author?: UserResponse; // Backend returns full author object
  parent_id?: number | null;
  body: string;
  is_urgent: boolean;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentRequest {
  patient_id: number;
  parent_id?: number | null;
  body: string;
  is_urgent?: boolean;
}

export async function getPatientComments(patientId: number): Promise<ApiResponse<Comment[]>> {
  return apiFetch<ApiResponse<Comment[]>>(`/api/v1/comments/patient/${patientId}`);
}

export async function createComment(data: CreateCommentRequest): Promise<void> {
  await apiFetch('/api/v1/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function markCommentsAsRead(patientId: number): Promise<void> {
  await apiFetch(`/api/v1/comments/patient/${patientId}/read`, {
    method: 'POST',
  });
}
