import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  registerForPushNotifications,
  sendPushToken,
  setBadgeCount,
  type PushNotificationData,
} from '@/lib/push-notifications';
import { useAuth } from '@/contexts/auth-context';

/**
 * Hook to handle push notification registration and navigation
 * Should be called once in the root layout after auth is initialized
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Only register if user is authenticated
    if (!user) return;

    // Register for push notifications
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await sendPushToken(token);
          console.log('Push token registered:', token);
        }
      } catch (error) {
        console.error('Failed to register push notifications:', error);
      }
    })();

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);

        // Invalidate notifications queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Update badge count on iOS
        if (Platform.OS === 'ios') {
          const badge = notification.request.content.badge;
          if (typeof badge === 'number') {
            setBadgeCount(badge);
          }
        }
      }
    );

    // Listen for user tapping on notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as unknown as PushNotificationData;
        handleNotificationNavigation(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, queryClient]);

  /**
   * Navigate to the appropriate screen based on notification type
   */
  const handleNotificationNavigation = (data: PushNotificationData) => {
    if (!data.type) return;

    try {
      // Most notification types should navigate to patient detail
      if (data.patient_id) {
        router.push(`/(tabs)/patients/${data.patient_id}` as any);
      }

      // Clear badge after handling notification
      if (Platform.OS === 'ios') {
        setBadgeCount(0);
      }

      // Invalidate notifications to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  };
}
