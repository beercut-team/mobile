#!/usr/bin/env node

const API_BASE_URL = 'https://api.beercut.tech';

async function login(email, password) {
  console.log('🔐 Logging in as admin...');
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

async function main() {
  const adminEmail = process.argv[2];
  const adminPassword = process.argv[3];

  if (!adminEmail || !adminPassword) {
    console.error('❌ Error: Admin credentials required');
    process.exit(1);
  }

  try {
    const token = await login(adminEmail, adminPassword);

    // Get users list to see structure
    console.log('📋 Fetching users list...');
    const usersResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users?email=surgeon@test.com`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!usersResponse.ok) {
      throw new Error(`Could not fetch users: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();
    console.log('Response structure:', JSON.stringify(usersData, null, 2));

    // Handle different response formats
    let surgeon = null;
    if (Array.isArray(usersData)) {
      surgeon = usersData.find(u => u.email === 'surgeon@test.com');
    } else if (usersData.data && Array.isArray(usersData.data)) {
      surgeon = usersData.data.find(u => u.email === 'surgeon@test.com');
    } else if (usersData.email === 'surgeon@test.com') {
      surgeon = usersData;
    }

    if (!surgeon) {
      console.log('\n⚠️  Surgeon user not found in response');
      console.log('Creating new surgeon account...\n');
    } else {
      console.log(`\n✅ Found surgeon: ${surgeon.name} (ID: ${surgeon.id})`);
      console.log(`Attempting to delete user ID: ${surgeon.id}...\n`);
      
      // Try to delete
      const deleteResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users/${surgeon.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (deleteResponse.ok) {
        console.log('✅ User deleted successfully\n');
      } else {
        const text = await deleteResponse.text();
        console.log(`⚠️  Delete failed: ${deleteResponse.status} - ${text}`);
        console.log('Will try to create anyway...\n');
      }
    }

    // Create new surgeon
    console.log('👤 Creating surgeon account...');
    const createResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'surgeon@test.com',
        password: 'asdasdA1',
        name: 'Surgeon',
        first_name: 'Хирург',
        last_name: 'Тестовый',
        role: 'SURGEON',
      }),
    });

    if (createResponse.ok) {
      const newUser = await createResponse.json();
      console.log('✅ User created successfully!');
      console.log(`   ID: ${newUser.id}, Email: ${newUser.email}\n`);
      
      console.log('='.repeat(60));
      console.log('✅ SUCCESS!');
      console.log('='.repeat(60));
      console.log('\nCredentials:');
      console.log('  Email: surgeon@test.com');
      console.log('  Password: asdasdA1');
      console.log('\n🎯 You can now login!');
    } else {
      const text = await createResponse.text();
      console.log(`\n❌ Create failed: ${createResponse.status}`);
      console.log(`Response: ${text}`);
      
      if (createResponse.status === 409 || text.includes('already exists')) {
        console.log('\n⚠️  User already exists. Backend does not support password reset.');
        console.log('You need to either:');
        console.log('  1. Contact backend admin to reset password');
        console.log('  2. Use database access to update password hash');
        console.log('  3. Delete user from database and recreate');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
