#!/usr/bin/env node

/**
 * Seed script for adding test comments to patients
 * Usage: node scripts/seed-comments.js <JWT_TOKEN>
 */

const API_BASE_URL = 'https://api.beercut.tech';

// Comments for each patient
const testComments = [
  // Patient 5 - Петров Иван
  {
    patient_id: 5,
    body: 'Пациент прошел все предоперационные обследования. Анализы в норме.',
    is_urgent: false,
  },
  {
    patient_id: 5,
    body: 'Требуется дополнительная консультация кардиолога перед операцией.',
    is_urgent: true,
  },
  {
    patient_id: 5,
    body: 'Консультация кардиолога получена. Противопоказаний нет.',
    is_urgent: false,
  },

  // Patient 6 - Смирнова Мария
  {
    patient_id: 6,
    body: 'СРОЧНО! Пациентка жалуется на резкое ухудшение зрения. Необходима срочная операция.',
    is_urgent: true,
  },
  {
    patient_id: 6,
    body: 'Операция назначена на ближайшую дату. Подготовка в процессе.',
    is_urgent: false,
  },

  // Patient 7 - Козлов Александр
  {
    patient_id: 7,
    body: 'Ожидаем результаты анализов крови и ЭКГ.',
    is_urgent: false,
  },
  {
    patient_id: 7,
    body: 'Результаты получены. Все в пределах нормы.',
    is_urgent: false,
  },

  // Patient 8 - Волкова Елена
  {
    patient_id: 8,
    body: 'Пациентка готова к операции. Все документы в порядке.',
    is_urgent: false,
  },

  // Patient 9 - Морозов Николай
  {
    patient_id: 9,
    body: 'Требуется проверка паспортных данных. Несоответствие в СНИЛС.',
    is_urgent: true,
  },
  {
    patient_id: 9,
    body: 'Данные проверены и исправлены. Готов к модерации.',
    is_urgent: false,
  },
];

async function createComment(token, commentData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(commentData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create comment: ${response.status} ${error}`);
  }

  return response.json();
}

async function main() {
  const token = process.argv[2];

  if (!token) {
    console.error('❌ Error: JWT token is required');
    console.log('\nUsage: node scripts/seed-comments.js <JWT_TOKEN>');
    process.exit(1);
  }

  console.log('💬 Starting comments seeding...\n');

  let successCount = 0;
  let failCount = 0;

  for (const comment of testComments) {
    try {
      await createComment(token, comment);
      const urgentFlag = comment.is_urgent ? '🔴' : '💬';
      console.log(`${urgentFlag} Created comment for Patient #${comment.patient_id}`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed for Patient #${comment.patient_id}`);
      console.error(`   Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${testComments.length}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
