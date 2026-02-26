import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { Patient } from '@/lib/patients';
import { STATUS_LABELS } from '@/lib/patients';

interface PatientHeaderProps {
  patient: Patient;
  progress: number;
}

export function PatientHeader({ patient, progress }: PatientHeaderProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const nameFontSize = useAccessibilityFontSize(24);
  const codeFontSize = useAccessibilityFontSize(14);
  const padding = useAccessibilityFontSize(16);

  const fullName = [patient.last_name, patient.first_name, patient.middle_name]
    .filter(Boolean)
    .join(' ');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          padding,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text,
                fontSize: nameFontSize,
              },
            ]}
          >
            {fullName}
          </Text>
          <Text
            style={[
              styles.code,
              {
                color: colors.mutedForeground,
                fontSize: codeFontSize,
              },
            ]}
          >
            Код доступа: {patient.access_code}
          </Text>
        </View>
        <StatusBadge status={STATUS_LABELS[patient.status]} percentage={progress} />
      </View>

      <View style={styles.progressContainer}>
        <Text
          style={[
            styles.progressLabel,
            {
              color: colors.mutedForeground,
              fontSize: useAccessibilityFontSize(12),
            },
          ]}
        >
          Готовность к операции
        </Text>
        <ProgressBar current={progress} total={100} showLabel />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '700',
    marginBottom: 4,
  },
  code: {
    fontWeight: '400',
  },
  progressContainer: {
    gap: 8,
  },
  progressLabel: {
    fontWeight: '600',
  },
});
