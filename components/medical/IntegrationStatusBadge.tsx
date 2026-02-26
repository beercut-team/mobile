/**
 * Integration Status Badge Component
 *
 * Компонент для отображения статуса синхронизации с внешними системами
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { SyncStatus, IntegrationSystem } from '@/lib/integrations';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface IntegrationStatusBadgeProps {
  system: IntegrationSystem;
  status: SyncStatus;
  lastSyncAt?: string;
  externalId?: string;
  compact?: boolean;
}

const SYSTEM_LABELS: Record<IntegrationSystem, string> = {
  emias: 'ЕМИАС',
  riams: 'РИАМС',
};

const STATUS_CONFIG: Record<
  SyncStatus,
  {
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
  }
> = {
  pending: {
    label: 'Ожидает',
    icon: 'schedule',
    color: '#F59E0B',
  },
  synced: {
    label: 'Синхронизирован',
    icon: 'check-circle',
    color: '#10B981',
  },
  error: {
    label: 'Ошибка',
    icon: 'error',
    color: '#EF4444',
  },
};

export function IntegrationStatusBadge({
  system,
  status,
  lastSyncAt,
  externalId,
  compact = false,
}: IntegrationStatusBadgeProps) {
  const colors = useThemeColors();
  const config = STATUS_CONFIG[status];

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          { backgroundColor: `${config.color}15` },
        ]}
      >
        <MaterialIcons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.compactText, { color: config.color }]}>
          {SYSTEM_LABELS[system]}
        </Text>
      </View>
    );
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
      <View style={styles.header}>
        <Text style={[styles.systemLabel, { color: colors.text }]}>
          {SYSTEM_LABELS[system]}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${config.color}15` },
          ]}
        >
          <MaterialIcons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* Details */}
      {status === 'synced' && (
        <View style={styles.details}>
          {externalId && (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="fingerprint"
                size={16}
                color={colors.mutedForeground}
              />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                ID: {externalId}
              </Text>
            </View>
          )}
          {lastSyncAt && (
            <View style={styles.detailRow}>
              <MaterialIcons
                name="access-time"
                size={16}
                color={colors.mutedForeground}
              />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                {formatDate(lastSyncAt)}
              </Text>
            </View>
          )}
        </View>
      )}

      {status === 'error' && (
        <View style={styles.details}>
          <Text style={[styles.errorText, { color: config.color }]}>
            Не удалось синхронизировать
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginTop: 8,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
