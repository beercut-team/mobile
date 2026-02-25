import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { Button } from '@/components/ui/button';
import type { Comment } from '@/lib/comments';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (body: string, isUrgent: boolean) => void;
  isLoading?: boolean;
}

export function CommentThread({ comments, onAddComment, isLoading = false }: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const fontSize = useAccessibilityFontSize(14);
  const authorFontSize = useAccessibilityFontSize(13);
  const dateFontSize = useAccessibilityFontSize(12);
  const urgentFontSize = useAccessibilityFontSize(11);
  const padding = useAccessibilityFontSize(16);
  const borderRadius = useAccessibilityFontSize(12);

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim(), isUrgent);
      setNewComment('');
      setIsUrgent(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View
      style={[
        styles.commentItem,
        {
          backgroundColor: item.is_urgent ? colors.destructive + '10' : colors.muted,
          borderLeftColor: item.is_urgent ? colors.destructive : colors.border,
          padding: padding * 0.75,
          borderRadius: borderRadius * 0.75,
        },
      ]}
    >
      <View style={styles.commentHeader}>
        <Text
          style={[
            styles.commentAuthor,
            {
              color: colors.text,
              fontSize: authorFontSize,
            },
          ]}
        >
          Автор #{item.author_id}
        </Text>
        <Text
          style={[
            styles.commentDate,
            {
              color: colors.mutedForeground,
              fontSize: dateFontSize,
            },
          ]}
        >
          {formatDate(item.created_at)}
        </Text>
      </View>
      <Text
        style={[
          styles.commentBody,
          {
            color: colors.text,
            fontSize,
          },
        ]}
      >
        {item.body}
      </Text>
      {item.is_urgent && (
        <View
          style={[
            styles.urgentBadge,
            {
              backgroundColor: colors.destructive,
            },
          ]}
        >
          <Text
            style={[
              styles.urgentText,
              {
                color: '#FFFFFF',
                fontSize: urgentFontSize,
              },
            ]}
          >
            СРОЧНО
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.mutedForeground,
                fontSize,
              },
            ]}
          >
            Комментариев пока нет
          </Text>
        }
        inverted
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            padding,
          },
        ]}
      >
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Добавить комментарий..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.text,
              fontSize,
              borderRadius: borderRadius * 0.75,
              padding: padding * 0.75,
            },
          ]}
          accessibilityLabel="Текст комментария"
        />
        <View style={styles.actions}>
          <Button
            variant={isUrgent ? 'destructive' : 'outline'}
            onPress={() => setIsUrgent(!isUrgent)}
            accessibilityLabel={isUrgent ? 'Отменить срочность' : 'Пометить как срочное'}
          >
            {isUrgent ? '🔴 Срочно' : 'Срочно'}
          </Button>
          <Button
            onPress={handleSubmit}
            disabled={!newComment.trim() || isLoading}
            accessibilityLabel="Отправить комментарий"
          >
            Отправить
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  commentItem: {
    borderLeftWidth: 3,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentDate: {
    fontWeight: '400',
  },
  commentBody: {
    lineHeight: 20,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  urgentText: {
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 32,
  },
  inputContainer: {
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
