import { apiFetch } from './api';
import type { ApiResponse } from './auth';

export type IOLFormula = 'SRKT' | 'HAIGIS' | 'HOFFERQ';
export type IOLEye = 'OD' | 'OS';

export interface IOLCalculationRequest {
  patient_id: number;
  eye: IOLEye;
  axial_length: number;
  keratometry1: number;
  keratometry2: number;
  acd?: number;
  target_refraction?: number;
  formula: IOLFormula;
  a_constant?: number;
}

export interface IOLCalculation {
  id: number;
  patient_id: number;
  eye: string;
  axial_length: number;
  keratometry1: number;
  keratometry2: number;
  acd?: number;
  target_refraction: number;
  formula: string;
  iol_power: number;
  predicted_refraction: number;
  a_constant: number;
  calculated_by: number;
  warnings?: string;
  created_at: string;
}

export async function calculateIOL(data: IOLCalculationRequest): Promise<ApiResponse<IOLCalculation>> {
  return apiFetch<ApiResponse<IOLCalculation>>('/api/v1/iol/calculate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getIOLHistory(patientId: number): Promise<ApiResponse<IOLCalculation[]>> {
  return apiFetch<ApiResponse<IOLCalculation[]>>(`/api/v1/iol/patient/${patientId}/history`);
}

export const IOL_FORMULA_LABELS: Record<IOLFormula, string> = {
  SRKT: 'SRK/T',
  HAIGIS: 'Haigis',
  HOFFERQ: 'Hoffer Q',
};
