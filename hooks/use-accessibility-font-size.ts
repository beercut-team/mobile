import { useAccessibility } from '@/contexts/accessibility-context';
import { AccessibilityFontScale } from '@/constants/theme';

export function useAccessibilityFontSize(baseSize: number): number {
  const { isAccessibilityMode } = useAccessibility();
  if (!isAccessibilityMode) return baseSize;

  // Keep large titles from becoming oversized while still improving readability.
  const adaptiveScale =
    baseSize >= 28 ? 1.15 :
    baseSize >= 20 ? 1.2 :
    baseSize >= 16 ? 1.26 :
    AccessibilityFontScale;

  const minimumBoost =
    baseSize <= 12 ? 2.5 :
    baseSize <= 16 ? 2 :
    1.5;

  const scaled = baseSize * adaptiveScale;
  return Math.round(Math.max(scaled, baseSize + minimumBoost));
}
