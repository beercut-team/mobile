import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText
              style={[styles.avatarText, { color: colors.primaryForeground }]}
            >
              {user?.name ? getInitials(user.name) : '?'}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.name}>
            {user?.name}
          </ThemedText>
          <ThemedText style={[styles.email, { color: colors.mutedForeground }]}>
            {user?.email}
          </ThemedText>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Имя
            </ThemedText>
            <ThemedText style={styles.infoValue}>{user?.name}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Email
            </ThemedText>
            <ThemedText style={styles.infoValue}>{user?.email}</ThemedText>
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
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    textAlign: 'center',
  },
  email: {
    marginTop: 4,
    fontSize: 15,
  },
  infoCard: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  logoutButton: {
    marginTop: 32,
  },
});
