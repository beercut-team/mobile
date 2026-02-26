import { apiFetch } from './api';
import type { ApiResponse } from './auth';
import type { MedicalStandardsMetadata } from './medical-standards';

export type PatientStatus =
  | 'NEW'
  | 'PREPARATION'
  | 'REVIEW_NEEDED'
  | 'APPROVED'
  | 'SURGERY_SCHEDULED'
  | 'COMPLETED'
  | 'REJECTED';

export type OperationType = 'PHACOEMULSIFICATION' | 'ANTIGLAUCOMA' | 'VITRECTOMY';
export type Eye = 'OD' | 'OS' | 'OU';

export interface Patient {
  id: number;
  access_code: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  snils?: string;
  passport_series?: string;
  passport_number?: string;
  policy_number?: string;
  oms_policy?: string; // Добавлено для интеграций
  gender?: 'male' | 'female'; // Добавлено для FHIR/интеграций
  diagnosis?: string; // Сохраняем как fallback
  operation_type: OperationType;
  eye: Eye;
  status: PatientStatus;
  doctor_id: number;
  surgeon_id?: number | null;
  doctor?: {
    id: number;
    name: string;
  } | null;
  surgeon?: {
    id: number;
    name: string;
  } | null;
  district?: {
    id: number;
    name: string;
  } | null;
  district_id: number;
  notes?: string;
  surgery_date?: string | null;
  created_at: string;
  updated_at: string;

  // НОВОЕ: метаданные медицинских стандартов
  medical_metadata?: MedicalStandardsMetadata;
}

export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  snils?: string;
  passport_series?: string;
  passport_number?: string;
  policy_number?: string;
  diagnosis?: string;
  operation_type: OperationType;
  eye: Eye;
  district_id: number;
  notes?: string;
}

export interface UpdatePatientRequest {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  diagnosis?: string;
  notes?: string;
  snils?: string;
  passport_series?: string;
  passport_number?: string;
  policy_number?: string;
}

export interface PatientListParams {
  search?: string;
  status?: PatientStatus;
  page?: number;
  limit?: number;
}

export async function getPatients(params?: PatientListParams): Promise<ApiResponse<Patient[]>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch<ApiResponse<Patient[]>>(`/api/v1/patients${qs ? `?${qs}` : ''}`);
}

export async function getPatient(id: number): Promise<ApiResponse<Patient>> {
  return apiFetch<ApiResponse<Patient>>(`/api/v1/patients/${id}`);
}

export async function createPatient(data: CreatePatientRequest): Promise<ApiResponse<Patient>> {
  return apiFetch<ApiResponse<Patient>>('/api/v1/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(id: number, data: UpdatePatientRequest): Promise<ApiResponse<Patient>> {
  return apiFetch<ApiResponse<Patient>>(`/api/v1/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePatientStatus(
  id: number,
  status: PatientStatus,
  comment?: string,
): Promise<ApiResponse<unknown>> {
  return apiFetch<ApiResponse<unknown>>(`/api/v1/patients/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, comment }),
  });
}

export async function getDashboard(): Promise<ApiResponse<Record<string, number>>> {
  return apiFetch<ApiResponse<Record<string, number>>>('/api/v1/patients/dashboard');
}

// ============================================================================
// Medical Standards API
// ============================================================================

/**
 * Обновить медицинские метаданные пациента
 * TODO: Требуется реализация на backend
 */
export async function updateMedicalMetadata(
  id: number,
  metadata: MedicalStandardsMetadata
): Promise<ApiResponse<Patient>> {
  return apiFetch<ApiResponse<Patient>>(`/api/v1/patients/${id}/medical-metadata`, {
    method: 'POST',
    body: JSON.stringify(metadata),
  });
}

/**
 * Получить FHIR Bundle для пациента
 * TODO: Требуется реализация на backend
 */
export async function getPatientFHIRBundle(id: number): Promise<ApiResponse<any>> {
  return apiFetch<ApiResponse<any>>(`/api/v1/patients/${id}/fhir-bundle`);
}

export const STATUS_LABELS: Record<PatientStatus, string> = {
  NEW: 'Новый',
  PREPARATION: 'Подготовка',
  REVIEW_NEEDED: 'На проверке',
  APPROVED: 'Одобрен',
  SURGERY_SCHEDULED: 'Операция назначена',
  COMPLETED: 'Завершён',
  REJECTED: 'Отклонён',
};

export const STATUS_COLORS: Record<PatientStatus, string> = {
  NEW: '#3B82F6',
  PREPARATION: '#F59E0B',
  REVIEW_NEEDED: '#8B5CF6',
  APPROVED: '#10B981',
  SURGERY_SCHEDULED: '#06B6D4',
  COMPLETED: '#22C55E',
  REJECTED: '#EF4444',
};

export const OPERATION_LABELS: Record<OperationType, string> = {
  PHACOEMULSIFICATION: 'Факоэмульсификация',
  ANTIGLAUCOMA: 'Антиглаукомная',
  VITRECTOMY: 'Витрэктомия',
};

export const EYE_LABELS: Record<Eye, string> = {
  OD: 'OD (правый)',
  OS: 'OS (левый)',
  OU: 'OU (оба)',
};
