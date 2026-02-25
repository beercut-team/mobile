import { apiFetch } from './api';
import type { ApiResponse } from './auth';

export interface District {
  id: number;
  name: string;
  region: string;
  code: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export async function getDistricts(
  search?: string,
  page = 1,
  limit = 50,
): Promise<ApiResponse<District[]>> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  query.set('page', String(page));
  query.set('limit', String(limit));
  return apiFetch<ApiResponse<District[]>>(`/api/v1/districts?${query}`);
}

export async function getDistrict(id: number): Promise<ApiResponse<District>> {
  return apiFetch<ApiResponse<District>>(`/api/v1/districts/${id}`);
}
