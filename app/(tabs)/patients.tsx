import { useState, useCallback, useEffect } from 'react';
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
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
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
  const router = useRouter();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();
  const tabBarClearance = Math.max(156, insets.bottom + 126);

  const titleSize = useAccessibilityFontSize(28);
  const searchIconSize = useAccessibilityFontSize(18);
  const searchInputSize = useAccessibilityFontSize(15);
  const searchBarHeight = useAccessibilityFontSize(44);
  const searchBarRadius = useAccessibilityFontSize(14);
  const filterLabelSize = useAccessibilityFontSize(12);
  const filterDotSize = useAccessibilityFontSize(7);
  const filterChipRadius = useAccessibilityFontSize(20);
  const filterChipPaddingH = useAccessibilityFontSize(12);
  const filterChipPaddingV = useAccessibilityFontSize(6);
  const patientNameSize = useAccessibilityFontSize(16);
  const patientMetaSize = useAccessibilityFontSize(13);
  const statusTextSize = useAccessibilityFontSize(11);
  const statusDotSize = useAccessibilityFontSize(6);
  const statusBadgeRadius = useAccessibilityFontSize(12);
  const statusBadgePaddingH = useAccessibilityFontSize(10);
  const statusBadgePaddingV = useAccessibilityFontSize(4);
  const diagnosisSize = useAccessibilityFontSize(13);
  const dateTextSize = useAccessibilityFontSize(12);
  const surgeryDateSize = useAccessibilityFontSize(12);
  const emptyTextSize = useAccessibilityFontSize(15);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', debouncedSearch, statusFilter, page],
    queryFn: () =>
      getPatients({
        search: debouncedSearch || undefined,
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

  // Error state component
  if (error && !isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.headerArea, { paddingTop: insets.top + 8 }]}>
          <ThemedText type="title" style={[styles.title, { fontSize: titleSize }]}>
            Пациенты
          </ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: colors.destructive, fontSize: emptyTextSize }]}>
            Ошибка загрузки пациентов
          </ThemedText>
          <Button onPress={() => refetch()} style={styles.retryButton}>
            Повторить
          </Button>
        </View>
      </ThemedView>
    );
  }

  const renderPatient = ({ item }: { item: Patient }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/patients/${item.id}`)}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`Пациент ${item.last_name} ${item.first_name}, статус ${STATUS_LABELS[item.status]}`}
    >
      <Card style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.patientInfo}>
            <ThemedText style={[styles.patientName, { fontSize: patientNameSize }]}>
              {item.last_name} {item.first_name}
              {item.middle_name ? ` ${item.middle_name}` : ''}
            </ThemedText>
            <ThemedText style={[styles.patientMeta, { color: colors.mutedForeground, fontSize: patientMetaSize }]}>
              {OPERATION_LABELS[item.operation_type]} · {EYE_LABELS[item.eye]}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_COLORS[item.status] + '18', borderRadius: statusBadgeRadius, paddingHorizontal: statusBadgePaddingH, paddingVertical: statusBadgePaddingV },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_COLORS[item.status], width: statusDotSize, height: statusDotSize, borderRadius: statusDotSize / 2 },
              ]}
            />
            <ThemedText
              style={[styles.statusText, { color: STATUS_COLORS[item.status], fontSize: statusTextSize }]}
            >
              {STATUS_LABELS[item.status]}
            </ThemedText>
          </View>
        </View>

        {item.diagnosis && (
          <ThemedText
            style={[styles.diagnosis, { color: colors.mutedForeground, fontSize: diagnosisSize }]}
            numberOfLines={1}
          >
            {item.diagnosis}
          </ThemedText>
        )}

        <View style={[styles.patientFooter, { borderTopColor: colors.border }]}>
          <ThemedText style={[styles.dateText, { color: colors.mutedForeground, fontSize: dateTextSize }]}>
            {new Date(item.created_at).toLocaleDateString('ru-RU')}
          </ThemedText>
          {item.surgery_date && (
            <ThemedText style={[styles.surgeryDate, { color: colors.primary, fontSize: surgeryDateSize }]}>
              Операция: {new Date(item.surgery_date).toLocaleDateString('ru-RU')}
            </ThemedText>
          )}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 8 }]}>
        <ThemedText type="title" style={[styles.title, { fontSize: titleSize }]}>
          Пациенты
        </ThemedText>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              borderRadius: searchBarRadius,
              height: searchBarHeight,
            },
          ]}
        >
          <ThemedText style={{ color: colors.mutedForeground, fontSize: searchIconSize }}>
            🔍
          </ThemedText>
          <TextInput
            placeholder="Поиск по имени..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            style={[styles.searchInput, { color: colors.text, fontSize: searchInputSize }]}
            accessibilityLabel="Поиск пациентов по имени"
            accessibilityHint="Введите имя пациента для поиска"
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
                    borderRadius: filterChipRadius,
                    paddingHorizontal: filterChipPaddingH,
                    paddingVertical: filterChipPaddingV,
                  },
                ]}
              >
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: dotColor, opacity: active ? 1 : 0.4, width: filterDotSize, height: filterDotSize, borderRadius: filterDotSize / 2 },
                  ]}
                />
                <ThemedText
                  style={[
                    styles.filterLabel,
                    { color: active ? dotColor : colors.mutedForeground, fontSize: filterLabelSize },
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
        contentContainerStyle={[styles.list, { paddingBottom: tabBarClearance }]}
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
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground, fontSize: emptyTextSize }]}>
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
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
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
    borderWidth: 1,
  },
  filterDot: {},
  filterLabel: {
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
    fontWeight: '600',
  },
  patientMeta: {
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {},
  statusText: {
    fontWeight: '600',
  },
  diagnosis: {},
  patientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dateText: {},
  surgeryDate: {
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {},
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
});
