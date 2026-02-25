import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDashboard, STATUS_LABELS, STATUS_COLORS, type PatientStatus } from '@/lib/patients';
import { getUnreadCount } from '@/lib/notifications';

const ROLE_LABELS: Record<string, string> = {
  DISTRICT_DOCTOR: 'Районный врач',
  SURGEON: 'Хирург',
  PATIENT: 'Пациент',
  ADMIN: 'Администратор',
};

export default function HomeScreen() {
  const { user, hasRole } = useAuth();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();

  const showDashboard = hasRole('DISTRICT_DOCTOR', 'SURGEON', 'ADMIN');

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    enabled: showDashboard,
  });

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const stats = dashboard?.data;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greeting()}
            </ThemedText>
            <ThemedText type="title" style={styles.name}>
              {user?.name ?? user?.first_name ?? 'Пользователь'}
            </ThemedText>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
            <ThemedText style={[styles.roleText, { color: colors.primary }]}>
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            </ThemedText>
          </View>
        </View>

        {/* Notifications Card */}
        {unread != null && unread > 0 && (
          <Card style={[styles.notifCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <View style={styles.notifContent}>
              <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
              <ThemedText style={styles.notifText}>
                {unread} {unread === 1 ? 'новое уведомление' : unread < 5 ? 'новых уведомления' : 'новых уведомлений'}
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Dashboard Stats */}
        {showDashboard && stats && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Статистика пациентов
            </ThemedText>
            <View style={styles.statsGrid}>
              {(Object.entries(stats) as [PatientStatus, number][]).map(([status, count]) => {
                if (!STATUS_LABELS[status]) return null;
                return (
                  <Card key={status} style={styles.statCard}>
                    <View style={[styles.statDot, { backgroundColor: STATUS_COLORS[status] }]} />
                    <ThemedText style={styles.statCount}>{count}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                      {STATUS_LABELS[status]}
                    </ThemedText>
                  </Card>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {showDashboard && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Быстрые действия
            </ThemedText>
            <View style={styles.actionsRow}>
              <Card
                style={[styles.actionCard, { borderColor: colors.primary + '30' }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <ThemedText style={{ fontSize: 24 }}>+</ThemedText>
                </View>
                <ThemedText style={styles.actionLabel}>Новый пациент</ThemedText>
              </Card>
              <Card
                style={[styles.actionCard, { borderColor: '#8B5CF6' + '30' }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                  <ThemedText style={{ fontSize: 24 }}>?</ThemedText>
                </View>
                <ThemedText style={styles.actionLabel}>На проверке</ThemedText>
              </Card>
            </View>
          </View>
        )}

        {/* Patient Role - Simple Info */}
        {!showDashboard && (
          <View style={styles.section}>
            <Card style={styles.welcomeCard}>
              <ThemedText type="subtitle">Добро пожаловать!</ThemedText>
              <ThemedText style={[styles.welcomeText, { color: colors.mutedForeground }]}>
                Вы можете просматривать уведомления и информацию о своём аккаунте в профиле.
              </ThemedText>
            </Card>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 15,
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notifCard: {
    marginBottom: 20,
    padding: 16,
  },
  notifContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%' as any,
    flexGrow: 1,
    padding: 16,
    alignItems: 'flex-start',
    gap: 6,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  welcomeCard: {
    gap: 8,
  },
  welcomeText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
