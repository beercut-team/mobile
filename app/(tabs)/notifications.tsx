import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/lib/notifications';

export default function NotificationsScreen() {
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(1, 50),
  });

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n) => !n.is_read);

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => {
        if (!item.is_read) {
          markReadMutation.mutate(item.id);
        }
      }}
      style={({ pressed }) => [
        styles.notifItem,
        {
          backgroundColor: item.is_read
            ? colors.card
            : colors.primary + '08',
          borderColor: item.is_read ? colors.border : colors.primary + '25',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.notifRow}>
        {!item.is_read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
        <View style={styles.notifContent}>
          <ThemedText style={styles.notifTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText
            style={[styles.notifMessage, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {item.message}
          </ThemedText>
          <ThemedText style={[styles.notifDate, { color: colors.mutedForeground }]}>
            {formatDate(item.created_at)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText type="title" style={styles.title}>
          Уведомления
        </ThemedText>
        {hasUnread && (
          <Button
            variant="ghost"
            onPress={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
            style={styles.markAllBtn}
          >
            Прочитать все
          </Button>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
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
              <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>
                ?
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
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
  },
  title: {
    fontSize: 28,
  },
  markAllBtn: {
    height: 36,
    paddingHorizontal: 12,
  },
  list: {
    padding: 20,
    paddingTop: 4,
    gap: 10,
  },
  notifItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifDate: {
    fontSize: 11,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 15,
  },
});
