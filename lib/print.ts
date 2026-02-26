import { API_BASE_URL, fetchWithTimeout } from './api';
import { getTokens } from './token-storage';

export async function downloadRoutingSheet(patientId: number): Promise<Blob> {
  const tokens = await getTokens();

  const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/print/patient/${patientId}/routing-sheet`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens?.accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to download routing sheet');
  }

  return res.blob();
}

export async function downloadChecklistReport(patientId: number): Promise<Blob> {
  const tokens = await getTokens();

  const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/print/patient/${patientId}/checklist-report`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens?.accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to download checklist report');
  }

  return res.blob();
}
