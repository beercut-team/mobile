#!/usr/bin/env node

/**
 * Seed script for adding test patients to the API
 * Usage: node scripts/seed-patients.js <JWT_TOKEN>
 */

const API_BASE_URL = 'https://api.beercut.tech';

const testPatients = [
  {
    first_name: 'Иван',
    last_name: 'Петров',
    middle_name: 'Сергеевич',
    date_of_birth: '1955-03-15',
    phone: '+79161234567',
    email: 'ivanov@example.com',
    address: 'г. Ярославль, ул. Ленина, д. 10, кв. 5',
    snils: '123-456-789 00',
    passport_series: '7601',
    passport_number: '123456',
    policy_number: '1234567890123456',
    diagnosis: 'Катаракта правого глаза',
    operation_type: 'PHACOEMULSIFICATION',
    eye: 'OD',
    district_id: 1,
    notes: 'Пациент готов к операции, все анализы в норме',
  },
  {
    first_name: 'Мария',
    last_name: 'Смирнова',
    middle_name: 'Ивановна',
    date_of_birth: '1948-07-22',
    phone: '+79167654321',
    address: 'г. Рыбинск, ул. Пушкина, д. 25',
    snils: '987-654-321 00',
    passport_series: '7602',
    passport_number: '654321',
    policy_number: '6543210987654321',
    diagnosis: 'Глаукома обоих глаз',
    operation_type: 'ANTIGLAUCOMA',
    eye: 'OU',
    district_id: 2,
    notes: 'Требуется срочная операция',
  },
  {
    first_name: 'Александр',
    last_name: 'Козлов',
    middle_name: 'Петрович',
    date_of_birth: '1962-11-30',
    phone: '+79169876543',
    address: 'г. Ярославль, ул. Свободы, д. 45, кв. 12',
    snils: '456-789-123 00',
    passport_series: '7603',
    passport_number: '789456',
    policy_number: '7894561230123456',
    diagnosis: 'Отслойка сетчатки левого глаза',
    operation_type: 'VITRECTOMY',
    eye: 'OS',
    district_id: 1,
    notes: 'Пациент на подготовке, ожидаем результаты анализов',
  },
  {
    first_name: 'Елена',
    last_name: 'Волкова',
    middle_name: 'Дмитриевна',
    date_of_birth: '1970-05-18',
    phone: '+79165551234',
    address: 'г. Тутаев, ул. Советская, д. 8',
    diagnosis: 'Катаракта левого глаза',
    operation_type: 'PHACOEMULSIFICATION',
    eye: 'OS',
    district_id: 3,
  },
  {
    first_name: 'Николай',
    last_name: 'Морозов',
    middle_name: 'Владимирович',
    date_of_birth: '1958-09-10',
    phone: '+79163334455',
    address: 'г. Ярославль, ул. Чехова, д. 33, кв. 7',
    snils: '111-222-333 00',
    diagnosis: 'Катаракта правого глаза, начальная стадия',
    operation_type: 'PHACOEMULSIFICATION',
    eye: 'OD',
    district_id: 1,
    notes: 'Пациент на модерации',
  },
];

async function createPatient(token, patientData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create patient: ${response.status} ${error}`);
  }

  return response.json();
}

async function main() {
  const token = process.argv[2];

  if (!token) {
    console.error('❌ Error: JWT token is required');
    console.log('\nUsage: node scripts/seed-patients.js <JWT_TOKEN>');
    console.log('\nTo get a token:');
    console.log('1. Login to the app');
    console.log('2. Check SecureStore/localStorage for access token');
    console.log('3. Or use: curl -X POST https://api.beercut.tech/api/v1/auth/login \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"username":"your_username","password":"your_password"}\'');
    process.exit(1);
  }

  console.log('🌱 Starting patient seeding...\n');

  let successCount = 0;
  let failCount = 0;

  for (const patient of testPatients) {
    try {
      const result = await createPatient(token, patient);
      console.log(`✅ Created: ${patient.last_name} ${patient.first_name} (ID: ${result.data.id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${patient.last_name} ${patient.first_name}`);
      console.error(`   Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${testPatients.length}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
