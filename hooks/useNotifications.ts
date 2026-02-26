import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/lib/notifications';

/**
 * Hook for managing notifications with React Query
 * Provides queries for notifications list and unread count,
 * plus mutations for marking as read
 */
export function useNotifications(page = 1, limit = 20) {
  const queryClient = useQueryClient();

  // Query for notifications list
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => getNotifications(page, limit),
    staleTime: 30000, // 30 seconds
  });

  // Query for unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 30000,
  });

  // Mutation for marking single notification as read
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation for marking all notifications as read
  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: notificationsData?.data ?? [],
    unreadCount: unreadCount ?? 0,
    isLoading,
    error,
    refetch,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllMutation.isPending,
  };
}
