import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESSIBILITY_KEY = 'accessibility_mode';

interface AccessibilityContextValue {
  isAccessibilityMode: boolean;
  toggleAccessibilityMode: () => void;
  isLoading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem(ACCESSIBILITY_KEY);
        if (stored === 'true') {
          setIsAccessibilityMode(true);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggleAccessibilityMode = useCallback(async () => {
    const newValue = !isAccessibilityMode;
    setIsAccessibilityMode(newValue);
    try {
      await setItem(ACCESSIBILITY_KEY, String(newValue));
    } catch {
      // ignore
    }
  }, [isAccessibilityMode]);

  return (
    <AccessibilityContext.Provider
      value={{ isAccessibilityMode, toggleAccessibilityMode, isLoading }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
