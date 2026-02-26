/**
 * Medical Standards & Integrations - Usage Examples
 *
 * Примеры использования модулей медицинских стандартов и интеграций
 */

import type { Patient } from '@/lib/patients';
import {
  CATARACT_ICD10_CODES,
  OPHTHALMIC_SNOMED_CODES,
  OCULAR_BIOMETRY_LOINC_CODES,
  createLOINCObservation,
  createPatientFHIRBundle,
  searchICD10Codes,
  searchSNOMEDCodes,
} from '@/lib/medical-standards';
import {
  exportPatientToEMIAS,
  exportPatientToRIAMS,
  validateForEMIAS,
  validateForRIAMS,
  prepareEMIASExport,
  prepareRIAMSExport,
  getAllSyncStatuses,
  isReadyForExport,
  RIAMS_REGIONS,
} from '@/lib/integrations';

// ============================================================================
// Пример 1: Создание пациента с медицинскими кодами
// ============================================================================

export async function example1_CreatePatientWithMedicalCodes() {
  // Пример данных пациента с медицинскими метаданными
  const patientData = {
    first_name: 'Иван',
    last_name: 'Иванов',
    middle_name: 'Петрович',
    date_of_birth: '1950-05-15',
    gender: 'male' as const,
    phone: '+79161234567',
    snils: '123-456-789 00',
    oms_policy: '1234567890123456',
    address: 'г. Москва, ул. Ленина, д. 1',
    diagnosis: 'Старческая ядерная катаракта', // Fallback текст
    operation_type: 'PHACOEMULSIFICATION' as const,
    eye: 'OD' as const,
    district_id: 1,

    // Медицинские метаданные
    medical_metadata: {
      // Диагноз по МКБ-10
      diagnosisCodes: [CATARACT_ICD10_CODES.SENILE_NUCLEAR],

      // Процедура по SNOMED CT
      procedureCodes: [OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL],

      // Наблюдения (измерения для ИОЛ)
      observations: [
        createLOINCObservation(
          OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
          '23.5'
        ),
        createLOINCObservation(
          OCULAR_BIOMETRY_LOINC_CODES.KERATOMETRY_K1_RIGHT,
          '43.5'
        ),
        createLOINCObservation(
          OCULAR_BIOMETRY_LOINC_CODES.KERATOMETRY_K2_RIGHT,
          '44.0'
        ),
      ],
    },
  };

  console.log('Пример пациента с медицинскими кодами:', patientData);
  return patientData;
}

// ============================================================================
// Пример 2: Поиск медицинских кодов
// ============================================================================

export function example2_SearchMedicalCodes() {
  // Поиск кодов МКБ-10
  const cataractCodes = searchICD10Codes('катаракта');
  console.log('Найденные коды МКБ-10:', cataractCodes);

  // Поиск кодов SNOMED CT
  const procedureCodes = searchSNOMEDCodes('факоэмульсификация');
  console.log('Найденные коды SNOMED CT:', procedureCodes);

  return { cataractCodes, procedureCodes };
}

// ============================================================================
// Пример 3: Генерация FHIR Bundle
// ============================================================================

export function example3_GenerateFHIRBundle(patient: Patient) {
  // Создаем FHIR Bundle со всеми ресурсами пациента
  const fhirBundle = createPatientFHIRBundle(patient);

  console.log('FHIR Bundle:', JSON.stringify(fhirBundle, null, 2));

  // Bundle содержит:
  // - Patient resource (демографические данные)
  // - Condition resource (диагноз)
  // - Procedure resource (операция)
  // - Observation resources (измерения ИОЛ)

  return fhirBundle;
}

// ============================================================================
// Пример 4: Валидация для экспорта в ЕМИАС
// ============================================================================

export function example4_ValidateForEMIAS(patient: Patient) {
  const validation = validateForEMIAS(patient);

  if (validation.valid) {
    console.log('✅ Пациент готов к экспорту в ЕМИАС');
  } else {
    console.log('❌ Ошибки валидации:', validation.errors);
  }

  if (validation.warnings && validation.warnings.length > 0) {
    console.log('⚠️ Предупреждения:', validation.warnings);
  }

  return validation;
}

// ============================================================================
// Пример 5: Экспорт в ЕМИАС
// ============================================================================

export async function example5_ExportToEMIAS(patient: Patient) {
  // Сначала валидируем
  const validation = validateForEMIAS(patient);
  if (!validation.valid) {
    console.error('Невозможно экспортировать: ошибки валидации');
    return;
  }

  // Подготавливаем данные (для preview)
  const { data } = prepareEMIASExport(patient);
  console.log('Данные для экспорта в ЕМИАС:', data);

  // Экспортируем
  const result = await exportPatientToEMIAS(patient.id);

  if (result.success) {
    console.log('✅ Успешно экспортировано в ЕМИАС');
    console.log('ID в ЕМИАС:', result.externalId);
  } else {
    console.error('❌ Ошибка экспорта:', result.error);
  }

  return result;
}

// ============================================================================
// Пример 6: Экспорт в РИАМС
// ============================================================================

export async function example6_ExportToRIAMS(patient: Patient) {
  // Выбираем регион (например, Москва)
  const regionCode = '77';

  // Валидируем
  const validation = validateForRIAMS(patient, regionCode);
  if (!validation.valid) {
    console.error('Невозможно экспортировать: ошибки валидации');
    return;
  }

  // Подготавливаем данные
  const { data } = prepareRIAMSExport(patient, regionCode);
  console.log('Данные для экспорта в РИАМС:', data);

  // Экспортируем
  const result = await exportPatientToRIAMS(patient.id, regionCode);

  if (result.success) {
    console.log('✅ Успешно экспортировано в РИАМС');
    console.log('ID в РИАМС:', result.externalId);
  } else {
    console.error('❌ Ошибка экспорта:', result.error);
  }

  return result;
}

// ============================================================================
// Пример 7: Проверка статусов синхронизации
// ============================================================================

export async function example7_CheckSyncStatuses(patientId: number) {
  const statuses = await getAllSyncStatuses(patientId);

  statuses.forEach((status) => {
    console.log(`${status.system.toUpperCase()}:`);
    console.log(`  Статус: ${status.status}`);
    console.log(`  ID пациента: ${status.patientId || 'не синхронизирован'}`);
    console.log(`  Последняя синхронизация: ${status.lastSyncAt || 'никогда'}`);
  });

  return statuses;
}

// ============================================================================
// Пример 8: Проверка готовности к экспорту
// ============================================================================

export function example8_CheckExportReadiness(patient: Patient) {
  const readiness = isReadyForExport(patient);

  console.log('Готовность к экспорту:');
  console.log(`  Общая готовность: ${readiness.ready ? '✅' : '❌'}`);
  console.log(`  ЕМИАС: ${readiness.systems.emias ? '✅' : '❌'}`);
  console.log(`  РИАМС: ${readiness.systems.riams ? '✅' : '❌'}`);

  // Показываем детали валидации
  readiness.validations.forEach((validation) => {
    console.log(`\n${validation.system.toUpperCase()}:`);
    if (validation.errors.length > 0) {
      console.log('  Ошибки:', validation.errors);
    }
    if (validation.warnings && validation.warnings.length > 0) {
      console.log('  Предупреждения:', validation.warnings);
    }
  });

  return readiness;
}

// ============================================================================
// Пример 9: Список поддерживаемых регионов РИАМС
// ============================================================================

export function example9_ListRIAMSRegions() {
  console.log('Поддерживаемые регионы РИАМС:');
  RIAMS_REGIONS.forEach((region) => {
    const status = region.active ? '✅' : '❌';
    console.log(`  ${status} ${region.code} - ${region.name}`);
  });

  return RIAMS_REGIONS;
}

// ============================================================================
// Пример 10: Полный workflow
// ============================================================================

export async function example10_FullWorkflow(patient: Patient) {
  console.log('=== Полный workflow медицинских стандартов и интеграций ===\n');

  // 1. Проверяем готовность
  console.log('1. Проверка готовности к экспорту...');
  const readiness = isReadyForExport(patient);
  console.log(`   Готов: ${readiness.ready}\n`);

  if (!readiness.ready) {
    console.log('   Пациент не готов к экспорту. Завершение.');
    return;
  }

  // 2. Генерируем FHIR Bundle
  console.log('2. Генерация FHIR Bundle...');
  const fhirBundle = createPatientFHIRBundle(patient);
  console.log(`   Создано ресурсов: ${fhirBundle.entry.length}\n`);

  // 3. Экспортируем в ЕМИАС (если готов)
  if (readiness.systems.emias) {
    console.log('3. Экспорт в ЕМИАС...');
    const emiasResult = await exportPatientToEMIAS(patient.id);
    console.log(`   Результат: ${emiasResult.success ? '✅' : '❌'}\n`);
  }

  // 4. Экспортируем в РИАМС (если готов)
  if (readiness.systems.riams) {
    console.log('4. Экспорт в РИАМС...');
    const riamsResult = await exportPatientToRIAMS(patient.id, '77');
    console.log(`   Результат: ${riamsResult.success ? '✅' : '❌'}\n`);
  }

  // 5. Проверяем статусы синхронизации
  console.log('5. Проверка статусов синхронизации...');
  const statuses = await getAllSyncStatuses(patient.id);
  statuses.forEach((status) => {
    console.log(`   ${status.system}: ${status.status}`);
  });

  console.log('\n=== Workflow завершен ===');
}
