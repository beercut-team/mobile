#!/usr/bin/env node

/**
 * Add checklists and documents to Yakut surgeon's patients
 * Usage: node scripts/add-patient-data.js
 */

const API_BASE_URL = 'https://api.beercut.tech';

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  return { token: data.access_token, user: data.user };
}

async function getPatients(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get patients: ${response.status}`);
  }

  const result = await response.json();
  return result.data || [];
}

async function getPatientChecklist(token, patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/checklists/patient/${patientId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    return [];
  }

  const result = await response.json();
  return result.data || [];
}

async function updateChecklistItem(token, itemId, data) {
  const response = await fetch(`${API_BASE_URL}/api/v1/checklists/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.ok;
}

async function processPatientChecklist(token, patient, completionRate) {
  const checklist = await getPatientChecklist(token, patient.id);

  if (!checklist || checklist.length === 0) {
    console.log(`   ⚠️  ${patient.first_name} ${patient.last_name}: No checklist found`);
    return 0;
  }

  const itemsToComplete = Math.floor(checklist.length * completionRate);
  let successCount = 0;

  for (let i = 0; i < itemsToComplete && i < checklist.length; i++) {
    const item = checklist[i];
    const success = await updateChecklistItem(token, item.id, {
      status: 'COMPLETED',
      result: 'Выполнено',
      notes: `Проверено ${new Date().toLocaleDateString('ru-RU')}`,
    });

    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Mark one item as IN_PROGRESS
  if (itemsToComplete < checklist.length) {
    await updateChecklistItem(token, checklist[itemsToComplete].id, {
      status: 'IN_PROGRESS',
      notes: 'В процессе выполнения',
    });
    successCount++;
  }

  console.log(`   ✅ ${patient.first_name} ${patient.last_name}: ${successCount}/${checklist.length} items updated (${Math.round(completionRate * 100)}%)`);
  return successCount;
}

async function assignPatientToSurgeon(token, patientId, surgeonId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ surgeon_id: surgeonId }),
  });

  return response.ok;
}

async function main() {
  console.log('📋 Adding checklists and documents to patients...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Login as admin first to assign patients
    console.log('🔐 Logging in as admin...');
    const adminAuth = await login('admin@gmail.com', '123123123');
    console.log(`✅ Logged in as: ${adminAuth.user.name}\n`);

    // Login as surgeon to get surgeon ID
    console.log('🔐 Logging in as surgeon...');
    const { token, user } = await login('ivanov.semyon@test.com', 'asdasdA1');
    console.log(`✅ Logged in as: ${user.name} (ID: ${user.id})\n`);

    // Get all patients as admin
    console.log('👥 Fetching patients...');
    const response = await getPatients(adminAuth.token);
    const allPatients = response.data || response;

    // Filter patients with Yakut names and specific phone numbers (created by our script)
    const yakutPhones = ['+79142345671', '+79142345672', '+79142345673', '+79142345674', '+79142345675'];
    const yakutPatients = allPatients.filter(p =>
      yakutPhones.includes(p.phone)
    );

    if (yakutPatients.length === 0) {
      console.log('⚠️  No Yakut patients found. Run create-yakut-surgeon.js first.');
      process.exit(1);
    }

    console.log(`✅ Found ${yakutPatients.length} patients:\n`);
    yakutPatients.forEach(p => {
      console.log(`   • ${p.first_name} ${p.last_name} (ID: ${p.id}, Status: ${p.status})`);
    });

    // Assign patients to surgeon
    console.log('\n👨‍⚕️ Assigning patients to surgeon...\n');
    for (const patient of yakutPatients) {
      const success = await assignPatientToSurgeon(adminAuth.token, patient.id, user.id);
      if (success) {
        console.log(`   ✅ ${patient.first_name} ${patient.last_name} assigned to surgeon`);
      } else {
        console.log(`   ⚠️  Failed to assign ${patient.first_name} ${patient.last_name}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Process checklists
    console.log('\n📋 Updating checklists...\n');

    const completionRates = [0.8, 0.6, 0.9, 0.5, 0.7];
    let totalUpdated = 0;

    for (let i = 0; i < yakutPatients.length; i++) {
      const patient = yakutPatients[i];
      const rate = completionRates[i] || 0.5;
      const updated = await processPatientChecklist(token, patient, rate);
      totalUpdated += updated;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   • ${yakutPatients.length} patients processed`);
    console.log(`   • ${totalUpdated} checklist items updated`);
    console.log('\n🎯 Data is ready for testing!');
    console.log('\n🔑 Surgeon credentials:');
    console.log('   Email: ivanov.semyon@test.com');
    console.log('   Password: asdasdA1');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
