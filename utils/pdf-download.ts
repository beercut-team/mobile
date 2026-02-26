import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { downloadRoutingSheet, downloadChecklistReport } from '@/lib/print';

function sanitizeFilenamePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'file';
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  const blobWithBytes = blob as Blob & { bytes?: () => Promise<Uint8Array> };
  if (typeof blobWithBytes.bytes === 'function') {
    return blobWithBytes.bytes();
  }

  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  throw new Error('Unsupported blob implementation');
}

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

    // Convert response blob to raw bytes and save it atomically.
    const bytes = await blobToBytes(blob);
    file.create({ overwrite: true, intermediates: true });
    file.write(bytes);

    // Share/open the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Открыть PDF',
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save PDF file: ${reason}`);
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
  const filename = `routing-sheet-${sanitizeFilenamePart(patientName)}-${Date.now()}.pdf`;

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
  const filename = `checklist-report-${sanitizeFilenamePart(patientName)}-${Date.now()}.pdf`;

  if (Platform.OS === 'web') {
    downloadPDFWeb(blob, filename);
  } else {
    await downloadPDFMobile(blob, filename);
  }
}
