/**
 * FHIR Mapper Tests
 *
 * Run with: node __tests__/medical-standards/fhir-mapper.test.js
 */

const {
  mapPatientToFHIR,
  mapDiagnosisToFHIR,
  mapProcedureToFHIR,
  mapObservationToFHIR,
  createPatientFHIRBundle,
} = require('../../lib/medical-standards/fhir-mapper');

const { CATARACT_ICD10_CODES } = require('../../lib/medical-standards/icd10');
const { OPHTHALMIC_SNOMED_CODES } = require('../../lib/medical-standards/snomed');
const { OCULAR_BIOMETRY_LOINC_CODES } = require('../../lib/medical-standards/loinc');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.error(`❌ ${message}`);
    failed++;
  }
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.error(`❌ ${message}`);
    console.error(`   Expected: ${JSON.stringify(expected)}`);
    console.error(`   Actual: ${JSON.stringify(actual)}`);
    failed++;
  }
}

console.log('\n🧪 Testing FHIR Mapper\n');

// Mock patient data
const mockPatient = {
  id: 123,
  first_name: 'Иван',
  last_name: 'Иванов',
  middle_name: 'Петрович',
  date_of_birth: '1950-05-15',
  gender: 'male',
  phone: '+79991234567',
  snils: '123-456-789 00',
  oms_policy: '1234567890123456',
  medical_metadata: {
    diagnosisCodes: [CATARACT_ICD10_CODES.SENILE_NUCLEAR],
    procedureCodes: [OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL],
    observations: [
      {
        ...OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
        value: '23.5',
        observedAt: '2026-02-20T10:00:00Z',
      },
    ],
    fhirResourceId: 'patient-123-fhir',
  },
};

// Test 1: Map Patient to FHIR
console.log('Test Group: Patient Mapping');
const fhirPatient = mapPatientToFHIR(mockPatient);

assert(fhirPatient.resourceType === 'Patient', 'Resource type is Patient');
assert(fhirPatient.id === 'patient-123-fhir', 'Patient ID is mapped correctly');
assert(fhirPatient.name.length === 1, 'Has one name entry');
assert(fhirPatient.name[0].family === 'Иванов', 'Family name is correct');
assert(fhirPatient.name[0].given.includes('Иван'), 'Given name includes first name');
assert(fhirPatient.name[0].given.includes('Петрович'), 'Given name includes middle name');
assert(fhirPatient.gender === 'male', 'Gender is mapped correctly');
assert(fhirPatient.birthDate === '1950-05-15', 'Birth date is mapped correctly');
assert(fhirPatient.telecom && fhirPatient.telecom.length === 1, 'Has one telecom entry');
assert(fhirPatient.telecom[0].system === 'phone', 'Telecom system is phone');
assert(fhirPatient.telecom[0].value === '+79991234567', 'Phone number is correct');
assert(fhirPatient.identifier.length >= 1, 'Has at least one identifier');

// Test 2: Map Diagnosis to FHIR
console.log('\nTest Group: Diagnosis Mapping');
const fhirCondition = mapDiagnosisToFHIR(
  mockPatient,
  CATARACT_ICD10_CODES.SENILE_NUCLEAR
);

assert(fhirCondition.resourceType === 'Condition', 'Resource type is Condition');
assert(fhirCondition.subject.reference.includes('patient-123'), 'Subject reference is correct');
assert(fhirCondition.code.coding.length === 1, 'Has one coding');
assert(fhirCondition.code.coding[0].system === 'http://hl7.org/fhir/sid/icd-10', 'ICD-10 system URL is correct');
assert(fhirCondition.code.coding[0].code === 'H25.1', 'Diagnosis code is correct');
assert(fhirCondition.code.coding[0].display.includes('ядерная'), 'Diagnosis display is correct');
assert(fhirCondition.clinicalStatus.coding[0].code === 'active', 'Clinical status is active');

// Test 3: Map Procedure to FHIR
console.log('\nTest Group: Procedure Mapping');
const fhirProcedure = mapProcedureToFHIR(
  mockPatient,
  OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL
);

assert(fhirProcedure.resourceType === 'Procedure', 'Resource type is Procedure');
assert(fhirProcedure.subject.reference.includes('patient-123'), 'Subject reference is correct');
assert(fhirProcedure.code.coding.length === 1, 'Has one coding');
assert(fhirProcedure.code.coding[0].system === 'http://snomed.info/sct', 'SNOMED CT system URL is correct');
assert(fhirProcedure.code.coding[0].code === '172522003', 'Procedure code is correct');
assert(fhirProcedure.code.coding[0].display.includes('Факоэмульсификация'), 'Procedure display is correct');
assert(fhirProcedure.status === 'preparation', 'Procedure status is preparation');

// Test 4: Map Observation to FHIR
console.log('\nTest Group: Observation Mapping');
const loincObs = {
  ...OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
  value: '23.5',
  observedAt: '2026-02-20T10:00:00Z',
};
const fhirObservation = mapObservationToFHIR(mockPatient, loincObs);

assert(fhirObservation.resourceType === 'Observation', 'Resource type is Observation');
assert(fhirObservation.subject.reference.includes('patient-123'), 'Subject reference is correct');
assert(fhirObservation.code.coding.length === 1, 'Has one coding');
assert(fhirObservation.code.coding[0].system === 'http://loinc.org', 'LOINC system URL is correct');
assert(fhirObservation.code.coding[0].code === '79894-2', 'Observation code is correct');
assert(fhirObservation.status === 'final', 'Observation status is final');
assert(fhirObservation.effectiveDateTime === '2026-02-20T10:00:00Z', 'Effective date is correct');
assert(fhirObservation.valueQuantity.value === 23.5, 'Value is correct number');
assert(fhirObservation.valueQuantity.unit === 'mm', 'Unit is correct');

// Test 5: Create FHIR Bundle
console.log('\nTest Group: FHIR Bundle');
const bundle = createPatientFHIRBundle(mockPatient);

assert(bundle.resourceType === 'Bundle', 'Bundle resource type is correct');
assert(bundle.type === 'collection', 'Bundle type is collection');
assert(bundle.entry.length === 4, 'Bundle has 4 entries (Patient, Condition, Procedure, Observation)');

const patientEntry = bundle.entry.find(e => e.resource.resourceType === 'Patient');
assert(patientEntry !== undefined, 'Bundle contains Patient resource');

const conditionEntry = bundle.entry.find(e => e.resource.resourceType === 'Condition');
assert(conditionEntry !== undefined, 'Bundle contains Condition resource');

const procedureEntry = bundle.entry.find(e => e.resource.resourceType === 'Procedure');
assert(procedureEntry !== undefined, 'Bundle contains Procedure resource');

const observationEntry = bundle.entry.find(e => e.resource.resourceType === 'Observation');
assert(observationEntry !== undefined, 'Bundle contains Observation resource');

// Test 6: Patient without medical metadata
console.log('\nTest Group: Patient Without Metadata');
const minimalPatient = {
  id: 456,
  first_name: 'Петр',
  last_name: 'Петров',
  birth_date: '1960-01-01',
  gender: 'male',
};

const minimalFhirPatient = mapPatientToFHIR(minimalPatient);
assert(minimalFhirPatient.resourceType === 'Patient', 'Minimal patient maps to FHIR');
assert(minimalFhirPatient.id.startsWith('patient-456'), 'Generated FHIR ID for patient without metadata');

const minimalBundle = createPatientFHIRBundle(minimalPatient);
assert(minimalBundle.entry.length === 1, 'Minimal bundle has only Patient resource');

// Test 7: Multiple observations
console.log('\nTest Group: Multiple Observations');
const patientWithMultipleObs = {
  ...mockPatient,
  medical_metadata: {
    observations: [
      {
        ...OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
        value: '23.5',
        observedAt: '2026-02-20T10:00:00Z',
      },
      {
        ...OCULAR_BIOMETRY_LOINC_CODES.KERATOMETRY_K1_RIGHT,
        value: '42.5',
        observedAt: '2026-02-20T10:05:00Z',
      },
    ],
  },
};

const multiObsBundle = createPatientFHIRBundle(patientWithMultipleObs);
const obsEntries = multiObsBundle.entry.filter(e => e.resource.resourceType === 'Observation');
assert(obsEntries.length === 2, 'Bundle contains 2 Observation resources');

// Test 8: Female patient
console.log('\nTest Group: Gender Mapping');
const femalePatient = {
  ...mockPatient,
  gender: 'female',
};
const femaleFhirPatient = mapPatientToFHIR(femalePatient);
assert(femaleFhirPatient.gender === 'female', 'Female gender is mapped correctly');

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
