/**
 * RIAMS Integration Tests
 *
 * Run with: node __tests__/integrations/riams.test.js
 */

const {
  validateForRIAMS,
  prepareRIAMSExport,
  mapPatientToRIAMS,
  RIAMS_REGIONS,
} = require('../../lib/integrations/riams');

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

console.log('\n🧪 Testing RIAMS Integration\n');

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

// Test 1: Supported regions
console.log('Test Group: Supported Regions');
const regions = RIAMS_REGIONS;
assert(regions.length === 10, 'Has 10 supported regions');
assert(regions.some(r => r.code === '77'), 'Includes Moscow (77)');
assert(regions.some(r => r.code === '78'), 'Includes St. Petersburg (78)');
assert(regions.some(r => r.code === '50'), 'Includes Moscow Oblast (50)');
assert(regions.every(r => r.code && r.name), 'All regions have code and name');

// Test 2: Validation - Valid patient with region
console.log('\nTest Group: Validation - Valid Patient');
const validResult = validateForRIAMS(validPatient, '77');
assert(validResult.valid === true, 'Valid patient with Moscow region passes validation');
assert(validResult.errors.length === 0, 'Valid patient has no errors');

// Test 3: Validation - Invalid region
console.log('\nTest Group: Validation - Invalid Region');
const invalidRegionResult = validateForRIAMS(validPatient, '99');
assert(invalidRegionResult.valid === false, 'Invalid region code fails validation');
assert(invalidRegionResult.errors.some(e => e.includes('Регион')), 'Error mentions region');

const noRegionResult = validateForRIAMS(validPatient, '');
assert(noRegionResult.valid === false, 'Empty region code fails validation');

// Test 4: Validation - Missing required fields
console.log('\nTest Group: Validation - Missing Fields');

const noFirstName = { ...validPatient, first_name: '' };
const result1 = validateForRIAMS(noFirstName, '77');
assert(result1.valid === false, 'Patient without first name fails validation');
assert(result1.errors.some(e => e.includes('ФИО')), 'Error mentions full name');

const noLastName = { ...validPatient, last_name: '' };
const result2 = validateForRIAMS(noLastName, '77');
assert(result2.valid === false, 'Patient without last name fails validation');
assert(result2.errors.some(e => e.includes('ФИО')), 'Error mentions full name');

const noBirthDate = { ...validPatient, date_of_birth: undefined };
const result3 = validateForRIAMS(noBirthDate, '77');
assert(result3.valid === false, 'Patient without birth date fails validation');
assert(result3.errors.some(e => e.includes('Дата рождения')), 'Error mentions birth date');

const noGender = { ...validPatient, gender: undefined };
const result4 = validateForRIAMS(noGender, '77');
assert(result4.valid === false, 'Patient without gender fails validation');
assert(result4.errors.some(e => e.includes('Пол')), 'Error mentions gender');

// Test 5: Validation - Optional fields
console.log('\nTest Group: Validation - Optional Fields');

const noSNILS = { ...validPatient, snils: undefined };
const result5 = validateForRIAMS(noSNILS, '77');
assert(result5.valid === true, 'Patient without SNILS passes validation');
assert(result5.warnings.some(w => w.includes('СНИЛС')), 'Warning mentions SNILS');

const noOMS = { ...validPatient, oms_policy: undefined };
const result6 = validateForRIAMS(noOMS, '77');
assert(result6.valid === true, 'Patient without OMS passes validation');
assert(result6.warnings.some(w => w.includes('ОМС')), 'Warning mentions OMS');

// Test 6: Map patient to RIAMS format
console.log('\nTest Group: Patient Mapping');
const riamsData = mapPatientToRIAMS(validPatient, '77');

assert(riamsData.fullName !== undefined, 'Full name is present');
assert(riamsData.fullName.includes('Иванов'), 'Full name includes last name');
assert(riamsData.fullName.includes('Иван'), 'Full name includes first name');
assert(riamsData.birthDate === '1950-05-15', 'Birth date is mapped');
assert(riamsData.gender === 'M', 'Gender is mapped to M');
assert(riamsData.snils === '123-456-789 00', 'SNILS is mapped');
assert(riamsData.oms === '1234567890123456', 'OMS policy is mapped');
assert(riamsData.phone === '+79991234567', 'Phone is mapped');
assert(riamsData.regionCode === '77', 'Region code is mapped');

// Test 7: Medical metadata mapping
console.log('\nTest Group: Medical Metadata Mapping');
assert(riamsData.diagnosisCode !== undefined, 'Diagnosis code is present');
assert(riamsData.diagnosisCode === 'H25.1', 'Diagnosis code is mapped');
assert(riamsData.procedureCode !== undefined, 'Procedure code is present');
assert(riamsData.procedureCode === '172522003', 'Procedure code is mapped');

// Test 8: Prepare export data
console.log('\nTest Group: Prepare Export');
const exportData = prepareRIAMSExport(validPatient, '78');

assert(exportData.data !== undefined, 'Export has data');
assert(exportData.data.fullName.includes('Иванов'), 'Export data is correct');
assert(exportData.data.regionCode === '78', 'Export has correct region code');
assert(exportData.validation !== undefined, 'Export has validation');
assert(exportData.validation.valid === true, 'Export validation passes');
assert(exportData.validation.system === 'riams', 'Export system is RIAMS');

// Test 9: Different regions
console.log('\nTest Group: Different Regions');
const moscowData = mapPatientToRIAMS(validPatient, '77');
const spbData = mapPatientToRIAMS(validPatient, '78');
const krasnoyarskData = mapPatientToRIAMS(validPatient, '23');

assert(moscowData.regionCode === '77', 'Moscow region code is correct');
assert(spbData.regionCode === '78', 'St. Petersburg region code is correct');
assert(krasnoyarskData.regionCode === '23', 'Krasnoyarsk region code is correct');

// Test 10: Patient without medical metadata
console.log('\nTest Group: Patient Without Medical Metadata');
const minimalPatient = {
  id: 456,
  first_name: 'Петр',
  last_name: 'Петров',
  date_of_birth: '1960-01-01',
  gender: 'male',
};

const minimalRiamsData = mapPatientToRIAMS(minimalPatient, '77');
assert(minimalRiamsData.fullName.includes('Петров'), 'Minimal patient is mapped');
assert(minimalRiamsData.diagnosisCode === undefined, 'No diagnosis for minimal patient');
assert(minimalRiamsData.procedureCode === undefined, 'No procedures for minimal patient');

const minimalValidation = validateForRIAMS(minimalPatient, '77');
assert(minimalValidation.valid === true, 'Minimal patient passes validation');

// Test 11: Region name lookup
console.log('\nTest Group: Region Names');
const moscowRegion = regions.find(r => r.code === '77');
assert(moscowRegion.name === 'Москва', 'Moscow region name is correct');

const spbRegion = regions.find(r => r.code === '78');
assert(spbRegion.name === 'Санкт-Петербург', 'St. Petersburg region name is correct');

const moscowOblastRegion = regions.find(r => r.code === '50');
assert(moscowOblastRegion.name === 'Московская область', 'Moscow Oblast region name is correct');

// Test 12: Gender mapping
console.log('\nTest Group: Gender Mapping');
const femalePatient = { ...validPatient, gender: 'female' };
const femaleData = mapPatientToRIAMS(femalePatient, '77');
assert(femaleData.gender === 'F', 'Female gender is mapped to F');

// Test 14: Validation with multiple errors
console.log('\nTest Group: Multiple Validation Errors');
const invalidPatient = {
  id: 789,
  first_name: '',
  last_name: '',
  birth_date: undefined,
  gender: undefined,
};

const multiErrorResult = validateForRIAMS(invalidPatient, '99');
assert(multiErrorResult.valid === false, 'Invalid patient fails validation');
assert(multiErrorResult.errors.length >= 5, 'Has multiple errors (including region)');

// Test 15: All supported regions validation
console.log('\nTest Group: All Regions Validation');
regions.forEach(region => {
  const result = validateForRIAMS(validPatient, region.code);
  assert(
    result.valid === true,
    `Valid patient passes validation for region ${region.code} (${region.name})`
  );
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
