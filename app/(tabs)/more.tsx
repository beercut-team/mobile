import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { useAuth } from '@/contexts/auth-context';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  route: string;
}

export default function MoreScreen() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const { isAccessibilityMode, toggleAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();

  const titleSize = useAccessibilityFontSize(28);
  const itemTitleSize = useAccessibilityFontSize(16);
  const itemIconSize = useAccessibilityFontSize(24);
  const padding = useAccessibilityFontSize(16);
  const borderRadius = useAccessibilityFontSize(12);
  const sectionTitleSize = useAccessibilityFontSize(15);
  const sectionDescSize = useAccessibilityFontSize(13);
  const bottomSectionLift = useAccessibilityFontSize(10);
  const tabBarClearance = Math.max(136, insets.bottom + 108);

  const isPatient = hasRole('PATIENT');

  const menuItems: MenuItem[] = [
    ...(isPatient ? [{
      id: 'documents',
      title: 'Прикрепленные документы',
      icon: 'doc.fill' as React.ComponentProps<typeof IconSymbol>['name'],
      route: '/(tabs)/documents',
    }] : []),
    {
      id: 'profile',
      title: 'Профиль',
      icon: 'person.fill',
      route: '/(tabs)/profile',
    },
  ];

  const handleItemPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ThemedText type="title" style={{ fontSize: titleSize }}>
          Ещё
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleItemPress(item.route)}
            style={({ pressed }) => [
              styles.menuItem,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                padding,
                borderRadius,
              },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: colors.primary + '15',
                    width: itemIconSize * 2,
                    height: itemIconSize * 2,
                    borderRadius: itemIconSize,
                  },
                ]}
              >
                <IconSymbol name={item.icon} size={itemIconSize} color={colors.primary} />
              </View>
              <ThemedText
                style={[
                  styles.menuItemTitle,
                  {
                    fontSize: itemTitleSize,
                  },
                ]}
              >
                {item.title}
              </ThemedText>
            </View>

            <View style={styles.menuItemRight}>
              <IconSymbol name="chevron.right" size={20} color={colors.mutedForeground} />
            </View>
          </Pressable>
        ))}

        <View style={[styles.bottomSection, { marginBottom: bottomSectionLift }]}>
          {/* User Info Card */}
          <View
            style={[
              styles.userCard,
              {
                backgroundColor: colors.muted,
                padding,
                borderRadius,
              },
            ]}
          >
            <ThemedText style={[styles.userLabel, { color: colors.mutedForeground }]}>
              Вы вошли как
            </ThemedText>
            <ThemedText style={[styles.userName, { fontSize: itemTitleSize }]}>
              {user?.name || user?.first_name || 'Пользователь'}
            </ThemedText>
            <ThemedText style={[styles.userRole, { color: colors.mutedForeground }]}>
              {user?.role === 'DISTRICT_DOCTOR' && 'Районный врач'}
              {user?.role === 'SURGEON' && 'Хирург'}
              {user?.role === 'PATIENT' && 'Пациент'}
              {user?.role === 'ADMIN' && 'Администратор'}
            </ThemedText>
          </View>

          {/* Low Vision Mode */}
          <View
            style={[
              styles.accessibilityCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                padding,
                borderRadius,
              },
            ]}
          >
            <ThemedText style={[styles.accessibilityTitle, { fontSize: sectionTitleSize }]}>
              Версия для слабовидящих
            </ThemedText>
            <ThemedText style={[styles.accessibilityDesc, { color: colors.mutedForeground, fontSize: sectionDescSize }]}>
              {isAccessibilityMode ? 'Сейчас включена' : 'Сейчас выключена'}
            </ThemedText>
            <Button
              onPress={toggleAccessibilityMode}
              variant={isAccessibilityMode ? 'outline' : 'default'}
              style={styles.accessibilityButton}
            >
              {isAccessibilityMode ? 'Выключить режим' : 'Включить режим'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 12,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuItemTitle: {
    fontWeight: '600',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCard: {
    gap: 4,
  },
  userLabel: {
    fontSize: 12,
  },
  userName: {
    fontWeight: '600',
  },
  userRole: {
    fontSize: 14,
  },
  accessibilityCard: {
    borderWidth: 1,
    gap: 8,
  },
  accessibilityTitle: {
    fontWeight: '600',
  },
  accessibilityDesc: {},
  accessibilityButton: {
    marginTop: 4,
  },
});
