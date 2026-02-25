import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const fontSize16 = useAccessibilityFontSize(16);
  const fontSize20 = useAccessibilityFontSize(20);
  const fontSize32 = useAccessibilityFontSize(32);

  return (
    <Text
      style={[
        { color },
        type === 'default' ? { fontSize: fontSize16, lineHeight: fontSize16 * 1.5 } : undefined,
        type === 'title' ? { fontSize: fontSize32, fontWeight: 'bold', lineHeight: fontSize32 } : undefined,
        type === 'defaultSemiBold' ? { fontSize: fontSize16, lineHeight: fontSize16 * 1.5, fontWeight: '600' } : undefined,
        type === 'subtitle' ? { fontSize: fontSize20, fontWeight: 'bold' } : undefined,
        type === 'link' ? { lineHeight: fontSize16 * 1.875, fontSize: fontSize16, color: '#0a7ea4' } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
