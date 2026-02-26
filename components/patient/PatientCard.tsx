import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { Patient } from '@/lib/patients';
import { STATUS_LABELS } from '@/lib/patients';

interface PatientCardProps {
  patient: Patient;
  progress?: number;
}

export function PatientCard({ patient, progress = 0 }: PatientCardProps) {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const nameFontSize = useAccessibilityFontSize(16);
  const codeFontSize = useAccessibilityFontSize(14);
  const padding = useAccessibilityFontSize(16);
  const borderRadius = useAccessibilityFontSize(12);

  const fullName = [patient.last_name, patient.first_name, patient.middle_name]
    .filter(Boolean)
    .join(' ');

  const handlePress = () => {
    router.push(`/(tabs)/patients/${patient.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding,
          borderRadius,
        },
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Пациент ${fullName}, статус ${STATUS_LABELS[patient.status]}`}
    >
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text,
                fontSize: nameFontSize,
              },
            ]}
            numberOfLines={1}
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
            {patient.access_code}
          </Text>
        </View>
        <StatusBadge status={STATUS_LABELS[patient.status]} percentage={progress} size="sm" />
      </View>

      {progress > 0 && (
        <View style={styles.progressContainer}>
          <ProgressBar current={progress} total={100} showLabel />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  code: {
    fontWeight: '400',
  },
  progressContainer: {
    marginTop: 12,
  },
});
