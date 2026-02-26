# Medical Standards & Integrations

Документация по модулям медицинских стандартов (HL7/FHIR, МКБ-10, SNOMED CT, LOINC) и интеграций с внешними системами (ЕМИАС, РИАМС).

## Содержание

- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Медицинские стандарты](#медицинские-стандарты)
- [Интеграции](#интеграции)
- [API](#api)
- [Примеры использования](#примеры-использования)
- [Backend требования](#backend-требования)

## Обзор

Система поддерживает международные медицинские стандарты и интеграции с российскими медицинскими информационными системами:

### Медицинские стандарты

- **МКБ-10** (ICD-10) - коды диагнозов
- **SNOMED CT** - коды процедур и операций
- **LOINC** - коды наблюдений и измерений
- **FHIR R4** - формат обмена медицинскими данными

### Интеграции

- **ЕМИАС** - Единая медицинская информационно-аналитическая система (Москва)
- **РИАМС** - Региональная информационно-аналитическая медицинская система

## Архитектура

### Структура данных

Медицинские метаданные хранятся в поле `medical_metadata` типа `MedicalStandardsMetadata`:

```typescript
interface Patient {
  // ... существующие поля ...

  // Медицинские метаданные (опционально)
  medical_metadata?: MedicalStandardsMetadata;
}

interface MedicalStandardsMetadata {
  diagnosisCodes?: ICD10Code[];        // Коды диагнозов
  procedureCodes?: SNOMEDCode[];       // Коды процедур
  observations?: LOINCCode[];          // Наблюдения/измерения
  fhirResourceId?: string;             // FHIR resource ID
  extensions?: MedicalExtension[];     // Расширения
  integrations?: {                     // Метаданные интеграций
    emias?: EMIASMetadata;
    riams?: RIAMSMetadata;
  };
}
```

### Хранение в БД

Данные хранятся в JSONB колонке `medical_metadata` таблицы `patients`:

```sql
ALTER TABLE patients ADD COLUMN medical_metadata JSONB;
CREATE INDEX idx_patients_medical_metadata ON patients USING GIN (medical_metadata);
```

### Обратная совместимость

- Поле `diagnosis` сохранено как fallback для текстовых диагнозов
- `medical_metadata` опционально - старые пациенты работают без него
- UI показывает код МКБ-10 если есть, иначе текст из `diagnosis`

## Медицинские стандарты

### МКБ-10 (ICD-10)

Международная классификация болезней, 10-я редакция.

#### Предопределенные коды

```typescript
import { CATARACT_ICD10_CODES } from '@/lib/medical-standards';

// Доступные коды катаракты
CATARACT_ICD10_CODES.SENILE_NUCLEAR      // H25.1
CATARACT_ICD10_CODES.SENILE_INCIPIENT    // H25.0
CATARACT_ICD10_CODES.TRAUMATIC           // H26.1
// ... и другие
```

#### Утилиты

```typescript
import {
  searchICD10Codes,
  validateICD10Code,
  formatICD10Code
} from '@/lib/medical-standards';

// Поиск кодов
const codes = searchICD10Codes('катаракта');

// Валидация формата
const isValid = validateICD10Code('H25.1'); // true

// Форматирование
const formatted = formatICD10Code(code); // "H25.1 - Старческая ядерная катаракта"
```

### SNOMED CT

Систематизированная номенклатура медицины - коды процедур.

#### Предопределенные коды

```typescript
import { OPHTHALMIC_SNOMED_CODES } from '@/lib/medical-standards';

// Доступные коды процедур
OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL          // 172522003
OPHTHALMIC_SNOMED_CODES.PHACOEMULSIFICATION     // 231744001
OPHTHALMIC_SNOMED_CODES.IOL_IMPLANTATION        // 308694008
// ... и другие
```

#### Утилиты

```typescript
import {
  searchSNOMEDCodes,
  validateSNOMEDCode,
  formatSNOMEDCode
} from '@/lib/medical-standards';

// Поиск кодов
const codes = searchSNOMEDCodes('факоэмульсификация');

// Валидация
const isValid = validateSNOMEDCode('231744001'); // true
```

### LOINC

Логическая система идентификации наблюдений - коды измерений.

#### Предопределенные коды

```typescript
import { OCULAR_BIOMETRY_LOINC_CODES } from '@/lib/medical-standards';

// Коды биометрии глаза
OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT  // 79894-2
OCULAR_BIOMETRY_LOINC_CODES.KERATOMETRY_K1_RIGHT // 79897-5
// ... и другие
```

#### Создание наблюдений

```typescript
import { createLOINCObservation } from '@/lib/medical-standards';

const observation = createLOINCObservation(
  OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
  '23.5'  // значение
);
```

### FHIR R4

Формат обмена медицинскими данными.

#### Генерация FHIR Bundle

```typescript
import { createPatientFHIRBundle } from '@/lib/medical-standards';

const fhirBundle = createPatientFHIRBundle(patient);

// Bundle содержит:
// - Patient resource (демографические данные)
// - Condition resource (диагноз)
// - Procedure resource (операция)
// - Observation resources (измерения)
```

#### Маппинг отдельных ресурсов

```typescript
import {
  mapPatientToFHIR,
  mapDiagnosisToFHIR,
  mapProcedureToFHIR,
  mapObservationToFHIR
} from '@/lib/medical-standards';

const fhirPatient = mapPatientToFHIR(patient);
const fhirCondition = mapDiagnosisToFHIR(patient, diagnosisCode);
const fhirProcedure = mapProcedureToFHIR(patient, procedureCode);
const fhirObservation = mapObservationToFHIR(patient, observation);
```

## Интеграции

### ЕМИАС

Единая медицинская информационно-аналитическая система (Москва).

#### Валидация

```typescript
import { validateForEMIAS } from '@/lib/integrations';

const validation = validateForEMIAS(patient);

if (validation.valid) {
  // Готов к экспорту
} else {
  console.error('Ошибки:', validation.errors);
  console.warn('Предупреждения:', validation.warnings);
}
```

#### Экспорт

```typescript
import { exportPatientToEMIAS } from '@/lib/integrations';

const result = await exportPatientToEMIAS(patient.id);

if (result.success) {
  console.log('ID в ЕМИАС:', result.externalId);
}
```

#### Создание случая

```typescript
import { createEMIASCase } from '@/lib/integrations';

const result = await createEMIASCase(patient.id, {
  surgeryDate: '2026-03-15',
  procedureCode: '172522003',
  diagnosisCode: 'H25.1',
});
```

### РИАМС

Региональная информационно-аналитическая медицинская система.

#### Поддерживаемые регионы

```typescript
import { RIAMS_REGIONS, isRegionSupported } from '@/lib/integrations';

// Список регионов
RIAMS_REGIONS.forEach(region => {
  console.log(`${region.code} - ${region.name}`);
});

// Проверка региона
const supported = isRegionSupported('77'); // true для Москвы
```

#### Валидация

```typescript
import { validateForRIAMS } from '@/lib/integrations';

const validation = validateForRIAMS(patient, '77'); // код региона

if (!validation.valid) {
  console.error('Ошибки:', validation.errors);
}
```

#### Экспорт

```typescript
import { exportPatientToRIAMS } from '@/lib/integrations';

const result = await exportPatientToRIAMS(patient.id, '77');

if (result.success) {
  console.log('ID в РИАМС:', result.externalId);
}
```

### Общие функции

#### Проверка всех статусов

```typescript
import { getAllSyncStatuses } from '@/lib/integrations';

const statuses = await getAllSyncStatuses(patient.id);

statuses.forEach(status => {
  console.log(`${status.system}: ${status.status}`);
});
```

#### Проверка готовности

```typescript
import { isReadyForExport } from '@/lib/integrations';

const readiness = isReadyForExport(patient);

console.log('Готов к экспорту:', readiness.ready);
console.log('ЕМИАС:', readiness.systems.emias);
console.log('РИАМС:', readiness.systems.riams);
```

## API

### Frontend API

#### Обновление медицинских метаданных

```typescript
import { updateMedicalMetadata } from '@/lib/patients';

await updateMedicalMetadata(patientId, {
  diagnosisCodes: [CATARACT_ICD10_CODES.SENILE_NUCLEAR],
  procedureCodes: [OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL],
  observations: [/* ... */],
});
```

#### Получение FHIR Bundle

```typescript
import { getPatientFHIRBundle } from '@/lib/patients';

const bundle = await getPatientFHIRBundle(patientId);
```

### Backend API (требуется реализация)

См. раздел [Backend требования](#backend-требования).

## Примеры использования

Полные примеры см. в файле `/lib/medical-standards-examples.ts`.

### Базовый пример

```typescript
import {
  CATARACT_ICD10_CODES,
  OPHTHALMIC_SNOMED_CODES,
  createPatientFHIRBundle
} from '@/lib/medical-standards';
import { exportPatientToEMIAS } from '@/lib/integrations';

// 1. Создаем пациента с медицинскими кодами
const patient = await createPatient({
  // ... базовые поля ...
  medical_metadata: {
    diagnosisCodes: [CATARACT_ICD10_CODES.SENILE_NUCLEAR],
    procedureCodes: [OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL],
  },
});

// 2. Генерируем FHIR Bundle
const fhirBundle = createPatientFHIRBundle(patient);

// 3. Экспортируем в ЕМИАС
const result = await exportPatientToEMIAS(patient.id);
```

## Backend требования

### Database Migration

```sql
-- Добавить колонку для метаданных
ALTER TABLE patients ADD COLUMN medical_metadata JSONB;

-- Индекс для быстрого поиска
CREATE INDEX idx_patients_medical_metadata
ON patients USING GIN (medical_metadata);

-- Добавить поля для интеграций (опционально)
ALTER TABLE patients ADD COLUMN oms_policy VARCHAR(16);
ALTER TABLE patients ADD COLUMN gender VARCHAR(10);
```

### API Endpoints

#### Медицинские стандарты

```
POST   /api/v1/patients/:id/medical-metadata
GET    /api/v1/patients/:id/fhir-bundle
GET    /api/v1/medical-codes/icd10/search?q=катаракта
GET    /api/v1/medical-codes/snomed/search?q=...
GET    /api/v1/medical-codes/loinc/search?q=...
```

#### ЕМИАС

```
POST   /api/v1/integrations/emias/patients/:id/export
POST   /api/v1/integrations/emias/patients/:id/case
GET    /api/v1/integrations/emias/patients/:id/status
```

#### РИАМС

```
POST   /api/v1/integrations/riams/patients/:id/export
GET    /api/v1/integrations/riams/patients/:id/status
GET    /api/v1/integrations/riams/regions
```

### Пример структуры medical_metadata

```json
{
  "diagnosisCodes": [
    {
      "code": "H25.1",
      "display": "Старческая ядерная катаракта",
      "system": "ICD-10"
    }
  ],
  "procedureCodes": [
    {
      "code": "172522003",
      "display": "Факоэмульсификация с имплантацией ИОЛ",
      "system": "SNOMED-CT"
    }
  ],
  "observations": [
    {
      "code": "79894-2",
      "display": "Длина оси правого глаза",
      "system": "LOINC",
      "value": "23.5",
      "unit": "mm",
      "observedAt": "2026-02-26T10:00:00Z"
    }
  ],
  "fhirResourceId": "patient-123-fhir",
  "integrations": {
    "emias": {
      "patientId": "EMIAS-12345",
      "caseId": "CASE-67890",
      "lastSyncAt": "2026-02-26T10:00:00Z",
      "syncStatus": "synced"
    },
    "riams": {
      "patientId": "RIAMS-54321",
      "regionCode": "77",
      "lastSyncAt": "2026-02-26T10:05:00Z",
      "syncStatus": "synced"
    }
  }
}
```

## Roadmap

### MVP (текущая реализация)

- ✅ Типы для медицинских стандартов
- ✅ Предопределенные коды (МКБ-10, SNOMED, LOINC)
- ✅ FHIR R4 mapper
- ✅ Заглушки интеграций ЕМИАС/РИАМС
- ✅ Валидация данных

### Фаза 2

- [ ] Backend API endpoints
- [ ] Database migration
- [ ] Реальные интеграции с ЕМИАС/РИАМС
- [ ] UI компоненты для выбора кодов

### Фаза 3

- [ ] Полнотекстовый поиск медицинских кодов
- [ ] Автоматическое предложение кодов на основе текста
- [ ] Синхронизация с внешними справочниками
- [ ] Расширенная валидация FHIR

### Фаза 4

- [ ] Поддержка HL7 v2 messages
- [ ] Интеграция с другими РИАМС регионов
- [ ] Экспорт в федеральные системы
- [ ] Аудит и логирование интеграций
