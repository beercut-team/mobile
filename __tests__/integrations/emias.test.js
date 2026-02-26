/**
 * EMIAS Integration Tests
 *
 * Run with: node __tests__/integrations/emias.test.js
 */

const {
  validateForEMIAS,
  prepareEMIASExport,
  mapPatientToEMIAS,
} = require('../../lib/integrations/emias');

const { CATARACT_ICD10_CODES } = require('../../lib/medical-standards/icd10');
const { OPHTHALMIC_SNOMED_CODES } = require('../../lib/medical-standards/snomed');

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

console.log('\n🧪 Testing EMIAS Integration\n');

// Mock patient data
const validPatient = {
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
  },
};

// Test 1: Validation - Valid patient
console.log('Test Group: Validation - Valid Patient');
const validResult = validateForEMIAS(validPatient);
assert(validResult.valid === true, 'Valid patient passes validation');
assert(validResult.errors.length === 0, 'Valid patient has no errors');

// Test 2: Validation - Missing required fields
console.log('\nTest Group: Validation - Missing Fields');

const noFirstName = { ...validPatient, first_name: '' };
const result1 = validateForEMIAS(noFirstName);
assert(result1.valid === false, 'Patient without first name fails validation');
assert(result1.errors.some(e => e.includes('ФИО')), 'Error mentions full name');

const noLastName = { ...validPatient, last_name: '' };
const result2 = validateForEMIAS(noLastName);
assert(result2.valid === false, 'Patient without last name fails validation');
assert(result2.errors.some(e => e.includes('ФИО')), 'Error mentions full name');

const noBirthDate = { ...validPatient, date_of_birth: undefined };
const result3 = validateForEMIAS(noBirthDate);
assert(result3.valid === false, 'Patient without birth date fails validation');
assert(result3.errors.some(e => e.includes('Дата рождения')), 'Error mentions birth date');

const noGender = { ...validPatient, gender: undefined };
const result4 = validateForEMIAS(noGender);
assert(result4.valid === false, 'Patient without gender fails validation');
assert(result4.errors.some(e => e.includes('Пол')), 'Error mentions gender');

// Test 3: Validation - Optional fields
console.log('\nTest Group: Validation - Optional Fields');

const noSNILS = { ...validPatient, snils: undefined };
const result5 = validateForEMIAS(noSNILS);
assert(result5.valid === true, 'Patient without SNILS passes validation');
assert(result5.warnings.some(w => w.includes('СНИЛС')), 'Warning mentions SNILS');

const noOMS = { ...validPatient, oms_policy: undefined };
const result6 = validateForEMIAS(noOMS);
assert(result6.valid === true, 'Patient without OMS passes validation');
assert(result6.warnings.some(w => w.includes('ОМС')), 'Warning mentions OMS');

// Test 4: Map patient to EMIAS format
console.log('\nTest Group: Patient Mapping');
const emiasData = mapPatientToEMIAS(validPatient);

assert(emiasData.fullName !== undefined, 'Full name is present');
assert(emiasData.fullName.includes('Иванов'), 'Full name includes last name');
assert(emiasData.fullName.includes('Иван'), 'Full name includes first name');
assert(emiasData.birthDate === '1950-05-15', 'Birth date is mapped');
assert(emiasData.gender === 'M', 'Gender is mapped to M');
assert(emiasData.snils === '123-456-789 00', 'SNILS is mapped');
assert(emiasData.oms === '1234567890123456', 'OMS policy is mapped');
assert(emiasData.phone === '+79991234567', 'Phone is mapped');

// Test 5: Medical metadata mapping
console.log('\nTest Group: Medical Metadata Mapping');
assert(emiasData.diagnosisCode !== undefined, 'Diagnosis code is present');
assert(emiasData.diagnosisCode === 'H25.1', 'Diagnosis code is mapped');
assert(emiasData.procedureCode !== undefined, 'Procedure code is present');
assert(emiasData.procedureCode === '172522003', 'Procedure code is mapped');

// Test 6: Prepare export data
console.log('\nTest Group: Prepare Export');
const exportData = prepareEMIASExport(validPatient);

assert(exportData.data !== undefined, 'Export has data');
assert(exportData.data.fullName.includes('Иванов'), 'Export data is correct');
assert(exportData.validation !== undefined, 'Export has validation');
assert(exportData.validation.valid === true, 'Export validation passes');
assert(exportData.validation.system === 'emias', 'Export system is EMIAS');

// Test 7: Patient without medical metadata
console.log('\nTest Group: Patient Without Medical Metadata');
const minimalPatient = {
  id: 456,
  first_name: 'Петр',
  last_name: 'Петров',
  date_of_birth: '1960-01-01',
  gender: 'male',
};

const minimalEmiasData = mapPatientToEMIAS(minimalPatient);
assert(minimalEmiasData.fullName.includes('Петров'), 'Minimal patient is mapped');
assert(minimalEmiasData.diagnosisCode === undefined, 'No diagnosis for minimal patient');
assert(minimalEmiasData.procedureCode === undefined, 'No procedures for minimal patient');

const minimalValidation = validateForEMIAS(minimalPatient);
assert(minimalValidation.valid === true, 'Minimal patient passes validation');

// Test 8: Gender mapping
console.log('\nTest Group: Gender Mapping');
const femalePatient = { ...validPatient, gender: 'female' };
const femaleData = mapPatientToEMIAS(femalePatient);
assert(femaleData.gender === 'F', 'Female gender is mapped to F');

// Test 10: Empty strings vs undefined
console.log('\nTest Group: Empty Strings');
const emptyStringPatient = {
  ...validPatient,
  middle_name: '',
  snils: '',
  oms_policy: '',
};

const emptyStringData = mapPatientToEMIAS(emptyStringPatient);
assert(emptyStringData.middleName === '', 'Empty middle name is preserved');
assert(emptyStringData.snils === '', 'Empty SNILS is preserved');
assert(emptyStringData.omsPolicy === '', 'Empty OMS is preserved');

const emptyStringValidation = validateForEMIAS(emptyStringPatient);
assert(emptyStringValidation.valid === true, 'Patient with empty optional fields passes validation');

// Test 11: Validation with multiple errors
console.log('\nTest Group: Multiple Validation Errors');
const invalidPatient = {
  id: 789,
  first_name: '',
  last_name: '',
  birth_date: undefined,
  gender: undefined,
};

const multiErrorResult = validateForEMIAS(invalidPatient);
assert(multiErrorResult.valid === false, 'Invalid patient fails validation');
assert(multiErrorResult.errors.length >= 4, 'Has multiple errors');

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
