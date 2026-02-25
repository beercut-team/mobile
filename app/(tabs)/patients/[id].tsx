import { useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { usePatientDetail } from '@/hooks/usePatientDetail';
import { useChecklist } from '@/hooks/useChecklist';
import { useComments } from '@/hooks/useComments';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useIOLCalculator } from '@/hooks/useIOLCalculator';
import { usePDFDownload } from '@/hooks/usePDFDownload';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { PassportDataSection } from '@/components/patient/PassportDataSection';
import { ChecklistItem } from '@/components/patient/ChecklistItem';
import { CommentThread } from '@/components/patient/CommentThread';
import { IOLCalculatorForm } from '@/components/patient/IOLCalculatorForm';
import { TabView, type Tab } from '@/components/ui/tab-view';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ActionSheet, type ActionSheetAction } from '@/components/ui/action-sheet';
import { Modal } from '@/components/ui/modal';
import { FileUpload } from '@/components/ui/FileUpload';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const padding = useAccessibilityFontSize(16);

  const patientId = parseInt(id, 10);

  const { patient, isLoading: patientLoading, error: patientError } = usePatientDetail(patientId);
  const { checklist, updateItem, progress, isLoading: checklistLoading } = useChecklist(patientId);
  const { comments, addComment, unreadCount, isLoading: commentsLoading } = useComments(patientId);
  const { media, upload, deleteMedia } = useMediaUpload(patientId);
  const { history: iolHistory, calculate: calculateIOL, isCalculating } = useIOLCalculator(patientId);
  const { downloadRoutingSheet, downloadChecklistReport, isDownloading } = usePDFDownload();

  const [showPDFMenu, setShowPDFMenu] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<number | null>(null);

  if (patientLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Загрузка данных пациента...
        </Text>
      </View>
    );
  }

  if (patientError || !patient) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Ошибка загрузки данных пациента
        </Text>
        <Button onPress={() => router.back()}>Назад</Button>
      </View>
    );
  }

  const handleChecklistToggle = (itemId: number) => {
    const item = checklist?.find((i) => i.id === itemId);
    if (!item) return;

    const newStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    updateItem({ id: itemId, data: { status: newStatus } });
  };

  const handleChecklistUpload = (itemId: number) => {
    setSelectedChecklistItem(itemId);
    setUploadModalVisible(true);
  };

  const handleFileUpload = async (file: { uri: string; name: string; type: string; size: number }) => {
    if (!selectedChecklistItem) return;

    try {
      // Convert file to Blob for upload
      let blob: Blob;
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        blob = await response.blob();
      } else {
        // For native platforms, create a blob-like object
        blob = {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any;
      }

      // Upload file with checklist_item_id in metadata
      await upload({
        file: blob,
        patient_id: patientId,
        category: 'checklist',
        metadata: { checklist_item_id: selectedChecklistItem },
      });

      // Update checklist item status to IN_PROGRESS
      await updateItem({
        id: selectedChecklistItem,
        data: { status: 'IN_PROGRESS' },
      });

      setUploadModalVisible(false);
      setSelectedChecklistItem(null);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const handleAddComment = (body: string, isUrgent: boolean) => {
    addComment({
      patient_id: patientId,
      body,
      is_urgent: isUrgent,
    });
  };

  const patientName = `${patient.last_name}_${patient.first_name}`;

  const pdfActions: ActionSheetAction[] = [
    {
      label: 'Лист маршрутизации',
      icon: 'doc.text.fill',
      onPress: () => downloadRoutingSheet(patientId, patientName),
    },
    {
      label: 'Отчет по чек-листу',
      icon: 'checklist',
      onPress: () => downloadChecklistReport(patientId, patientName),
    },
  ];

  const tabs: Tab[] = [
    {
      key: 'checklist',
      title: 'Чеклист',
      content: (
        <ScrollView
          style={[styles.tabContent, { backgroundColor: colors.background }]}
          contentContainerStyle={{ padding }}
        >
          {checklistLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : checklist && checklist.length > 0 ? (
            checklist.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggle={handleChecklistToggle}
                onUpload={handleChecklistUpload}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Чеклист пуст
            </Text>
          )}
        </ScrollView>
      ),
    },
    {
      key: 'media',
      title: 'Медиа',
      content: (
        <ScrollView
          style={[styles.tabContent, { backgroundColor: colors.background }]}
          contentContainerStyle={{ padding }}
        >
          {media && media.length > 0 ? (
            media.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.mediaItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: colors.text }}>{item.original_name}</Text>
                <Pressable onPress={() => deleteMedia(item.id)}>
                  <IconSymbol name="trash" size={20} color={colors.destructive} />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Нет загруженных файлов
            </Text>
          )}
        </ScrollView>
      ),
    },
    {
      key: 'comments',
      title: `Комментарии${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
      content: (
        <CommentThread
          comments={comments || []}
          onAddComment={handleAddComment}
          isLoading={commentsLoading}
        />
      ),
    },
    {
      key: 'iol',
      title: 'Расчёт ИОЛ',
      content: (
        <View style={styles.tabContent}>
          <IOLCalculatorForm
            patientId={patientId}
            onCalculate={calculateIOL}
            isCalculating={isCalculating}
          />
          {iolHistory && iolHistory.length > 0 && (
            <View style={[styles.historySection, { padding, backgroundColor: colors.muted }]}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>
                История расчётов
              </Text>
              {iolHistory.slice(0, 3).map((calc) => (
                <View
                  key={calc.id}
                  style={[
                    styles.historyItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: colors.text }}>
                    {calc.eye} • {calc.formula} • IOL: {calc.iol_power}D
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {new Date(calc.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ),
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Детали пациента',
          headerBackTitle: 'Назад',
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView>
          <PatientHeader patient={patient} progress={progress} />

          <View style={[styles.section, { padding }]}>
            <PassportDataSection patient={patient} />
          </View>

          <View style={styles.actionsSection}>
            <Button variant="outline" onPress={() => console.log('Edit')}>
              Редактировать
            </Button>
            <Button
              variant="outline"
              onPress={() => setShowPDFMenu(true)}
              loading={isDownloading}
              disabled={isDownloading}
            >
              Скачать PDF
            </Button>
          </View>
        </ScrollView>

        <TabView tabs={tabs} />
      </View>

      <ActionSheet
        visible={showPDFMenu}
        actions={pdfActions}
        onDismiss={() => setShowPDFMenu(false)}
      />

      <Modal
        visible={uploadModalVisible}
        onClose={() => {
          setUploadModalVisible(false);
          setSelectedChecklistItem(null);
        }}
        title="Загрузить файл"
      >
        <FileUpload onUpload={handleFileUpload} accept="all" />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tabContent: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 32,
  },
  mediaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  historySection: {
    marginTop: 16,
    gap: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
});
