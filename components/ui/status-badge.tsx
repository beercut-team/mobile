import { StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  status: string;
  percentage: number;
  size?: BadgeSize;
}

export function StatusBadge({ status, percentage, size = 'md' }: StatusBadgeProps) {
  const theme = useColorScheme() ?? 'light';

  // Size configurations
  const sizeConfig = {
    sm: {
      fontSize: useAccessibilityFontSize(12),
      paddingVertical: useAccessibilityFontSize(4),
      paddingHorizontal: useAccessibilityFontSize(8),
      borderRadius: useAccessibilityFontSize(8),
    },
    md: {
      fontSize: useAccessibilityFontSize(14),
      paddingVertical: useAccessibilityFontSize(6),
      paddingHorizontal: useAccessibilityFontSize(12),
      borderRadius: useAccessibilityFontSize(10),
    },
    lg: {
      fontSize: useAccessibilityFontSize(16),
      paddingVertical: useAccessibilityFontSize(8),
      paddingHorizontal: useAccessibilityFontSize(16),
      borderRadius: useAccessibilityFontSize(12),
    },
  };

  // Color logic based on percentage
  const getStatusColor = () => {
    if (percentage < 50) {
      return {
        background: theme === 'dark' ? '#7F1D1D' : '#FEE2E2',
        text: theme === 'dark' ? '#FCA5A5' : '#991B1B',
      };
    } else if (percentage >= 50 && percentage < 90) {
      return {
        background: theme === 'dark' ? '#78350F' : '#FEF3C7',
        text: theme === 'dark' ? '#FCD34D' : '#92400E',
      };
    } else {
      return {
        background: theme === 'dark' ? '#14532D' : '#D1FAE5',
        text: theme === 'dark' ? '#86EFAC' : '#065F46',
      };
    }
  };

  const statusColors = getStatusColor();
  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusColors.background,
          paddingVertical: config.paddingVertical,
          paddingHorizontal: config.paddingHorizontal,
          borderRadius: config.borderRadius,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${status}, ${percentage} процентов`}
    >
      <Text
        style={[
          styles.text,
          {
            color: statusColors.text,
            fontSize: config.fontSize,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
