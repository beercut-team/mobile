#!/usr/bin/env node

/**
 * Update patient statuses to demonstrate workflow
 * Usage: node scripts/update-statuses.js <JWT_TOKEN>
 */

const API_BASE_URL = 'https://api.beercut.tech';

const statusUpdates = [
  {
    patientId: 5,
    status: 'APPROVED',
    comment: 'Все документы проверены. Пациент одобрен для операции.',
  },
  {
    patientId: 6,
    status: 'SURGERY_SCHEDULED',
    comment: 'Операция назначена на ближайшую дату из-за срочности.',
  },
  {
    patientId: 7,
    status: 'PREPARATION',
    comment: 'Пациент в процессе подготовки к операции.',
  },
  {
    patientId: 8,
    status: 'REVIEW_NEEDED',
    comment: 'Готов к проверке администратором.',
  },
  {
    patientId: 9,
    status: 'REVIEW_NEEDED',
    comment: 'Документы исправлены, готов к модерации.',
  },
];

async function updatePatientStatus(token, patientId, status, comment) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status, comment }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update status: ${response.status} ${error}`);
  }

  return response.json();
}

const STATUS_LABELS = {
  NEW: 'Новый',
  PREPARATION: 'Подготовка',
  REVIEW_NEEDED: 'На проверке',
  APPROVED: 'Одобрен',
  SURGERY_SCHEDULED: 'Операция назначена',
  COMPLETED: 'Завершён',
  REJECTED: 'Отклонён',
};

async function main() {
  const token = process.argv[2];

  if (!token) {
    console.error('❌ Error: JWT token is required');
    console.log('\nUsage: node scripts/update-statuses.js <JWT_TOKEN>');
    process.exit(1);
  }

  console.log('🔄 Updating patient statuses...\n');

  let successCount = 0;
  let failCount = 0;

  for (const update of statusUpdates) {
    try {
      await updatePatientStatus(token, update.patientId, update.status, update.comment);
      console.log(`✅ Patient #${update.patientId}: ${STATUS_LABELS[update.status]}`);
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`❌ Patient #${update.patientId}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${statusUpdates.length}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
