/**
 * EMIAS Integration
 *
 * Интеграция с Единой медицинской информационно-аналитической системой (ЕМИАС)
 * MVP: заглушки для демонстрации паттерна интеграции
 */

import {
  IntegrationResponse,
  IntegrationSyncResult,
  IntegrationValidation,
  EMIASPatientData,
  EMIASCaseData,
} from './types';
import type { Patient } from '@/lib/patients';

// ============================================================================
// Data Mapping
// ============================================================================

/**
 * Маппинг пациента во внутренний формат ЕМИАС
 */
export function mapPatientToEMIAS(patient: Patient): EMIASPatientData {
  const mapped: EMIASPatientData = {
    fullName: `${patient.last_name} ${patient.first_name} ${patient.middle_name || ''}`.trim(),
    birthDate: patient.date_of_birth || '',
    gender: patient.gender === 'male' ? 'M' : 'F',
  };

  if (patient.snils) mapped.snils = patient.snils;
  if (patient.oms_policy) mapped.oms = patient.oms_policy;
  if (patient.address) mapped.address = patient.address;
  if (patient.phone) mapped.phone = patient.phone;

  const diagnosisCode = patient.medical_metadata?.diagnosisCodes?.[0]?.code;
  if (diagnosisCode) mapped.diagnosisCode = diagnosisCode;

  const procedureCode = patient.medical_metadata?.procedureCodes?.[0]?.code;
  if (procedureCode) mapped.procedureCode = procedureCode;

  return mapped;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Валидация данных пациента для экспорта в ЕМИАС
 */
export function validateForEMIAS(patient: Patient): IntegrationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Обязательные поля
  if (!patient.last_name || !patient.first_name) {
    errors.push('ФИО пациента обязательно');
    missingFields.push('fullName');
  }

  if (!patient.date_of_birth) {
    errors.push('Дата рождения обязательна');
    missingFields.push('birthDate');
  }

  if (!patient.gender) {
    errors.push('Пол пациента обязателен');
    missingFields.push('gender');
  }

  // Рекомендуемые поля
  if (!patient.snils) {
    warnings.push('СНИЛС не указан - рекомендуется для идентификации');
  }

  if (!patient.oms_policy) {
    warnings.push('Полис ОМС не указан - может потребоваться для оплаты');
  }

  if (!patient.phone) {
    warnings.push('Телефон не указан - затруднит связь с пациентом');
  }

  // Медицинские коды
  if (!patient.medical_metadata?.diagnosisCodes?.length) {
    warnings.push('Код диагноза МКБ-10 не указан - рекомендуется для статистики');
  }

  if (!patient.medical_metadata?.procedureCodes?.length) {
    warnings.push('Код процедуры SNOMED не указан - рекомендуется для учета');
  }

  return {
    system: 'emias',
    valid: errors.length === 0,
    errors,
    warnings,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}

// ============================================================================
// API Functions (Stubs)
// ============================================================================

/**
 * Экспорт пациента в ЕМИАС
 * MVP: заглушка, возвращает mock response
 * TODO: Реализовать на backend
 */
export async function exportPatientToEMIAS(
  patientId: number
): Promise<IntegrationResponse<EMIASPatientData>> {
  // В реальной реализации это будет API вызов:
  // return apiFetch(`/api/v1/integrations/emias/patients/${patientId}/export`, {
  //   method: 'POST',
  // });

  // MVP: возвращаем mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        externalId: `EMIAS-${patientId}-${Date.now()}`,
        data: undefined,
        timestamp: new Date().toISOString(),
      });
    }, 1000);
  });
}

/**
 * Создать случай в ЕМИАС для операции
 * MVP: заглушка
 * TODO: Реализовать на backend
 */
export async function createEMIASCase(
  patientId: number,
  _caseData: Partial<EMIASCaseData>
): Promise<IntegrationResponse<{ caseId: string }>> {
  // В реальной реализации:
  // return apiFetch(`/api/v1/integrations/emias/patients/${patientId}/case`, {
  //   method: 'POST',
  //   body: JSON.stringify(_caseData),
  // });

  // MVP: mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        externalId: `CASE-${patientId}-${Date.now()}`,
        data: {
          caseId: `CASE-${patientId}-${Date.now()}`,
        },
        timestamp: new Date().toISOString(),
      });
    }, 1000);
  });
}

/**
 * Получить статус синхронизации с ЕМИАС
 * MVP: заглушка
 * TODO: Реализовать на backend
 */
export async function getEMIASSyncStatus(
  patientId: number
): Promise<IntegrationSyncResult> {
  // В реальной реализации:
  // return apiFetch(`/api/v1/integrations/emias/patients/${patientId}/status`);

  // MVP: mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        system: 'emias',
        status: 'synced',
        patientId: `EMIAS-${patientId}`,
        lastSyncAt: new Date().toISOString(),
      });
    }, 500);
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Подготовить данные для экспорта (для preview/debug)
 * Не делает API вызов, только маппинг
 */
export function prepareEMIASExport(patient: Patient): {
  data: EMIASPatientData;
  validation: IntegrationValidation;
} {
  const data = mapPatientToEMIAS(patient);
  const validation = validateForEMIAS(patient);

  return { data, validation };
}

/**
 * Проверить, синхронизирован ли пациент с ЕМИАС
 */
export function isEMIASSynced(patient: Patient): boolean {
  return (
    patient.medical_metadata?.integrations?.emias?.syncStatus === 'synced' &&
    !!patient.medical_metadata?.integrations?.emias?.patientId
  );
}

/**
 * Получить ID пациента в ЕМИАС
 */
export function getEMIASPatientId(patient: Patient): string | undefined {
  return patient.medical_metadata?.integrations?.emias?.patientId;
}

/**
 * Получить ID случая в ЕМИАС
 */
export function getEMIASCaseId(patient: Patient): string | undefined {
  return patient.medical_metadata?.integrations?.emias?.caseId;
}
