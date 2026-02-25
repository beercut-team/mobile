import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getPatients,
  STATUS_LABELS,
  STATUS_COLORS,
  OPERATION_LABELS,
  EYE_LABELS,
  type Patient,
  type PatientStatus,
} from '@/lib/patients';

const STATUS_FILTERS: (PatientStatus | 'ALL')[] = [
  'ALL',
  'NEW',
  'PREPARATION',
  'REVIEW_NEEDED',
  'APPROVED',
  'SURGERY_SCHEDULED',
  'COMPLETED',
  'REJECTED',
];

export default function PatientsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['patients', search, statusFilter, page],
    queryFn: () =>
      getPatients({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 20,
      }),
  });

  const patients = data?.data ?? [];
  const meta = data?.meta;

  const onRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const renderPatient = ({ item }: { item: Patient }) => (
    <Card style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <ThemedText style={styles.patientName}>
            {item.last_name} {item.first_name}
            {item.middle_name ? ` ${item.middle_name}` : ''}
          </ThemedText>
          <ThemedText style={[styles.patientMeta, { color: colors.mutedForeground }]}>
            {OPERATION_LABELS[item.operation_type]} · {EYE_LABELS[item.eye]}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] + '18' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          />
          <ThemedText
            style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
          >
            {STATUS_LABELS[item.status]}
          </ThemedText>
        </View>
      </View>

      {item.diagnosis && (
        <ThemedText
          style={[styles.diagnosis, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {item.diagnosis}
        </ThemedText>
      )}

      <View style={[styles.patientFooter, { borderTopColor: colors.border }]}>
        <ThemedText style={[styles.dateText, { color: colors.mutedForeground }]}>
          {new Date(item.created_at).toLocaleDateString('ru-RU')}
        </ThemedText>
        {item.surgery_date && (
          <ThemedText style={[styles.surgeryDate, { color: colors.primary }]}>
            Операция: {new Date(item.surgery_date).toLocaleDateString('ru-RU')}
          </ThemedText>
        )}
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 8 }]}>
        <ThemedText type="title" style={styles.title}>
          Пациенты
        </ThemedText>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <ThemedText style={{ color: colors.mutedForeground, fontSize: 18 }}>
            ?
          </ThemedText>
          <TextInput
            placeholder="Поиск по имени..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Status Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: status }) => {
            const active = statusFilter === status;
            const label = status === 'ALL' ? 'Все' : STATUS_LABELS[status];
            const dotColor = status === 'ALL' ? colors.primary : STATUS_COLORS[status];

            return (
              <Pressable
                onPress={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? dotColor + '18'
                      : colors.muted,
                    borderColor: active ? dotColor + '40' : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: dotColor, opacity: active ? 1 : 0.4 },
                  ]}
                />
                <ThemedText
                  style={[
                    styles.filterLabel,
                    { color: active ? dotColor : colors.mutedForeground },
                  ]}
                >
                  {label}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Patient List */}
      <FlatList
        data={patients}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPatient}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Пациенты не найдены
              </ThemedText>
            </View>
          ) : null
        }
        onEndReached={() => {
          if (meta && page < meta.total_pages) {
            setPage((p) => p + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filterList: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    padding: 20,
    paddingTop: 4,
    gap: 12,
  },
  patientCard: {
    padding: 16,
    gap: 10,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  patientMeta: {
    fontSize: 13,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  diagnosis: {
    fontSize: 13,
  },
  patientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dateText: {
    fontSize: 12,
  },
  surgeryDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
  },
});
