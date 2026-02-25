import { useState } from 'react';
import { useToast } from '@/contexts/toast-context';
import {
  downloadPatientRoutingSheet,
  downloadPatientChecklistReport,
} from '@/utils/pdf-download';

export function usePDFDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useToast();

  const downloadRoutingSheet = async (patientId: number, patientName: string) => {
    try {
      setIsDownloading(true);
      await downloadPatientRoutingSheet(patientId, patientName);
      showToast('Лист маршрутизации скачан', 'success');
    } catch (error) {
      showToast('Ошибка скачивания листа маршрутизации', 'error');
      console.error('Failed to download routing sheet:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadChecklistReport = async (patientId: number, patientName: string) => {
    try {
      setIsDownloading(true);
      await downloadPatientChecklistReport(patientId, patientName);
      showToast('Отчет по чек-листу скачан', 'success');
    } catch (error) {
      showToast('Ошибка скачивания отчета', 'error');
      console.error('Failed to download checklist report:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadRoutingSheet,
    downloadChecklistReport,
    isDownloading,
  };
}
