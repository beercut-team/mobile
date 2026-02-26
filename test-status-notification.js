#!/usr/bin/env node

const API_BASE_URL = 'https://api.beercut.tech';

async function doctorLogin(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return { token: data.access_token, user: data.user };
}

async function patientLogin(accessCode) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/patient-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: accessCode }),
  });
  const data = await response.json();
  return data.access_token;
}

async function getPatient(token, patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

async function updateStatus(token, patientId, status) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Status update failed: ${response.status} ${error}`);
  }
  
  return response.json();
}

async function getNotifications(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

async function main() {
  console.log('🧪 Тест уведомлений при изменении статуса\n');

  // Login as doctor
  console.log('1️⃣ Вход как врач...');
  const { token: doctorToken, user: doctor } = await doctorLogin('admin@gmail.com', '123123123');
  console.log(`✅ ${doctor.name}\n`);

  // Get current patient status
  console.log('2️⃣ Текущий статус пациента...');
  const patientData = await getPatient(doctorToken, 2);
  const currentStatus = patientData.data.status;
  console.log(`📋 Статус: ${currentStatus}\n`);

  // Login as patient
  console.log('3️⃣ Вход как пациент...');
  const patientToken = await patientLogin('e5f6g7h8');
  const before = await getNotifications(patientToken);
  console.log(`📬 Уведомлений до: ${before.data?.length || 0}\n`);

  // Change status (toggle between APPROVED and SURGERY_SCHEDULED)
  const newStatus = currentStatus === 'APPROVED' ? 'SURGERY_SCHEDULED' : 'APPROVED';
  console.log(`4️⃣ Изменение статуса: ${currentStatus} → ${newStatus}...`);
  await updateStatus(doctorToken, 2, newStatus);
  console.log('✅ Статус изменен\n');

  // Wait and check
  console.log('⏳ Ожидание 3 секунды...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('5️⃣ Проверка уведомлений...');
  const after = await getNotifications(patientToken);
  console.log(`📬 Уведомлений после: ${after.data?.length || 0}\n`);

  const diff = (after.data?.length || 0) - (before.data?.length || 0);
  
  console.log('='.repeat(60));
  if (diff > 0) {
    console.log('✅ УВЕДОМЛЕНИЕ СОЗДАНО!');
    console.log('='.repeat(60));
    console.log(`\n🎉 Новых уведомлений: ${diff}\n`);
    after.data.slice(0, diff).forEach((n, i) => {
      console.log(`${i + 1}. ${n.title}`);
      console.log(`   ${n.body}`);
      console.log(`   Тип: ${n.type}\n`);
    });
  } else {
    console.log('❌ УВЕДОМЛЕНИЕ НЕ СОЗДАНО');
    console.log('='.repeat(60));
    console.log('\n📝 ВЫВОД: Система уведомлений НЕ работает на бэкенде');
    console.log('\nНесмотря на наличие в API документации, автоматическое');
    console.log('создание уведомлений не реализовано.');
    console.log('\n👉 Нужно передать документацию бэкенд-команде:');
    console.log('   docs/NOTIFICATIONS_BACKEND_TODO.md');
  }
}

main().catch(err => console.error('❌', err.message));
