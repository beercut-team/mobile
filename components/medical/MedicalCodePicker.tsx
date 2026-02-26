/**
 * Medical Code Picker Component
 *
 * Компонент для выбора медицинских кодов (ICD-10, SNOMED CT, LOINC)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  type ICD10Code,
  type SNOMEDCode,
  type LOINCCode,
  searchICD10Codes,
  searchSNOMEDCodes,
  searchLOINCCodes,
  formatICD10Code,
  formatSNOMEDCode,
  formatLOINCCode,
} from '@/lib/medical-standards';
import { useThemeColors } from '@/hooks/use-theme-colors';

type MedicalCodeType = 'icd10' | 'snomed' | 'loinc';
type MedicalCode = ICD10Code | SNOMEDCode | LOINCCode;

interface MedicalCodePickerProps {
  type: MedicalCodeType;
  value?: MedicalCode;
  onSelect: (code: MedicalCode) => void;
  placeholder?: string;
  label?: string;
}

const TYPE_LABELS: Record<MedicalCodeType, string> = {
  icd10: 'Диагноз (МКБ-10)',
  snomed: 'Процедура (SNOMED CT)',
  loinc: 'Наблюдение (LOINC)',
};

export function MedicalCodePicker({
  type,
  value,
  onSelect,
  placeholder,
  label,
}: MedicalCodePickerProps) {
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Поиск кодов
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    switch (type) {
      case 'icd10':
        return searchICD10Codes(searchQuery);
      case 'snomed':
        return searchSNOMEDCodes(searchQuery);
      case 'loinc':
        return searchLOINCCodes(searchQuery);
      default:
        return [];
    }
  }, [type, searchQuery]);

  // Форматирование выбранного значения
  const formattedValue = useMemo(() => {
    if (!value) return null;

    switch (type) {
      case 'icd10':
        return formatICD10Code(value as ICD10Code);
      case 'snomed':
        return formatSNOMEDCode(value as SNOMEDCode);
      case 'loinc':
        return formatLOINCCode(value as LOINCCode);
      default:
        return null;
    }
  }, [type, value]);

  const handleSelect = (code: MedicalCode) => {
    onSelect(code);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect(null as any);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.inputContent}>
          <Text
            style={[
              styles.inputText,
              { color: value ? colors.text : colors.mutedForeground },
            ]}
            numberOfLines={1}
          >
            {formattedValue || placeholder || `Выберите ${TYPE_LABELS[type]}`}
          </Text>
          <MaterialIcons
            name="arrow-drop-down"
            size={24}
            color={colors.mutedForeground}
          />
        </View>
      </TouchableOpacity>

      {value && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <MaterialIcons name="close" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {TYPE_LABELS[type]}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialIcons
                name="search"
                size={20}
                color={colors.mutedForeground}
              />
              <TextInput
                style={[styles.searchTextInput, { color: colors.text }]}
                placeholder="Поиск..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          </View>

          {/* Results */}
          {searchQuery.trim() ? (
            <FlatList<MedicalCode>
              data={searchResults}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.resultItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.resultCode, { color: colors.primary }]}>
                    {item.code}
                  </Text>
                  <Text style={[styles.resultDisplay, { color: colors.text }]}>
                    {item.display}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="search-off"
                    size={48}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.mutedForeground }]}
                  >
                    Ничего не найдено
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="search"
                size={48}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Начните вводить для поиска
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 40,
    top: 38,
    padding: 4,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultCode: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultDisplay: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
