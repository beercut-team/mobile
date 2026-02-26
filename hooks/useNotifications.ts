import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/lib/notifications';
import { useAuth } from '@/contexts/auth-context';

/**
 * Hook for managing notifications with React Query
 * Provides queries for notifications list and unread count,
 * plus mutations for marking as read
 */
export function useNotifications(page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const isPatient = hasRole('PATIENT');

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

  // Filter notifications for patients - only show notifications where entity_id matches their user_id
  const filteredNotifications = useMemo(() => {
    const allNotifications = notificationsData?.data ?? [];
    if (!isPatient || !user?.id) {
      return allNotifications;
    }
    // For patients, only show notifications where entity_id matches their user_id
    return allNotifications.filter(n => n.entity_id === user.id);
  }, [notificationsData?.data, isPatient, user?.id]);

  // Filter unread count for patients
  const filteredUnreadCount = useMemo(() => {
    if (!isPatient || !user?.id) {
      return unreadCount ?? 0;
    }
    // For patients, count only unread notifications where entity_id matches their user_id
    const allNotifications = notificationsData?.data ?? [];
    return allNotifications.filter(n => !n.is_read && n.entity_id === user.id).length;
  }, [notificationsData?.data, isPatient, user?.id, unreadCount]);

  return {
    notifications: filteredNotifications,
    unreadCount: filteredUnreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllMutation.isPending,
  };
}
