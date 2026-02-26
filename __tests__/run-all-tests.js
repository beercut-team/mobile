#!/usr/bin/env node

/**
 * Test Runner for Medical Standards
 *
 * Runs all medical standards and integration tests
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  '__tests__/medical-standards/icd10.test.js',
  '__tests__/medical-standards/snomed.test.js',
  '__tests__/medical-standards/loinc.test.js',
  '__tests__/medical-standards/fhir-mapper.test.js',
  '__tests__/integrations/emias.test.js',
  '__tests__/integrations/riams.test.js',
];

let totalPassed = 0;
let totalFailed = 0;
let completedTests = 0;

console.log('\n' + '='.repeat(70));
console.log('🧪 Running Medical Standards Test Suite');
console.log('='.repeat(70) + '\n');

function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, '..', testFile);
    const testName = path.basename(testFile, '.test.js');

    console.log(`\n📝 Running: ${testName}`);
    console.log('-'.repeat(70));

    const child = spawn('node', ['-r', 'ts-node/register', testPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    child.on('close', (code) => {
      completedTests++;

      if (code === 0) {
        console.log(`\n✅ ${testName} passed`);
      } else {
        console.log(`\n❌ ${testName} failed`);
        totalFailed++;
      }

      resolve(code);
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();

  for (const test of tests) {
    await runTest(test);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Suite Summary');
  console.log('='.repeat(70));
  console.log(`Total tests: ${tests.length}`);
  console.log(`✅ Passed: ${tests.length - totalFailed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(70) + '\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
