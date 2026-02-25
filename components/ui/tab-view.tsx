import { useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

export interface Tab {
  key: string;
  title: string;
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
  initialTab?: string;
}

export function TabView({ tabs, initialTab }: TabViewProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const fontSize = useAccessibilityFontSize(15);
  const tabHeight = useAccessibilityFontSize(44);

  const [activeTab, setActiveTab] = useState(initialTab ?? tabs[0]?.key);
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const handleTabLayout = useCallback((key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => ({ ...prev, [key]: { x, width } }));
  }, []);

  const handleTabPress = useCallback(
    (key: string) => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveTab(key);

      const layout = tabLayouts[key];
      if (layout) {
        indicatorX.value = withSpring(layout.x, { damping: 20, stiffness: 300 });
        indicatorWidth.value = withSpring(layout.width, { damping: 20, stiffness: 300 });

        // Scroll to make active tab visible
        scrollViewRef.current?.scrollTo({
          x: layout.x - 20,
          animated: true,
        });
      }
    },
    [tabLayouts, indicatorX, indicatorWidth]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content;

  return (
    <View style={styles.container}>
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                onLayout={(e) => handleTabLayout(tab.key, e)}
                style={[styles.tab, { height: tabHeight }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? colors.primary : colors.mutedForeground,
                      fontSize,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.primary },
            indicatorStyle,
          ]}
        />
      </View>
      <View style={styles.contentContainer}>{activeTabContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
