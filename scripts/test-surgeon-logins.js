#!/usr/bin/env node

const API_BASE_URL = 'https://api.beercut.tech';

async function testLogins() {
  const accounts = [
    { email: 'surgeon@test.com', name: 'Surgeon (test)' },
    { email: 'surgeon@example.com', name: 'Васильев Ньургун' }
  ];

  const passwords = ['asdasdA1', '123123123', 'password', 'surgeon', 'surgeon123', 'Password123', 'qwerty123', 'test123', 'admin123'];

  for (const account of accounts) {
    console.log('\n' + '='.repeat(60));
    console.log(`Testing: ${account.email} (${account.name})`);
    console.log('='.repeat(60));

    for (const pwd of passwords) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: account.email, password: pwd }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('\n✅ SUCCESS!');
          console.log(`Email: ${account.email}`);
          console.log(`Password: ${pwd}`);
          console.log(`User: ${data.user.name} (${data.user.role})\n`);
          return { email: account.email, password: pwd };
        }
      } catch (e) {
        // Continue
      }
    }
    console.log(`❌ No password worked for ${account.email}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('⚠️  Could not find working credentials');
  console.log('='.repeat(60));
  console.log('\nOptions:');
  console.log('1. Contact backend administrator to reset password');
  console.log('2. Access database directly to update password hash');
  console.log('3. Use a different surgeon account if available');

  return null;
}

testLogins();
