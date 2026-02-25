import { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PatientCard } from '@/components/patient/PatientCard';
import { ActionSheet, type ActionSheetAction } from '@/components/ui/action-sheet';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { useModeration } from '@/hooks/useModeration';
import type { Patient } from '@/lib/patients';

export default function ModerationScreen() {
  const { patients, approve, reject, isLoading } = useModeration();
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();
  const fontSize = useAccessibilityFontSize(14);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const handleApprove = () => {
    if (!selectedPatient) return;

    Alert.alert(
      'Одобрить пациента?',
      `Пациент ${selectedPatient.last_name} ${selectedPatient.first_name} будет одобрен для операции.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Одобрить',
          onPress: () => {
            approve(selectedPatient.id);
            setSelectedPatient(null);
          },
        },
      ]
    );
  };

  const handleRejectStart = () => {
    setShowActionSheet(false);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedPatient) return;

    reject({
      patientId: selectedPatient.id,
      comment: rejectComment.trim() || undefined,
    });

    setShowRejectModal(false);
    setRejectComment('');
    setSelectedPatient(null);
  };

  const actions: ActionSheetAction[] = [
    {
      label: 'Одобрить',
      icon: 'checkmark.circle.fill',
      onPress: handleApprove,
    },
    {
      label: 'Вернуть на доработку',
      icon: 'arrow.uturn.backward.circle.fill',
      onPress: handleRejectStart,
      destructive: true,
    },
  ];

  const renderPatient = ({ item }: { item: Patient }) => (
    <View>
      <PatientCard patient={item} progress={75} />
      <View style={styles.actionButtons}>
        <Button
          variant="default"
          onPress={() => {
            setSelectedPatient(item);
            handleApprove();
          }}
          style={styles.approveButton}
        >
          Одобрить
        </Button>
        <Button
          variant="destructive"
          onPress={() => {
            setSelectedPatient(item);
            handleRejectStart();
          }}
          style={styles.rejectButton}
        >
          Отклонить
        </Button>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={[styles.emptyText, { color: colors.mutedForeground, fontSize }]}>
        Нет пациентов на модерации
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ThemedText type="title">Модерация</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.mutedForeground, fontSize }]}>
          Пациенты, готовые к проверке
        </ThemedText>
      </View>

      <FlatList
        data={patients}
        renderItem={renderPatient}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 120 },
          !patients?.length && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <ActionSheet
        visible={showActionSheet}
        actions={actions}
        onDismiss={() => {
          setShowActionSheet(false);
          setSelectedPatient(null);
        }}
      />

      <Modal
        visible={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectComment('');
          setSelectedPatient(null);
        }}
        title="Причина отклонения"
      >
        <View style={styles.modalContent}>
          <Input
            placeholder="Укажите, что нужно исправить..."
            value={rejectComment}
            onChangeText={setRejectComment}
            multiline
            numberOfLines={4}
            style={styles.commentInput}
          />
          <View style={styles.modalButtons}>
            <Button
              variant="outline"
              onPress={() => {
                setShowRejectModal(false);
                setRejectComment('');
              }}
              style={styles.modalButton}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onPress={handleRejectSubmit}
              style={styles.modalButton}
            >
              Отклонить
            </Button>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  subtitle: {
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -8,
    marginBottom: 12,
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  modalContent: {
    gap: 16,
  },
  commentInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
