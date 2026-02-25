import { ScrollView, StyleSheet, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

const ROLE_LABELS: Record<string, string> = {
  DISTRICT_DOCTOR: 'Районный врач',
  SURGEON: 'Хирург',
  PATIENT: 'Пациент',
  ADMIN: 'Администратор',
};

const ROLE_COLORS: Record<string, string> = {
  DISTRICT_DOCTOR: '#3B82F6',
  SURGEON: '#8B5CF6',
  PATIENT: '#10B981',
  ADMIN: '#F59E0B',
};

function getInitials(name?: string, firstName?: string, lastName?: string) {
  if (firstName && lastName) {
    return (lastName[0] + firstName[0]).toUpperCase();
  }
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isAccessibilityMode, toggleAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();

  const avatarSize = useAccessibilityFontSize(88);
  const avatarTextSize = useAccessibilityFontSize(32);
  const nameSize = useAccessibilityFontSize(24);
  const roleTextSize = useAccessibilityFontSize(13);
  const roleDotSize = useAccessibilityFontSize(7);
  const rolePadding = useAccessibilityFontSize(14);
  const roleBorderRadius = useAccessibilityFontSize(14);
  const emailSize = useAccessibilityFontSize(14);
  const cardTitleSize = useAccessibilityFontSize(16);
  const infoTextSize = useAccessibilityFontSize(14);
  const activeTextSize = useAccessibilityFontSize(12);
  const activeDotSize = useAccessibilityFontSize(6);
  const activeTagPaddingH = useAccessibilityFontSize(10);
  const activeTagPaddingV = useAccessibilityFontSize(4);
  const activeTagRadius = useAccessibilityFontSize(10);
  const accessibilityTitleSize = useAccessibilityFontSize(16);
  const accessibilityDescSize = useAccessibilityFontSize(13);

  const roleColor = ROLE_COLORS[user?.role ?? ''] ?? colors.primary;

  const infoRows: { label: string; value?: string | null }[] = [
    { label: 'Имя', value: user?.name || `${user?.last_name ?? ''} ${user?.first_name ?? ''}`.trim() },
    { label: 'Email', value: user?.email },
    { label: 'Телефон', value: user?.phone },
    { label: 'Роль', value: ROLE_LABELS[user?.role ?? ''] ?? user?.role },
  ];

  if (user?.specialization) {
    infoRows.push({ label: 'Специализация', value: user.specialization });
  }
  if (user?.license_number) {
    infoRows.push({ label: 'Номер лицензии', value: user.license_number });
  }

  const filteredRows = infoRows.filter((r) => r.value);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: roleColor, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            <ThemedText style={[styles.avatarText, { color: '#fff', fontSize: avatarTextSize }]}>
              {getInitials(user?.name, user?.first_name, user?.last_name)}
            </ThemedText>
          </View>
          <ThemedText type="title" style={[styles.name, { fontSize: nameSize }]}>
            {user?.name || `${user?.last_name ?? ''} ${user?.first_name ?? ''}`.trim()}
          </ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '18', paddingHorizontal: rolePadding, borderRadius: roleBorderRadius }]}>
            <View style={[styles.roleDot, { backgroundColor: roleColor, width: roleDotSize, height: roleDotSize, borderRadius: roleDotSize / 2 }]} />
            <ThemedText style={[styles.roleText, { color: roleColor, fontSize: roleTextSize }]}>
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            </ThemedText>
          </View>
          <ThemedText style={[styles.email, { color: colors.mutedForeground, fontSize: emailSize }]}>
            {user?.email}
          </ThemedText>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <ThemedText style={[styles.cardTitle, { fontSize: cardTitleSize }]}>Информация</ThemedText>
          {filteredRows.map((row, idx) => (
            <View key={row.label}>
              {idx > 0 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground, fontSize: infoTextSize }]}>
                  {row.label}
                </ThemedText>
                <ThemedText style={[styles.infoValue, { fontSize: infoTextSize }]} numberOfLines={1}>
                  {row.value}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>

        {/* Accessibility Mode */}
        <Card style={styles.accessibilityCard}>
          <View style={styles.accessibilityHeader}>
            <View style={styles.accessibilityInfo}>
              <ThemedText style={[styles.accessibilityTitle, { fontSize: accessibilityTitleSize }]}>
                Версия для слабовидящих
              </ThemedText>
              <ThemedText style={[styles.accessibilityDesc, { color: colors.mutedForeground, fontSize: accessibilityDescSize }]}>
                Увеличенный шрифт и высокий контраст
              </ThemedText>
            </View>
            <Switch
              value={isAccessibilityMode}
              onValueChange={toggleAccessibilityMode}
              trackColor={{ false: colors.muted, true: colors.primary + '40' }}
              thumbColor={isAccessibilityMode ? colors.primary : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Account Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground, fontSize: infoTextSize }]}>
              Статус аккаунта
            </ThemedText>
            <View style={[styles.activeTag, { backgroundColor: '#10B981' + '18', paddingHorizontal: activeTagPaddingH, paddingVertical: activeTagPaddingV, borderRadius: activeTagRadius }]}>
              <View style={[styles.activeDot, { backgroundColor: '#10B981', width: activeDotSize, height: activeDotSize, borderRadius: activeDotSize / 2 }]} />
              <ThemedText style={[styles.activeText, { color: '#10B981', fontSize: activeTextSize }]}>
                {user?.is_active !== false ? 'Активен' : 'Неактивен'}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Logout */}
        <Button variant="destructive" onPress={logout} style={styles.logoutButton}>
          Выйти из аккаунта
        </Button>
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
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontWeight: '700',
  },
  name: {
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 10,
  },
  roleDot: {},
  roleText: {
    fontWeight: '600',
  },
  email: {
    marginTop: 8,
  },
  infoCard: {
    gap: 0,
    marginBottom: 14,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {},
  infoValue: {
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
  } as any,
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  statusCard: {
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {},
  activeText: {
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
  },
  accessibilityCard: {
    marginBottom: 14,
  },
  accessibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessibilityInfo: {
    flex: 1,
    marginRight: 12,
  },
  accessibilityTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  accessibilityDesc: {
    lineHeight: 18,
  },
});
