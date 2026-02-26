/**
 * ICD-10 Utilities
 *
 * Утилиты для работы с кодами МКБ-10 (Международная классификация болезней)
 */

import { ICD10Code } from './types';

// ============================================================================
// Предопределенные коды катаракты
// ============================================================================

export const CATARACT_ICD10_CODES = {
  /** H25.0 - Старческая начальная катаракта */
  SENILE_INCIPIENT: {
    code: 'H25.0',
    display: 'Старческая начальная катаракта',
    system: 'ICD-10' as const,
  },

  /** H25.1 - Старческая ядерная катаракта */
  SENILE_NUCLEAR: {
    code: 'H25.1',
    display: 'Старческая ядерная катаракта',
    system: 'ICD-10' as const,
  },

  /** H25.2 - Старческая катаракта морганиева типа */
  SENILE_MORGAGNIAN: {
    code: 'H25.2',
    display: 'Старческая катаракта морганиева типа',
    system: 'ICD-10' as const,
  },

  /** H25.8 - Другие старческие катаракты */
  SENILE_OTHER: {
    code: 'H25.8',
    display: 'Другие старческие катаракты',
    system: 'ICD-10' as const,
  },

  /** H25.9 - Старческая катаракта неуточненная */
  SENILE_UNSPECIFIED: {
    code: 'H25.9',
    display: 'Старческая катаракта неуточненная',
    system: 'ICD-10' as const,
  },

  /** H26.0 - Детская, юношеская и пресенильная катаракта */
  INFANTILE_JUVENILE: {
    code: 'H26.0',
    display: 'Детская, юношеская и пресенильная катаракта',
    system: 'ICD-10' as const,
  },

  /** H26.1 - Травматическая катаракта */
  TRAUMATIC: {
    code: 'H26.1',
    display: 'Травматическая катаракта',
    system: 'ICD-10' as const,
  },

  /** H26.2 - Осложненная катаракта */
  COMPLICATED: {
    code: 'H26.2',
    display: 'Осложненная катаракта',
    system: 'ICD-10' as const,
  },

  /** H26.3 - Катаракта, вызванная лекарственными средствами */
  DRUG_INDUCED: {
    code: 'H26.3',
    display: 'Катаракта, вызванная лекарственными средствами',
    system: 'ICD-10' as const,
  },

  /** H26.4 - Вторичная катаракта */
  SECONDARY: {
    code: 'H26.4',
    display: 'Вторичная катаракта',
    system: 'ICD-10' as const,
  },

  /** H26.8 - Другая уточненная катаракта */
  OTHER_SPECIFIED: {
    code: 'H26.8',
    display: 'Другая уточненная катаракта',
    system: 'ICD-10' as const,
  },

  /** H26.9 - Катаракта неуточненная */
  UNSPECIFIED: {
    code: 'H26.9',
    display: 'Катаракта неуточненная',
    system: 'ICD-10' as const,
  },
} as const;

// ============================================================================
// Дополнительные офтальмологические коды
// ============================================================================

export const OPHTHALMIC_ICD10_CODES = {
  /** H40.1 - Первичная открытоугольная глаукома */
  PRIMARY_OPEN_ANGLE_GLAUCOMA: {
    code: 'H40.1',
    display: 'Первичная открытоугольная глаукома',
    system: 'ICD-10' as const,
  },

  /** H40.2 - Первичная закрытоугольная глаукома */
  PRIMARY_ANGLE_CLOSURE_GLAUCOMA: {
    code: 'H40.2',
    display: 'Первичная закрытоугольная глаукома',
    system: 'ICD-10' as const,
  },

  /** H35.3 - Дегенерация макулы и заднего полюса */
  MACULAR_DEGENERATION: {
    code: 'H35.3',
    display: 'Дегенерация макулы и заднего полюса',
    system: 'ICD-10' as const,
  },

  /** H36.0 - Диабетическая ретинопатия */
  DIABETIC_RETINOPATHY: {
    code: 'H36.0',
    display: 'Диабетическая ретинопатия',
    system: 'ICD-10' as const,
  },
} as const;

// ============================================================================
// Утилиты
// ============================================================================

/**
 * Валидация формата кода МКБ-10
 * Формат: буква + 2 цифры + опционально точка и 1-2 цифры (например, H25.1)
 */
export function validateICD10Code(code: string): boolean {
  const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
  return icd10Pattern.test(code);
}

/**
 * Поиск кодов МКБ-10 по запросу
 * MVP: возвращает предопределенные коды катаракты
 * TODO: В будущем подключить к backend API для полного поиска
 */
export function searchICD10Codes(query: string): ICD10Code[] {
  const lowerQuery = query.toLowerCase();

  // Поиск в кодах катаракты
  const cataractResults = Object.values(CATARACT_ICD10_CODES).filter(
    (code) =>
      code.display.toLowerCase().includes(lowerQuery) ||
      code.code.toLowerCase().includes(lowerQuery)
  );

  // Поиск в других офтальмологических кодах
  const ophthalmicResults = Object.values(OPHTHALMIC_ICD10_CODES).filter(
    (code) =>
      code.display.toLowerCase().includes(lowerQuery) ||
      code.code.toLowerCase().includes(lowerQuery)
  );

  return [...cataractResults, ...ophthalmicResults];
}

/**
 * Получить все коды катаракты
 */
export function getAllCataractCodes(): ICD10Code[] {
  return Object.values(CATARACT_ICD10_CODES);
}

/**
 * Получить код по строковому значению
 */
export function getICD10CodeByCode(code: string): ICD10Code | undefined {
  const allCodes = [
    ...Object.values(CATARACT_ICD10_CODES),
    ...Object.values(OPHTHALMIC_ICD10_CODES),
  ];

  return allCodes.find((c) => c.code === code);
}

/**
 * Форматировать код для отображения
 */
export function formatICD10Code(code: ICD10Code): string {
  return `${code.code} - ${code.display}`;
}
