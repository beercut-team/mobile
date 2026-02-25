import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { IconSymbol } from './icon-symbol';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Выберите...',
  disabled = false,
}: SelectProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const labelFontSize = useAccessibilityFontSize(14);
  const borderRadius = useAccessibilityFontSize(8);

  if (Platform.OS === 'web') {
    return <WebSelect {...{ options, value, onChange, label, placeholder, disabled }} />;
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontSize: labelFontSize,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.pickerContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            borderRadius,
          },
          disabled && styles.disabled,
        ]}
      >
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          enabled={!disabled}
          style={[
            styles.picker,
            {
              color: colors.text,
            },
          ]}
          dropdownIconColor={colors.icon}
          accessibilityLabel={label}
        >
          {!value && (
            <Picker.Item
              label={placeholder}
              value=""
              color={colors.mutedForeground}
            />
          )}
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

// Web-specific implementation
function WebSelect({
  options,
  value,
  onChange,
  label,
  placeholder,
  disabled,
}: SelectProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const fontSize = useAccessibilityFontSize(16);
  const labelFontSize = useAccessibilityFontSize(14);
  const padding = useAccessibilityFontSize(12);
  const borderRadius = useAccessibilityFontSize(8);

  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontSize: labelFontSize,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View style={styles.webSelectWrapper}>
        <Pressable
          onPress={() => !disabled && setIsOpen(!isOpen)}
          style={[
            styles.webSelectButton,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              padding,
              borderRadius,
            },
            disabled && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled, expanded: isOpen }}
        >
          <Text
            style={[
              styles.webSelectText,
              {
                color: selectedOption ? colors.text : colors.mutedForeground,
                fontSize,
              },
            ]}
          >
            {selectedOption?.label || placeholder}
          </Text>
          <IconSymbol
            name={isOpen ? 'chevron.up' : 'chevron.down'}
            size={20}
            color={colors.icon}
          />
        </Pressable>
        {isOpen && !disabled && (
          <View
            style={[
              styles.webDropdown,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius,
              },
            ]}
          >
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={({ pressed, hovered }: any) => [
                  styles.webOption,
                  {
                    backgroundColor:
                      pressed || hovered ? colors.muted : 'transparent',
                    padding,
                  },
                  option.value === value && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.webOptionText,
                    {
                      color:
                        option.value === value
                          ? colors.primaryForeground
                          : colors.text,
                      fontSize,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  webSelectWrapper: {
    position: 'relative',
  },
  webSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  webSelectText: {
    flex: 1,
  },
  webDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'scroll',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webOption: {
    cursor: 'pointer',
  },
  webOptionText: {
    // Text styling
  },
});
