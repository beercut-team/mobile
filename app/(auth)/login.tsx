import { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = useCallback((field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prev) => {
      const next = { ...prev };
      switch (field) {
        case 'email':
          if (!email.trim()) next.email = 'Введите email';
          else if (!validateEmail(email.trim())) next.email = 'Некорректный email';
          else next.email = undefined;
          break;
        case 'password':
          if (!password) next.password = 'Введите пароль';
          else next.password = undefined;
          break;
      }
      return next;
    });
  }, [email, password]);

  const handleFieldChange = useCallback((field: keyof FieldErrors, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [touched]);

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!email.trim()) next.email = 'Введите email';
    else if (!validateEmail(email.trim())) next.email = 'Некорректный email';

    if (!password) next.password = 'Введите пароль';

    setErrors(next);
    setTouched({ email: true, password: true });
    return !Object.values(next).some(Boolean);
  };

  const mutation = useMutation({
    mutationFn: () => login(email.trim(), password),
  });

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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Вход в аккаунт
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Войдите, чтобы продолжить
          </Text>
        </View>

        {/* Server Error */}
        {mutation.error && (
          <View style={[styles.serverError, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30' }]}>
            <Text style={[styles.serverErrorTitle, { color: colors.destructive }]}>
              Ошибка входа
            </Text>
            <Text style={[styles.serverErrorText, { color: colors.destructive }]}>
              {mutation.error.message}
            </Text>
          </View>
        )}

        <Card style={styles.card}>
          <Input
            label="Электронная почта"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => handleFieldChange('email', v, setEmail)}
            onBlur={() => handleBlur('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
            error={errors.email}
          />

          <Input
            label="Пароль"
            placeholder="Ваш пароль"
            value={password}
            onChangeText={(v) => handleFieldChange('password', v, setPassword)}
            onBlur={() => handleBlur('password')}
            secureTextEntry
            showPasswordToggle
            containerStyle={styles.field}
            error={errors.password}
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
            Нет аккаунта?{' '}
          </Text>
          <Link href="/(auth)/register">
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              Регистрация
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  serverError: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  serverErrorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  serverErrorText: {
    fontSize: 13,
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
  },
});
