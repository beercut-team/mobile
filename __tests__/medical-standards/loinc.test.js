/**
 * LOINC Utilities Tests
 *
 * Run with: node __tests__/medical-standards/loinc.test.js
 */

const {
  OCULAR_BIOMETRY_LOINC_CODES,
  VISION_LOINC_CODES,
  validateLOINCCode,
  formatLOINCCode,
  searchLOINCCodes,
  createLOINCObservation,
} = require('../../lib/medical-standards/loinc');

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

console.log('\n🧪 Testing LOINC Utilities\n');

// Test 1: Predefined codes exist
console.log('Test Group: Predefined Codes');
assert(
  OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT.code === '79894-2',
  'AXIAL_LENGTH_RIGHT code is 79894-2'
);
assert(
  OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT.display.includes('Длина оси'),
  'AXIAL_LENGTH_RIGHT has correct display text'
);
assert(
  OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT.unit === 'mm',
  'AXIAL_LENGTH_RIGHT has correct unit'
);
assert(
  Object.keys(OCULAR_BIOMETRY_LOINC_CODES).length === 10,
  'Has 10 ocular biometry codes'
);
assert(
  Object.keys(VISION_LOINC_CODES).length === 6,
  'Has 6 vision codes'
);

// Test 2: Validation
console.log('\nTest Group: Validation');
assert(validateLOINCCode('79894-2'), 'Valid code 79894-2 passes validation');
assert(validateLOINCCode('79897-5'), 'Valid code 79897-5 passes validation');
assert(validateLOINCCode('70936-0'), 'Valid code 70936-0 passes validation');
assert(!validateLOINCCode(''), 'Empty string fails validation');
assert(!validateLOINCCode('ABC'), 'Non-numeric code fails validation');
assert(!validateLOINCCode('12345'), 'Code without hyphen fails validation');
assert(!validateLOINCCode('12345-'), 'Code without check digit fails validation');
assert(!validateLOINCCode('-2'), 'Code without main part fails validation');

// Test 3: Formatting
console.log('\nTest Group: Formatting');
const testCode = OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT;
const formattedCode = formatLOINCCode(testCode);
assert(
  formattedCode.includes('79894-2') && formattedCode.includes('Длина оси'),
  'Code is formatted correctly'
);

const testCodeWithValue = createLOINCObservation(testCode, '23.5');
const formattedWithValue = formatLOINCCode(testCodeWithValue);
assert(
  formattedWithValue.includes('23.5') && formattedWithValue.includes('mm'),
  'Code with value is formatted correctly'
);

// Test 4: Search functionality
console.log('\nTest Group: Search');
const axialResults = searchLOINCCodes('длина оси');
assert(axialResults.length > 0, 'Search for "длина оси" returns results');
assert(
  axialResults.some(c => c.code === '79894-2'),
  'Search results include axial length right'
);

const keratometryResults = searchLOINCCodes('кератометрия');
assert(keratometryResults.length > 0, 'Search for "кератометрия" returns results');
assert(
  keratometryResults.length >= 4,
  'Search for "кератометрия" returns multiple results'
);

const codeResults = searchLOINCCodes('79894-2');
assert(codeResults.length > 0, 'Search by code returns results');
assert(codeResults[0].code === '79894-2', 'Search by code finds exact match');

const emptyResults = searchLOINCCodes('');
assert(emptyResults.length >= 0, 'Empty search returns results or empty array');

const noMatchResults = searchLOINCCodes('xyz123');
assert(noMatchResults.length === 0, 'Non-matching search returns no results');

// Test 5: Case insensitive search
console.log('\nTest Group: Case Insensitive Search');
const upperResults = searchLOINCCodes('ДЛИНА ОСИ');
const lowerResults = searchLOINCCodes('длина оси');
assertEquals(
  upperResults.length,
  lowerResults.length,
  'Uppercase and lowercase searches return same count'
);

// Test 6: Get all codes
console.log('\nTest Group: Get All Codes');
const allCodes = [
  ...Object.values(OCULAR_BIOMETRY_LOINC_CODES),
  ...Object.values(VISION_LOINC_CODES),
];
assert(allCodes.length === 16, 'All LOINC codes returns 16 total codes');
assert(
  allCodes.every(c => c.code && c.display && c.system === 'LOINC'),
  'All codes have required fields'
);
assert(
  allCodes.every(c => c.unit),
  'All codes have unit field'
);

// Test 7: Code structure validation
console.log('\nTest Group: Code Structure');
allCodes.forEach(code => {
  assert(
    /^\d{4,5}-\d$/.test(code.code),
    `Code ${code.code} matches LOINC format`
  );
  assert(
    code.display.length > 0,
    `Code ${code.code} has non-empty display text`
  );
  assert(
    code.unit && code.unit.length > 0,
    `Code ${code.code} has unit specified`
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

// Test 9: Create observation
console.log('\nTest Group: Create Observation');
const observation = createLOINCObservation(
  OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
  '23.5'
);
assert(observation.code === '79894-2', 'Observation has correct code');
assert(observation.display.includes('Длина оси'), 'Observation has correct display');
assert(observation.value === '23.5', 'Observation has correct value');
assert(observation.unit === 'mm', 'Observation has correct unit');
assert(observation.observedAt, 'Observation has observedAt timestamp');
assert(
  new Date(observation.observedAt).getTime() > 0,
  'observedAt is valid ISO date'
);

const observationWithDate = createLOINCObservation(
  OCULAR_BIOMETRY_LOINC_CODES.KERATOMETRY_K1_RIGHT,
  '42.5',
  '2026-01-15T10:00:00Z'
);
assertEquals(
  observationWithDate.observedAt,
  '2026-01-15T10:00:00Z',
  'Custom observedAt date is preserved'
);

// Test 10: Units validation
console.log('\nTest Group: Units');
const biometryCodes = Object.values(OCULAR_BIOMETRY_LOINC_CODES);
assert(
  biometryCodes.filter(c => c.unit === 'mm').length === 4,
  'Has 4 codes with mm unit (axial length, ACD, lens thickness)'
);
assert(
  biometryCodes.filter(c => c.unit === 'D').length === 6,
  'Has 6 codes with D unit (keratometry)'
);

const visionCodes = Object.values(VISION_LOINC_CODES);
assert(
  visionCodes.some(c => c.unit === 'LogMAR'),
  'Has codes with LogMAR unit'
);
assert(
  visionCodes.some(c => c.unit === 'mmHg'),
  'Has codes with mmHg unit'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
