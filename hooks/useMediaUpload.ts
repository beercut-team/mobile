import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientMedia, uploadMedia, deleteMedia, validateFile } from '@/lib/media';
import type { UploadMediaRequest } from '@/lib/media';
import { useToast } from '@/contexts/toast-context';
import { addToQueue } from '@/lib/offline-queue';
import { useOfflineSync } from './useOfflineSync';
import { ApiError } from '@/lib/api';

export function useMediaUpload(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { isOnline, updatePendingCount } = useOfflineSync();

  const { data, isLoading, error } = useQuery({
    queryKey: ['media', patientId],
    queryFn: async () => {
      const response = await getPatientMedia(patientId);
      return response.data;
    },
    enabled: !!patientId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadMediaRequest) => {
      // Block file uploads when offline
      if (!isOnline) {
        throw new Error('Загрузка файлов доступна только онлайн');
      }

      // Validate file before upload
      const validation = validateFile(data.file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const response = await uploadMedia(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', patientId] });
      showToast('Файл загружен', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка загрузки файла', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      try {
        await deleteMedia(mediaId);
      } catch (error) {
        if (!isOnline || (error instanceof ApiError && error.status >= 500)) {
          // Queue for offline sync
          await addToQueue({
            entity: 'media',
            entity_id: mediaId,
            action: 'DELETE',
            client_time: new Date().toISOString(),
          });
          await updatePendingCount();

          // Optimistic update
          queryClient.setQueryData(['media', patientId], (old: any) =>
            old?.filter((item: any) => item.id !== mediaId)
          );

          throw new Error('offline');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', patientId] });
      showToast('Файл удалён', 'success');
    },
    onError: (error: Error) => {
      if (error.message === 'offline') {
        showToast('Удаление сохранено для синхронизации', 'success');
      } else {
        // Rollback optimistic update on error
        queryClient.invalidateQueries({ queryKey: ['media', patientId] });
        showToast(error.message || 'Ошибка удаления файла', 'error');
      }
    },
  });

  return {
    media: data,
    upload: uploadMutation.mutate,
    deleteMedia: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isLoading,
    error,
  };
}
