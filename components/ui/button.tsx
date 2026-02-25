import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = 'default',
  loading = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const fontSize = useAccessibilityFontSize(16);
  const buttonHeight = useAccessibilityFontSize(48);
  const borderRadius = useAccessibilityFontSize(12);
  const paddingHorizontal = useAccessibilityFontSize(24);

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    default: {
      backgroundColor: colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    destructive: {
      backgroundColor: colors.destructive,
    },
  };

  const textColors: Record<ButtonVariant, string> = {
    default: colors.primaryForeground,
    outline: colors.text,
    ghost: colors.text,
    destructive: '#FFFFFF',
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { height: buttonHeight, borderRadius, paddingHorizontal },
        variantStyles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <Text style={[styles.text, { color: textColors[variant], fontSize }]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
