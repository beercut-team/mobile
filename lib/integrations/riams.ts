/**
 * RIAMS Integration
 *
 * Интеграция с Региональной информационно-аналитической медицинской системой (РИАМС)
 * MVP: заглушки для демонстрации паттерна интеграции
 */

import {
  IntegrationResponse,
  IntegrationSyncResult,
  IntegrationValidation,
  RIAMSPatientData,
  RIAMSRegion,
} from './types';
import type { Patient } from '@/lib/patients';

// ============================================================================
// Supported Regions
// ============================================================================

/**
 * Список поддерживаемых регионов РИАМС
 * Коды регионов по ОКАТО
 */
export const RIAMS_REGIONS: RIAMSRegion[] = [
  { code: '77', name: 'Москва', active: true },
  { code: '50', name: 'Московская область', active: true },
  { code: '78', name: 'Санкт-Петербург', active: true },
  { code: '47', name: 'Ленинградская область', active: true },
  { code: '23', name: 'Краснодарский край', active: true },
  { code: '61', name: 'Ростовская область', active: true },
  { code: '66', name: 'Свердловская область', active: true },
  { code: '74', name: 'Челябинская область', active: true },
  { code: '54', name: 'Новосибирская область', active: true },
  { code: '16', name: 'Республика Татарстан', active: true },
];

// ============================================================================
// Data Mapping
// ============================================================================

/**
 * Маппинг пациента во внутренний формат РИАМС
 */
export function mapPatientToRIAMS(
  patient: Patient,
  regionCode: string
): RIAMSPatientData {
  const mapped: RIAMSPatientData = {
    fullName: `${patient.last_name} ${patient.first_name} ${patient.middle_name || ''}`.trim(),
    birthDate: patient.date_of_birth || '',
    gender: patient.gender === 'male' ? 'M' : 'F',
    regionCode,
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
 * Валидация данных пациента для экспорта в РИАМС
 */
export function validateForRIAMS(
  patient: Patient,
  regionCode?: string
): IntegrationValidation {
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

  // Код региона обязателен для РИАМС
  const effectiveRegionCode =
    regionCode || patient.medical_metadata?.integrations?.riams?.regionCode;

  if (!effectiveRegionCode) {
    errors.push('Код региона обязателен для РИАМС');
    missingFields.push('regionCode');
  } else {
    // Проверяем, что регион поддерживается
    const region = RIAMS_REGIONS.find((r) => r.code === effectiveRegionCode);
    if (!region) {
      errors.push(`Регион с кодом ${effectiveRegionCode} не поддерживается`);
    } else if (!region.active) {
      errors.push(`Регион ${region.name} временно недоступен`);
    }
  }

  // Рекомендуемые поля
  if (!patient.snils) {
    warnings.push('СНИЛС не указан - рекомендуется для идентификации');
  }

  if (!patient.oms_policy) {
    warnings.push('Полис ОМС не указан - может потребоваться для оплаты');
  }

  if (!patient.address) {
    warnings.push('Адрес не указан - рекомендуется для региональной привязки');
  }

  // Медицинские коды
  if (!patient.medical_metadata?.diagnosisCodes?.length) {
    warnings.push('Код диагноза МКБ-10 не указан - рекомендуется для статистики');
  }

  if (!patient.medical_metadata?.procedureCodes?.length) {
    warnings.push('Код процедуры SNOMED не указан - рекомендуется для учета');
  }

  return {
    system: 'riams',
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
 * Экспорт пациента в РИАМС
 * MVP: заглушка, возвращает mock response
 * TODO: Реализовать на backend
 */
export async function exportPatientToRIAMS(
  patientId: number,
  regionCode: string
): Promise<IntegrationResponse<RIAMSPatientData>> {
  // В реальной реализации это будет API вызов:
  // return apiFetch(`/api/v1/integrations/riams/patients/${patientId}/export`, {
  //   method: 'POST',
  //   body: JSON.stringify({ regionCode }),
  // });

  // MVP: возвращаем mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      const region = RIAMS_REGIONS.find((r) => r.code === regionCode);

      if (!region || !region.active) {
        resolve({
          success: false,
          error: `Регион с кодом ${regionCode} не поддерживается или недоступен`,
          errorCode: 'INVALID_REGION',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      resolve({
        success: true,
        externalId: `RIAMS-${regionCode}-${patientId}-${Date.now()}`,
        data: undefined,
        timestamp: new Date().toISOString(),
      });
    }, 1000);
  });
}

/**
 * Получить статус синхронизации с РИАМС
 * MVP: заглушка
 * TODO: Реализовать на backend
 */
export async function getRIAMSSyncStatus(
  patientId: number
): Promise<IntegrationSyncResult> {
  // В реальной реализации:
  // return apiFetch(`/api/v1/integrations/riams/patients/${patientId}/status`);

  // MVP: mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        system: 'riams',
        status: 'synced',
        patientId: `RIAMS-${patientId}`,
        lastSyncAt: new Date().toISOString(),
      });
    }, 500);
  });
}

/**
 * Получить список поддерживаемых регионов
 * MVP: возвращает статический список
 * TODO: В будущем можно получать с backend
 */
export async function getSupportedRegions(): Promise<RIAMSRegion[]> {
  // В реальной реализации:
  // return apiFetch('/api/v1/integrations/riams/regions');

  // MVP: возвращаем статический список
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(RIAMS_REGIONS);
    }, 200);
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Подготовить данные для экспорта (для preview/debug)
 * Не делает API вызов, только маппинг
 */
export function prepareRIAMSExport(
  patient: Patient,
  regionCode: string
): {
  data: RIAMSPatientData;
  validation: IntegrationValidation;
} {
  const data = mapPatientToRIAMS(patient, regionCode);
  const validation = validateForRIAMS(patient, regionCode);

  return { data, validation };
}

/**
 * Проверить, синхронизирован ли пациент с РИАМС
 */
export function isRIAMSSynced(patient: Patient): boolean {
  return (
    patient.medical_metadata?.integrations?.riams?.syncStatus === 'synced' &&
    !!patient.medical_metadata?.integrations?.riams?.patientId
  );
}

/**
 * Получить ID пациента в РИАМС
 */
export function getRIAMSPatientId(patient: Patient): string | undefined {
  return patient.medical_metadata?.integrations?.riams?.patientId;
}

/**
 * Получить код региона пациента
 */
export function getRIAMSRegionCode(patient: Patient): string | undefined {
  return patient.medical_metadata?.integrations?.riams?.regionCode;
}

/**
 * Получить информацию о регионе по коду
 */
export function getRegionByCode(code: string): RIAMSRegion | undefined {
  return RIAMS_REGIONS.find((r) => r.code === code);
}

/**
 * Проверить, поддерживается ли регион
 */
export function isRegionSupported(code: string): boolean {
  const region = getRegionByCode(code);
  return !!region && region.active;
}
