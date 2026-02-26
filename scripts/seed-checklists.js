#!/usr/bin/env node

/**
 * Seed script for updating checklist items to show progress
 * Usage: node scripts/seed-checklists.js <JWT_TOKEN>
 */

const API_BASE_URL = 'https://api.beercut.tech';

async function getPatientChecklist(token, patientId) {
  const response = await fetch(`${API_BASE_URL}/api/v1/checklists/patient/${patientId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get checklist: ${response.status}`);
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update checklist item: ${response.status} ${error}`);
  }

  return response.json();
}

async function processPatientChecklist(token, patientId, completionRate = 0.5) {
  try {
    const checklist = await getPatientChecklist(token, patientId);

    if (!checklist || checklist.length === 0) {
      console.log(`⚠️  Patient #${patientId}: No checklist items found`);
      return { success: 0, failed: 0 };
    }

    const itemsToComplete = Math.floor(checklist.length * completionRate);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < itemsToComplete && i < checklist.length; i++) {
      const item = checklist[i];

      try {
        await updateChecklistItem(token, item.id, {
          status: 'COMPLETED',
          result: 'Выполнено',
          notes: `Проверено ${new Date().toLocaleDateString('ru-RU')}`,
        });
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failCount++;
      }
    }

    // Mark one item as IN_PROGRESS if there are remaining items
    if (itemsToComplete < checklist.length) {
      try {
        const inProgressItem = checklist[itemsToComplete];
        await updateChecklistItem(token, inProgressItem.id, {
          status: 'IN_PROGRESS',
          notes: 'В процессе выполнения',
        });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    console.log(`✅ Patient #${patientId}: ${successCount} items updated (${Math.round(completionRate * 100)}% complete)`);
    return { success: successCount, failed: failCount };

  } catch (error) {
    console.error(`❌ Patient #${patientId}: ${error.message}`);
    return { success: 0, failed: 1 };
  }
}

async function main() {
  const token = process.argv[2];

  if (!token) {
    console.error('❌ Error: JWT token is required');
    console.log('\nUsage: node scripts/seed-checklists.js <JWT_TOKEN>');
    process.exit(1);
  }

  console.log('📋 Starting checklist updates...\n');

  // Different completion rates for different patients
  const patients = [
    { id: 5, rate: 0.8 },  // Петров - почти готов
    { id: 6, rate: 0.6 },  // Смирнова - в процессе
    { id: 7, rate: 0.4 },  // Козлов - начальная стадия
    { id: 8, rate: 0.9 },  // Волкова - почти готова
    { id: 9, rate: 0.3 },  // Морозов - только начал
  ];

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const patient of patients) {
    const result = await processPatientChecklist(token, patient.id, patient.rate);
    totalSuccess += result.success;
    totalFailed += result.failed;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${totalSuccess} items updated`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   👥 Patients processed: ${patients.length}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
