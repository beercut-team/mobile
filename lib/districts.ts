import { apiFetch } from './api';
import type { ApiResponse, MessageResponse } from './auth';

export interface District {
  id: number;
  name: string;
  code?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDistrictRequest {
  name: string;
  code?: string;
  timezone?: string;
}

export interface UpdateDistrictRequest {
  name?: string;
  code?: string;
  timezone?: string;
}

export interface DistrictListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getDistricts(
  params?: DistrictListParams
): Promise<ApiResponse<District[]>> {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }

  const query = queryParams.toString();
  const url = `/api/v1/districts${query ? `?${query}` : ''}`;

  return apiFetch<ApiResponse<District[]>>(url);
}

export async function createDistrict(
  data: CreateDistrictRequest
): Promise<ApiResponse<District>> {
  return apiFetch<ApiResponse<District>>('/api/v1/districts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDistrict(id: number): Promise<ApiResponse<District>> {
  return apiFetch<ApiResponse<District>>(`/api/v1/districts/${id}`);
}

export async function updateDistrict(
  id: number,
  data: UpdateDistrictRequest
): Promise<ApiResponse<District>> {
  return apiFetch<ApiResponse<District>>(`/api/v1/districts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDistrict(id: number): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/v1/districts/${id}`, {
    method: 'DELETE',
  });
}
