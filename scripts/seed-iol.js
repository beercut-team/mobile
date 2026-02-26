#!/usr/bin/env node

/**
 * Seed script for adding test IOL calculations
 * Usage: node scripts/seed-iol.js <JWT_TOKEN>
 */

const API_BASE_URL = 'https://api.beercut.tech';

// IOL calculations for patients with cataract operations
const testCalculations = [
  // Patient 5 - Петров Иван (OD - правый глаз)
  {
    patient_id: 5,
    eye: 'OD',
    axial_length: 23.45,
    keratometry1: 43.5,
    keratometry2: 44.0,
    acd: 3.2,
    target_refraction: 0,
    formula: 'SRKT',
    a_constant: 118.4,
  },
  {
    patient_id: 5,
    eye: 'OD',
    axial_length: 23.45,
    keratometry1: 43.5,
    keratometry2: 44.0,
    acd: 3.2,
    target_refraction: 0,
    formula: 'HAIGIS',
    a_constant: 118.4,
  },
  {
    patient_id: 5,
    eye: 'OD',
    axial_length: 23.45,
    keratometry1: 43.5,
    keratometry2: 44.0,
    target_refraction: -0.5,
    formula: 'HOFFERQ',
    a_constant: 118.4,
  },

  // Patient 8 - Волкова Елена (OS - левый глаз)
  {
    patient_id: 8,
    eye: 'OS',
    axial_length: 22.8,
    keratometry1: 42.75,
    keratometry2: 43.25,
    acd: 3.1,
    target_refraction: 0,
    formula: 'SRKT',
    a_constant: 118.4,
  },
  {
    patient_id: 8,
    eye: 'OS',
    axial_length: 22.8,
    keratometry1: 42.75,
    keratometry2: 43.25,
    acd: 3.1,
    target_refraction: 0,
    formula: 'HAIGIS',
    a_constant: 118.4,
  },

  // Patient 9 - Морозов Николай (OD - правый глаз)
  {
    patient_id: 9,
    eye: 'OD',
    axial_length: 24.1,
    keratometry1: 44.25,
    keratometry2: 44.75,
    acd: 3.3,
    target_refraction: 0,
    formula: 'SRKT',
    a_constant: 118.4,
  },
  {
    patient_id: 9,
    eye: 'OD',
    axial_length: 24.1,
    keratometry1: 44.25,
    keratometry2: 44.75,
    acd: 3.3,
    target_refraction: 0,
    formula: 'HOFFERQ',
    a_constant: 118.4,
  },
];

async function calculateIOL(token, calculationData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/iol/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(calculationData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to calculate IOL: ${response.status} ${error}`);
  }

  return response.json();
}

async function main() {
  const token = process.argv[2];

  if (!token) {
    console.error('❌ Error: JWT token is required');
    console.log('\nUsage: node scripts/seed-iol.js <JWT_TOKEN>');
    process.exit(1);
  }

  console.log('🔬 Starting IOL calculations seeding...\n');

  let successCount = 0;
  let failCount = 0;

  for (const calc of testCalculations) {
    try {
      const result = await calculateIOL(token, calc);
      const iolPower = result.data?.iol_power || 'N/A';
      console.log(`✅ Patient #${calc.patient_id} (${calc.eye}, ${calc.formula}): IOL ${iolPower}D`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`❌ Failed for Patient #${calc.patient_id} (${calc.eye}, ${calc.formula})`);
      console.error(`   Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${testCalculations.length}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
