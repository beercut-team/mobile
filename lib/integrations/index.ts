/**
 * Integrations Module
 *
 * Экспорты для интеграций с внешними медицинскими системами (ЕМИАС, РИАМС)
 */

// Types
export type {
  IntegrationSystem,
  SyncStatus,
  IntegrationResponse,
  IntegrationSyncResult,
  IntegrationExportData,
  ValidationResult,
  IntegrationValidation,
  EMIASPatientData,
  EMIASCaseData,
  RIAMSPatientData,
  RIAMSRegion,
} from './types';

// EMIAS
export {
  mapPatientToEMIAS,
  validateForEMIAS,
  exportPatientToEMIAS,
  createEMIASCase,
  getEMIASSyncStatus,
  prepareEMIASExport,
  isEMIASSynced,
  getEMIASPatientId,
  getEMIASCaseId,
} from './emias';

// RIAMS
export {
  RIAMS_REGIONS,
  mapPatientToRIAMS,
  validateForRIAMS,
  exportPatientToRIAMS,
  getRIAMSSyncStatus,
  getSupportedRegions,
  prepareRIAMSExport,
  isRIAMSSynced,
  getRIAMSPatientId,
  getRIAMSRegionCode,
  getRegionByCode,
  isRegionSupported,
} from './riams';

// ============================================================================
// Common Integration Functions
// ============================================================================

import type { Patient } from '@/lib/patients';
import { IntegrationSyncResult, IntegrationValidation } from './types';
import { getEMIASSyncStatus, validateForEMIAS } from './emias';
import { getRIAMSSyncStatus, validateForRIAMS } from './riams';

/**
 * Получить статусы синхронизации со всеми системами
 */
export async function getAllSyncStatuses(
  patientId: number
): Promise<IntegrationSyncResult[]> {
  const [emiasStatus, riamsStatus] = await Promise.all([
    getEMIASSyncStatus(patientId),
    getRIAMSSyncStatus(patientId),
  ]);

  return [emiasStatus, riamsStatus];
}

/**
 * Валидация для всех систем интеграции
 */
export function validateForAllIntegrations(
  patient: Patient
): IntegrationValidation[] {
  return [validateForEMIAS(patient), validateForRIAMS(patient)];
}

/**
 * Проверить, готов ли пациент к экспорту в любую систему
 */
export function isReadyForExport(patient: Patient): {
  ready: boolean;
  systems: {
    emias: boolean;
    riams: boolean;
  };
  validations: IntegrationValidation[];
} {
  const validations = validateForAllIntegrations(patient);
  const emiasValidation = validations.find((v) => v.system === 'emias');
  const riamsValidation = validations.find((v) => v.system === 'riams');

  return {
    ready: emiasValidation?.valid || riamsValidation?.valid || false,
    systems: {
      emias: emiasValidation?.valid || false,
      riams: riamsValidation?.valid || false,
    },
    validations,
  };
}
