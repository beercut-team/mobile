/**
 * Medical Metadata Section Component
 *
 * Секция для отображения медицинских кодов и статусов интеграций
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Patient } from '@/lib/patients';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import { ExportToSystemButton } from './ExportToSystemButton';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface MedicalMetadataSectionProps {
  patient: Patient;
  onRefresh?: () => void;
}

export function MedicalMetadataSection({
  patient,
  onRefresh,
}: MedicalMetadataSectionProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(true);

  const metadata = patient.medical_metadata;
  const hasMetadata =
    metadata &&
    (metadata.diagnosisCodes?.length ||
      metadata.procedureCodes?.length ||
      metadata.observations?.length);

  const hasIntegrations =
    metadata?.integrations?.emias || metadata?.integrations?.riams;

  if (!hasMetadata && !hasIntegrations) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <MaterialIcons
            name="medical-services"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Медицинские стандарты
          </Text>
        </View>
        <MaterialIcons
          name={expanded ? 'expand-less' : 'expand-more'}
          size={24}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Diagnosis Codes (ICD-10) */}
          {metadata?.diagnosisCodes && metadata.diagnosisCodes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Диагноз (МКБ-10)
              </Text>
              {metadata.diagnosisCodes.map((code, index) => (
                <View
                  key={index}
                  style={[
                    styles.codeItem,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.codeText, { color: colors.primary }]}>
                    {code.code}
                  </Text>
                  <Text style={[styles.codeDisplay, { color: colors.text }]}>
                    {code.display}
                  </Text>
                  {code.notes && (
                    <Text
                      style={[
                        styles.codeNotes,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {code.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Procedure Codes (SNOMED CT) */}
          {metadata?.procedureCodes && metadata.procedureCodes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Процедуры (SNOMED CT)
              </Text>
              {metadata.procedureCodes.map((code, index) => (
                <View
                  key={index}
                  style={[
                    styles.codeItem,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.codeText, { color: colors.primary }]}>
                    {code.code}
                  </Text>
                  <Text style={[styles.codeDisplay, { color: colors.text }]}>
                    {code.display}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Observations (LOINC) */}
          {metadata?.observations && metadata.observations.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Наблюдения (LOINC)
              </Text>
              {metadata.observations.map((obs, index) => (
                <View
                  key={index}
                  style={[
                    styles.codeItem,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.observationHeader}>
                    <Text style={[styles.codeText, { color: colors.primary }]}>
                      {obs.code}
                    </Text>
                    {obs.value && (
                      <Text
                        style={[styles.observationValue, { color: colors.text }]}
                      >
                        {obs.value} {obs.unit}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.codeDisplay, { color: colors.text }]}>
                    {obs.display}
                  </Text>
                  {obs.observedAt && (
                    <Text
                      style={[
                        styles.codeNotes,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {new Date(obs.observedAt).toLocaleString('ru-RU')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* FHIR Resource ID */}
          {metadata?.fhirResourceId && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                FHIR Resource ID
              </Text>
              <View
                style={[
                  styles.codeItem,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.codeDisplay, { color: colors.mutedForeground }]}
                >
                  {metadata.fhirResourceId}
                </Text>
              </View>
            </View>
          )}

          {/* Integrations */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Интеграции
            </Text>

            {/* EMIAS Status */}
            {metadata?.integrations?.emias && (
              <IntegrationStatusBadge
                system="emias"
                status={metadata.integrations.emias.syncStatus || 'pending'}
                lastSyncAt={metadata.integrations.emias.lastSyncAt}
                externalId={metadata.integrations.emias.patientId}
              />
            )}

            {/* RIAMS Status */}
            {metadata?.integrations?.riams && (
              <IntegrationStatusBadge
                system="riams"
                status={metadata.integrations.riams.syncStatus || 'pending'}
                lastSyncAt={metadata.integrations.riams.lastSyncAt}
                externalId={metadata.integrations.riams.patientId}
              />
            )}

            {/* Export Buttons */}
            <View style={styles.exportButtons}>
              <ExportToSystemButton
                patient={patient}
                system="emias"
                onSuccess={onRefresh}
              />
              <ExportToSystemButton
                patient={patient}
                system="riams"
                onSuccess={onRefresh}
              />
            </View>
          </View>

          {/* Fallback Diagnosis */}
          {patient.diagnosis && !metadata?.diagnosisCodes?.length && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Диагноз (текст)
              </Text>
              <View
                style={[
                  styles.codeItem,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.codeDisplay, { color: colors.text }]}>
                  {patient.diagnosis}
                </Text>
                <Text
                  style={[styles.codeNotes, { color: colors.mutedForeground }]}
                >
                  Рекомендуется добавить код МКБ-10
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  codeDisplay: {
    fontSize: 16,
  },
  codeNotes: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  observationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  observationValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  exportButtons: {
    marginTop: 8,
  },
});
