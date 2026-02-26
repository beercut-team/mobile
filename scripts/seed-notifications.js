#!/usr/bin/env node

/**
 * Seed script for creating test notifications
 * Usage: node scripts/seed-notifications.js <JWT_TOKEN> [PATIENT_ID]
 */

const API_BASE_URL = 'https://api.beercut.tech';

// Only 5 notification types are supported by the backend API
const notificationTemplates = [
  {
    title: 'Статус изменен',
    message: 'Ваш статус изменен на: Одобрен. Вы готовы к операции.',
    type: 'STATUS_CHANGE',
  },
  {
    title: 'Новый комментарий',
    message: 'Врач оставил комментарий к вашей карте',
    type: 'NEW_COMMENT',
  },
  {
    title: 'Дата операции назначена',
    message: 'Ваша операция назначена на 11 ноября 2026 года',
    type: 'SURGERY_SCHEDULED',
  },
  {
    title: 'Истек срок чек-листа',
    message: 'Срок выполнения предоперационного чек-листа истек',
    type: 'CHECKLIST_EXPIRY',
  },
  {
    title: 'Напоминание об операции',
    message: 'Ваша операция запланирована на завтра в 10:00',
    type: 'SURGERY_REMINDER',
  },
];

async function createNotification(token, patientId, notification) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: patientId,
        patient_id: patientId,
        ...notification,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

async function main() {
  const token = process.argv[2];
  const patientId = parseInt(process.argv[3] || '2', 10);

  if (!token) {
    console.error('❌ Error: JWT token is required');
    console.log('\nUsage: node scripts/seed-notifications.js <JWT_TOKEN> [PATIENT_ID]');
    console.log('\nExample:');
    console.log('  node scripts/seed-notifications.js "eyJhbG..." 2');
    process.exit(1);
  }

  console.log('📬 Starting notifications seeding...\n');
  console.log(`Patient ID: ${patientId}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const notification of notificationTemplates) {
    try {
      await createNotification(token, patientId, notification);
      console.log(`✅ Created: ${notification.title}`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Failed: ${notification.title} - ${error.message}`);
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${notificationTemplates.length}`);
}

main();
