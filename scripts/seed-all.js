#!/usr/bin/env node

/**
 * Master seed script - runs all seeding operations
 * Usage: node scripts/seed-all.js <EMAIL> <PASSWORD>
 */

const { execSync } = require('child_process');

const API_BASE_URL = 'https://api.beercut.tech';

async function login(email, password) {
  console.log('🔐 Logging in...');

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Logged in as: ${data.user.name} (${data.user.role})\n`);

  return data.access_token;
}

function runScript(scriptName, token) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${scriptName}`);
  console.log('='.repeat(60));

  try {
    execSync(`node scripts/${scriptName} "${token}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to run ${scriptName}`);
    return false;
  }
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.log('\nUsage: node scripts/seed-all.js <EMAIL> <PASSWORD>');
    console.log('\nExample:');
    console.log('  node scripts/seed-all.js admin@gmail.com 123123123');
    process.exit(1);
  }

  console.log('🌱 Starting complete database seeding...\n');
  const startTime = Date.now();

  try {
    // Step 1: Login
    const token = await login(email, password);

    // Step 2: Seed patients
    const patientsSuccess = runScript('seed-patients.js', token);
    if (!patientsSuccess) {
      console.error('\n❌ Failed to seed patients. Aborting.');
      process.exit(1);
    }

    // Step 3: Seed comments
    runScript('seed-comments.js', token);

    // Step 4: Seed IOL calculations
    runScript('seed-iol.js', token);

    // Step 5: Update patient statuses
    runScript('update-statuses.js', token);

    // Step 6: Try to seed checklists (may fail if no templates)
    console.log('\n' + '='.repeat(60));
    console.log('Running: seed-checklists.js (optional)');
    console.log('='.repeat(60));
    runScript('seed-checklists.js', token);

    // Step 7: Try to seed notifications (requires backend support)
    console.log('\n' + '='.repeat(60));
    console.log('Running: seed-patient-notifications.js (requires backend support)');
    console.log('='.repeat(60));
    runScript('seed-patient-notifications.js', token);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n⏱️  Total time: ${duration}s`);
    console.log('\n📋 What was created:');
    console.log('   • 5 test patients with different statuses');
    console.log('   • 10 comments (including urgent ones)');
    console.log('   • 7 IOL calculations (3 formulas)');
    console.log('   • Status updates for workflow demonstration');
    console.log('   • 10 notifications (if backend supports it)');
    console.log('\n🎯 Test the app now!');
    console.log('   npm start');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
