import { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { IconSymbol } from './icon-symbol';

export interface ActionSheetAction {
  label: string;
  icon?: React.ComponentProps<typeof IconSymbol>['name'];
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  actions: ActionSheetAction[];
  onDismiss: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActionSheet({ visible, actions, onDismiss }: ActionSheetProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();
  const fontSize = useAccessibilityFontSize(16);
  const actionHeight = useAccessibilityFontSize(56);
  const borderRadius = useAccessibilityFontSize(16);
  const iconSize = useAccessibilityFontSize(24);

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 25, stiffness: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(500, { duration: 200 });
    }
  }, [visible, backdropOpacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackdropPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss();
  };

  const handleActionPress = (action: ActionSheetAction) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(
        action.destructive
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    }
    onDismiss();
    // Execute action after dismiss animation starts
    setTimeout(() => action.onPress(), 100);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onDismiss}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <AnimatedPressable
          style={[styles.backdrop, backdropStyle]}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopLeftRadius: borderRadius,
              borderTopRightRadius: borderRadius,
            },
            sheetStyle,
          ]}
        >
          <View style={styles.handle}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: colors.mutedForeground + '40' },
              ]}
            />
          </View>

          <View style={[styles.actionsContainer, { gap: 1 }]}>
            {actions.map((action, index) => {
              const textColor = action.destructive ? colors.destructive : colors.text;
              return (
                <Pressable
                  key={index}
                  onPress={() => handleActionPress(action)}
                  style={({ pressed }) => [
                    styles.action,
                    {
                      height: actionHeight,
                      backgroundColor: pressed
                        ? colors.muted
                        : colors.card,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  {action.icon && (
                    <IconSymbol
                      name={action.icon}
                      size={iconSize}
                      color={textColor}
                    />
                  )}
                  <Text
                    style={[
                      styles.actionText,
                      {
                        color: textColor,
                        fontSize,
                        fontWeight: action.destructive ? '600' : '400',
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.cancelContainer}>
            <Pressable
              onPress={handleBackdropPress}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  height: actionHeight,
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderRadius: borderRadius / 2,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Отмена"
            >
              <Text
                style={[
                  styles.cancelText,
                  {
                    color: colors.text,
                    fontSize,
                    fontWeight: '600',
                  },
                ]}
              >
                Отмена
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    paddingTop: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  actionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionText: {
    flex: 1,
  },
  cancelContainer: {
    marginTop: 12,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    textAlign: 'center',
  },
});
