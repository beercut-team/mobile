import { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Modal as RNModal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PatientCard } from '@/components/patient/PatientCard';
import { ActionSheet, type ActionSheetAction } from '@/components/ui/action-sheet';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
  const tabBarClearance = Math.max(136, insets.bottom + 108);
  const rejectSheetLift = Math.max(useAccessibilityFontSize(96), insets.bottom + 72);
  const rejectSheetPadding = useAccessibilityFontSize(20);
  const rejectSheetRadius = useAccessibilityFontSize(24);
  const rejectTitleSize = useAccessibilityFontSize(18);
  const rejectInputSize = useAccessibilityFontSize(16);
  const rejectInputMinHeight = useAccessibilityFontSize(132);
  const rejectInputRadius = useAccessibilityFontSize(14);

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

  const closeRejectModal = () => {
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
          { paddingBottom: tabBarClearance },
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

      <RNModal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={closeRejectModal}
        statusBarTranslucent
      >
        <View style={styles.rejectOverlay}>
          <Pressable style={styles.rejectBackdrop} onPress={closeRejectModal} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={24}
            style={styles.rejectKeyboardWrap}
          >
            <View
              style={[
                styles.rejectSheet,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  marginBottom: rejectSheetLift,
                  borderRadius: rejectSheetRadius,
                  padding: rejectSheetPadding,
                },
              ]}
            >
              <View style={styles.rejectHeader}>
                <ThemedText style={[styles.rejectTitle, { fontSize: rejectTitleSize }]}>
                  Причина отклонения
                </ThemedText>
                <Pressable
                  onPress={closeRejectModal}
                  style={styles.rejectCloseButton}
                  accessibilityRole="button"
                  accessibilityLabel="Закрыть"
                >
                  <IconSymbol name="xmark.circle.fill" size={28} color={colors.icon} />
                </Pressable>
              </View>

              <TextInput
                placeholder="Укажите, что нужно исправить..."
                placeholderTextColor={colors.mutedForeground}
                value={rejectComment}
                onChangeText={setRejectComment}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={[
                  styles.rejectInput,
                  {
                    minHeight: rejectInputMinHeight,
                    borderRadius: rejectInputRadius,
                    fontSize: rejectInputSize,
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              />

              <View style={styles.rejectButtons}>
                <Button
                  variant="outline"
                  onPress={closeRejectModal}
                  style={styles.rejectActionButton}
                >
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  onPress={handleRejectSubmit}
                  style={styles.rejectActionButton}
                >
                  Отклонить
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </RNModal>
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
  rejectOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  rejectBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  rejectKeyboardWrap: {
    justifyContent: 'flex-end',
  },
  rejectSheet: {
    borderWidth: 1,
    maxHeight: '78%',
    marginHorizontal: 12,
  },
  rejectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rejectTitle: {
    fontWeight: '700',
    flex: 1,
  },
  rejectCloseButton: {
    marginLeft: 8,
    flexShrink: 0,
  },
  rejectInput: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rejectButtons: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  rejectActionButton: {
    flex: 1,
  },
});
