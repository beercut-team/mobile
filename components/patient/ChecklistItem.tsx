import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { ChecklistItem as ChecklistItemType } from '@/lib/checklists';
import { CHECKLIST_STATUS_LABELS, CHECKLIST_STATUS_COLORS } from '@/lib/checklists';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle?: (id: number) => void;
  onUpload?: (id: number) => void;
  disabled?: boolean;
}

export function ChecklistItem({ item, onToggle, onUpload, disabled = false }: ChecklistItemProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const nameFontSize = useAccessibilityFontSize(15);
  const descFontSize = useAccessibilityFontSize(13);
  const statusFontSize = useAccessibilityFontSize(12);
  const padding = useAccessibilityFontSize(12);
  const borderRadius = useAccessibilityFontSize(8);

  const isCompleted = item.status === 'COMPLETED';

  const handleToggle = () => {
    if (!disabled && onToggle) {
      onToggle(item.id);
    }
  };

  const handleUpload = () => {
    if (!disabled && onUpload) {
      onUpload(item.id);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding,
          borderRadius,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={handleToggle}
          style={styles.checkboxContainer}
          disabled={disabled}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted, disabled }}
          accessibilityLabel={item.name}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isCompleted ? colors.primary : colors.border,
                backgroundColor: isCompleted ? colors.primary : 'transparent',
              },
            ]}
          >
            {isCompleted && (
              <IconSymbol name="checkmark" size={16} color={colors.primaryForeground} />
            )}
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.name,
                {
                  color: colors.text,
                  fontSize: nameFontSize,
                },
                isCompleted && styles.completedText,
              ]}
            >
              {item.name}
              {item.is_required && (
                <Text style={{ color: colors.destructive }}> *</Text>
              )}
            </Text>
            {item.description && (
              <Text
                style={[
                  styles.description,
                  {
                    color: colors.mutedForeground,
                    fontSize: descFontSize,
                  },
                ]}
              >
                {item.description}
              </Text>
            )}
          </View>
        </Pressable>

        {onUpload && (
          <Pressable
            onPress={handleUpload}
            disabled={disabled}
            style={[
              styles.uploadButton,
              {
                backgroundColor: colors.muted,
                borderRadius: borderRadius / 2,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Загрузить файл"
          >
            <IconSymbol name="paperclip" size={18} color={colors.icon} />
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: CHECKLIST_STATUS_COLORS[item.status] + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: CHECKLIST_STATUS_COLORS[item.status],
                fontSize: statusFontSize,
              },
            ]}
          >
            {CHECKLIST_STATUS_LABELS[item.status]}
          </Text>
        </View>
        {item.notes && (
          <Text
            style={[
              styles.notes,
              {
                color: colors.mutedForeground,
                fontSize: descFontSize,
              },
            ]}
            numberOfLines={2}
          >
            {item.notes}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkboxContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontWeight: '600',
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  description: {
    lineHeight: 18,
  },
  uploadButton: {
    padding: 8,
  },
  footer: {
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontWeight: '600',
  },
  notes: {
    fontStyle: 'italic',
  },
});
