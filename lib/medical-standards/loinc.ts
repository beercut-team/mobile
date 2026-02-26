/**
 * LOINC Utilities
 *
 * Утилиты для работы с кодами LOINC (Логическая система идентификации наблюдений)
 * Используется для кодирования измерений и наблюдений (например, биометрия глаза для ИОЛ)
 */

import { LOINCCode } from './types';

// ============================================================================
// Предопределенные коды для биометрии глаза
// ============================================================================

export const OCULAR_BIOMETRY_LOINC_CODES = {
  /** 79893-4 - Длина оси левого глаза */
  AXIAL_LENGTH_LEFT: {
    code: '79893-4',
    display: 'Длина оси левого глаза',
    system: 'LOINC' as const,
    unit: 'mm',
  },

  /** 79894-2 - Длина оси правого глаза */
  AXIAL_LENGTH_RIGHT: {
    code: '79894-2',
    display: 'Длина оси правого глаза',
    system: 'LOINC' as const,
    unit: 'mm',
  },

  /** 79895-9 - Кератометрия K1 левого глаза */
  KERATOMETRY_K1_LEFT: {
    code: '79895-9',
    display: 'Кератометрия K1 левого глаза',
    system: 'LOINC' as const,
    unit: 'D',
  },

  /** 79896-7 - Кератометрия K2 левого глаза */
  KERATOMETRY_K2_LEFT: {
    code: '79896-7',
    display: 'Кератометрия K2 левого глаза',
    system: 'LOINC' as const,
    unit: 'D',
  },

  /** 79897-5 - Кератометрия K1 правого глаза */
  KERATOMETRY_K1_RIGHT: {
    code: '79897-5',
    display: 'Кератометрия K1 правого глаза',
    system: 'LOINC' as const,
    unit: 'D',
  },

  /** 79898-3 - Кератометрия K2 правого глаза */
  KERATOMETRY_K2_RIGHT: {
    code: '79898-3',
    display: 'Кератометрия K2 правого глаза',
    system: 'LOINC' as const,
    unit: 'D',
  },

  /** 79899-1 - Глубина передней камеры левого глаза */
  ACD_LEFT: {
    code: '79899-1',
    display: 'Глубина передней камеры левого глаза',
    system: 'LOINC' as const,
    unit: 'mm',
  },

  /** 79900-7 - Глубина передней камеры правого глаза */
  ACD_RIGHT: {
    code: '79900-7',
    display: 'Глубина передней камеры правого глаза',
    system: 'LOINC' as const,
    unit: 'mm',
  },

  /** 79901-5 - Толщина хрусталика левого глаза */
  LENS_THICKNESS_LEFT: {
    code: '79901-5',
    display: 'Толщина хрусталика левого глаза',
    system: 'LOINC' as const,
    unit: 'mm',
  },

  /** 79902-3 - Толщина хрусталика правого глаза */
  LENS_THICKNESS_RIGHT: {
    code: '79902-3',
    display: 'Толщина хрусталика правого глаза',
    system: 'LOINC' as const,
    unit: 'mm',
  },
} as const;

// ============================================================================
// Коды для рефракции и остроты зрения
// ============================================================================

export const VISION_LOINC_CODES = {
  /** 79903-1 - Острота зрения левого глаза */
  VISUAL_ACUITY_LEFT: {
    code: '79903-1',
    display: 'Острота зрения левого глаза',
    system: 'LOINC' as const,
    unit: '',
  },

  /** 79904-9 - Острота зрения правого глаза */
  VISUAL_ACUITY_RIGHT: {
    code: '79904-9',
    display: 'Острота зрения правого глаза',
    system: 'LOINC' as const,
    unit: '',
  },

  /** 79905-6 - Сферический эквивалент левого глаза */
  SPHERICAL_EQUIVALENT_LEFT: {
    code: '79905-6',
    display: 'Сферический эквивалент левого глаза',
    system: 'LOINC' as const,
    unit: 'D',
  },

  /** 79906-4 - Сферический эквивалент правого глаза */
  SPHERICAL_EQUIVALENT_RIGHT: {
    code: '79906-4',
    display: 'Сферический эквивалент правого глаза',
    system: 'LOINC' as const,
    unit: 'D',
  },

  /** 79907-2 - Внутриглазное давление левого глаза */
  IOP_LEFT: {
    code: '79907-2',
    display: 'Внутриглазное давление левого глаза',
    system: 'LOINC' as const,
    unit: 'mmHg',
  },

  /** 79908-0 - Внутриглазное давление правого глаза */
  IOP_RIGHT: {
    code: '79908-0',
    display: 'Внутриглазное давление правого глаза',
    system: 'LOINC' as const,
    unit: 'mmHg',
  },
} as const;

// ============================================================================
// Утилиты
// ============================================================================

/**
 * Валидация формата кода LOINC
 * Формат: 1-5 цифр + дефис + контрольная цифра (например, 79893-4)
 */
export function validateLOINCCode(code: string): boolean {
  const loincPattern = /^\d{1,5}-\d$/;
  return loincPattern.test(code);
}

/**
 * Поиск кодов LOINC по запросу
 * MVP: возвращает предопределенные коды биометрии
 * TODO: В будущем подключить к backend API для полного поиска
 */
export function searchLOINCCodes(query: string): LOINCCode[] {
  const lowerQuery = query.toLowerCase();

  // Поиск в кодах биометрии
  const biometryResults = Object.values(OCULAR_BIOMETRY_LOINC_CODES).filter(
    (code) =>
      code.display.toLowerCase().includes(lowerQuery) ||
      code.code.includes(lowerQuery)
  );

  // Поиск в кодах зрения
  const visionResults = Object.values(VISION_LOINC_CODES).filter(
    (code) =>
      code.display.toLowerCase().includes(lowerQuery) ||
      code.code.includes(lowerQuery)
  );

  return [...biometryResults, ...visionResults];
}

/**
 * Получить все коды биометрии
 */
export function getAllBiometryCodes(): LOINCCode[] {
  return Object.values(OCULAR_BIOMETRY_LOINC_CODES);
}

/**
 * Получить все коды зрения
 */
export function getAllVisionCodes(): LOINCCode[] {
  return Object.values(VISION_LOINC_CODES);
}

/**
 * Получить код по строковому значению
 */
export function getLOINCCodeByCode(code: string): LOINCCode | undefined {
  const allCodes = [
    ...Object.values(OCULAR_BIOMETRY_LOINC_CODES),
    ...Object.values(VISION_LOINC_CODES),
  ];

  return allCodes.find((c) => c.code === code);
}

/**
 * Форматировать код для отображения
 */
export function formatLOINCCode(code: LOINCCode): string {
  const valueStr = code.value ? ` = ${code.value} ${code.unit || ''}` : '';
  return `${code.code} - ${code.display}${valueStr}`;
}

/**
 * Создать наблюдение LOINC с значением
 */
export function createLOINCObservation(
  code: LOINCCode,
  value: string,
  observedAt?: string
): LOINCCode {
  return {
    ...code,
    value,
    observedAt: observedAt || new Date().toISOString(),
  };
}
