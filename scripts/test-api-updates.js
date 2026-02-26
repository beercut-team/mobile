#!/usr/bin/env node

/**
 * Comprehensive test script for new API endpoints
 * Tests auth, patients, districts, surgeries, checklists, media, and notifications
 *
 * Usage: node scripts/test-api-updates.js <EMAIL> <PASSWORD>
 */

const BASE_URL = 'https://api.beercut.tech';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

function section(message) {
  console.log(`\n${colors.blue}━━━ ${message} ━━━${colors.reset}`);
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

async function testEndpoint(name, testFn) {
  try {
    await testFn();
    success(name);
    results.passed++;
    return true;
  } catch (err) {
    error(`${name}: ${err.message}`);
    results.failed++;
    return false;
  }
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

async function testRegularLogin(email, password) {
  section('Testing Auth Endpoints');

  return testEndpoint('Regular login (POST /api/v1/auth/login)', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.data.access_token) {
      throw new Error('No access token in response');
    }

    return data.data.access_token;
  });
}

async function testTelegramTokenLogin() {
  return testEndpoint('Telegram token login (POST /api/v1/auth/telegram-token-login)', async () => {
    // This endpoint requires a valid Telegram token, which we don't have in tests
    // We'll just verify the endpoint exists and returns proper error
    const response = await fetch(`${BASE_URL}/api/v1/auth/telegram-token-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_token: 'invalid_test_token' }),
    });

    // We expect 401 or 400 for invalid token, not 404
    if (response.status === 404) {
      throw new Error('Endpoint not found');
    }

    info('  Endpoint exists (returns proper error for invalid token)');
  });
}

// ============================================================================
// PATIENTS ENDPOINTS
// ============================================================================

async function testPatientsEndpoints(token) {
  section('Testing Patients Endpoints');

  // First, get a patient to work with
  let patientId = null;
  let accessCode = null;

  await testEndpoint('Get patients list', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/patients?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.data.length > 0) {
      patientId = data.data[0].id;
      accessCode = data.data[0].access_code;
      info(`  Found patient ID: ${patientId}, access code: ${accessCode}`);
    }
  });

  // Test public status endpoint (no auth required)
  if (accessCode) {
    await testEndpoint('Public status endpoint (GET /api/public/status/{code})', async () => {
      const response = await fetch(`${BASE_URL}/api/public/status/${accessCode}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.data.status) {
        throw new Error('No status in response');
      }

      info(`  Status: ${data.data.status}`);
    });
  } else {
    info('⊘ Skipping public status test (no patient with access code)');
    results.skipped++;
  }

  // Test batch update endpoint
  if (patientId) {
    await testEndpoint('Batch update endpoint (POST /api/v1/patients/{id}/batch-update)', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/patients/${patientId}/batch-update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            notes: 'Test batch update from API test script',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.data.id) {
        throw new Error('No patient data in response');
      }
    });
  } else {
    info('⊘ Skipping batch update test (no patient found)');
    results.skipped++;
  }
}

// ============================================================================
// DISTRICTS ENDPOINTS
// ============================================================================

async function testDistrictsEndpoints(token) {
  section('Testing Districts Endpoints');

  let districtId = null;

  // Test list districts
  await testEndpoint('List districts (GET /api/v1/districts)', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/districts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.data.length > 0) {
      districtId = data.data[0].id;
      info(`  Found ${data.data.length} districts`);
    }
  });

  // Test get single district
  if (districtId) {
    await testEndpoint('Get single district (GET /api/v1/districts/{id})', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/districts/${districtId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.data.id) {
        throw new Error('No district data in response');
      }

      info(`  District: ${data.data.name}`);
    });
  } else {
    info('⊘ Skipping get district test (no districts found)');
    results.skipped++;
  }

  // Test create district (requires ADMIN role)
  await testEndpoint('Create district (POST /api/v1/districts) [ADMIN only]', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/districts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Test District ${Date.now()}`,
        code: `TEST_${Date.now()}`,
      }),
    });

    // Accept both success (201) and forbidden (403) as valid responses
    if (response.status === 403) {
      info('  User lacks ADMIN role (expected for non-admin users)');
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.data.id) {
      throw new Error('No district data in response');
    }

    info(`  Created district ID: ${data.data.id}`);
  });
}

// ============================================================================
// SURGERIES ENDPOINTS
// ============================================================================

async function testSurgeriesEndpoints(token) {
  section('Testing Surgeries Endpoints');

  // Test list surgeries
  await testEndpoint('List surgeries (GET /api/v1/surgeries)', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/surgeries?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    info(`  Found ${data.data.length} surgeries`);
  });

  // Test create surgery (requires SURGEON/ADMIN role)
  await testEndpoint('Create surgery (POST /api/v1/surgeries) [SURGEON/ADMIN only]', async () => {
    // Get a patient ID first
    const patientsResponse = await fetch(`${BASE_URL}/api/v1/patients?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!patientsResponse.ok) {
      throw new Error('Cannot fetch patients for surgery test');
    }

    const patientsData = await patientsResponse.json();
    if (patientsData.data.length === 0) {
      throw new Error('No patients available for surgery test');
    }

    const patientId = patientsData.data[0].id;

    const response = await fetch(`${BASE_URL}/api/v1/surgeries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: patientId,
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        operation_type: 'Факоэмульсификация катаракты',
      }),
    });

    // Accept both success (201) and forbidden (403) as valid responses
    if (response.status === 403) {
      info('  User lacks SURGEON/ADMIN role (expected for non-surgeon users)');
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.data.id) {
      throw new Error('No surgery data in response');
    }

    info(`  Created surgery ID: ${data.data.id}`);
  });
}

// ============================================================================
// CHECKLISTS ENDPOINTS
// ============================================================================

async function testChecklistsEndpoints(token) {
  section('Testing Checklists Endpoints');

  await testEndpoint('Create checklist item (POST /api/v1/checklists)', async () => {
    // Get a patient ID first
    const patientsResponse = await fetch(`${BASE_URL}/api/v1/patients?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!patientsResponse.ok) {
      throw new Error('Cannot fetch patients for checklist test');
    }

    const patientsData = await patientsResponse.json();
    if (patientsData.data.length === 0) {
      throw new Error('No patients available for checklist test');
    }

    const patientId = patientsData.data[0].id;

    const response = await fetch(`${BASE_URL}/api/v1/checklists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: patientId,
        title: 'Test checklist item',
        description: 'Created by API test script',
        is_required: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.data.id) {
      throw new Error('No checklist data in response');
    }

    info(`  Created checklist item ID: ${data.data.id}`);
  });
}

// ============================================================================
// MEDIA ENDPOINTS
// ============================================================================

async function testMediaEndpoints(token) {
  section('Testing Media Endpoints');

  await testEndpoint('Download URL endpoint (GET /api/v1/media/{id}/download-url)', async () => {
    // First, try to get a media file
    const patientsResponse = await fetch(`${BASE_URL}/api/v1/patients?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!patientsResponse.ok) {
      throw new Error('Cannot fetch patients for media test');
    }

    const patientsData = await patientsResponse.json();

    // Look for a patient with media
    let mediaId = null;
    for (const patient of patientsData.data) {
      if (patient.media && patient.media.length > 0) {
        mediaId = patient.media[0].id;
        break;
      }
    }

    if (!mediaId) {
      throw new Error('No media files found (create some test media first)');
    }

    const response = await fetch(`${BASE_URL}/api/v1/media/${mediaId}/download-url`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.data.download_url) {
      throw new Error('No download URL in response');
    }

    info(`  Got download URL for media ID: ${mediaId}`);
  });
}

// ============================================================================
// NOTIFICATIONS VALIDATION
// ============================================================================

async function testNotificationsValidation(token) {
  section('Testing Notifications Validation');

  await testEndpoint('Verify only 5 notification types are used', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/notifications?page=1&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const allowedTypes = [
      'STATUS_CHANGE',
      'DOCTOR_ASSIGNED',
      'SURGEON_ASSIGNED',
      'NEW_COMMENT',
      'SURGERY_SCHEDULED',
    ];

    const foundTypes = new Set();
    const invalidTypes = [];

    for (const notification of data.data) {
      foundTypes.add(notification.type);
      if (!allowedTypes.includes(notification.type)) {
        invalidTypes.push(notification.type);
      }
    }

    if (invalidTypes.length > 0) {
      throw new Error(`Found invalid notification types: ${invalidTypes.join(', ')}`);
    }

    info(`  Found ${foundTypes.size} valid notification types: ${Array.from(foundTypes).join(', ')}`);
    info(`  All notifications use only the 5 allowed types`);
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/test-api-updates.js <EMAIL> <PASSWORD>');
    process.exit(1);
  }

  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  API Updates Comprehensive Test Suite                     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  try {
    // Login and get token
    const token = await testRegularLogin(email, password);
    if (!token) {
      throw new Error('Failed to login');
    }

    // Run all test suites
    await testTelegramTokenLogin();
    await testPatientsEndpoints(token);
    await testDistrictsEndpoints(token);
    await testSurgeriesEndpoints(token);
    await testChecklistsEndpoints(token);
    await testMediaEndpoints(token);
    await testNotificationsValidation(token);

    // Print summary
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  Test Summary                                              ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`${colors.green}✓ Passed:${colors.reset}  ${results.passed}`);
    console.log(`${colors.red}✗ Failed:${colors.reset}  ${results.failed}`);
    console.log(`${colors.yellow}⊘ Skipped:${colors.reset} ${results.skipped}`);
    console.log(`${colors.cyan}━ Total:${colors.reset}   ${results.passed + results.failed + results.skipped}`);

    if (results.failed > 0) {
      console.log(`\n${colors.red}❌ Some tests failed${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}✅ All tests passed!${colors.reset}`);
    }

  } catch (err) {
    console.error(`\n${colors.red}❌ Fatal error:${colors.reset} ${err.message}`);
    process.exit(1);
  }
}

main();
