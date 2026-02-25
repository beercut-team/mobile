import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientComments, createComment, markCommentsAsRead } from '@/lib/comments';
import type { CreateCommentRequest } from '@/lib/comments';
import { useToast } from '@/contexts/toast-context';

export function useComments(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', patientId],
    queryFn: async () => {
      const response = await getPatientComments(patientId);
      return response.data;
    },
    enabled: !!patientId,
    refetchInterval: 30000, // 30 seconds
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: CreateCommentRequest) => {
      await createComment(commentData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comments', patientId] });
      // Auto mark as read after adding comment
      try {
        await markCommentsAsRead(patientId);
      } catch (error) {
        // Silently fail if mark as read fails
        console.error('Failed to mark comments as read:', error);
      }
      showToast('Комментарий добавлен', 'success');
    },
    onError: (error: Error) => {
      showToast(error.message || 'Ошибка добавления комментария', 'error');
    },
  });

  const unreadCount = data?.filter(comment => !comment.is_read).length || 0;

  return {
    comments: data,
    addComment: addCommentMutation.mutate,
    unreadCount,
    isLoading: isLoading || addCommentMutation.isPending,
    error,
  };
}
