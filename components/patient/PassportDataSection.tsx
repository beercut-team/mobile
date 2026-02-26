import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Patient } from '@/lib/patients';

interface PassportDataSectionProps {
  patient: Patient;
}

export function PassportDataSection({ patient }: PassportDataSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const titleFontSize = useAccessibilityFontSize(16);
  const labelFontSize = useAccessibilityFontSize(14);
  const valueFontSize = useAccessibilityFontSize(14);
  const padding = useAccessibilityFontSize(16);
  const borderRadius = useAccessibilityFontSize(12);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const dataRows = [
    { label: 'Дата рождения', value: formatDate(patient.date_of_birth) },
    { label: 'СНИЛС', value: patient.snils || '—' },
    { label: 'Паспорт', value: patient.passport_series && patient.passport_number
        ? `${patient.passport_series} ${patient.passport_number}`
        : '—' },
    { label: 'Полис ОМС', value: patient.policy_number || '—' },
    { label: 'Телефон', value: patient.phone || '—' },
    { label: 'Email', value: patient.email || '—' },
    { label: 'Адрес', value: patient.address || '—' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius,
        },
      ]}
    >
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={[styles.header, { padding }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel="Паспортные данные"
      >
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: titleFontSize,
            },
          ]}
        >
          Паспортные данные
        </Text>
        <IconSymbol
          name={isExpanded ? 'chevron.up' : 'chevron.down'}
          size={20}
          color={colors.icon}
        />
      </Pressable>

      {isExpanded && (
        <View style={[styles.content, { padding, paddingTop: 0 }]}>
          {dataRows.map((row, index) => (
            <View
              key={index}
              style={[
                styles.row,
                index !== dataRows.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.mutedForeground,
                    fontSize: labelFontSize,
                  },
                ]}
              >
                {row.label}
              </Text>
              <Text
                style={[
                  styles.value,
                  {
                    color: colors.text,
                    fontSize: valueFontSize,
                  },
                ]}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  content: {
    gap: 0,
  },
  row: {
    paddingVertical: 12,
    gap: 4,
  },
  label: {
    fontWeight: '500',
  },
  value: {
    fontWeight: '400',
  },
});
