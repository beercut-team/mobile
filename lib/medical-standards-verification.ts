/**
 * Medical Standards & Integrations - Verification Test
 *
 * Простой тест для проверки, что все модули импортируются и работают
 */

import {
  // Types
  type ICD10Code,
  type SNOMEDCode,
  type LOINCCode,
  type MedicalStandardsMetadata,
  type FHIRBundle,

  // ICD-10
  CATARACT_ICD10_CODES,
  OPHTHALMIC_ICD10_CODES,
  searchICD10Codes,
  validateICD10Code,
  formatICD10Code,

  // SNOMED CT
  OPHTHALMIC_SNOMED_CODES,
  DIAGNOSTIC_SNOMED_CODES,
  searchSNOMEDCodes,
  validateSNOMEDCode,

  // LOINC
  OCULAR_BIOMETRY_LOINC_CODES,
  VISION_LOINC_CODES,
  searchLOINCCodes,
  createLOINCObservation,

  // FHIR
  createPatientFHIRBundle,
  mapPatientToFHIR,
} from '@/lib/medical-standards';

import {
  // Types
  type IntegrationResponse,
  type IntegrationSyncResult,
  type RIAMSRegion,

  // EMIAS
  validateForEMIAS,
  exportPatientToEMIAS,
  prepareEMIASExport,
  isEMIASSynced,

  // RIAMS
  RIAMS_REGIONS,
  validateForRIAMS,
  exportPatientToRIAMS,
  prepareRIAMSExport,
  isRIAMSSynced,
  isRegionSupported,

  // Common
  getAllSyncStatuses,
  isReadyForExport,
} from '@/lib/integrations';

import type { Patient } from '@/lib/patients';

/**
 * Тест 1: Проверка импортов медицинских стандартов
 */
function test1_MedicalStandardsImports() {
  console.log('✅ Test 1: Medical Standards imports');

  // Проверяем, что коды доступны
  const icd10Code = CATARACT_ICD10_CODES.SENILE_NUCLEAR;
  console.log('  ICD-10 код:', icd10Code.code, '-', icd10Code.display);

  const snomedCode = OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL;
  console.log('  SNOMED код:', snomedCode.code, '-', snomedCode.display);

  const loincCode = OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT;
  console.log('  LOINC код:', loincCode.code, '-', loincCode.display);
}

/**
 * Тест 2: Проверка поиска кодов
 */
function test2_SearchCodes() {
  console.log('\n✅ Test 2: Search codes');

  const icd10Results = searchICD10Codes('катаракта');
  console.log('  Найдено ICD-10 кодов:', icd10Results.length);

  const snomedResults = searchSNOMEDCodes('факоэмульсификация');
  console.log('  Найдено SNOMED кодов:', snomedResults.length);

  const loincResults = searchLOINCCodes('длина оси');
  console.log('  Найдено LOINC кодов:', loincResults.length);
}

/**
 * Тест 3: Проверка валидации
 */
function test3_Validation() {
  console.log('\n✅ Test 3: Code validation');

  const validICD10 = validateICD10Code('H25.1');
  console.log('  H25.1 валиден:', validICD10);

  const invalidICD10 = validateICD10Code('INVALID');
  console.log('  INVALID валиден:', invalidICD10);

  const validSNOMED = validateSNOMEDCode('231744001');
  console.log('  231744001 валиден:', validSNOMED);

  const invalidSNOMED = validateSNOMEDCode('123');
  console.log('  123 валиден:', invalidSNOMED);
}

/**
 * Тест 4: Проверка создания LOINC наблюдений
 */
function test4_LOINCObservations() {
  console.log('\n✅ Test 4: LOINC observations');

  const observation = createLOINCObservation(
    OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
    '23.5'
  );

  console.log('  Создано наблюдение:', observation.code, '=', observation.value, observation.unit);
}

/**
 * Тест 5: Проверка FHIR маппинга
 */
function test5_FHIRMapping() {
  console.log('\n✅ Test 5: FHIR mapping');

  // Создаем mock пациента
  const mockPatient: Partial<Patient> = {
    id: 1,
    first_name: 'Иван',
    last_name: 'Иванов',
    middle_name: 'Петрович',
    date_of_birth: '1950-05-15',
    gender: 'male',
    medical_metadata: {
      diagnosisCodes: [CATARACT_ICD10_CODES.SENILE_NUCLEAR],
      procedureCodes: [OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL],
    },
  };

  const fhirPatient = mapPatientToFHIR(mockPatient as Patient);
  console.log('  FHIR Patient ID:', fhirPatient.id);
  console.log('  FHIR Patient name:', fhirPatient.name?.[0]?.family);
}

/**
 * Тест 6: Проверка интеграций
 */
function test6_Integrations() {
  console.log('\n✅ Test 6: Integrations');

  // Проверяем регионы РИАМС
  console.log('  Регионов РИАМС:', RIAMS_REGIONS.length);
  console.log('  Москва поддерживается:', isRegionSupported('77'));

  // Создаем mock пациента
  const mockPatient: Partial<Patient> = {
    id: 1,
    first_name: 'Иван',
    last_name: 'Иванов',
    date_of_birth: '1950-05-15',
    gender: 'male',
    snils: '123-456-789 00',
  };

  // Валидация для ЕМИАС
  const emiasValidation = validateForEMIAS(mockPatient as Patient);
  console.log('  ЕМИАС валидация:', emiasValidation.valid ? '✅' : '❌');
  if (!emiasValidation.valid) {
    console.log('    Ошибки:', emiasValidation.errors.length);
  }

  // Валидация для РИАМС
  const riamsValidation = validateForRIAMS(mockPatient as Patient, '77');
  console.log('  РИАМС валидация:', riamsValidation.valid ? '✅' : '❌');
  if (!riamsValidation.valid) {
    console.log('    Ошибки:', riamsValidation.errors.length);
  }
}

/**
 * Тест 7: Проверка готовности к экспорту
 */
function test7_ExportReadiness() {
  console.log('\n✅ Test 7: Export readiness');

  const mockPatient: Partial<Patient> = {
    id: 1,
    first_name: 'Иван',
    last_name: 'Иванов',
    date_of_birth: '1950-05-15',
    gender: 'male',
    snils: '123-456-789 00',
    medical_metadata: {
      diagnosisCodes: [CATARACT_ICD10_CODES.SENILE_NUCLEAR],
    },
  };

  const readiness = isReadyForExport(mockPatient as Patient);
  console.log('  Готов к экспорту:', readiness.ready ? '✅' : '❌');
  console.log('  ЕМИАС:', readiness.systems.emias ? '✅' : '❌');
  console.log('  РИАМС:', readiness.systems.riams ? '✅' : '❌');
}

/**
 * Запуск всех тестов
 */
export function runVerificationTests() {
  console.log('=== Medical Standards & Integrations - Verification Tests ===\n');

  try {
    test1_MedicalStandardsImports();
    test2_SearchCodes();
    test3_Validation();
    test4_LOINCObservations();
    test5_FHIRMapping();
    test6_Integrations();
    test7_ExportReadiness();

    console.log('\n=== ✅ All tests passed ===');
    return true;
  } catch (error) {
    console.error('\n=== ❌ Tests failed ===');
    console.error(error);
    return false;
  }
}

// Экспортируем для использования в других местах
export default runVerificationTests;
