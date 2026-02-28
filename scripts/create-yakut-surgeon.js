#!/usr/bin/env node

/**
 * Creates a new Yakut surgeon and seeds test data
 * Usage: node scripts/create-yakut-surgeon.js
 */

const API_BASE_URL = 'https://api.beercut.tech';

async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@gmail.com',
      password: '123123123'
    }),
  });

  if (!response.ok) {
    throw new Error('Admin login failed');
  }

  const data = await response.json();
  console.log(`✅ Logged in as: ${data.user.name}\n`);
  return data.access_token;
}

async function getOrCreateSurgeon(adminToken) {
  const surgeonEmail = 'ivanov.semyon@test.com';
  const surgeonPassword = 'asdasdA1';

  // Try to login first
  console.log('🔐 Trying to login as surgeon...');

  try {
    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: surgeonEmail,
        password: surgeonPassword
      }),
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log(`✅ Surgeon already exists: ${data.user.name} (ID: ${data.user.id})`);
      console.log(`   Email: ${surgeonEmail}`);
      console.log(`   Password: ${surgeonPassword}\n`);
      return { token: data.access_token, user: data.user };
    }
  } catch (e) {
    // Continue to creation
  }

  // If login failed, create new surgeon
  console.log('👤 Creating new Yakut surgeon...');

  const surgeonData = {
    email: surgeonEmail,
    password: surgeonPassword,
    name: 'Иванов Семён Петрович',
    first_name: 'Семён',
    last_name: 'Иванов',
    middle_name: 'Петрович',
    phone: '+79142223344',
    role: 'SURGEON',
    specialization: 'Хирург-офтальмолог',
    license_number: 'ЛИЦ-54321'
  };

  // Try POST to admin/users endpoint
  let response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(surgeonData),
  });

  // If admin endpoint doesn't work, try regular registration with district_id = 1
  if (!response.ok) {
    console.log('   Admin endpoint failed, trying registration with district_id...');

    response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...surgeonData, district_id: 1 }),
    });
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create surgeon: ${response.status} - ${text}`);
  }

  const data = await response.json();

  // Handle different response formats
  const user = data.user || data;
  const token = data.access_token;

  console.log(`✅ Surgeon created: ${user.name} (ID: ${user.id})`);
  console.log(`   Email: ${surgeonEmail}`);
  console.log(`   Password: ${surgeonPassword}\n`);

  // If we don't have a token, login to get one
  if (!token) {
    console.log('🔐 Logging in as new surgeon...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: surgeonEmail,
        password: surgeonPassword
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('Could not login as new surgeon');
    }

    const loginData = await loginResponse.json();
    return { token: loginData.access_token, user: loginData.user };
  }

  return { token, user };
}

async function loginAsDistrictDoctor() {
  console.log('🔐 Logging in as district doctor to create patients...');

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'doctor@test.com',
      password: '123123123'
    }),
  });

  if (!response.ok) {
    // Try with admin if doctor doesn't work
    console.log('   District doctor login failed, trying admin...');
    const adminResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: '123123123'
      }),
    });

    if (!adminResponse.ok) {
      throw new Error('Could not login as district doctor or admin');
    }

    const adminData = await adminResponse.json();
    console.log(`✅ Logged in as: ${adminData.user.name}\n`);
    return adminData.access_token;
  }

  const data = await response.json();
  console.log(`✅ Logged in as: ${data.user.name}\n`);
  return data.access_token;
}

async function createPatient(token, patientData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create patient: ${response.status} - ${text}`);
  }

  return response.json();
}

async function addComment(token, patientId, text, isUrgent = false) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, is_urgent: isUrgent }),
  });

  if (response.ok) {
    return response.json();
  }
  return null;
}

async function addIOLCalculation(token, patientId, calcData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/iol-calculations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(calcData),
  });

  if (response.ok) {
    return response.json();
  }
  return null;
}

async function updatePatientStatus(token, patientId, status) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status }),
  });

  if (response.ok) {
    return response.json();
  }
  return null;
}

async function main() {
  console.log('🌱 Creating Yakut surgeon with test data...\n');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();

  try {
    // Step 1: Login as admin
    const adminToken = await loginAsAdmin();

    // Step 2: Get or create surgeon
    const { token: surgeonToken, user: surgeon } = await getOrCreateSurgeon(adminToken);

    // Step 3: Login as district doctor to create patients
    const doctorToken = await loginAsDistrictDoctor();

    // Step 3: Create patients with Yakut names
    console.log('👥 Creating test patients...');

    const patients = [
      {
        first_name: 'Айаана',
        last_name: 'Николаева',
        middle_name: 'Ивановна',
        date_of_birth: '1965-03-15',
        phone: '+79142345671',
        address: 'г. Якутск, ул. Ленина, д. 12, кв. 5',
        diagnosis: 'Катаракта правого глаза',
        operation_type: 'PHACOEMULSIFICATION',
        eye: 'OD',
        district_id: 1,
      },
      {
        first_name: 'Сардаана',
        last_name: 'Васильева',
        middle_name: 'Петровна',
        date_of_birth: '1958-07-22',
        phone: '+79142345672',
        address: 'г. Якутск, ул. Кирова, д. 45, кв. 12',
        diagnosis: 'Двусторонняя катаракта',
        operation_type: 'PHACOEMULSIFICATION',
        eye: 'OU',
        district_id: 1,
      },
      {
        first_name: 'Ньургун',
        last_name: 'Иванов',
        middle_name: 'Семёнович',
        date_of_birth: '1970-11-08',
        phone: '+79142345673',
        address: 'г. Якутск, ул. Орджоникидзе, д. 23, кв. 8',
        diagnosis: 'Катаракта левого глаза',
        operation_type: 'PHACOEMULSIFICATION',
        eye: 'OS',
        district_id: 1,
      },
      {
        first_name: 'Туяра',
        last_name: 'Алексеева',
        middle_name: 'Николаевна',
        date_of_birth: '1962-05-30',
        phone: '+79142345674',
        address: 'г. Якутск, ул. Дзержинского, д. 67, кв. 34',
        diagnosis: 'Возрастная катаракта',
        operation_type: 'PHACOEMULSIFICATION',
        eye: 'OD',
        district_id: 1,
      },
      {
        first_name: 'Айсен',
        last_name: 'Петров',
        middle_name: 'Васильевич',
        date_of_birth: '1955-12-18',
        phone: '+79142345675',
        address: 'г. Якутск, ул. Аммосова, д. 89, кв. 21',
        diagnosis: 'Осложнённая катаракта',
        operation_type: 'PHACOEMULSIFICATION',
        eye: 'OS',
        district_id: 1,
      },
    ];

    const createdPatients = [];

    for (let i = 0; i < patients.length; i++) {
      const patient = await createPatient(doctorToken, patients[i]);
      createdPatients.push(patient);
      console.log(`   ✅ Patient ${i + 1}: ${patient.first_name} ${patient.last_name} (ID: ${patient.id})`);
    }

    console.log('');

    // Step 4: Add comments
    console.log('💬 Adding comments...');
    await addComment(doctorToken, createdPatients[0].id, 'Пациентка готова к операции. Все анализы в норме.');
    await addComment(doctorToken, createdPatients[1].id, 'Требуется дополнительное обследование сетчатки.', true);
    await addComment(doctorToken, createdPatients[2].id, 'Пациент принимает антикоагулянты, требуется консультация терапевта.');
    console.log('   ✅ Added 3 comments\n');

    // Step 5: Add IOL calculations
    console.log('🔬 Adding IOL calculations...');

    await addIOLCalculation(doctorToken, createdPatients[0].id, {
      formula: 'SRKT',
      axial_length: 23.5,
      k1: 43.5,
      k2: 44.0,
      acd: 3.2,
      target_refraction: -0.5,
      iol_power: 21.5,
      predicted_refraction: -0.48,
    });

    await addIOLCalculation(doctorToken, createdPatients[1].id, {
      formula: 'Haigis',
      axial_length: 24.2,
      k1: 42.8,
      k2: 43.5,
      acd: 3.1,
      target_refraction: 0.0,
      iol_power: 20.0,
      predicted_refraction: 0.02,
    });

    await addIOLCalculation(doctorToken, createdPatients[2].id, {
      formula: 'Hoffer Q',
      axial_length: 22.8,
      k1: 44.2,
      k2: 44.8,
      acd: 3.0,
      target_refraction: -0.25,
      iol_power: 22.5,
      predicted_refraction: -0.23,
    });

    console.log('   ✅ Added 3 IOL calculations\n');

    // Step 6: Update statuses
    console.log('📊 Updating patient statuses...');
    await updatePatientStatus(doctorToken, createdPatients[0].id, 'PREPARATION');
    await updatePatientStatus(doctorToken, createdPatients[1].id, 'REVIEW_NEEDED');
    await updatePatientStatus(doctorToken, createdPatients[2].id, 'PREPARATION');
    console.log('   ✅ Updated statuses\n');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('='.repeat(60));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(60));
    console.log('\n📋 Created:');
    console.log(`   • Surgeon: ${surgeon.name}`);
    console.log(`   • ${createdPatients.length} patients with Yakut names`);
    console.log(`   • 3 comments (1 urgent)`);
    console.log(`   • 3 IOL calculations`);
    console.log(`   • Status updates`);
    console.log(`\n⏱️  Total time: ${duration}s`);
    console.log('\n🔑 Surgeon credentials:');
    console.log('   Email: ivanov.semyon@test.com');
    console.log('   Password: asdasdA1');
    console.log('\n🎯 You can now login and test the app!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
