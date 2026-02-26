/**
 * Seed Medical Metadata Script
 *
 * Добавляет тестовые медицинские метаданные к существующим пациентам
 *
 * Usage:
 *   node scripts/seed-medical-metadata.js <EMAIL> <PASSWORD>
 */

const {
  CATARACT_ICD10_CODES,
  OPHTHALMIC_SNOMED_CODES,
  OCULAR_BIOMETRY_LOINC_CODES,
} = require('../lib/medical-standards');

const API_BASE_URL = 'https://api.beercut.tech';

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.access_token;
}

async function getPatients(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

async function updatePatientMetadata(token, patientId, metadata) {
  const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/medical-metadata`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    // If endpoint doesn't exist yet, just log it
    console.log(`⚠️  Backend endpoint not implemented yet for patient ${patientId}`);
    return null;
  }

  const data = await response.json();
  return data.data;
}

function generateRandomMetadata(patientIndex) {
  const diagnosisCodes = [
    CATARACT_ICD10_CODES.SENILE_NUCLEAR,
    CATARACT_ICD10_CODES.SENILE_INCIPIENT,
    CATARACT_ICD10_CODES.TRAUMATIC,
    CATARACT_ICD10_CODES.COMPLICATED,
  ];

  const procedureCodes = [
    OPHTHALMIC_SNOMED_CODES.PHACO_WITH_IOL,
    OPHTHALMIC_SNOMED_CODES.PHACOEMULSIFICATION,
    OPHTHALMIC_SNOMED_CODES.EXTRACAPSULAR_EXTRACTION,
  ];

  // Rotate through different combinations
  const diagnosisIndex = patientIndex % diagnosisCodes.length;
  const procedureIndex = patientIndex % procedureCodes.length;

  const metadata = {
    diagnosisCodes: [diagnosisCodes[diagnosisIndex]],
    procedureCodes: [procedureCodes[procedureIndex]],
    observations: [
      {
        ...OCULAR_BIOMETRY_LOINC_CODES.AXIAL_LENGTH_RIGHT,
        value: (22.5 + Math.random() * 2).toFixed(2),
        observedAt: new Date().toISOString(),
      },
      {
        ...OCULAR_BIOMETRY_LOINC_CODES.KERATOMETRY_K1_RIGHT,
        value: (42.0 + Math.random() * 3).toFixed(2),
        observedAt: new Date().toISOString(),
      },
      {
        ...OCULAR_BIOMETRY_LOINC_CODES.KERATOMETRY_K2_RIGHT,
        value: (43.0 + Math.random() * 3).toFixed(2),
        observedAt: new Date().toISOString(),
      },
    ],
  };

  // Add integration metadata for some patients
  if (patientIndex % 2 === 0) {
    metadata.integrations = {
      emias: {
        patientId: `EMIAS-${1000 + patientIndex}`,
        syncStatus: 'synced',
        lastSyncAt: new Date().toISOString(),
      },
    };
  }

  if (patientIndex % 3 === 0) {
    metadata.integrations = {
      ...metadata.integrations,
      riams: {
        patientId: `RIAMS-${2000 + patientIndex}`,
        regionCode: '77',
        syncStatus: 'synced',
        lastSyncAt: new Date().toISOString(),
      },
    };
  }

  return metadata;
}

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: node scripts/seed-medical-metadata.js <EMAIL> <PASSWORD>');
    process.exit(1);
  }

  try {
    console.log('🔐 Logging in...');
    const token = await login(email, password);
    console.log('✅ Logged in successfully\n');

    console.log('📋 Fetching patients...');
    const patients = await getPatients(token);
    console.log(`✅ Found ${patients.length} patients\n`);

    console.log('💉 Adding medical metadata...\n');

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const metadata = generateRandomMetadata(i);

      console.log(`Patient ${i + 1}/${patients.length}: ${patient.last_name} ${patient.first_name}`);
      console.log(`  Diagnosis: ${metadata.diagnosisCodes[0].code} - ${metadata.diagnosisCodes[0].display}`);
      console.log(`  Procedure: ${metadata.procedureCodes[0].code} - ${metadata.procedureCodes[0].display}`);
      console.log(`  Observations: ${metadata.observations.length} measurements`);

      if (metadata.integrations?.emias) {
        console.log(`  EMIAS: ${metadata.integrations.emias.patientId} (${metadata.integrations.emias.syncStatus})`);
      }

      if (metadata.integrations?.riams) {
        console.log(`  RIAMS: ${metadata.integrations.riams.patientId} (${metadata.integrations.riams.syncStatus})`);
      }

      const result = await updatePatientMetadata(token, patient.id, metadata);

      if (result) {
        console.log('  ✅ Updated successfully\n');
      } else {
        console.log('  ⚠️  Backend endpoint not available (metadata logged above)\n');
      }
    }

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           Medical Metadata Seeding Complete! 🎉             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\n📱 Open the app and navigate to any patient detail screen');
    console.log('   to see the medical metadata section with:');
    console.log('   • ICD-10 diagnosis codes');
    console.log('   • SNOMED CT procedure codes');
    console.log('   • LOINC observation codes');
    console.log('   • Integration statuses (EMIAS/RIAMS)');
    console.log('\n⚠️  Note: If backend endpoint is not implemented yet,');
    console.log('   you can manually add codes using the UI:');
    console.log('   1. Open patient details');
    console.log('   2. Click "Медицинские коды" button');
    console.log('   3. Add codes using the search interface\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
