import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  showPasswordToggle,
  secureTextEntry,
  ...props
}: InputProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const [focused, setFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const labelFontSize = useAccessibilityFontSize(14);
  const inputFontSize = useAccessibilityFontSize(16);
  const errorFontSize = useAccessibilityFontSize(13);
  const inputHeight = useAccessibilityFontSize(48);
  const iconSize = useAccessibilityFontSize(20);
  const borderRadius = useAccessibilityFontSize(12);
  const toggleButtonRight = useAccessibilityFontSize(12);
  const toggleButtonPadding = useAccessibilityFontSize(48);

  const shouldShowToggle = showPasswordToggle && secureTextEntry;

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[styles.label, { color: colors.text, fontSize: labelFontSize }]}>{label}</Text>
      )}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={[
            styles.input,
            {
              height: inputHeight,
              fontSize: inputFontSize,
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: error
                ? colors.destructive
                : focused
                  ? colors.ring
                  : colors.border,
              paddingRight: shouldShowToggle ? toggleButtonPadding : 16,
              borderRadius,
            },
            style,
          ]}
          {...props}
        />
        {shouldShowToggle && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={[styles.toggleButton, { right: toggleButtonRight }]}
            hitSlop={8}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={iconSize}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive, fontSize: errorFontSize }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  toggleButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    marginTop: 4,
  },
});
