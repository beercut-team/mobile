#!/usr/bin/env node

/**
 * Seed script for creating test notifications for a patient
 * Usage: node scripts/seed-patient-notifications.js <JWT_TOKEN> [PATIENT_ID]
 *
 * NOTE: This script requires backend API support (POST /api/v1/notifications)
 * If the endpoint doesn't exist yet, the script will show what notifications
 * would be created and provide helpful error messages.
 */

const API_BASE_URL = 'https://api.beercut.tech';

/**
 * Generate realistic notifications for a patient's journey
 * Timestamps spread over past 7 days
 */
function generateNotifications(patientId) {
  const now = new Date();

  // Helper to create date N hours ago
  const hoursAgo = (hours) => {
    const date = new Date(now);
    date.setHours(date.getHours() - hours);
    return date.toISOString();
  };

  // Only 5 notification types are supported by the backend API:
  // STATUS_CHANGE, NEW_COMMENT, SURGERY_SCHEDULED, CHECKLIST_EXPIRY, SURGERY_REMINDER
  return [
    // 1. Status NEW → PREPARATION (3 days ago = 72 hours)
    {
      user_id: patientId,
      entity_id: patientId,
      entity_type: 'patient',
      title: 'Статус изменен',
      body: 'Ваш статус изменен на: На подготовке',
      type: 'STATUS_CHANGE',
      created_at: hoursAgo(72)
    },

    // 2. Status PREPARATION → REVIEW_NEEDED (2 days ago = 48 hours)
    {
      user_id: patientId,
      entity_id: patientId,
      entity_type: 'patient',
      title: 'Статус изменен',
      body: 'Ваш статус изменен на: Требуется проверка',
      type: 'STATUS_CHANGE',
      created_at: hoursAgo(48)
    },

    // 3. Comment added (1 day ago = 24 hours)
    {
      user_id: patientId,
      entity_id: patientId,
      entity_type: 'patient',
      title: 'Новый комментарий',
      body: 'Николаев Айсен: Пожалуйста, сдайте анализы крови до 5 марта',
      type: 'NEW_COMMENT',
      created_at: hoursAgo(24)
    },

    // 4. Status REVIEW_NEEDED → APPROVED (12 hours ago)
    {
      user_id: patientId,
      entity_id: patientId,
      entity_type: 'patient',
      title: 'Статус изменен',
      body: 'Ваш статус изменен на: Одобрен',
      type: 'STATUS_CHANGE',
      created_at: hoursAgo(12)
    },

    // 5. Surgery scheduled (6 hours ago)
    {
      user_id: patientId,
      entity_id: patientId,
      entity_type: 'patient',
      title: 'Дата операции назначена',
      body: 'Ваша операция назначена на 11 ноября 2026',
      type: 'SURGERY_SCHEDULED',
      created_at: hoursAgo(6)
    },

    // 6. Checklist expiry warning (3 hours ago)
    {
      user_id: patientId,
      entity_id: patientId,
      entity_type: 'patient',
      title: 'Истек срок чек-листа',
      body: 'Срок выполнения предоперационного чек-листа истек',
      type: 'CHECKLIST_EXPIRY',
      created_at: hoursAgo(3)
    },

    // 7. Surgery reminder (1 hour ago)
    {
      user_id: patientId,
      entity_id: patientId,
      entity_type: 'patient',
      title: 'Напоминание об операции',
      body: 'Ваша операция запланирована на завтра в 10:00',
      type: 'SURGERY_REMINDER',
      created_at: hoursAgo(1)
    }
  ];
}

async function createNotification(token, notificationData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(notificationData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error}`);
  }

  return response.json();
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'только что';
  if (diffHours < 24) return `${diffHours} ч. назад`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} дн. назад`;
}

async function main() {
  const token = process.argv[2];
  const patientId = parseInt(process.argv[3]) || 2;

  if (!token) {
    console.error('❌ Ошибка: требуется JWT токен');
    console.log('\nИспользование: node scripts/seed-patient-notifications.js <JWT_TOKEN> [PATIENT_ID]');
    console.log('\nПример:');
    console.log('  node scripts/seed-patient-notifications.js eyJhbGc... 2');
    console.log('\nПо умолчанию PATIENT_ID = 2 (Айаал Степанов, код доступа: e5f6g7h8)');
    process.exit(1);
  }

  console.log('🔔 Создание тестовых уведомлений...\n');
  console.log(`📋 Пациент ID: ${patientId}`);
  console.log(`📅 Период: последние 7 дней\n`);

  const notifications = generateNotifications(patientId);

  let successCount = 0;
  let failCount = 0;
  let endpointNotFound = false;

  for (const notification of notifications) {
    try {
      const result = await createNotification(token, notification);
      console.log(`✅ ${notification.title}`);
      console.log(`   ${notification.body}`);
      console.log(`   ⏰ ${formatTimestamp(notification.created_at)}\n`);
      successCount++;
    } catch (error) {
      if (error.message.includes('404')) {
        endpointNotFound = true;
        console.log(`📝 ${notification.title}`);
        console.log(`   ${notification.body}`);
        console.log(`   ⏰ ${formatTimestamp(notification.created_at)}\n`);
      } else {
        console.error(`❌ Ошибка: ${notification.title}`);
        console.error(`   ${error.message}\n`);
        failCount++;
      }
    }
  }

  console.log('═'.repeat(60));

  if (endpointNotFound) {
    console.log('\n⚠️  ВНИМАНИЕ: API endpoint не найден');
    console.log('\nAPI endpoint POST /api/v1/notifications пока не реализован на бэкенде.');
    console.log('Выше показаны уведомления, которые ДОЛЖНЫ быть созданы.\n');
    console.log('📄 Документация для бэкенд-разработчиков:');
    console.log('   docs/NOTIFICATIONS_API_SPEC.md\n');
    console.log('Что нужно сделать:');
    console.log('  1. Реализовать POST /api/v1/notifications на бэкенде');
    console.log('  2. Добавить автоматическое создание уведомлений при изменении данных пациента');
    console.log('  3. Интегрировать с Expo Push Notification Service');
    console.log('  4. Запустить этот скрипт снова для тестирования\n');
  } else {
    console.log('\n📊 Результат:');
    console.log(`   ✅ Создано: ${successCount}`);
    console.log(`   ❌ Ошибок: ${failCount}`);
    console.log(`   📝 Всего: ${notifications.length}\n`);

    if (successCount > 0) {
      console.log('✨ Уведомления успешно созданы!');
      console.log('\nПроверка:');
      console.log(`  1. Войдите в приложение как пациент (код: e5f6g7h8)`);
      console.log(`  2. Перейдите на вкладку "Уведомления"`);
      console.log(`  3. Проверьте, что отображаются ${successCount} уведомлений`);
      console.log(`  4. Проверьте функцию "Отметить как прочитанное"\n`);
    }
  }
}

main().catch((error) => {
  console.error('❌ Критическая ошибка:', error.message);
  process.exit(1);
});
