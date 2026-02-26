import { View, StyleSheet, FlatList, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { useAuth } from '@/contexts/auth-context';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { getMediaDownloadUrl } from '@/lib/media';
import type { Media } from '@/lib/media';
import { useToast } from '@/contexts/toast-context';

export default function DocumentsScreen() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const titleSize = useAccessibilityFontSize(28);
  const itemTitleSize = useAccessibilityFontSize(16);
  const itemSubtitleSize = useAccessibilityFontSize(13);
  const itemIconSize = useAccessibilityFontSize(24);
  const padding = useAccessibilityFontSize(16);
  const borderRadius = useAccessibilityFontSize(12);
  const emptyIconSize = useAccessibilityFontSize(64);
  const emptyTextSize = useAccessibilityFontSize(16);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Назад"
      >
        <IconSymbol name="chevron.left" size={24} color={colors.primary} />
      </Pressable>
      <ThemedText
        type="title"
        numberOfLines={2}
        style={[styles.headerTitle, { fontSize: titleSize }]}
      >
        Прикрепленные документы
      </ThemedText>
    </View>
  );

  // Only patients can view their own documents
  const isPatient = hasRole('PATIENT');
  const patientId = isPatient ? user?.id : null;

  const { media, isLoading, error } = useMediaUpload(patientId || 0);

  const handleDownload = async (item: Media) => {
    try {
      const url = await getMediaDownloadUrl(item.id);

      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch {
      showToast('Ошибка загрузки файла', 'error');
    }
  };

  const getFileIcon = (contentType: string): React.ComponentProps<typeof IconSymbol>['name'] => {
    if (contentType.startsWith('image/')) {
      return 'photo.fill';
    }
    if (contentType === 'application/pdf') {
      return 'doc.fill';
    }
    return 'doc.text.fill';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!isPatient) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { fontSize: emptyTextSize, color: colors.mutedForeground }]}>
            Доступно только для пациентов
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { fontSize: emptyTextSize, color: colors.destructive }]}>
            Ошибка загрузки документов
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}

      {!media || media.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="doc.fill" size={emptyIconSize} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyText, { fontSize: emptyTextSize, color: colors.mutedForeground }]}>
            Нет прикрепленных документов
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={media}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleDownload(item)}
              style={({ pressed }) => [
                styles.documentItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  padding,
                  borderRadius,
                },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Открыть ${item.original_name}`}
            >
              <View style={styles.documentLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: colors.primary + '15',
                      width: itemIconSize * 2,
                      height: itemIconSize * 2,
                      borderRadius: itemIconSize,
                    },
                  ]}
                >
                  <IconSymbol
                    name={getFileIcon(item.content_type)}
                    size={itemIconSize}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.documentInfo}>
                  <ThemedText
                    style={[styles.documentTitle, { fontSize: itemTitleSize }]}
                    numberOfLines={2}
                  >
                    {item.original_name}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.documentSubtitle,
                      { fontSize: itemSubtitleSize, color: colors.mutedForeground },
                    ]}
                  >
                    {formatFileSize(item.size)} • {formatDate(item.created_at)}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol name="arrow.down.circle.fill" size={24} color={colors.primary} />
            </Pressable>
          )}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  documentInfo: {
    flex: 1,
    gap: 4,
  },
  documentTitle: {
    fontWeight: '600',
  },
  documentSubtitle: {},
});
