#!/usr/bin/env node

/**
 * Change user password script
 * Usage: node scripts/change-password.js <ADMIN_EMAIL> <ADMIN_PASSWORD> <TARGET_EMAIL> <NEW_PASSWORD>
 */

const API_BASE_URL = 'https://api.beercut.tech';

async function login(email, password) {
  console.log('🔐 Logging in as admin...');

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Login failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  console.log(`✅ Logged in as: ${data.user.name} (${data.user.role})\n`);

  return data.access_token;
}

async function getUserByEmail(token, email) {
  console.log(`🔍 Looking for user: ${email}`);

  // Try to get user list or search
  const endpoints = [
    `/api/v1/users?email=${email}`,
    `/api/v1/admin/users?email=${email}`,
    `/api/v1/users/search?email=${email}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Found user via ${endpoint}`);

        // Handle different response formats
        if (Array.isArray(data)) {
          return data.find(u => u.email === email);
        } else if (data.data && Array.isArray(data.data)) {
          return data.data.find(u => u.email === email);
        } else if (data.id) {
          return data;
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  throw new Error(`Could not find user with email: ${email}`);
}

async function changePassword(token, userId, email, newPassword) {
  console.log(`🔑 Attempting to change password for user ID: ${userId}`);

  // Try different common endpoints
  const endpoints = [
    { url: `/api/v1/admin/users/${userId}/password`, method: 'PUT' },
    { url: `/api/v1/admin/users/${userId}/password`, method: 'PATCH' },
    { url: `/api/v1/users/${userId}/password`, method: 'PUT' },
    { url: `/api/v1/users/${userId}/password`, method: 'PATCH' },
    { url: `/api/v1/admin/users/${userId}`, method: 'PATCH' },
    { url: `/api/v1/users/${userId}`, method: 'PATCH' },
  ];

  const bodies = [
    { password: newPassword },
    { new_password: newPassword },
    { password: newPassword, email },
  ];

  for (const endpoint of endpoints) {
    for (const body of bodies) {
      try {
        console.log(`  Trying: ${endpoint.method} ${endpoint.url}`);

        const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`\n✅ SUCCESS! Password changed via ${endpoint.method} ${endpoint.url}`);
          console.log(`Response:`, data);
          return true;
        } else if (response.status !== 404 && response.status !== 405) {
          const text = await response.text();
          console.log(`  ❌ ${response.status}: ${text}`);
        }
      } catch (e) {
        // Continue to next attempt
      }
    }
  }

  throw new Error('All password change attempts failed. Backend may not support this operation.');
}

async function main() {
  const adminEmail = process.argv[2];
  const adminPassword = process.argv[3];
  const targetEmail = process.argv[4];
  const newPassword = process.argv[5];

  if (!adminEmail || !adminPassword || !targetEmail || !newPassword) {
    console.error('❌ Error: All parameters are required');
    console.log('\nUsage: node scripts/change-password.js <ADMIN_EMAIL> <ADMIN_PASSWORD> <TARGET_EMAIL> <NEW_PASSWORD>');
    console.log('\nExample:');
    console.log('  node scripts/change-password.js admin@test.com admin123 surgeon@test.com asdasdA1');
    process.exit(1);
  }

  try {
    const token = await login(adminEmail, adminPassword);
    const user = await getUserByEmail(token, targetEmail);

    if (!user) {
      throw new Error(`User not found: ${targetEmail}`);
    }

    console.log(`Found user: ${user.name} (ID: ${user.id}, Role: ${user.role})\n`);

    await changePassword(token, user.id, targetEmail, newPassword);

    console.log('\n' + '='.repeat(60));
    console.log('✅ PASSWORD CHANGED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\nUser: ${targetEmail}`);
    console.log(`New password: ${newPassword}`);
    console.log('\n🎯 You can now login with the new credentials!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
