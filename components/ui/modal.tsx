import { ReactNode } from 'react';
import {
  Modal as RNModal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { IconSymbol } from './icon-symbol';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const titleFontSize = useAccessibilityFontSize(18);
  const padding = useAccessibilityFontSize(24);
  const borderRadius = useAccessibilityFontSize(16);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={styles.overlay}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: colors.card,
              padding,
              borderRadius,
            },
          ]}
          entering={Platform.OS === 'ios' ? SlideInDown.duration(300) : FadeIn.duration(200)}
          exiting={Platform.OS === 'ios' ? SlideOutDown.duration(300) : FadeOut.duration(200)}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: titleFontSize,
                },
              ]}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
            >
              <IconSymbol name="xmark.circle.fill" size={24} color={colors.icon} />
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    ...Platform.select({
      ios: {
        justifyContent: 'flex-end',
      },
      android: {
        justifyContent: 'center',
      },
      web: {
        justifyContent: 'center',
      },
    }),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      web: {
        marginHorizontal: 16,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
    flexShrink: 0,
  },
  body: {
    // Content goes here
  },
});
