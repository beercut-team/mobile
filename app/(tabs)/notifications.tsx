import { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/lib/notifications';
import { getNotificationIcon } from '@/lib/notifications';

export default function NotificationsScreen() {
  const { user, hasRole } = useAuth();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();
  const tabBarClearance = Math.max(156, insets.bottom + 126);
  const isPatient = hasRole('PATIENT');

  const titleSize = useAccessibilityFontSize(28);
  const notifTitleSize = useAccessibilityFontSize(15);
  const notifMessageSize = useAccessibilityFontSize(13);
  const notifDateSize = useAccessibilityFontSize(11);
  const emptyIconSize = useAccessibilityFontSize(40);
  const emptyTextSize = useAccessibilityFontSize(15);
  const unreadDotSize = useAccessibilityFontSize(8);
  const iconSize = useAccessibilityFontSize(20);
  const borderRadius = useAccessibilityFontSize(14);
  const markAllBtnHeight = useAccessibilityFontSize(36);
  const markAllBtnPadding = useAccessibilityFontSize(12);

  const {
    notifications: allNotifications,
    isLoading,
    error,
    refetch,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications(1, 50);

  // Filter notifications for patients - only show notifications related to their patient record
  const notifications = useMemo(() => {
    if (!isPatient || !user?.id) {
      return allNotifications;
    }
    // For patients, only show notifications where entity_id matches their user_id (patient_id)
    return allNotifications.filter(n => n.entity_id === user.id);
  }, [allNotifications, isPatient, user?.id]);

  const hasUnread = notifications.some((n) => !n.is_read);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Error state
  if (error && !isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <ThemedText type="title" style={[styles.title, { fontSize: titleSize }]}>
            Уведомления
          </ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.destructive, fontSize: emptyTextSize }]}>
            Ошибка загрузки уведомлений
          </ThemedText>
          <Button onPress={() => refetch()} style={styles.retryButton}>
            Повторить
          </Button>
        </View>
      </ThemedView>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Только что';
    if (mins < 60) return `${mins} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.type);

    return (
      <View
        style={[
          styles.notifItem,
          {
            backgroundColor: item.is_read
              ? colors.card
              : colors.primary + '08',
            borderColor: item.is_read ? colors.border : colors.primary + '25',
            borderRadius,
          },
        ]}
      >
        <View style={styles.notifRow}>
          <View style={[styles.iconContainer, { width: iconSize + 16, height: iconSize + 16, borderRadius: (iconSize + 16) / 2, backgroundColor: colors.primary + '15' }]}>
            <IconSymbol name={iconName as any} size={iconSize} color={colors.primary} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <ThemedText style={[styles.notifTitle, { fontSize: notifTitleSize }]} numberOfLines={1}>
                {item.title}
              </ThemedText>
              {!item.is_read && (
                <View
                  style={[styles.unreadDot, { backgroundColor: colors.primary, width: unreadDotSize, height: unreadDotSize, borderRadius: unreadDotSize / 2 }]}
                  accessibilityLabel="Непрочитанное уведомление"
                />
              )}
            </View>
            <ThemedText
              style={[styles.notifMessage, { color: colors.mutedForeground, fontSize: notifMessageSize }]}
              numberOfLines={2}
            >
              {item.body}
            </ThemedText>
            <ThemedText style={[styles.notifDate, { color: colors.mutedForeground, fontSize: notifDateSize }]}>
              {formatDate(item.created_at)}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText type="title" style={[styles.title, { fontSize: titleSize }]}>
          Уведомления
        </ThemedText>
        {hasUnread && (
          <Button
            variant="ghost"
            onPress={() => markAllAsRead()}
            loading={isMarkingAllRead}
            style={[styles.markAllBtn, { height: markAllBtnHeight, paddingHorizontal: markAllBtnPadding }]}
          >
            Прочитать все
          </Button>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarClearance }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <ThemedText style={{ fontSize: emptyIconSize, marginBottom: 12 }}>
                📭
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground, fontSize: emptyTextSize }]}>
                Нет уведомлений
              </ThemedText>
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    flex: 1,
  },
  markAllBtn: {},
  list: {
    padding: 20,
    paddingTop: 4,
    gap: 10,
  },
  notifItem: {
    borderWidth: 1,
    padding: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {},
  notifMessage: {
    lineHeight: 18,
  },
  notifDate: {
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {},
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
});
