/**
 * SNOMED CT Utilities
 *
 * Утилиты для работы с кодами SNOMED CT (Систематизированная номенклатура медицины)
 */

import { SNOMEDCode } from './types';

// ============================================================================
// Предопределенные коды офтальмологических процедур
// ============================================================================

export const OPHTHALMIC_SNOMED_CODES = {
  /** 54885007 - Экстракция катаракты */
  CATARACT_EXTRACTION: {
    code: '54885007',
    display: 'Экстракция катаракты',
    system: 'SNOMED-CT' as const,
  },

  /** 231744001 - Факоэмульсификация катаракты */
  PHACOEMULSIFICATION: {
    code: '231744001',
    display: 'Факоэмульсификация катаракты',
    system: 'SNOMED-CT' as const,
  },

  /** 397544007 - Экстракапсулярная экстракция катаракты */
  EXTRACAPSULAR_EXTRACTION: {
    code: '397544007',
    display: 'Экстракапсулярная экстракция катаракты',
    system: 'SNOMED-CT' as const,
  },

  /** 46309007 - Интракапсулярная экстракция катаракты */
  INTRACAPSULAR_EXTRACTION: {
    code: '46309007',
    display: 'Интракапсулярная экстракция катаракты',
    system: 'SNOMED-CT' as const,
  },

  /** 308694008 - Имплантация интраокулярной линзы */
  IOL_IMPLANTATION: {
    code: '308694008',
    display: 'Имплантация интраокулярной линзы',
    system: 'SNOMED-CT' as const,
  },

  /** 172522003 - Факоэмульсификация с имплантацией ИОЛ */
  PHACO_WITH_IOL: {
    code: '172522003',
    display: 'Факоэмульсификация с имплантацией ИОЛ',
    system: 'SNOMED-CT' as const,
  },

  /** 231745000 - Лазерная капсулотомия */
  LASER_CAPSULOTOMY: {
    code: '231745000',
    display: 'Лазерная капсулотомия',
    system: 'SNOMED-CT' as const,
  },

  /** 397193006 - Витрэктомия */
  VITRECTOMY: {
    code: '397193006',
    display: 'Витрэктомия',
    system: 'SNOMED-CT' as const,
  },

  /** 29178003 - Трабекулэктомия */
  TRABECULECTOMY: {
    code: '29178003',
    display: 'Трабекулэктомия',
    system: 'SNOMED-CT' as const,
  },

  /** 397544007 - Лазерная иридотомия */
  LASER_IRIDOTOMY: {
    code: '397544007',
    display: 'Лазерная иридотомия',
    system: 'SNOMED-CT' as const,
  },
} as const;

// ============================================================================
// Коды диагностических процедур
// ============================================================================

export const DIAGNOSTIC_SNOMED_CODES = {
  /** 252779009 - Биометрия глаза */
  OCULAR_BIOMETRY: {
    code: '252779009',
    display: 'Биометрия глаза',
    system: 'SNOMED-CT' as const,
  },

  /** 252816007 - Кератометрия */
  KERATOMETRY: {
    code: '252816007',
    display: 'Кератометрия',
    system: 'SNOMED-CT' as const,
  },

  /** 252817003 - Пахиметрия роговицы */
  PACHYMETRY: {
    code: '252817003',
    display: 'Пахиметрия роговицы',
    system: 'SNOMED-CT' as const,
  },

  /** 252818008 - Оптическая когерентная томография */
  OCT: {
    code: '252818008',
    display: 'Оптическая когерентная томография',
    system: 'SNOMED-CT' as const,
  },

  /** 252819000 - Флюоресцентная ангиография */
  FLUORESCEIN_ANGIOGRAPHY: {
    code: '252819000',
    display: 'Флюоресцентная ангиография',
    system: 'SNOMED-CT' as const,
  },
} as const;

// ============================================================================
// Утилиты
// ============================================================================

/**
 * Валидация формата кода SNOMED CT
 * Формат: 6-18 цифр
 */
export function validateSNOMEDCode(code: string): boolean {
  const snomedPattern = /^\d{6,18}$/;
  return snomedPattern.test(code);
}

/**
 * Поиск кодов SNOMED CT по запросу
 * MVP: возвращает предопределенные коды процедур
 * TODO: В будущем подключить к backend API для полного поиска
 */
export function searchSNOMEDCodes(query: string): SNOMEDCode[] {
  const lowerQuery = query.toLowerCase();

  // Поиск в процедурах
  const procedureResults = Object.values(OPHTHALMIC_SNOMED_CODES).filter(
    (code) =>
      code.display.toLowerCase().includes(lowerQuery) ||
      code.code.includes(lowerQuery)
  );

  // Поиск в диагностических процедурах
  const diagnosticResults = Object.values(DIAGNOSTIC_SNOMED_CODES).filter(
    (code) =>
      code.display.toLowerCase().includes(lowerQuery) ||
      code.code.includes(lowerQuery)
  );

  return [...procedureResults, ...diagnosticResults];
}

/**
 * Получить все коды процедур
 */
export function getAllProcedureCodes(): SNOMEDCode[] {
  return Object.values(OPHTHALMIC_SNOMED_CODES);
}

/**
 * Получить все коды диагностических процедур
 */
export function getAllDiagnosticCodes(): SNOMEDCode[] {
  return Object.values(DIAGNOSTIC_SNOMED_CODES);
}

/**
 * Получить код по строковому значению
 */
export function getSNOMEDCodeByCode(code: string): SNOMEDCode | undefined {
  const allCodes = [
    ...Object.values(OPHTHALMIC_SNOMED_CODES),
    ...Object.values(DIAGNOSTIC_SNOMED_CODES),
  ];

  return allCodes.find((c) => c.code === code);
}

/**
 * Форматировать код для отображения
 */
export function formatSNOMEDCode(code: SNOMEDCode): string {
  return `${code.code} - ${code.display}`;
}
