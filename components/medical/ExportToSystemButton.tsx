/**
 * Export To System Button Component
 *
 * Компонент для экспорта пациента в ЕМИАС/РИАМС
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  type IntegrationSystem,
  exportPatientToEMIAS,
  exportPatientToRIAMS,
  validateForEMIAS,
  validateForRIAMS,
  RIAMS_REGIONS,
} from '@/lib/integrations';
import type { Patient } from '@/lib/patients';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useToast } from '@/contexts/toast-context';

interface ExportToSystemButtonProps {
  patient: Patient;
  system: IntegrationSystem;
  onSuccess?: () => void;
  compact?: boolean;
}

const SYSTEM_LABELS: Record<IntegrationSystem, string> = {
  emias: 'ЕМИАС',
  riams: 'РИАМС',
};

export function ExportToSystemButton({
  patient,
  system,
  onSuccess,
  compact = false,
}: ExportToSystemButtonProps) {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Проверяем, синхронизирован ли уже
  const isSynced =
    system === 'emias'
      ? patient.medical_metadata?.integrations?.emias?.syncStatus === 'synced'
      : patient.medical_metadata?.integrations?.riams?.syncStatus === 'synced';

  const handleExport = async () => {
    // Валидация перед экспортом
    const validation =
      system === 'emias'
        ? validateForEMIAS(patient)
        : validateForRIAMS(patient);

    if (!validation.valid) {
      Alert.alert(
        'Ошибка валидации',
        `Невозможно экспортировать в ${SYSTEM_LABELS[system]}:\n\n${validation.errors.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Для РИАМС нужно выбрать регион
    if (system === 'riams') {
      // Показываем выбор региона
      Alert.alert(
        'Выберите регион',
        'Для экспорта в РИАМС необходимо указать регион',
        [
          ...RIAMS_REGIONS.filter((r) => r.active)
            .slice(0, 5)
            .map((region) => ({
              text: region.name,
              onPress: () => performExport(region.code),
            })),
          { text: 'Отмена', style: 'cancel' },
        ]
      );
      return;
    }

    // Для ЕМИАС экспортируем сразу
    await performExport();
  };

  const performExport = async (regionCode?: string) => {
    setIsExporting(true);

    try {
      const result =
        system === 'emias'
          ? await exportPatientToEMIAS(patient.id)
          : await exportPatientToRIAMS(patient.id, regionCode!);

      if (result.success) {
        showToast(`Успешно экспортировано в ${SYSTEM_LABELS[system]}`, 'success');
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      Alert.alert(
        'Ошибка экспорта',
        `Не удалось экспортировать в ${SYSTEM_LABELS[system]}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactButton,
          {
            backgroundColor: isSynced ? colors.success + '15' : colors.primary,
            opacity: isExporting ? 0.6 : 1,
          },
        ]}
        onPress={handleExport}
        disabled={isExporting || isSynced}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialIcons
              name={isSynced ? 'check-circle' : 'cloud-upload'}
              size={16}
              color={isSynced ? colors.success : '#fff'}
            />
            <Text
              style={[
                styles.compactButtonText,
                { color: isSynced ? colors.success : '#fff' },
              ]}
            >
              {SYSTEM_LABELS[system]}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isSynced ? colors.success + '15' : colors.primary,
          borderColor: isSynced ? colors.success : colors.primary,
          opacity: isExporting ? 0.6 : 1,
        },
      ]}
      onPress={handleExport}
      disabled={isExporting || isSynced}
    >
      <View style={styles.buttonContent}>
        {isExporting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <MaterialIcons
              name={isSynced ? 'check-circle' : 'cloud-upload'}
              size={20}
              color={isSynced ? colors.success : '#fff'}
            />
            <Text
              style={[
                styles.buttonText,
                { color: isSynced ? colors.success : '#fff' },
              ]}
            >
              {isSynced
                ? `Синхронизировано с ${SYSTEM_LABELS[system]}`
                : `Экспортировать в ${SYSTEM_LABELS[system]}`}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
