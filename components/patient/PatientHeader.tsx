import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Patient } from '@/lib/patients';
import { EYE_LABELS, OPERATION_LABELS, STATUS_LABELS } from '@/lib/patients';

interface PatientHeaderProps {
  patient: Patient;
  progress: number;
  topInset?: number;
  onBack?: () => void;
}

export function PatientHeader({ patient, progress, topInset = 0, onBack }: PatientHeaderProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const nameFontSize = useAccessibilityFontSize(30);
  const codeFontSize = useAccessibilityFontSize(14);
  const metaFontSize = useAccessibilityFontSize(13);
  const progressLabelSize = useAccessibilityFontSize(13);
  const progressValueSize = useAccessibilityFontSize(14);
  const shellPadding = useAccessibilityFontSize(16);
  const cardPadding = useAccessibilityFontSize(16);
  const cardRadius = useAccessibilityFontSize(18);
  const progressCardRadius = useAccessibilityFontSize(12);
  const backButtonSize = useAccessibilityFontSize(36);
  const iconSize = useAccessibilityFontSize(19);

  const fullName = [patient.last_name, patient.first_name, patient.middle_name]
    .filter(Boolean)
    .join(' ');
  const operationMeta = `${OPERATION_LABELS[patient.operation_type]} • ${EYE_LABELS[patient.eye]}`;

  return (
    <View
      style={[
        styles.shell,
        {
          paddingTop: topInset,
          paddingHorizontal: shellPadding,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: cardRadius,
            padding: cardPadding,
          },
        ]}
      >
        <View style={styles.toolbar}>
          <Pressable
            onPress={onBack}
            disabled={!onBack}
            style={[
              styles.backButton,
              {
                width: backButtonSize,
                height: backButtonSize,
                borderRadius: backButtonSize / 2,
                backgroundColor: colors.muted,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Назад"
          >
            <IconSymbol name="chevron.left" size={iconSize} color={colors.icon} />
          </Pressable>
          <StatusBadge status={STATUS_LABELS[patient.status]} percentage={progress} size="sm" multiline />
        </View>

        <View style={styles.identity}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text,
                fontSize: nameFontSize,
              },
            ]}
            numberOfLines={2}
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
          <Text
            style={[
              styles.operationMeta,
              {
                color: colors.mutedForeground,
                fontSize: metaFontSize,
              },
            ]}
            numberOfLines={1}
          >
            {operationMeta}
          </Text>
        </View>

        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: colors.muted,
              borderRadius: progressCardRadius,
            },
          ]}
        >
          <View style={styles.progressHead}>
            <Text
              style={[
                styles.progressLabel,
                {
                  color: colors.mutedForeground,
                  fontSize: progressLabelSize,
                },
              ]}
            >
              Готовность к операции
            </Text>
            <Text
              style={[
                styles.progressValue,
                {
                  color: colors.text,
                  fontSize: progressValueSize,
                },
              ]}
            >
              {Math.round(progress)}%
            </Text>
          </View>
          <ProgressBar current={progress} total={100} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {},
  card: {
    borderWidth: 0,
    gap: 14,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  identity: {
    gap: 2,
  },
  name: {
    fontWeight: '700',
  },
  code: {
    fontWeight: '500',
  },
  operationMeta: {
    fontWeight: '500',
  },
  progressCard: {
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  progressLabel: {
    fontWeight: '600',
  },
  progressValue: {
    fontWeight: '700',
  },
});
