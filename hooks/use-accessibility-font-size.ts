import { useAccessibility } from '@/contexts/accessibility-context';
import { AccessibilityFontScale } from '@/constants/theme';

export function useAccessibilityFontSize(baseSize: number): number {
  const { isAccessibilityMode } = useAccessibility();
  return isAccessibilityMode ? baseSize * AccessibilityFontScale : baseSize;
}
