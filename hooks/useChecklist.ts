import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientChecklist, updateChecklistItem, getChecklistProgress } from '@/lib/checklists';
import type { UpdateChecklistItemRequest, ChecklistItem } from '@/lib/checklists';
import { useToast } from '@/contexts/toast-context';

export function calculateProgress(items: ChecklistItem[]): number {
  if (!items || items.length === 0) return 0;

  const completed = items.filter(item => item.status === 'COMPLETED').length;
  return Math.round((completed / items.length) * 100);
}

export function useChecklist(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['checklists', patientId],
    queryFn: async () => {
      const response = await getPatientChecklist(patientId);
      return response.data;
    },
    enabled: !!patientId,
  });

  const progressQuery = useQuery({
    queryKey: ['checklists', patientId, 'progress'],
    queryFn: async () => {
      const response = await getChecklistProgress(patientId);
      return response.data;
    },
    enabled: !!patientId,
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateChecklistItemRequest }) => {
      await updateChecklistItem(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', patientId] });
      queryClient.invalidateQueries({ queryKey: ['checklists', patientId, 'progress'] });
      showToast('Пункт чеклиста обновлён', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка обновления чеклиста', 'error');
    },
  });

  const progress = data ? calculateProgress(data) : progressQuery.data?.percentage || 0;

  return {
    checklist: data,
    updateItem: updateItemMutation.mutate,
    progress,
    isLoading: isLoading || updateItemMutation.isPending,
    error,
  };
}
