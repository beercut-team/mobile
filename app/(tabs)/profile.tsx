import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();

  const avatarSize = useAccessibilityFontSize(88);
  const avatarTextSize = useAccessibilityFontSize(32);
  const avatarTextOffset = Math.max(1, Math.round(avatarTextSize * 0.06));
  const avatarRingInset = useAccessibilityFontSize(5);
  const avatarRingSize = avatarSize + avatarRingInset * 2;
  const avatarStatusSize = useAccessibilityFontSize(16);
  const avatarStatusBorder = Math.max(2, Math.round(useAccessibilityFontSize(2)));
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
  const tabBarClearance = Math.max(136, insets.bottom + 108);
  const logoutButtonLift = useAccessibilityFontSize(10);

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
  const initials = getInitials(user?.name, user?.first_name, user?.last_name);
  const isActive = user?.is_active !== false;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.header}>
          <View style={[styles.avatarWrap, { width: avatarRingSize, height: avatarRingSize }]}>
            <View
              style={[
                styles.avatarRing,
                {
                  backgroundColor: roleColor + '12',
                  borderColor: roleColor + '35',
                  width: avatarRingSize,
                  height: avatarRingSize,
                  borderRadius: avatarRingSize / 2,
                },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: roleColor, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color: '#fff',
                      fontSize: avatarTextSize,
                      lineHeight: avatarTextSize,
                      transform: [{ translateY: avatarTextOffset }],
                    },
                  ]}
                >
                  {initials}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.avatarStatus,
                {
                  backgroundColor: isActive ? '#10B981' : colors.mutedForeground,
                  borderColor: colors.background,
                  width: avatarStatusSize,
                  height: avatarStatusSize,
                  borderRadius: avatarStatusSize / 2,
                  borderWidth: avatarStatusBorder,
                },
              ]}
            />
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
        <Button variant="destructive" onPress={logout} style={[styles.logoutButton, { marginBottom: logoutButtonLift }]}>
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
  avatarWrap: {
    marginBottom: 14,
    position: 'relative',
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  avatarText: {
    fontWeight: '700',
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  avatarStatus: {
    position: 'absolute',
    right: 2,
    bottom: 2,
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
    gap: 12,
  },
  infoLabel: {
    flex: 1,
  },
  infoValue: {
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
    flexShrink: 0,
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
});
