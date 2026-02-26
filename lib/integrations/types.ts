/**
 * Integration Types
 *
 * Общие типы для интеграций с внешними медицинскими системами
 */

// ============================================================================
// Common Integration Types
// ============================================================================

export type IntegrationSystem = 'emias' | 'riams';

export type SyncStatus = 'pending' | 'synced' | 'error';

export interface IntegrationResponse<T = any> {
  /** Успешность операции */
  success: boolean;
  /** ID во внешней системе */
  externalId?: string;
  /** Дополнительные данные */
  data?: T;
  /** Сообщение об ошибке */
  error?: string;
  /** Код ошибки */
  errorCode?: string;
  /** Timestamp операции */
  timestamp: string;
}

export interface IntegrationSyncResult {
  /** Система интеграции */
  system: IntegrationSystem;
  /** Статус синхронизации */
  status: SyncStatus;
  /** ID пациента в системе */
  patientId?: string;
  /** Дата последней синхронизации */
  lastSyncAt?: string;
  /** Сообщение об ошибке */
  errorMessage?: string;
}

export interface IntegrationExportData {
  /** ID пациента в нашей системе */
  patientId: number;
  /** Система для экспорта */
  system: IntegrationSystem;
  /** Данные для экспорта */
  data: any;
  /** Метаданные */
  metadata?: Record<string, any>;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  /** Валидность данных */
  valid: boolean;
  /** Список ошибок */
  errors: string[];
  /** Список предупреждений */
  warnings?: string[];
}

export interface IntegrationValidation extends ValidationResult {
  /** Система интеграции */
  system: IntegrationSystem;
  /** Обязательные поля, которых не хватает */
  missingFields?: string[];
}

// ============================================================================
// EMIAS Specific Types
// ============================================================================

export interface EMIASPatientData {
  /** ФИО */
  fullName: string;
  /** Дата рождения */
  birthDate: string;
  /** Пол */
  gender: 'M' | 'F';
  /** СНИЛС */
  snils?: string;
  /** Полис ОМС */
  oms?: string;
  /** Адрес */
  address?: string;
  /** Телефон */
  phone?: string;
  /** Диагноз (код МКБ-10) */
  diagnosisCode?: string;
  /** Тип операции (код SNOMED) */
  procedureCode?: string;
}

export interface EMIASCaseData {
  /** ID пациента в ЕМИАС */
  patientId: string;
  /** Дата операции */
  surgeryDate: string;
  /** Код операции */
  procedureCode: string;
  /** Код диагноза */
  diagnosisCode: string;
  /** ID врача */
  doctorId?: string;
  /** ID хирурга */
  surgeonId?: string;
}

// ============================================================================
// RIAMS Specific Types
// ============================================================================

export interface RIAMSPatientData {
  /** ФИО */
  fullName: string;
  /** Дата рождения */
  birthDate: string;
  /** Пол */
  gender: 'M' | 'F';
  /** СНИЛС */
  snils?: string;
  /** Полис ОМС */
  oms?: string;
  /** Адрес */
  address?: string;
  /** Телефон */
  phone?: string;
  /** Код региона */
  regionCode: string;
  /** Диагноз (код МКБ-10) */
  diagnosisCode?: string;
  /** Тип операции (код SNOMED) */
  procedureCode?: string;
}

export interface RIAMSRegion {
  /** Код региона */
  code: string;
  /** Название региона */
  name: string;
  /** Активен ли регион */
  active: boolean;
}
