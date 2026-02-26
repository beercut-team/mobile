import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
  }, [user]);

  /**
   * Navigate to the appropriate screen based on notification type
   */
  const handleNotificationNavigation = (data: PushNotificationData) => {
    if (!data.type) return;

    try {
      switch (data.type) {
        case 'comment':
          if (data.patientId) {
            router.push(`/(tabs)/patients/${data.patientId}`);
          }
          break;

        case 'status_change':
          if (data.patientId) {
            router.push(`/(tabs)/patients/${data.patientId}`);
          }
          break;

        case 'surgery_reminder':
          if (data.surgeryId) {
            // Navigate to notifications tab where surgery info might be displayed
            router.push('/(tabs)/notifications');
          }
          break;

        case 'moderation_completed':
          if (data.patientId) {
            router.push(`/(tabs)/patients/${data.patientId}`);
          }
          break;

        default:
          console.warn('Unknown notification type:', data.type);
      }

      // Clear badge after handling notification
      if (Platform.OS === 'ios') {
        setBadgeCount(0);
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  };
}
