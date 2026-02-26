import { Tabs } from 'expo-router';
import React from 'react';

import { FloatingTabBar } from '@/components/ui/floating-tab-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useNotifications } from '@/hooks/useNotifications';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[colorScheme ?? 'light'];
  const { hasRole } = useAuth();

  const canViewPatients = hasRole('DISTRICT_DOCTOR', 'SURGEON', 'ADMIN');
  const canModerate = hasRole('SURGEON', 'ADMIN');
  const showNotificationsTab = !canModerate;
  const showProfileTab = !canViewPatients;

  // Get unread count for badge (only fetch if tab is visible)
  const { unreadCount } = useNotifications(1, 1);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Пациенты',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.bullet.clipboard" color={color} />,
          href: canViewPatients ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="moderation"
        options={{
          title: 'Проверка',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.seal.fill" color={color} />,
          href: canModerate ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Уведомления',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="bell.fill" color={color} />,
          tabBarBadge: showNotificationsTab && unreadCount > 0 ? unreadCount : undefined,
          href: showNotificationsTab ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          href: showProfileTab ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Ещё',
          tabBarIcon: ({ color, size }) => <IconSymbol size={size ?? 24} name="ellipsis.circle.fill" color={color} />,
          href: undefined,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Документы',
          href: null,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="doc.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
