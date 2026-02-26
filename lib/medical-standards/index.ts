/**
 * Medical Standards Module
 *
 * Экспорты для работы с медицинскими стандартами (HL7/FHIR, МКБ-10, SNOMED CT, LOINC)
 */

// Types
export type {
  ICD10Code,
  SNOMEDCode,
  LOINCCode,
  MedicalExtension,
  FHIRReference,
  EMIASMetadata,
  RIAMSMetadata,
  MedicalStandardsMetadata,
  FHIRPatient,
  FHIRCondition,
  FHIRProcedure,
  FHIRObservation,
  FHIRBundle,
} from './types';

// ICD-10
export {
  CATARACT_ICD10_CODES,
  OPHTHALMIC_ICD10_CODES,
  validateICD10Code,
  searchICD10Codes,
  getAllCataractCodes,
  getICD10CodeByCode,
  formatICD10Code,
} from './icd10';

// SNOMED CT
export {
  OPHTHALMIC_SNOMED_CODES,
  DIAGNOSTIC_SNOMED_CODES,
  validateSNOMEDCode,
  searchSNOMEDCodes,
  getAllProcedureCodes,
  getAllDiagnosticCodes,
  getSNOMEDCodeByCode,
  formatSNOMEDCode,
} from './snomed';

// LOINC
export {
  OCULAR_BIOMETRY_LOINC_CODES,
  VISION_LOINC_CODES,
  validateLOINCCode,
  searchLOINCCodes,
  getAllBiometryCodes,
  getAllVisionCodes,
  getLOINCCodeByCode,
  formatLOINCCode,
  createLOINCObservation,
} from './loinc';

// FHIR Mapper
export {
  mapPatientToFHIR,
  mapDiagnosisToFHIR,
  mapProcedureToFHIR,
  mapObservationToFHIR,
  createPatientFHIRBundle,
  validateFHIRPatient,
  validateFHIRBundle,
} from './fhir-mapper';
