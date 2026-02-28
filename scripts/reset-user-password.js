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

async function deleteUser(token, userId) {
  console.log(`🗑️  Attempting to delete user ID: ${userId}`);
  
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (response.ok) {
    console.log('✅ User deleted successfully\n');
    return true;
  } else {
    const text = await response.text();
    console.log(`❌ Delete failed: ${response.status} - ${text}\n`);
    return false;
  }
}

async function createUser(token, userData) {
  console.log(`👤 Creating new user: ${userData.email}`);
  
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData),
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ User created successfully');
    console.log(`   ID: ${data.id}, Email: ${data.email}, Role: ${data.role}\n`);
    return data;
  } else {
    const text = await response.text();
    throw new Error(`Create failed: ${response.status} - ${text}`);
  }
}

async function main() {
  const adminEmail = process.argv[2];
  const adminPassword = process.argv[3];

  if (!adminEmail || !adminPassword) {
    console.error('❌ Error: Admin credentials required');
    console.log('\nUsage: node scripts/reset-user-password.js <ADMIN_EMAIL> <ADMIN_PASSWORD>');
    process.exit(1);
  }

  try {
    const token = await login(adminEmail, adminPassword);

    // Get current surgeon user
    const usersResponse = await fetch(`${API_BASE_URL}/api/v1/admin/users?email=surgeon@test.com`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!usersResponse.ok) {
      throw new Error('Could not fetch users');
    }

    const users = await usersResponse.json();
    const surgeon = users.data.find(u => u.email === 'surgeon@test.com');

    if (!surgeon) {
      console.log('⚠️  Surgeon user not found, creating new one...');
    } else {
      console.log(`Found surgeon: ${surgeon.name} (ID: ${surgeon.id})\n`);
      
      // Try to delete
      const deleted = await deleteUser(token, surgeon.id);
      if (!deleted) {
        console.log('⚠️  Could not delete user, will try to create anyway...\n');
      }
    }

    // Create new surgeon with known password
    const newSurgeon = await createUser(token, {
      email: 'surgeon@test.com',
      password: 'asdasdA1',
      name: 'Surgeon',
      first_name: 'Хирург',
      last_name: 'Тестовый',
      role: 'SURGEON',
    });

    console.log('='.repeat(60));
    console.log('✅ SURGEON ACCOUNT READY!');
    console.log('='.repeat(60));
    console.log('\nCredentials:');
    console.log('  Email: surgeon@test.com');
    console.log('  Password: asdasdA1');
    console.log('\n🎯 You can now login!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
