import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  color?: string;
}

export function ProgressBar({
  current,
  total,
  showLabel = false,
  color,
}: ProgressBarProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const fontSize = useAccessibilityFontSize(12);
  const height = useAccessibilityFontSize(8);
  const borderRadius = useAccessibilityFontSize(4);

  const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(percentage, {
      damping: 15,
      stiffness: 100,
    });
  }, [percentage, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const progressColor = color || colors.primary;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.muted,
            height,
            borderRadius,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: total,
          now: current,
        }}
        accessibilityLabel={`Прогресс: ${current} из ${total}`}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: progressColor,
              borderRadius,
            },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: colors.mutedForeground,
              fontSize,
            },
          ]}
        >
          {Math.round(percentage)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  label: {
    marginTop: 4,
    fontWeight: '500',
  },
});
