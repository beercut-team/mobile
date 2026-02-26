/**
 * Medical Metadata Form Component
 *
 * Форма для редактирования медицинских метаданных пациента
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Patient } from '@/lib/patients';
import type {
  ICD10Code,
  SNOMEDCode,
  LOINCCode,
  MedicalStandardsMetadata,
} from '@/lib/medical-standards';
import { MedicalCodePicker } from './MedicalCodePicker';
import { Button } from '@/components/ui/button';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface MedicalMetadataFormProps {
  patient?: Patient;
  onSave: (metadata: MedicalStandardsMetadata) => void;
  onCancel: () => void;
}

export function MedicalMetadataForm({
  patient,
  onSave,
  onCancel,
}: MedicalMetadataFormProps) {
  const colors = useThemeColors();

  // Инициализация состояния из существующих данных
  const [diagnosisCodes, setDiagnosisCodes] = useState<ICD10Code[]>(
    patient?.medical_metadata?.diagnosisCodes || []
  );
  const [procedureCodes, setProcedureCodes] = useState<SNOMEDCode[]>(
    patient?.medical_metadata?.procedureCodes || []
  );
  const [observations, setObservations] = useState<LOINCCode[]>(
    patient?.medical_metadata?.observations || []
  );

  const handleAddDiagnosisCode = (code: ICD10Code) => {
    // Проверяем, не добавлен ли уже этот код
    if (diagnosisCodes.some((c) => c.code === code.code)) {
      Alert.alert('Внимание', 'Этот код уже добавлен');
      return;
    }
    setDiagnosisCodes([...diagnosisCodes, code]);
  };

  const handleRemoveDiagnosisCode = (code: string) => {
    setDiagnosisCodes(diagnosisCodes.filter((c) => c.code !== code));
  };

  const handleAddProcedureCode = (code: SNOMEDCode) => {
    if (procedureCodes.some((c) => c.code === code.code)) {
      Alert.alert('Внимание', 'Этот код уже добавлен');
      return;
    }
    setProcedureCodes([...procedureCodes, code]);
  };

  const handleRemoveProcedureCode = (code: string) => {
    setProcedureCodes(procedureCodes.filter((c) => c.code !== code));
  };

  const handleAddObservation = (obs: LOINCCode) => {
    if (observations.some((o) => o.code === obs.code)) {
      Alert.alert('Внимание', 'Это наблюдение уже добавлено');
      return;
    }
    setObservations([...observations, obs]);
  };

  const handleRemoveObservation = (code: string) => {
    setObservations(observations.filter((o) => o.code !== code));
  };

  const handleSave = () => {
    const metadata: MedicalStandardsMetadata = {
      diagnosisCodes: diagnosisCodes.length > 0 ? diagnosisCodes : undefined,
      procedureCodes: procedureCodes.length > 0 ? procedureCodes : undefined,
      observations: observations.length > 0 ? observations : undefined,
      // Сохраняем существующие метаданные
      fhirResourceId: patient?.medical_metadata?.fhirResourceId,
      extensions: patient?.medical_metadata?.extensions,
      integrations: patient?.medical_metadata?.integrations,
    };

    onSave(metadata);
  };

  const hasChanges =
    diagnosisCodes.length > 0 ||
    procedureCodes.length > 0 ||
    observations.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Diagnosis Codes Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Диагнозы (МКБ-10)
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Добавьте коды диагнозов по Международной классификации болезней
          </Text>

          <MedicalCodePicker
            type="icd10"
            onSelect={(code) => handleAddDiagnosisCode(code as ICD10Code)}
            placeholder="Добавить код МКБ-10"
          />

          {diagnosisCodes.map((code) => (
            <View
              key={code.code}
              style={[
                styles.codeItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.codeContent}>
                <Text style={[styles.codeText, { color: colors.primary }]}>
                  {code.code}
                </Text>
                <Text style={[styles.codeDisplay, { color: colors.text }]}>
                  {code.display}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveDiagnosisCode(code.code)}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={colors.destructive}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Procedure Codes Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Процедуры (SNOMED CT)
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Добавьте коды процедур и операций
          </Text>

          <MedicalCodePicker
            type="snomed"
            onSelect={(code) => handleAddProcedureCode(code as SNOMEDCode)}
            placeholder="Добавить код SNOMED CT"
          />

          {procedureCodes.map((code) => (
            <View
              key={code.code}
              style={[
                styles.codeItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.codeContent}>
                <Text style={[styles.codeText, { color: colors.primary }]}>
                  {code.code}
                </Text>
                <Text style={[styles.codeDisplay, { color: colors.text }]}>
                  {code.display}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveProcedureCode(code.code)}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={colors.destructive}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Observations Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Наблюдения (LOINC)
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            Добавьте коды наблюдений и измерений
          </Text>

          <MedicalCodePicker
            type="loinc"
            onSelect={(code) => handleAddObservation(code as LOINCCode)}
            placeholder="Добавить код LOINC"
          />

          {observations.map((obs) => (
            <View
              key={obs.code}
              style={[
                styles.codeItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.codeContent}>
                <Text style={[styles.codeText, { color: colors.primary }]}>
                  {obs.code}
                </Text>
                <Text style={[styles.codeDisplay, { color: colors.text }]}>
                  {obs.display}
                </Text>
                {obs.value && (
                  <Text
                    style={[styles.observationValue, { color: colors.mutedForeground }]}
                  >
                    Значение: {obs.value} {obs.unit}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveObservation(obs.code)}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={colors.destructive}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {!hasChanges && (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="medical-services"
              size={48}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Добавьте медицинские коды для пациента
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View
        style={[
          styles.actions,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Button variant="outline" onPress={onCancel} style={styles.actionButton}>
          Отмена
        </Button>
        <Button
          onPress={handleSave}
          disabled={!hasChanges}
          style={styles.actionButton}
        >
          Сохранить
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  codeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  codeContent: {
    flex: 1,
    marginRight: 12,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  codeDisplay: {
    fontSize: 16,
  },
  observationValue: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
  },
});
