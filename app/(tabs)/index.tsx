import { ScrollView, StyleSheet, View, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { getDashboard, getPatient, STATUS_LABELS, OPERATION_LABELS, EYE_LABELS, type PatientStatus } from '@/lib/patients';
import { getUnreadCount } from '@/lib/notifications';

const ROLE_LABELS: Record<string, string> = {
  DISTRICT_DOCTOR: 'Районный врач',
  SURGEON: 'Хирург',
  PATIENT: 'Пациент',
  ADMIN: 'Администратор',
};

// Readiness percentage for each status (workflow completion)
const STATUS_READINESS: Record<PatientStatus, number> = {
  NEW: 10,
  PREPARATION: 30,
  REVIEW_NEEDED: 50,
  APPROVED: 70,
  SURGERY_SCHEDULED: 90,
  COMPLETED: 100,
  REJECTED: 0,
};

export default function HomeScreen() {
  const { user, hasRole } = useAuth();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();

  const greetingSize = useAccessibilityFontSize(15);
  const roleTextSize = useAccessibilityFontSize(12);
  const notifTextSize = useAccessibilityFontSize(14);
  const statCountSize = useAccessibilityFontSize(28);
  const statLabelSize = useAccessibilityFontSize(12);
  const statCountLineHeight = Math.round(statCountSize * 1.15);
  const statLabelLineHeight = Math.round(statLabelSize * 1.25);
  const actionIconSize = useAccessibilityFontSize(24);
  const actionLabelSize = useAccessibilityFontSize(13);
  const dotSize = useAccessibilityFontSize(8);
  const rolePadding = useAccessibilityFontSize(12);
  const borderRadius = useAccessibilityFontSize(12);
  const actionIconContainerSize = useAccessibilityFontSize(48);

  const showDashboard = hasRole('DISTRICT_DOCTOR', 'SURGEON', 'ADMIN');
  const isPatient = hasRole('PATIENT');

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    enabled: showDashboard,
  });

  const { data: patientData, isLoading: patientLoading, error: patientError, refetch: refetchPatient } = useQuery({
    queryKey: ['patient', user?.id],
    queryFn: () => getPatient(user!.id),
    enabled: isPatient && !!user?.id,
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
          <RefreshControl
            refreshing={isLoading || patientLoading}
            onRefresh={() => {
              refetch();
              if (isPatient) refetchPatient();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={[styles.greeting, { color: colors.mutedForeground, fontSize: greetingSize }]}>
              {greeting()}
            </ThemedText>
            <ThemedText type="title" style={styles.name}>
              {user?.name ?? user?.first_name ?? 'Пользователь'}
            </ThemedText>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15', paddingHorizontal: rolePadding, paddingVertical: rolePadding / 2, borderRadius }]}>
            <ThemedText style={[styles.roleText, { color: colors.primary, fontSize: roleTextSize }]}>
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            </ThemedText>
          </View>
        </View>

        {/* Notifications Card */}
        {unread != null && unread > 0 && (
          <Card style={[styles.notifCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <View style={styles.notifContent}>
              <View style={[styles.notifDot, { backgroundColor: colors.primary, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
              <ThemedText style={[styles.notifText, { fontSize: notifTextSize }]}>
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
                const readiness = STATUS_READINESS[status];
                return (
                  <Card key={status} style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <View style={styles.statBadgeWrap}>
                        <StatusBadge
                          status={STATUS_LABELS[status]}
                          percentage={readiness}
                          size="sm"
                          multiline
                        />
                      </View>
                      <View style={styles.readinessWrap}>
                        <ThemedText numberOfLines={1} style={[styles.readinessText, { color: colors.mutedForeground, fontSize: statLabelSize }]}>
                          {readiness}%
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.statBody}>
                      <ThemedText
                        numberOfLines={1}
                        style={[styles.statCount, { fontSize: statCountSize, lineHeight: statCountLineHeight }]}
                      >
                        {count}
                      </ThemedText>
                      <ThemedText
                        numberOfLines={1}
                        style={[styles.statLabel, { color: colors.mutedForeground, fontSize: statLabelSize, lineHeight: statLabelLineHeight }]}
                      >
                        {count === 1 ? 'пациент' : count < 5 ? 'пациента' : 'пациентов'}
                      </ThemedText>
                    </View>
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
                <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15', width: actionIconContainerSize, height: actionIconContainerSize, borderRadius: actionIconContainerSize / 3 }]}>
                  <ThemedText style={{ fontSize: actionIconSize }}>+</ThemedText>
                </View>
                <ThemedText style={[styles.actionLabel, { fontSize: actionLabelSize }]}>Новый пациент</ThemedText>
              </Card>
              <Card
                style={[styles.actionCard, { borderColor: '#8B5CF6' + '30' }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' + '15', width: actionIconContainerSize, height: actionIconContainerSize, borderRadius: actionIconContainerSize / 3 }]}>
                  <ThemedText style={{ fontSize: actionIconSize }}>?</ThemedText>
                </View>
                <ThemedText style={[styles.actionLabel, { fontSize: actionLabelSize }]}>На проверке</ThemedText>
              </Card>
            </View>
          </View>
        )}

        {/* Patient Medical Data */}
        {isPatient && (
          <View style={styles.section}>
            {patientLoading && (
              <Card style={styles.welcomeCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={{ marginTop: 12, textAlign: 'center' }}>
                  Загрузка данных...
                </ThemedText>
              </Card>
            )}

            {patientError && (
              <Card style={styles.welcomeCard}>
                <ThemedText style={{ color: colors.destructive, marginBottom: 12 }}>
                  Не удалось загрузить медицинские данные
                </ThemedText>
                <Button onPress={() => refetchPatient()}>Повторить</Button>
              </Card>
            )}

            {patientData?.data && (
              <>
                {/* Status Card */}
                <Card style={styles.patientStatusCard}>
                  <View style={styles.statusHeader}>
                    <ThemedText type="subtitle">Статус подготовки</ThemedText>
                    <StatusBadge
                      status={STATUS_LABELS[patientData.data.status]}
                      percentage={STATUS_READINESS[patientData.data.status]}
                    />
                  </View>
                </Card>

                {/* Medical Info Card */}
                <Card style={styles.medicalCard}>
                  <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                    Медицинская информация
                  </ThemedText>

                  <View style={styles.infoRow}>
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Диагноз
                    </ThemedText>
                    <ThemedText style={[styles.infoValue, styles.infoValueStrong]}>
                      {patientData.data.diagnosis || 'Не указан'}
                    </ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.infoRow}>
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Операция
                    </ThemedText>
                    <ThemedText style={[styles.infoValue, styles.infoValueStrong]}>
                      {OPERATION_LABELS[patientData.data.operation_type]} ({EYE_LABELS[patientData.data.eye]})
                    </ThemedText>
                  </View>

                  {patientData.data.surgery_date && (
                    <>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      <View style={styles.infoRow}>
                        <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                          Дата операции
                        </ThemedText>
                        <ThemedText style={[styles.infoValue, styles.infoValueStrong]}>
                          {new Date(patientData.data.surgery_date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </ThemedText>
                      </View>
                    </>
                  )}
                </Card>

                {/* Medical Team Card */}
                <Card style={styles.medicalCard}>
                  <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                    Медицинская команда
                  </ThemedText>

                  <View style={styles.infoRow}>
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Лечащий врач
                    </ThemedText>
                    <ThemedText style={[styles.infoValue, styles.infoValueStrong]}>
                      {patientData.data.doctor?.name || 'Не назначен'}
                    </ThemedText>
                  </View>

                  {patientData.data.surgeon && (
                    <>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      <View style={styles.infoRow}>
                        <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                          Хирург
                        </ThemedText>
                        <ThemedText style={[styles.infoValue, styles.infoValueStrong]}>
                          {patientData.data.surgeon.name}
                        </ThemedText>
                      </View>
                    </>
                  )}
                </Card>
              </>
            )}
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
    marginBottom: 4,
  },
  name: {},
  roleBadge: {
    marginTop: 4,
  },
  roleText: {
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
  notifDot: {},
  notifText: {
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
    minHeight: 140,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    gap: 6,
  },
  statBadgeWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
    zIndex: 0,
    overflow: 'visible',
  },
  statBody: {
    marginTop: 10,
    gap: 2,
    minHeight: 66,
    justifyContent: 'center',
  },
  readinessWrap: {
    minWidth: 44,
    marginLeft: 2,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  readinessText: {
    fontWeight: '600',
    flexShrink: 0,
    textAlign: 'right',
  },
  statCount: {
    fontWeight: '700',
    includeFontPadding: false,
  },
  statLabel: {
    fontWeight: '500',
    includeFontPadding: false,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
  welcomeCard: {
    gap: 8,
  },
  welcomeText: {
    lineHeight: 20,
  },
  patientStatusCard: {
    marginBottom: 14,
  },
  statusHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  medicalCard: {
    marginBottom: 14,
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  infoLabel: {
    flexBasis: '36%',
    minWidth: 0,
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  infoValueStrong: {
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
