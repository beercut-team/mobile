import { apiFetch, API_BASE_URL } from './api';
import type { ApiResponse } from './auth';
import { getTokens } from './token-storage';

export interface Media {
  id: number;
  patient_id: number;
  uploaded_by: number;
  file_name: string;
  original_name: string;
  content_type: string;
  size: number;
  storage_path: string;
  thumbnail_path?: string;
  category: string;
  created_at: string;
}

export interface UploadMediaRequest {
  file: File | Blob;
  patient_id: number;
  category?: string;
  metadata?: Record<string, any>;
}

export async function uploadMedia(data: UploadMediaRequest): Promise<ApiResponse<Media>> {
  const tokens = await getTokens();
  const formData = new FormData();

  formData.append('file', data.file);
  formData.append('patient_id', String(data.patient_id));
  if (data.category) {
    formData.append('category', data.category);
  }
  if (data.metadata) {
    formData.append('metadata', JSON.stringify(data.metadata));
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens?.accessToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? body.detail ?? message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export async function getPatientMedia(patientId: number): Promise<ApiResponse<Media[]>> {
  return apiFetch<ApiResponse<Media[]>>(`/api/v1/media/patient/${patientId}`);
}

export async function getMediaDownloadUrl(id: number): Promise<string> {
  const res = await apiFetch<ApiResponse<{ url: string }>>(`/api/v1/media/${id}/download`);
  return res.data.url;
}

export async function getMediaThumbnailUrl(id: number): Promise<string> {
  const res = await apiFetch<ApiResponse<{ url: string }>>(`/api/v1/media/${id}/thumbnail`);
  return res.data.url;
}

export async function deleteMedia(id: number): Promise<void> {
  await apiFetch(`/api/v1/media/${id}`, {
    method: 'DELETE',
  });
}
