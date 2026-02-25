import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import type { Media } from '@/lib/media';

interface MediaViewerProps {
  visible: boolean;
  images: Media[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (image: Media) => void;
  onDownload?: (image: Media) => void;
}

export function MediaViewer({
  visible,
  images,
  initialIndex,
  onClose,
  onDelete,
  onDownload,
}: MediaViewerProps) {
  const fontSize = useAccessibilityFontSize(16);
  const { width, height } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const currentImage = images[currentIndex];

  const resetTransform = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetTransform();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetTransform();
    }
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan gesture for moving zoomed image
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        // Swipe to change image
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (savedScale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Swipe threshold
        if (Math.abs(e.translationX) > width * 0.3) {
          if (e.translationX > 0) {
            runOnJS(goToPrevious)();
          } else {
            runOnJS(goToNext)();
          }
        }
        translateX.value = withSpring(0);
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Удалить изображение?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            onDelete(currentImage);
            if (images.length === 1) {
              onClose();
            } else if (currentIndex === images.length - 1) {
              setCurrentIndex(currentIndex - 1);
            }
          },
        },
      ]
    );
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentImage);
    }
  };

  const handleClose = () => {
    resetTransform();
    setCurrentIndex(initialIndex);
    onClose();
  };

  if (!visible || !currentImage) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <Text style={[styles.counter, { color: '#FFFFFF', fontSize }]}>
            {currentIndex + 1} / {images.length}
          </Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageWrapper, animatedStyle]}>
              <Image
                source={{ uri: currentImage.storage_path }}
                style={[styles.image, { width, height: height * 0.8 }]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={styles.actions}>
            {onDownload && (
              <Pressable onPress={handleDownload} style={styles.actionButton}>
                <MaterialIcons name="download" size={24} color="#FFFFFF" />
                <Text style={[styles.actionText, { fontSize: fontSize * 0.85 }]}>
                  Скачать
                </Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={handleDelete} style={styles.actionButton}>
                <MaterialIcons name="delete" size={24} color="#EF4444" />
                <Text style={[styles.actionText, { fontSize: fontSize * 0.85, color: '#EF4444' }]}>
                  Удалить
                </Text>
              </Pressable>
            )}
          </View>
          {currentImage.original_name && (
            <Text
              style={[styles.fileName, { color: '#FFFFFF', fontSize: fontSize * 0.9 }]}
              numberOfLines={1}
            >
              {currentImage.original_name}
            </Text>
          )}
        </View>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <Pressable
            onPress={goToPrevious}
            style={[styles.navButton, styles.navButtonLeft]}
          >
            <MaterialIcons name="chevron-left" size={48} color="#FFFFFF" />
          </Pressable>
        )}
        {currentIndex < images.length - 1 && (
          <Pressable
            onPress={goToNext}
            style={[styles.navButton, styles.navButtonRight]}
          >
            <MaterialIcons name="chevron-right" size={48} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  counter: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    // width and height set dynamically
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fileName: {
    textAlign: 'center',
    opacity: 0.8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -24 }],
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
});
