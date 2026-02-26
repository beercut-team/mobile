import { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface FieldErrors {
  accessCode?: string;
}

export default function PatientLoginScreen() {
  const { loginWithCode } = useAuth();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();

  const titleSize = useAccessibilityFontSize(28);
  const subtitleSize = useAccessibilityFontSize(16);
  const errorTitleSize = useAccessibilityFontSize(14);
  const errorTextSize = useAccessibilityFontSize(13);
  const borderRadius = useAccessibilityFontSize(12);

  const [accessCode, setAccessCode] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = useCallback((field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prev) => {
      const next = { ...prev };
      if (field === 'accessCode') {
        if (!accessCode.trim()) next.accessCode = 'Введите код доступа';
        else next.accessCode = undefined;
      }
      return next;
    });
  }, [accessCode]);

  const handleFieldChange = useCallback((field: keyof FieldErrors, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [touched]);

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!accessCode.trim()) next.accessCode = 'Введите код доступа';

    setErrors(next);
    setTouched({ accessCode: true });
    return !Object.values(next).some(Boolean);
  };

  const mutation = useMutation({
    mutationFn: () => loginWithCode(accessCode.trim()),
  });

  const contentPaddingTop = Math.max(insets.top + 18, 28);
  const contentPaddingBottom = Math.max(insets.bottom + 20, 28);

  const handleLogin = () => {
    if (!validate()) return;
    mutation.reset();
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontSize: titleSize }]}>
            Вход для пациента
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontSize: subtitleSize }]}>
            Введите код доступа, который вам выдал врач
          </Text>
        </View>

        {/* Server Error */}
        {mutation.error && (
          <View style={[styles.serverError, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30', borderRadius }]}>
            <Text style={[styles.serverErrorTitle, { color: colors.destructive, fontSize: errorTitleSize }]}>
              Ошибка входа
            </Text>
            <Text style={[styles.serverErrorText, { color: colors.destructive, fontSize: errorTextSize }]}>
              {mutation.error.message}
            </Text>
          </View>
        )}

        <Card style={styles.card}>
          <Input
            label="Код доступа"
            placeholder="Например: ABC123XYZ"
            value={accessCode}
            onChangeText={(v) => handleFieldChange('accessCode', v, setAccessCode)}
            onBlur={() => handleBlur('accessCode')}
            autoCapitalize="characters"
            autoCorrect={false}
            containerStyle={styles.field}
            error={errors.accessCode}
          />

          <Button
            onPress={handleLogin}
            loading={mutation.isPending}
            style={styles.button}
          >
            Войти
          </Button>
        </Card>

        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground }}>
            Вы врач?{' '}
          </Text>
          <Link href="/(auth)/doctor-login">
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              Войти через email
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  serverError: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  serverErrorTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  serverErrorText: {
    lineHeight: 18,
  },
  card: {
    gap: 0,
  },
  field: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
});
