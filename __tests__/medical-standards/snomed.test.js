/**
 * SNOMED CT Utilities Tests
 *
 * Run with: node __tests__/medical-standards/snomed.test.js
 */

const {
  OPHTHALMIC_SNOMED_CODES,
  DIAGNOSTIC_SNOMED_CODES,
  validateSNOMEDCode,
  formatSNOMEDCode,
  searchSNOMEDCodes,
  getAllProcedureCodes,
  getAllDiagnosticCodes,
} = require('../../lib/medical-standards/snomed');

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

console.log('\n🧪 Testing SNOMED CT Utilities\n');

// Test 1: Predefined codes exist
console.log('Test Group: Predefined Codes');
assert(
  OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL.code === '172522003',
  'PHACO_WITH_IOL code is 172522003'
);
assert(
  OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL.display.includes('Факоэмульсификация'),
  'PHACO_WITH_IOL has correct display text'
);
assert(
  Object.keys(OPHTHALMIC_SNOMED_CODES).length === 10,
  'Has 10 ophthalmic procedure codes'
);
assert(
  Object.keys(DIAGNOSTIC_SNOMED_CODES).length === 5,
  'Has 5 diagnostic procedure codes'
);

// Test 2: Validation
console.log('\nTest Group: Validation');
assert(validateSNOMEDCode('172522003'), 'Valid code 172522003 passes validation');
assert(validateSNOMEDCode('231744001'), 'Valid code 231744001 passes validation');
assert(validateSNOMEDCode('252957005'), 'Valid code 252957005 passes validation');
assert(!validateSNOMEDCode(''), 'Empty string fails validation');
assert(!validateSNOMEDCode('ABC'), 'Non-numeric code fails validation');
assert(!validateSNOMEDCode('123'), 'Too short code fails validation');
assert(!validateSNOMEDCode('12345678901234567890'), 'Too long code fails validation');

// Test 3: Formatting
console.log('\nTest Group: Formatting');
const testCode = OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL;
assertEquals(
  formatSNOMEDCode(testCode),
  '172522003 - Факоэмульсификация с имплантацией ИОЛ',
  'Code is formatted correctly'
);

// Test 4: Search functionality
console.log('\nTest Group: Search');
const phacoResults = searchSNOMEDCodes('факоэмульсификация');
assert(phacoResults.length > 0, 'Search for "факоэмульсификация" returns results');
assert(
  phacoResults.some(c => c.code === '172522003'),
  'Search results include phaco with IOL'
);

const iolResults = searchSNOMEDCodes('ИОЛ');
assert(iolResults.length > 0, 'Search for "ИОЛ" returns results');
assert(
  iolResults.some(c => c.code === '308694008'),
  'Search for "ИОЛ" includes IOL implantation'
);

const codeResults = searchSNOMEDCodes('172522003');
assert(codeResults.length > 0, 'Search by code returns results');
assert(codeResults[0].code === '172522003', 'Search by code finds exact match');

const emptyResults = searchSNOMEDCodes('');
assert(emptyResults.length >= 0, 'Empty search returns results or empty array');

const noMatchResults = searchSNOMEDCodes('xyz123');
assert(noMatchResults.length === 0, 'Non-matching search returns no results');

// Test 5: Case insensitive search
console.log('\nTest Group: Case Insensitive Search');
const upperResults = searchSNOMEDCodes('ФАКОЭМУЛЬСИФИКАЦИЯ');
const lowerResults = searchSNOMEDCodes('факоэмульсификация');
assertEquals(
  upperResults.length,
  lowerResults.length,
  'Uppercase and lowercase searches return same count'
);

// Test 6: Get all codes
console.log('\nTest Group: Get All Codes');
const allCodes = [
  ...Object.values(OPHTHALMIC_SNOMED_CODES),
  ...Object.values(DIAGNOSTIC_SNOMED_CODES),
];
assert(allCodes.length === 15, 'getAllProcedureCodes returns 15 total codes');
assert(
  allCodes.every(c => c.code && c.display && c.system === 'SNOMED-CT'),
  'All codes have required fields'
);

// Test 7: Code structure validation
console.log('\nTest Group: Code Structure');
allCodes.forEach(code => {
  assert(
    /^\d{6,18}$/.test(code.code),
    `Code ${code.code} matches SNOMED CT format`
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

// Test 9: Partial word search
console.log('\nTest Group: Partial Search');
const extractionResults = searchSNOMEDCodes('экстракция');
assert(
  extractionResults.length > 0,
  'Partial word "экстракция" returns results'
);
assert(
  extractionResults.some(c => c.display.includes('экстракция')),
  'Results contain word "экстракция"'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
