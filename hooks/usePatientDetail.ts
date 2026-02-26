import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatient, updatePatient, changePatientStatus } from '@/lib/patients';
import type { UpdatePatientRequest, PatientStatus } from '@/lib/patients';
import { useToast } from '@/contexts/toast-context';
import { addToQueue } from '@/lib/offline-queue';
import { useOfflineSync } from './useOfflineSync';
import { ApiError } from '@/lib/api';

export function usePatientDetail(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isOnline, updatePendingCount } = useOfflineSync();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', patientId],
    queryFn: async () => {
      const response = await getPatient(patientId);
      return response.data;
    },
    enabled: !!patientId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdatePatientRequest) => {
      try {
        const response = await updatePatient(patientId, data);
        return response.data;
      } catch (error) {
        if (!isOnline || (error instanceof ApiError && error.status >= 500)) {
          // Queue for offline sync
          await addToQueue({
            entity: 'patient',
            entity_id: patientId,
            action: 'UPDATE',
            payload: data,
            client_time: new Date().toISOString(),
          });
          await updatePendingCount();

          // Optimistic update
          queryClient.setQueryData(['patients', patientId], (old: any) => ({
            ...old,
            ...data,
          }));

          throw new Error('offline');
        }
        throw error;
      }
    },
    onMutate: async (data: UpdatePatientRequest) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['patients', patientId] });

      // Save previous data for rollback
      const previousData = queryClient.getQueryData(['patients', patientId]);

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      showToast('Данные пациента обновлены', 'success');
    },
    onError: (error: Error, _variables, context) => {
      if (error.message === 'offline') {
        showToast('Изменения сохранены для синхронизации', 'success');
      } else {
        // Rollback to previous data on error
        if (context?.previousData) {
          queryClient.setQueryData(['patients', patientId], context.previousData);
        }
        showToast(error.message || 'Ошибка обновления данных', 'error');
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, comment }: { status: PatientStatus; comment?: string }) => {
      try {
        await changePatientStatus(patientId, status, comment);
      } catch (error) {
        if (!isOnline || (error instanceof ApiError && error.status >= 500)) {
          // Queue for offline sync
          await addToQueue({
            entity: 'patient_status',
            entity_id: patientId,
            action: 'UPDATE',
            payload: { status, comment },
            client_time: new Date().toISOString(),
          });
          await updatePendingCount();

          // Optimistic update
          queryClient.setQueryData(['patients', patientId], (old: any) => ({
            ...old,
            status,
          }));

          throw new Error('offline');
        }
        throw error;
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['patients', patientId] });

      // Save previous data for rollback
      const previousData = queryClient.getQueryData(['patients', patientId]);

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      showToast('Статус пациента изменён', 'success');
    },
    onError: (error: Error, _variables, context) => {
      if (error.message === 'offline') {
        showToast('Изменения сохранены для синхронизации', 'success');
      } else {
        // Rollback to previous data on error
        if (context?.previousData) {
          queryClient.setQueryData(['patients', patientId], context.previousData);
        }
        showToast(error.message || 'Ошибка изменения статуса', 'error');
      }
    },
  });

  return {
    patient: data,
    updatePatient: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isLoading: isLoading || updateMutation.isPending || updateStatusMutation.isPending,
    error,
    refetch,
  };
}
