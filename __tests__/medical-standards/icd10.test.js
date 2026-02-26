/**
 * ICD-10 Utilities Tests
 *
 * Run with: node __tests__/medical-standards/icd10.test.js
 */

const {
  CATARACT_ICD10_CODES,
  OPHTHALMIC_ICD10_CODES,
  validateICD10Code,
  formatICD10Code,
  searchICD10Codes,
  getAllCataractCodes,
  getICD10CodeByCode,
} = require('../../lib/medical-standards/icd10');

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

console.log('\n🧪 Testing ICD-10 Utilities\n');

// Test 1: Predefined codes exist
console.log('Test Group: Predefined Codes');
assert(
  CATARACT_ICD10_CODES.SENILE_NUCLEAR.code === 'H25.1',
  'SENILE_NUCLEAR code is H25.1'
);
assert(
  CATARACT_ICD10_CODES.SENILE_NUCLEAR.display.includes('ядерная'),
  'SENILE_NUCLEAR has correct display text'
);
assert(
  Object.keys(CATARACT_ICD10_CODES).length === 12,
  'Has 12 cataract codes'
);
assert(
  Object.keys(OPHTHALMIC_ICD10_CODES).length === 4,
  'Has 4 additional ophthalmic codes'
);

// Test 2: Validation
console.log('\nTest Group: Validation');
assert(validateICD10Code('H25.1'), 'Valid code H25.1 passes validation');
assert(validateICD10Code('H26.2'), 'Valid code H26.2 passes validation');
assert(validateICD10Code('H40.1'), 'Valid code H40.1 passes validation');
assert(!validateICD10Code(''), 'Empty string fails validation');
assert(!validateICD10Code('ABC'), 'Invalid format fails validation');
assert(!validateICD10Code('H'), 'Incomplete code fails validation');
assert(!validateICD10Code('H25'), 'Code without subcategory fails validation');

// Test 3: Formatting
console.log('\nTest Group: Formatting');
const testCode = CATARACT_ICD10_CODES.SENILE_NUCLEAR;
assertEquals(
  formatICD10Code(testCode),
  'H25.1 - Старческая ядерная катаракта',
  'Code is formatted correctly'
);

// Test 4: Search functionality
console.log('\nTest Group: Search');
const cataractResults = searchICD10Codes('катаракта');
assert(cataractResults.length > 0, 'Search for "катаракта" returns results');
assert(
  cataractResults.some(c => c.code === 'H25.1'),
  'Search results include H25.1'
);

const nuclearResults = searchICD10Codes('ядерная');
assert(nuclearResults.length > 0, 'Search for "ядерная" returns results');
assert(
  nuclearResults[0].code === 'H25.1',
  'Search for "ядерная" returns nuclear cataract first'
);

const codeResults = searchICD10Codes('H25.1');
assert(codeResults.length > 0, 'Search by code returns results');
assert(codeResults[0].code === 'H25.1', 'Search by code finds exact match');

const emptyResults = searchICD10Codes('');
assert(emptyResults.length === 0, 'Empty search returns no results');

const noMatchResults = searchICD10Codes('xyz123');
assert(noMatchResults.length === 0, 'Non-matching search returns no results');

// Test 5: Case insensitive search
console.log('\nTest Group: Case Insensitive Search');
const upperResults = searchICD10Codes('КАТАРАКТА');
const lowerResults = searchICD10Codes('катаракта');
assertEquals(
  upperResults.length,
  lowerResults.length,
  'Uppercase and lowercase searches return same count'
);

// Test 6: Get all codes
console.log('\nTest Group: Get All Codes');
const allCodes = [
  ...Object.values(CATARACT_ICD10_CODES),
  ...Object.values(OPHTHALMIC_ICD10_CODES),
];
assert(allCodes.length === 16, 'getAllCataractCodes returns 16 total codes');
assert(
  allCodes.every(c => c.code && c.display && c.system === 'ICD-10'),
  'All codes have required fields'
);

// Test 7: Code structure validation
console.log('\nTest Group: Code Structure');
allCodes.forEach(code => {
  assert(
    /^[A-Z]\d{2}\.\d$/.test(code.code),
    `Code ${code.code} matches ICD-10 format`
  );
  assert(
    code.display.length > 0,
    `Code ${code.code} has non-empty display text`
  );
});

// Test 8: Unique codes
console.log('\nTest Group: Uniqueness');
const codes = allCodes.map(c => c.code);
const uniqueCodes = [...new Set(codes)];
assertEquals(
  codes.length,
  uniqueCodes.length,
  'All codes are unique'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
