import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatients, changePatientStatus } from '@/lib/patients';
import { useToast } from '@/contexts/toast-context';

export function useModeration() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', 'moderation'],
    queryFn: async () => {
      const response = await getPatients({ status: 'REVIEW_NEEDED' });
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (patientId: number) => {
      await changePatientStatus(patientId, 'APPROVED');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      showToast('Пациент одобрен', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка одобрения пациента', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ patientId, comment }: { patientId: number; comment?: string }) => {
      await changePatientStatus(patientId, 'REJECTED', comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      showToast('Пациент отклонён', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка отклонения пациента', 'error');
    },
  });

  return {
    patients: data,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    isLoading: isLoading || approveMutation.isPending || rejectMutation.isPending,
    error,
  };
}
