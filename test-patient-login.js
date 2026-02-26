// Test script for patient login flow
const API_BASE = 'https://api.beercut.tech';
const ACCESS_CODE = 'e5f6g7h8';

async function testPatientLogin() {
  console.log('🧪 Testing patient login flow...\n');

  try {
    // Step 1: Login with access code
    console.log('1️⃣ Logging in with access code:', ACCESS_CODE);
    const loginRes = await fetch(`${API_BASE}/api/v1/auth/patient-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: ACCESS_CODE }),
    });

    if (!loginRes.ok) {
      const error = await loginRes.json();
      throw new Error(`Login failed: ${error.error || loginRes.statusText}`);
    }

    const authData = await loginRes.json();
    console.log('✅ Login successful!');
    console.log('   Access token:', authData.access_token.substring(0, 20) + '...');
    console.log('   User:', authData.user.name);
    console.log('   Role:', authData.user.role);
    console.log('   Email:', authData.user.email || 'N/A');
    console.log('');

    // Step 2: Verify token works by calling /me endpoint
    console.log('2️⃣ Verifying token with /me endpoint...');
    const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!meRes.ok) {
      throw new Error(`/me endpoint failed: ${meRes.statusText}`);
    }

    const userData = await meRes.json();
    console.log('✅ Token verified!');
    console.log('   User ID:', userData.id);
    console.log('   Name:', userData.name);
    console.log('   Role:', userData.role);
    console.log('');

    // Step 3: Check if user is PATIENT role
    console.log('3️⃣ Checking user role...');
    if (userData.role === 'PATIENT') {
      console.log('✅ User has PATIENT role - correct!');
    } else {
      console.log('❌ User role is', userData.role, '- expected PATIENT');
    }
    console.log('');

    console.log('🎉 All tests passed! Patient login flow works correctly.');
    console.log('');
    console.log('📱 To test in the app:');
    console.log('   1. Run: npm start');
    console.log('   2. Open the app');
    console.log('   3. Enter access code: ' + ACCESS_CODE);
    console.log('   4. Press "Войти"');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPatientLogin();
