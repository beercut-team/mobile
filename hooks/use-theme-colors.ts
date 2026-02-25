import { useColorScheme } from './use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { Colors } from '@/constants/theme';

export function useThemeColors() {
  const colorScheme = useColorScheme();
  const { isAccessibilityMode } = useAccessibility();

  if (isAccessibilityMode) {
    return Colors.highContrast;
  }

  return Colors[colorScheme ?? 'light'];
}
