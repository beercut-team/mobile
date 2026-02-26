import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientChecklist, updateChecklistItem, getChecklistProgress } from '@/lib/checklists';
import type { UpdateChecklistItemRequest, ChecklistItem } from '@/lib/checklists';
import { useToast } from '@/contexts/toast-context';
import { addToQueue } from '@/lib/offline-queue';
import { useOfflineSync } from './useOfflineSync';
import { ApiError } from '@/lib/api';

export function calculateProgress(items: ChecklistItem[]): number {
  if (!items || items.length === 0) return 0;

  const completed = items.filter(item => item.status === 'COMPLETED').length;
  return Math.round((completed / items.length) * 100);
}

export function useChecklist(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isOnline, updatePendingCount } = useOfflineSync();

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
      try {
        await updateChecklistItem(id, data);
      } catch (error) {
        if (!isOnline || (error instanceof ApiError && error.status >= 500)) {
          // Queue for offline sync
          await addToQueue({
            entity: 'checklist_item',
            entity_id: id,
            action: 'UPDATE',
            payload: data,
            client_time: new Date().toISOString(),
          });
          await updatePendingCount();

          // Optimistic update
          queryClient.setQueryData(['checklists', patientId], (old: any) =>
            old?.map((item: any) => (item.id === id ? { ...item, ...data } : item))
          );

          throw new Error('offline');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', patientId] });
      queryClient.invalidateQueries({ queryKey: ['checklists', patientId, 'progress'] });
      showToast('Пункт чеклиста обновлён', 'success');
    },
    onError: (error: Error) => {
      if (error.message === 'offline') {
        showToast('Изменения сохранены для синхронизации', 'success');
      } else {
        // Rollback optimistic update on error
        queryClient.invalidateQueries({ queryKey: ['checklists', patientId] });
        queryClient.invalidateQueries({ queryKey: ['checklists', patientId, 'progress'] });
        showToast(error.message || 'Ошибка обновления чеклиста', 'error');
      }
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
