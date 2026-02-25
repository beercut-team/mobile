import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import type { Media } from '@/lib/media';

interface ImageGalleryProps {
  images: Media[];
  onImagePress: (image: Media, index: number) => void;
  categories?: string[];
}

export function ImageGallery({ images, onImagePress, categories }: ImageGalleryProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const fontSize = useAccessibilityFontSize(14);
  const { width } = useWindowDimensions();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate number of columns based on screen width
  const numColumns = width > 768 ? 3 : 2;
  const imageSize = (width - 32 - (numColumns - 1) * 8) / numColumns;

  // Filter images by category
  const filteredImages = useMemo(() => {
    if (!selectedCategory) return images;
    return images.filter((img) => img.category === selectedCategory);
  }, [images, selectedCategory]);

  // Only show images (filter out documents)
  const imageFiles = useMemo(() => {
    return filteredImages.filter((media) => media.content_type.startsWith('image/'));
  }, [filteredImages]);

  const renderCategoryFilter = () => {
    if (!categories || categories.length === 0) return null;

    return (
      <View style={styles.filterContainer}>
        <Pressable
          onPress={() => setSelectedCategory(null)}
          style={[
            styles.filterChip,
            {
              backgroundColor: !selectedCategory ? colors.primary : colors.muted,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: !selectedCategory ? colors.primaryForeground : colors.text,
                fontSize,
              },
            ]}
          >
            Все
          </Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedCategory === category ? colors.primary : colors.muted,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedCategory === category ? colors.primaryForeground : colors.text,
                  fontSize,
                },
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="photo-library" size={64} color={colors.icon} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground, fontSize }]}>
        {selectedCategory ? 'Нет изображений в этой категории' : 'Нет изображений'}
      </Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: Media; index: number }) => {
    const thumbnailUrl = item.thumbnail_path || item.storage_path;

    return (
      <Pressable
        onPress={() => onImagePress(item, index)}
        style={({ pressed }) => [
          styles.imageContainer,
          { width: imageSize, height: imageSize },
          pressed && styles.pressed,
        ]}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {item.category && (
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
            <Text
              style={[
                styles.categoryBadgeText,
                { color: colors.primaryForeground, fontSize: fontSize * 0.75 },
              ]}
              numberOfLines={1}
            >
              {item.category}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {renderCategoryFilter()}
      <FlatList
        data={imageFiles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        key={numColumns} // Force re-render when columns change
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          imageFiles.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
  },
});
