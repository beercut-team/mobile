import { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
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
  const fontSize = useAccessibilityFontSize(14);
  const tabHeight = useAccessibilityFontSize(40);
  const tabsPadding = useAccessibilityFontSize(6);
  const tabRadius = useAccessibilityFontSize(11);
  const shellRadius = useAccessibilityFontSize(16);

  const [activeTab, setActiveTab] = useState(initialTab ?? tabs[0]?.key);
  const handleTabPress = (key: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(key);
  };

  const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.tabsShell,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: shellRadius,
            padding: tabsPadding,
          },
        ]}
      >
        <ScrollView
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
                style={[
                  styles.tab,
                  {
                    height: tabHeight,
                    borderRadius: tabRadius,
                    backgroundColor: isActive ? colors.primary + '18' : 'transparent',
                    borderColor: isActive ? colors.primary + '45' : 'transparent',
                  },
                ]}
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
                  numberOfLines={1}
                >
                  {tab.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.contentContainer}>{activeTabContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsShell: {
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  contentContainer: {
    flex: 1,
  },
});
