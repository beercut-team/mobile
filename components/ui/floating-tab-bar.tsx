import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { BlurView, type BlurTint } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAuth } from '@/contexts/auth-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type TabBarOptions = BottomTabNavigationOptions & { href?: unknown };

const IOS_TINT: Record<'light' | 'dark', BlurTint> = {
  light: 'systemChromeMaterialLight',
  dark: 'systemChromeMaterialDark',
};

function getTabLabel(options: TabBarOptions, routeName: string): string {
  if (typeof options.tabBarLabel === 'string') return options.tabBarLabel;
  if (typeof options.title === 'string') return options.title;
  return routeName;
}

function resolveActiveRouteName(
  currentRouteName: string,
  visibleRouteNames: Set<string>,
  fallbackRouteName: string,
): string {
  if (visibleRouteNames.has(currentRouteName)) return currentRouteName;

  if (currentRouteName.startsWith('patients/') && visibleRouteNames.has('patients')) {
    return 'patients';
  }

  if (
    (currentRouteName === 'notifications' || currentRouteName === 'profile') &&
    visibleRouteNames.has('more')
  ) {
    return 'more';
  }

  return fallbackRouteName;
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const isIOS = Platform.OS === 'ios';

  const { isAccessibilityMode } = useAccessibility();
  const { hasRole } = useAuth();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const horizontalPadding = useAccessibilityFontSize(16);
  const tabBarRadius = useAccessibilityFontSize(24);
  const tabBarPadding = useAccessibilityFontSize(7);
  const tabGap = useAccessibilityFontSize(4);

  const canViewPatients = hasRole('DISTRICT_DOCTOR', 'SURGEON', 'ADMIN');
  const canModerate = hasRole('SURGEON', 'ADMIN');
  const currentRouteName = state.routes[state.index]?.name ?? state.routes[0]?.name ?? '';

  // Hide tab bar on deep patient details to prevent overlap with bottom content.
  if (currentRouteName.startsWith('patients/')) {
    return null;
  }

  const visibleTabNames = canModerate
    ? ['index', 'patients', 'moderation', 'more']
    : canViewPatients
      ? ['index', 'patients', 'notifications', 'more']
      : ['index', 'notifications', 'profile', 'more'];

  const visibleRoutes = visibleTabNames
    .map((name) => state.routes.find((route) => route.name === name))
    .filter((route): route is (typeof state.routes)[number] => route != null);

  if (!visibleRoutes.length) return null;

  const visibleRouteNames = new Set(visibleRoutes.map((route) => route.name));
  const activeRouteName = resolveActiveRouteName(
    currentRouteName,
    visibleRouteNames,
    visibleRoutes[0].name,
  );

  const blurTint: BlurTint = isAccessibilityMode
    ? theme
    : isIOS
      ? IOS_TINT[theme]
      : theme;

  const blurIntensity = isAccessibilityMode ? 0 : isIOS ? 90 : 95;
  const borderColor = isAccessibilityMode
    ? colors.border
    : isDark
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(255,255,255,0.75)';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: horizontalPadding,
        },
      ]}
      pointerEvents="box-none"
    >
      <BlurView
        tint={blurTint}
        intensity={blurIntensity}
        style={[
          styles.tabBar,
          {
            backgroundColor: isAccessibilityMode ? colors.card : 'rgba(255,255,255,0.02)',
            borderColor,
            borderRadius: tabBarRadius,
            paddingVertical: tabBarPadding,
            paddingHorizontal: tabBarPadding,
          },
        ]}
      >
        <View style={[styles.tabsRow, { gap: tabGap }]}>
          {visibleRoutes.map((route) => {
            const options = descriptors[route.key]?.options as TabBarOptions;
            const isFocused = route.name === activeRouteName;
            const label = getTabLabel(options, route.name);

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabButton
                key={route.key}
                label={label}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                renderIcon={options.tabBarIcon}
                testID={options.tabBarButtonTestID}
                colors={colors}
                theme={theme}
                isAccessibilityMode={isAccessibilityMode}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

interface TabButtonProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  renderIcon?: TabBarOptions['tabBarIcon'];
  testID?: string;
  colors: (typeof Colors)['light'];
  theme: 'light' | 'dark';
  isAccessibilityMode: boolean;
}

function TabButton({
  label,
  isFocused,
  onPress,
  onLongPress,
  renderIcon,
  testID,
  colors,
  theme,
  isAccessibilityMode,
}: TabButtonProps) {
  const scale = useSharedValue(1);
  const isDark = theme === 'dark';
  const iconSize = useAccessibilityFontSize(20);
  const labelSize = useAccessibilityFontSize(11);
  const labelLineHeight = Math.round(labelSize * 1.15);
  const innerMinHeight = useAccessibilityFontSize(54);
  const innerPaddingVertical = useAccessibilityFontSize(7);
  const innerPaddingHorizontal = useAccessibilityFontSize(8);
  const innerRadius = useAccessibilityFontSize(17);
  const innerGap = useAccessibilityFontSize(4);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 16, stiffness: 420 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 16, stiffness: 420 });
  };

  const color = isFocused ? colors.primary : colors.mutedForeground;

  const activeCapsuleStyle: ViewStyle | undefined = isFocused
    ? {
        backgroundColor: isAccessibilityMode
          ? colors.primary + '20'
          : isDark
            ? 'rgba(10,132,255,0.3)'
            : 'rgba(10,132,255,0.13)',
        borderColor: isAccessibilityMode
          ? colors.primary
          : isDark
            ? 'rgba(170,210,255,0.38)'
            : 'rgba(190,220,255,0.9)',
        borderWidth: isAccessibilityMode ? 1 : 0.7,
        ...Platform.select({
          ios: {
            shadowColor: '#0A84FF',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.2 : 0.14,
            shadowRadius: 8,
          },
          android: {
            elevation: 2,
          },
          web: {
            shadowColor: '#0A84FF',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.2 : 0.14,
            shadowRadius: 8,
          },
        }),
      }
    : undefined;

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tab, animatedStyle]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      testID={testID}
    >
      <View
        style={[
          styles.tabInner,
          {
            minHeight: innerMinHeight,
            paddingVertical: innerPaddingVertical,
            paddingHorizontal: innerPaddingHorizontal,
            borderRadius: innerRadius,
            gap: innerGap,
          },
          activeCapsuleStyle,
        ]}
      >
        {renderIcon?.({ color, size: iconSize, focused: isFocused })}
        <Text
          style={[
            styles.label,
            {
              color,
              fontSize: labelSize,
              lineHeight: labelLineHeight,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}
          numberOfLines={isAccessibilityMode ? 2 : 1}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBar: {
    width: '100%',
    maxWidth: 560,
    overflow: 'hidden',
    borderWidth: 0.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        backdropFilter: 'blur(20px) saturate(180%)',
      },
    }),
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    minWidth: 0,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    letterSpacing: -0.1,
    includeFontPadding: false,
  },
});
