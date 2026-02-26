/**
 * Medical Standards Types
 *
 * Типы для поддержки медицинских стандартов (HL7/FHIR, МКБ-10, SNOMED CT, LOINC)
 */

// ============================================================================
// ICD-10 (Международная классификация болезней, 10-я редакция)
// ============================================================================

export interface ICD10Code {
  /** Код МКБ-10 (например, "H25.1") */
  code: string;
  /** Человекочитаемое описание */
  display: string;
  /** Система кодирования */
  system: 'ICD-10';
  /** Дополнительные примечания */
  notes?: string;
}

// ============================================================================
// SNOMED CT (Систематизированная номенклатура медицины)
// ============================================================================

export interface SNOMEDCode {
  /** SNOMED CT код (например, "54885007") */
  code: string;
  /** Человекочитаемое описание */
  display: string;
  /** Система кодирования */
  system: 'SNOMED-CT';
  /** Дополнительные примечания */
  notes?: string;
}

// ============================================================================
// LOINC (Логическая система идентификации наблюдений)
// ============================================================================

export interface LOINCCode {
  /** LOINC код (например, "79893-4") */
  code: string;
  /** Человекочитаемое описание */
  display: string;
  /** Система кодирования */
  system: 'LOINC';
  /** Значение наблюдения */
  value?: string;
  /** Единица измерения */
  unit?: string;
  /** Дата наблюдения */
  observedAt?: string;
  /** Дополнительные примечания */
  notes?: string;
}

// ============================================================================
// FHIR Extensions (Расширения по модели FHIR)
// ============================================================================

export interface MedicalExtension {
  /** URL расширения */
  url: string;
  /** Значение расширения */
  value: string | number | boolean | object;
}

export interface FHIRReference {
  /** Тип ресурса (например, "Patient", "Practitioner") */
  reference: string;
  /** Отображаемое имя */
  display?: string;
}

// ============================================================================
// Integration Metadata
// ============================================================================

export interface EMIASMetadata {
  /** ID пациента в ЕМИАС */
  patientId?: string;
  /** ID случая в ЕМИАС */
  caseId?: string;
  /** Дата последней синхронизации */
  lastSyncAt?: string;
  /** Статус синхронизации */
  syncStatus?: 'pending' | 'synced' | 'error';
  /** Сообщение об ошибке (если есть) */
  errorMessage?: string;
}

export interface RIAMSMetadata {
  /** ID пациента в РИАМС */
  patientId?: string;
  /** Код региона */
  regionCode?: string;
  /** Дата последней синхронизации */
  lastSyncAt?: string;
  /** Статус синхронизации */
  syncStatus?: 'pending' | 'synced' | 'error';
  /** Сообщение об ошибке (если есть) */
  errorMessage?: string;
}

// ============================================================================
// Medical Standards Metadata (основная структура)
// ============================================================================

export interface MedicalStandardsMetadata {
  /** Коды диагнозов (МКБ-10) */
  diagnosisCodes?: ICD10Code[];

  /** Коды процедур (SNOMED CT) */
  procedureCodes?: SNOMEDCode[];

  /** Наблюдения (LOINC) - для измерений ИОЛ */
  observations?: LOINCCode[];

  /** FHIR resource ID (если синхронизировано) */
  fhirResourceId?: string;

  /** Кастомные расширения */
  extensions?: MedicalExtension[];

  /** Метаданные интеграций */
  integrations?: {
    emias?: EMIASMetadata;
    riams?: RIAMSMetadata;
  };
}

// ============================================================================
// FHIR Resource Types (упрощенные для MVP)
// ============================================================================

export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    family: string;
    given: string[];
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    postalCode?: string;
    country?: string;
  }>;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
}

export interface FHIRCondition {
  resourceType: 'Condition';
  id?: string;
  subject: FHIRReference;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  clinicalStatus?: {
    coding: Array<{
      system: string;
      code: string;
    }>;
  };
  recordedDate?: string;
}

export interface FHIRProcedure {
  resourceType: 'Procedure';
  id?: string;
  subject: FHIRReference;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  status: 'preparation' | 'in-progress' | 'completed' | 'not-done';
  performedDateTime?: string;
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id?: string;
  subject: FHIRReference;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  effectiveDateTime?: string;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'collection' | 'document' | 'transaction';
  entry: Array<{
    resource: FHIRPatient | FHIRCondition | FHIRProcedure | FHIRObservation;
  }>;
}
