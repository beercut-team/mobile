import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatient, updatePatient, changePatientStatus } from '@/lib/patients';
import type { UpdatePatientRequest, PatientStatus } from '@/lib/patients';
import { useToast } from '@/contexts/toast-context';

export function usePatientDetail(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', patientId],
    queryFn: async () => {
      const response = await getPatient(patientId);
      return response.data;
    },
    enabled: !!patientId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdatePatientRequest) => {
      const response = await updatePatient(patientId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      showToast('Данные пациента обновлены', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка обновления данных', 'error');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, comment }: { status: PatientStatus; comment?: string }) => {
      await changePatientStatus(patientId, status, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      showToast('Статус пациента изменён', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка изменения статуса', 'error');
    },
  });

  return {
    patient: data,
    updatePatient: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isLoading: isLoading || updateMutation.isPending || updateStatusMutation.isPending,
    error,
  };
}
