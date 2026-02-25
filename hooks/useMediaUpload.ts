import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientMedia, uploadMedia, deleteMedia } from '@/lib/media';
import type { UploadMediaRequest } from '@/lib/media';
import { useToast } from '@/contexts/toast-context';

export function useMediaUpload(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
      await deleteMedia(mediaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', patientId] });
      showToast('Файл удалён', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка удаления файла', 'error');
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
