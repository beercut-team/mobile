import { ScrollView, StyleSheet, View, RefreshControl, ActivityIndicator, Platform, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PatientCard } from '@/components/patient/PatientCard';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { getDashboard, getPatient, getPatients, STATUS_LABELS, OPERATION_LABELS, EYE_LABELS, type PatientStatus } from '@/lib/patients';
import { getUnreadCount } from '@/lib/notifications';
import { getPatientChecklist, getChecklistProgress, CHECKLIST_STATUS_LABELS } from '@/lib/checklists';

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
  const tabBarClearance = Math.max(156, insets.bottom + 126);
  const router = useRouter();

  const greetingSize = useAccessibilityFontSize(15);
  const roleTextSize = useAccessibilityFontSize(12);
  const notifTextSize = useAccessibilityFontSize(14);
  const statCountSize = useAccessibilityFontSize(28);
  const statLabelSize = useAccessibilityFontSize(12);
  const statCountLineHeight = Math.round(statCountSize * 1.15);
  const statLabelLineHeight = Math.round(statLabelSize * 1.25);
  const dotSize = useAccessibilityFontSize(8);
  const rolePadding = useAccessibilityFontSize(12);
  const borderRadius = useAccessibilityFontSize(12);

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

  const { data: checklistData, isLoading: checklistLoading } = useQuery({
    queryKey: ['checklist', patientData?.data?.id],
    queryFn: () => getPatientChecklist(patientData!.data.id),
    enabled: isPatient && !!patientData?.data?.id,
  });

  const { data: progressData } = useQuery({
    queryKey: ['checklist-progress', patientData?.data?.id],
    queryFn: () => getChecklistProgress(patientData!.data.id),
    enabled: isPatient && !!patientData?.data?.id,
  });

  const { data: recentPatients, isLoading: recentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['patients', 'recent'],
    queryFn: () => getPatients({ limit: 5, page: 1 }),
    enabled: showDashboard,
    staleTime: 5 * 60 * 1000,
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || patientLoading || recentLoading}
            onRefresh={() => {
              refetch();
              if (isPatient) refetchPatient();
              if (showDashboard) refetchRecent();
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

        {/* Quick Create Button */}
        {hasRole('DISTRICT_DOCTOR', 'ADMIN') && (
          <Button
            onPress={() => router.push('/(tabs)/patients/create')}
            style={styles.createButton}
          >
            + Создать пациента
          </Button>
        )}

        {/* Recent Patients */}
        {showDashboard && recentPatients && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Недавние пациенты
            </ThemedText>
            {recentLoading && <ActivityIndicator size="large" color={colors.primary} />}
            {!recentLoading && recentPatients.data?.length === 0 && (
              <Card style={styles.emptyCard}>
                <ThemedText style={{ color: colors.mutedForeground }}>
                  Пациенты не найдены
                </ThemedText>
              </Card>
            )}
            {!recentLoading && recentPatients.data?.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                progress={STATUS_READINESS[patient.status]}
              />
            ))}
          </View>
        )}

        {/* Dashboard Stats */}
        {showDashboard && stats && (() => {
          const totalPatients = Object.values(stats).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
          if (totalPatients === 0) return null;

          return (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Статистика пациентов
              </ThemedText>
              <View style={styles.statsGrid}>
                {(Object.entries(stats) as [PatientStatus, number][]).map(([status, count]) => {
                  if (!STATUS_LABELS[status]) return null;
                  const readiness = STATUS_READINESS[status];
                  return (
                    <Pressable
                      key={status}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        router.push({
                          pathname: '/(tabs)/patients',
                          params: { statusFilter: status }
                        });
                      }}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Показать пациентов со статусом ${STATUS_LABELS[status]}`}
                    >
                      <Card style={styles.statCard}>
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
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })()}

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

                {/* Checklist Card */}
                <Card style={styles.medicalCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <ThemedText type="subtitle">Чек-лист подготовки</ThemedText>
                    {progressData?.data && (
                      <ThemedText style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {progressData.data.completed}/{progressData.data.total}
                      </ThemedText>
                    )}
                  </View>

                  {checklistLoading && <ActivityIndicator size="small" color={colors.primary} />}

                  {!checklistLoading && checklistData?.data && checklistData.data.length === 0 && (
                    <ThemedText style={{ color: colors.mutedForeground, textAlign: 'center', paddingVertical: 12 }}>
                      Чек-лист пока не создан
                    </ThemedText>
                  )}

                  {!checklistLoading && checklistData?.data && checklistData.data.slice(0, 5).map((item, index) => (
                    <View key={item.id}>
                      {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                      <View style={styles.infoRow}>
                        <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                          {item.name}
                        </ThemedText>
                        <ThemedText style={[styles.infoValue, {
                          color: item.status === 'COMPLETED' ? '#10B981' : colors.mutedForeground,
                          fontWeight: '500'
                        }]}>
                          {CHECKLIST_STATUS_LABELS[item.status]}
                        </ThemedText>
                      </View>
                    </View>
                  ))}

                  {checklistData?.data && checklistData.data.length > 5 && (
                    <ThemedText style={{ color: colors.primary, textAlign: 'center', marginTop: 12, fontSize: 13 }}>
                      +{checklistData.data.length - 5} ещё
                    </ThemedText>
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
  createButton: {
    marginBottom: 20,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
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
