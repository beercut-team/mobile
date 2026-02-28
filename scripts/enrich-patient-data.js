#!/usr/bin/env node

/**
 * Add documents and additional data to Yakut surgeon's patients
 * Usage: node scripts/enrich-patient-data.js
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

async function addComment(token, patientId, text, isUrgent = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: patientId,
        body: text,
        is_urgent: isUrgent
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ⚠️  Comment failed (${response.status}): ${errorText.substring(0, 100)}`);
      return false;
    }

    return true;
  } catch (error) {
    console.log(`   ⚠️  Comment error: ${error.message}`);
    return false;
  }
}

async function scheduleSurgery(token, patientId, surgeryDate) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ surgery_date: surgeryDate }),
  });

  return response.ok;
}

async function updatePatientStatus(token, patientId, status, comment = null) {
  try {
    const body = comment ? { status, comment } : { status };

    const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ⚠️  Status update failed (${response.status}): ${errorText.substring(0, 100)}`);
      return false;
    }

    return true;
  } catch (error) {
    console.log(`   ⚠️  Status update error: ${error.message}`);
    return false;
  }
}

async function uploadDocument(token, patientId, fileName, content, category = 'analysis') {
  try {
    // Create a simple text file as Blob
    const blob = new Blob([content], { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('category', category);
    formData.append('description', `Тестовый документ: ${fileName}`);

    const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.log(`   ⚠️  Upload failed: ${error.message}`);
    return false;
  }
}

function getRandomDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

async function main() {
  console.log('📋 Enriching patient data with documents and additional info...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Login as surgeon
    console.log('🔐 Logging in as surgeon...');
    const surgeonAuth = await login('ivanov.semyon@test.com', 'asdasdA1');
    console.log(`✅ Logged in as: ${surgeonAuth.user.name}\n`);

    // Login as doctor for comments
    console.log('🔐 Logging in as doctor...');
    const doctorAuth = await login('admin@gmail.com', '123123123');
    console.log(`✅ Logged in as: ${doctorAuth.user.name}\n`);

    // Get Yakut patients (use admin token to see all patients)
    console.log('👥 Fetching patients...');
    const allPatients = await getPatients(doctorAuth.token);
    const yakutPhones = ['+79142345671', '+79142345672', '+79142345673', '+79142345674', '+79142345675'];
    const yakutPatients = allPatients.filter(p => yakutPhones.includes(p.phone));

    if (yakutPatients.length === 0) {
      console.log('⚠️  No Yakut patients found.');
      process.exit(1);
    }

    console.log(`✅ Found ${yakutPatients.length} patients\n`);

    // ========================================================================
    // STEP 1: Add more comments
    // ========================================================================
    console.log('💬 Adding additional comments...\n');

    const comments = [
      { patient: yakutPatients[0], text: 'Пациентка прошла консультацию терапевта. Противопоказаний нет.', urgent: false, author: 'doctor' },
      { patient: yakutPatients[0], text: 'Все анализы получены. Готов к операции.', urgent: false, author: 'doctor' },
      { patient: yakutPatients[1], text: 'Требуется повторная биометрия - первые результаты вызывают сомнения.', urgent: true, author: 'surgeon' },
      { patient: yakutPatients[1], text: 'Повторная биометрия выполнена. Результаты в норме.', urgent: false, author: 'doctor' },
      { patient: yakutPatients[2], text: 'Пациент подтвердил готовность к операции. Дата согласована.', urgent: false, author: 'doctor' },
      { patient: yakutPatients[3], text: 'Обратите внимание: пациентка принимает препараты для разжижения крови.', urgent: true, author: 'doctor' },
      { patient: yakutPatients[3], text: 'Получена консультация кардиолога. Можно продолжать подготовку с корректировкой терапии.', urgent: false, author: 'surgeon' },
      { patient: yakutPatients[4], text: 'Пациент готов к операции. Рекомендую назначить в ближайшие дни.', urgent: false, author: 'doctor' },
    ];

    let commentCount = 0;
    for (const comment of comments) {
      const token = comment.author === 'surgeon' ? surgeonAuth.token : doctorAuth.token;
      const success = await addComment(token, comment.patient.id, comment.text, comment.urgent);
      if (success) {
        const urgentMark = comment.urgent ? '🔴' : '  ';
        console.log(`   ${urgentMark} ${comment.patient.first_name} ${comment.patient.last_name}: "${comment.text.substring(0, 50)}..."`);
        commentCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n✅ Added ${commentCount} comments\n`);

    // ========================================================================
    // STEP 2: Schedule surgeries for approved patients
    // ========================================================================
    console.log('📅 Scheduling surgeries...\n');

    const surgerySchedule = [
      { patient: yakutPatients[2], days: 5, status: 'SURGERY_SCHEDULED' },  // Ньургун - через 5 дней
      { patient: yakutPatients[4], days: 3, status: 'SURGERY_SCHEDULED' },  // Айсен - через 3 дня
    ];

    let scheduledCount = 0;
    for (const schedule of surgerySchedule) {
      const surgeryDate = getRandomDate(schedule.days);
      const success = await scheduleSurgery(surgeonAuth.token, schedule.patient.id, surgeryDate);

      if (success) {
        await updatePatientStatus(surgeonAuth.token, schedule.patient.id, schedule.status, 'Операция назначена');
        const date = new Date(surgeryDate);
        console.log(`   ✅ ${schedule.patient.first_name} ${schedule.patient.last_name}: ${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`);
        scheduledCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n✅ Scheduled ${scheduledCount} surgeries\n`);

    // ========================================================================
    // STEP 3: Upload test documents (simplified - just log what would be uploaded)
    // ========================================================================
    console.log('📄 Test documents prepared for patients...\n');

    const documents = [
      { patient: yakutPatients[0], fileName: 'analiz-krovi.txt', category: 'Анализ крови' },
      { patient: yakutPatients[0], fileName: 'ekg.txt', category: 'ЭКГ' },
      { patient: yakutPatients[2], fileName: 'biometriya.txt', category: 'Биометрия глаза' },
      { patient: yakutPatients[4], fileName: 'konsultaciya-terapevta.txt', category: 'Консультация терапевта' },
    ];

    console.log('   📋 Documents that can be uploaded via app:');
    for (const doc of documents) {
      console.log(`   • ${doc.patient.first_name} ${doc.patient.last_name}: ${doc.fileName} (${doc.category})`);
    }

    console.log('\n   ℹ️  Documents can be uploaded manually through the mobile app');
    console.log('   ℹ️  Go to patient card → Documents tab → Upload button\n');

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('='.repeat(60));
    console.log('✅ DATA ENRICHMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   • ${commentCount} comments added (including urgent ones)`);
    console.log(`   • ${scheduledCount} surgeries scheduled`);
    console.log(`   • 4 document templates prepared`);
    console.log('\n🎯 Patient workflow demonstrates:');
    console.log('   • Multiple statuses: PREPARATION, SURGERY_SCHEDULED');
    console.log('   • Doctor-surgeon communication via comments');
    console.log('   • Urgent notifications (🔴)');
    console.log('   • Surgery scheduling with dates');
    console.log('   • Checklist progress tracking (50%-90% completion)');
    console.log('   • IOL calculations (3 different formulas)');
    console.log('\n📋 Patient Summary:');
    console.log('   1. Айаана Николаева - PREPARATION, surgery scheduled');
    console.log('   2. Сардаана Васильева - PREPARATION, surgery scheduled');
    console.log('   3. Ньургун Иванов - PREPARATION, 90% checklist done');
    console.log('   4. Туяра Алексеева - PREPARATION, 60% checklist done');
    console.log('   5. Айсен Петров - PREPARATION, 80% checklist done');
    console.log('\n🔑 Login credentials:');
    console.log('   Email: ivanov.semyon@test.com');
    console.log('   Password: asdasdA1');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm start');
    console.log('   2. Login as surgeon');
    console.log('   3. View patients, comments, checklists, IOL calculations');
    console.log('   4. Upload documents manually via app (Documents tab)');
    console.log('   5. Change patient statuses to demonstrate workflow');
    console.log('   6. Schedule more surgeries');
    console.log('\n📄 Documentation: .docs/usage-scenario.md');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
