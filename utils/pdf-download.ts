import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { downloadRoutingSheet, downloadChecklistReport } from '@/lib/print';

/**
 * Download and save PDF file on mobile devices
 */
async function downloadPDFMobile(
  blob: Blob,
  filename: string
): Promise<void> {
  try {
    // Create file in document directory
    const file = new File(Paths.document, filename);

    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();

    // Write to file
    await file.create();
    await file.write(new Uint8Array(arrayBuffer));

    // Share/open the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Открыть PDF',
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (error) {
    throw new Error('Failed to save PDF file');
  }
}

/**
 * Download PDF on web
 */
function downloadPDFWeb(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download routing sheet PDF for a patient
 */
export async function downloadPatientRoutingSheet(
  patientId: number,
  patientName: string
): Promise<void> {
  const blob = await downloadRoutingSheet(patientId);
  const filename = `routing-sheet-${patientName}-${Date.now()}.pdf`;

  if (Platform.OS === 'web') {
    downloadPDFWeb(blob, filename);
  } else {
    await downloadPDFMobile(blob, filename);
  }
}

/**
 * Download checklist report PDF for a patient
 */
export async function downloadPatientChecklistReport(
  patientId: number,
  patientName: string
): Promise<void> {
  const blob = await downloadChecklistReport(patientId);
  const filename = `checklist-report-${patientName}-${Date.now()}.pdf`;

  if (Platform.OS === 'web') {
    downloadPDFWeb(blob, filename);
  } else {
    await downloadPDFMobile(blob, filename);
  }
}
