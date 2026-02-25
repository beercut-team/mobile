/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E4E4E7',
    muted: '#F4F4F5',
    mutedForeground: '#71717A',
    destructive: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    ring: '#0a7ea4',
    inputBackground: '#F4F4F5',
    card: '#FFFFFF',
    cardForeground: '#11181C',
    primary: '#0a7ea4',
    primaryForeground: '#FFFFFF',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#27272A',
    muted: '#27272A',
    mutedForeground: '#A1A1AA',
    destructive: '#DC2626',
    warning: '#D97706',
    success: '#059669',
    ring: '#fff',
    inputBackground: '#1E2022',
    card: '#1C1E20',
    cardForeground: '#ECEDEE',
    primary: '#FFFFFF',
    primaryForeground: '#151718',
  },
  // High contrast theme for accessibility
  highContrast: {
    text: '#000000',
    background: '#FFFFFF',
    tint: '#0066CC',
    icon: '#000000',
    tabIconDefault: '#000000',
    tabIconSelected: '#0066CC',
    border: '#000000',
    muted: '#F0F0F0',
    mutedForeground: '#000000',
    destructive: '#CC0000',
    warning: '#CC6600',
    success: '#008800',
    ring: '#0066CC',
    inputBackground: '#FFFFFF',
    card: '#FFFFFF',
    cardForeground: '#000000',
    primary: '#0066CC',
    primaryForeground: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Font size multiplier for accessibility mode (2.0 = 100% increase for visually impaired)
export const AccessibilityFontScale = 2.0;
