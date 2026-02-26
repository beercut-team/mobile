#!/usr/bin/env node

/**
 * Test automatic notification creation by making real changes
 */

const API_BASE_URL = 'https://api.beercut.tech';

async function doctorLogin(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return { token: data.access_token, user: data.user };
}

async function patientLogin(accessCode) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/patient-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: accessCode }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Patient login failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getPatient(token, patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get patient: ${response.status}`);
  }

  return response.json();
}

async function addComment(token, patientId, body) {
  const response = await fetch(`${API_BASE_URL}/api/v1/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patient_id: patientId,
      body: body,
      is_urgent: false
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add comment: ${response.status} ${error}`);
  }

  return response.json();
}

async function getNotifications(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get notifications: ${response.status}`);
  }

  return response.json();
}

async function main() {
  const doctorEmail = process.argv[2];
  const doctorPassword = process.argv[3];
  const patientId = parseInt(process.argv[4]) || 2;

  if (!doctorEmail || !doctorPassword) {
    console.error('❌ Требуются email и пароль врача');
    console.log('\nИспользование: node test-notification-creation.js <EMAIL> <PASSWORD> [PATIENT_ID]');
    console.log('\nПример:');
    console.log('  node test-notification-creation.js admin@gmail.com 123123123 2');
    process.exit(1);
  }

  console.log('🧪 Тест автоматического создания уведомлений\n');

  // Step 1: Login as doctor
  console.log('1️⃣ Вход как врач...');
  const { token: doctorToken, user: doctor } = await doctorLogin(doctorEmail, doctorPassword);
  console.log(`✅ Вход выполнен: ${doctor.name} (${doctor.role})\n`);

  // Step 2: Get patient info
  console.log(`2️⃣ Получение данных пациента ID ${patientId}...`);
  const patientData = await getPatient(doctorToken, patientId);
  const patient = patientData.data;
  console.log(`✅ Пациент: ${patient.last_name} ${patient.first_name}`);
  console.log(`   Текущий статус: ${patient.status}\n`);

  // Step 3: Login as patient to check notifications BEFORE
  console.log('3️⃣ Проверка уведомлений ДО изменений...');
  const patientToken = await patientLogin('e5f6g7h8');
  const notificationsBefore = await getNotifications(patientToken);
  console.log(`📬 Уведомлений до: ${notificationsBefore.data?.length || 0}\n`);

  // Step 4: Add a comment (should trigger NEW_COMMENT notification)
  console.log('4️⃣ Добавление комментария...');
  await addComment(doctorToken, patientId, 'Тестовый комментарий для проверки уведомлений');
  console.log('✅ Комментарий добавлен\n');

  // Wait a bit for notification to be created
  console.log('⏳ Ожидание 2 секунды...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 5: Check notifications AFTER
  console.log('5️⃣ Проверка уведомлений ПОСЛЕ изменений...');
  const notificationsAfter = await getNotifications(patientToken);
  console.log(`📬 Уведомлений после: ${notificationsAfter.data?.length || 0}\n`);

  // Step 6: Show results
  const newNotifications = (notificationsAfter.data?.length || 0) - (notificationsBefore.data?.length || 0);
  
  console.log('='.repeat(60));
  if (newNotifications > 0) {
    console.log('✅ УВЕДОМЛЕНИЯ СОЗДАЮТСЯ АВТОМАТИЧЕСКИ!');
    console.log('='.repeat(60));
    console.log(`\n🎉 Создано новых уведомлений: ${newNotifications}\n`);
    
    console.log('📋 Новые уведомления:');
    notificationsAfter.data.slice(0, newNotifications).forEach((n, i) => {
      console.log(`\n   ${i + 1}. ${n.title}`);
      console.log(`      ${n.body}`);
      console.log(`      Тип: ${n.type}`);
    });
  } else {
    console.log('⚠️  УВЕДОМЛЕНИЯ НЕ СОЗДАЛИСЬ');
    console.log('='.repeat(60));
    console.log('\nВозможные причины:');
    console.log('  • Уведомления создаются только для пациента-владельца записи');
    console.log('  • Есть задержка в создании уведомлений');
    console.log('  • Система уведомлений не настроена для комментариев');
  }
}

main().catch((error) => {
  console.error('\n❌ Ошибка:', error.message);
  process.exit(1);
});
