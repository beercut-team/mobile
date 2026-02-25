import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type TabBarOptions = BottomTabNavigationOptions & { href?: unknown };

function isRouteVisible(options: TabBarOptions): boolean {
  return options.href !== null;
}

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
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];

  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key]?.options as TabBarOptions;
    return isRouteVisible(options);
  });

  if (!visibleRoutes.length) return null;

  const visibleRouteNames = new Set(visibleRoutes.map((route) => route.name));
  const currentRouteName = state.routes[state.index]?.name ?? visibleRoutes[0].name;
  const activeRouteName = resolveActiveRouteName(
    currentRouteName,
    visibleRouteNames,
    visibleRoutes[0].name,
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
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
            />
          );
        })}
      </View>
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
}

function TabButton({
  label,
  isFocused,
  onPress,
  onLongPress,
  renderIcon,
  testID,
  colors,
}: TabButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const color = isFocused ? colors.primary : colors.mutedForeground;

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
            backgroundColor: isFocused ? colors.primary + '15' : 'transparent',
          },
        ]}
      >
        {renderIcon?.({ color, size: 20, focused: isFocused })}
        <Text
          style={[
            styles.label,
            {
              color,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}
          numberOfLines={1}
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
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabBar: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
    }),
  },
  tab: {
    flex: 1,
    minWidth: 0,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});
