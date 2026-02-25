import { apiFetch, API_BASE_URL } from './api';

export type UserRole = 'DISTRICT_DOCTOR' | 'SURGEON' | 'PATIENT' | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  role: UserRole;
  district_id?: number | null;
  specialization?: string;
  license_number?: string;
  is_active?: boolean;
}

export interface MessageResponse {
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
}

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

export async function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/v1/auth/me');
}

export async function logoutUser(): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/v1/auth/logout', { method: 'POST' });
}
