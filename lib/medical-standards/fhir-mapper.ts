/**
 * FHIR R4 Mapper
 *
 * Утилиты для маппинга данных пациента в формат FHIR R4
 */

import {
  FHIRPatient,
  FHIRCondition,
  FHIRProcedure,
  FHIRObservation,
  FHIRBundle,
  FHIRReference,
  ICD10Code,
  SNOMEDCode,
  LOINCCode,
} from './types';
import type { Patient } from '@/lib/patients';

// ============================================================================
// Patient Resource Mapping
// ============================================================================

/**
 * Маппинг пациента в FHIR Patient resource
 */
export function mapPatientToFHIR(patient: Patient): FHIRPatient {
  const fhirPatient: FHIRPatient = {
    resourceType: 'Patient',
    id: patient.medical_metadata?.fhirResourceId || `patient-${patient.id}`,
    identifier: [
      {
        system: 'urn:oid:1.2.643.5.1.13.13.12.2.77.8511', // OID для московских медицинских организаций
        value: String(patient.id),
      },
    ],
    name: [
      {
        family: patient.last_name,
        given: [patient.first_name, patient.middle_name].filter((n): n is string => !!n),
      },
    ],
    gender: patient.gender === 'male' ? 'male' : patient.gender === 'female' ? 'female' : 'unknown',
    birthDate: patient.date_of_birth,
  };

  // Добавляем адрес если есть
  if (patient.address) {
    fhirPatient.address = [
      {
        line: [patient.address],
        city: patient.district?.name,
        country: 'RU',
      },
    ];
  }

  // Добавляем телефон если есть
  if (patient.phone) {
    fhirPatient.telecom = [
      {
        system: 'phone',
        value: patient.phone,
      },
    ];
  }

  return fhirPatient;
}

// ============================================================================
// Condition Resource Mapping (Диагноз)
// ============================================================================

/**
 * Маппинг диагноза в FHIR Condition resource
 */
export function mapDiagnosisToFHIR(
  patient: Patient,
  diagnosisCode: ICD10Code
): FHIRCondition {
  const patientReference: FHIRReference = {
    reference: `Patient/${patient.medical_metadata?.fhirResourceId || patient.id}`,
    display: `${patient.last_name} ${patient.first_name}`,
  };

  return {
    resourceType: 'Condition',
    id: `condition-${patient.id}-${diagnosisCode.code}`,
    subject: patientReference,
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: diagnosisCode.code,
          display: diagnosisCode.display,
        },
      ],
      text: diagnosisCode.display,
    },
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
        },
      ],
    },
    recordedDate: patient.created_at,
  };
}

// ============================================================================
// Procedure Resource Mapping (Процедура/Операция)
// ============================================================================

/**
 * Маппинг процедуры в FHIR Procedure resource
 */
export function mapProcedureToFHIR(
  patient: Patient,
  procedureCode: SNOMEDCode
): FHIRProcedure {
  const patientReference: FHIRReference = {
    reference: `Patient/${patient.medical_metadata?.fhirResourceId || patient.id}`,
    display: `${patient.last_name} ${patient.first_name}`,
  };

  // Определяем статус на основе статуса пациента
  let status: FHIRProcedure['status'] = 'preparation';
  if (patient.status === 'COMPLETED') {
    status = 'completed';
  } else if (patient.status === 'SURGERY_SCHEDULED') {
    status = 'in-progress';
  } else if (patient.status === 'REJECTED') {
    status = 'not-done';
  }

  return {
    resourceType: 'Procedure',
    id: `procedure-${patient.id}-${procedureCode.code}`,
    subject: patientReference,
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: procedureCode.code,
          display: procedureCode.display,
        },
      ],
      text: procedureCode.display,
    },
    status,
    performedDateTime: patient.surgery_date ?? undefined,
  };
}

// ============================================================================
// Observation Resource Mapping (Наблюдения/Измерения)
// ============================================================================

/**
 * Маппинг наблюдения в FHIR Observation resource
 */
export function mapObservationToFHIR(
  patient: Patient,
  observation: LOINCCode
): FHIRObservation {
  const patientReference: FHIRReference = {
    reference: `Patient/${patient.medical_metadata?.fhirResourceId || patient.id}`,
    display: `${patient.last_name} ${patient.first_name}`,
  };

  const fhirObservation: FHIRObservation = {
    resourceType: 'Observation',
    id: `observation-${patient.id}-${observation.code}`,
    subject: patientReference,
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: observation.code,
          display: observation.display,
        },
      ],
      text: observation.display,
    },
    status: 'final',
    effectiveDateTime: observation.observedAt || patient.created_at,
  };

  // Добавляем значение если есть
  if (observation.value && observation.unit) {
    fhirObservation.valueQuantity = {
      value: parseFloat(observation.value),
      unit: observation.unit,
      system: 'http://unitsofmeasure.org',
      code: observation.unit,
    };
  }

  return fhirObservation;
}

// ============================================================================
// Bundle Creation (Создание Bundle со всеми ресурсами)
// ============================================================================

/**
 * Создать FHIR Bundle со всеми ресурсами пациента
 */
export function createPatientFHIRBundle(patient: Patient): FHIRBundle {
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [],
  };

  // 1. Добавляем Patient resource
  bundle.entry.push({
    resource: mapPatientToFHIR(patient),
  });

  // 2. Добавляем Condition resources (диагнозы)
  if (patient.medical_metadata?.diagnosisCodes) {
    patient.medical_metadata.diagnosisCodes.forEach((diagnosisCode: ICD10Code) => {
      bundle.entry.push({
        resource: mapDiagnosisToFHIR(patient, diagnosisCode),
      });
    });
  }

  // 3. Добавляем Procedure resources (процедуры)
  if (patient.medical_metadata?.procedureCodes) {
    patient.medical_metadata.procedureCodes.forEach((procedureCode: SNOMEDCode) => {
      bundle.entry.push({
        resource: mapProcedureToFHIR(patient, procedureCode),
      });
    });
  }

  // 4. Добавляем Observation resources (наблюдения)
  if (patient.medical_metadata?.observations) {
    patient.medical_metadata.observations.forEach((observation: LOINCCode) => {
      bundle.entry.push({
        resource: mapObservationToFHIR(patient, observation),
      });
    });
  }

  return bundle;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Валидация FHIR Patient resource
 */
export function validateFHIRPatient(patient: FHIRPatient): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!patient.name || patient.name.length === 0) {
    errors.push('Patient must have at least one name');
  }

  if (!patient.gender) {
    errors.push('Patient must have a gender');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Валидация FHIR Bundle
 */
export function validateFHIRBundle(bundle: FHIRBundle): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!bundle.entry || bundle.entry.length === 0) {
    errors.push('Bundle must have at least one entry');
  }

  // Проверяем, что первый ресурс - Patient
  if (bundle.entry && bundle.entry[0]?.resource.resourceType !== 'Patient') {
    errors.push('First entry in bundle must be a Patient resource');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
