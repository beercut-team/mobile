import { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { UserRole } from '@/lib/auth';
import { applyPhoneMask, unmaskPhone, isPhoneComplete } from '@/lib/phone-mask';

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'PATIENT', label: 'Пациент', desc: 'Отслеживание подготовки' },
  { value: 'DISTRICT_DOCTOR', label: 'Районный врач', desc: 'Подготовка пациентов' },
  { value: 'SURGEON', label: 'Хирург', desc: 'Проверка и операции' },
];

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handlePhoneChange = useCallback((text: string) => {
    setPhone(applyPhoneMask(text));
    if (touched.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  }, [touched.phone]);

  const handleBlur = useCallback((field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prev) => {
      const next = { ...prev };
      switch (field) {
        case 'name':
          if (!name.trim()) next.name = 'Введите ФИО';
          else if (name.trim().length < 2) next.name = 'Минимум 2 символа';
          else next.name = undefined;
          break;
        case 'email':
          if (!email.trim()) next.email = 'Введите email';
          else if (!validateEmail(email.trim())) next.email = 'Некорректный email';
          else next.email = undefined;
          break;
        case 'phone':
          if (phone && !isPhoneComplete(phone)) next.phone = 'Введите полный номер';
          else next.phone = undefined;
          break;
        case 'password':
          if (!password) next.password = 'Введите пароль';
          else if (password.length < 6) next.password = 'Минимум 6 символов';
          else next.password = undefined;
          break;
      }
      return next;
    });
  }, [name, email, phone, password]);

  const handleFieldChange = useCallback((field: keyof FieldErrors, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [touched]);

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!name.trim()) next.name = 'Введите ФИО';
    else if (name.trim().length < 2) next.name = 'Минимум 2 символа';

    if (!email.trim()) next.email = 'Введите email';
    else if (!validateEmail(email.trim())) next.email = 'Некорректный email';

    if (phone && !isPhoneComplete(phone)) next.phone = 'Введите полный номер';

    if (!password) next.password = 'Введите пароль';
    else if (password.length < 6) next.password = 'Минимум 6 символов';

    setErrors(next);
    setTouched({ name: true, email: true, password: true, phone: true });
    return !Object.values(next).some(Boolean);
  };

  const mutation = useMutation({
    mutationFn: () => {
      const rawPhone = unmaskPhone(phone);
      return register({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: rawPhone.length === 11 ? `+${rawPhone}` : undefined,
        role,
      });
    },
    onSuccess: () => {
      showToast('Вы успешно зарегистрировались!', 'success');
      router.replace('/(tabs)/profile');
    },
  });

  const handleRegister = () => {
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
            Регистрация
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Создайте аккаунт для начала работы
          </Text>
        </View>

        {/* Server Error */}
        {mutation.error && (
          <View style={[styles.serverError, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30' }]}>
            <Text style={[styles.serverErrorTitle, { color: colors.destructive }]}>
              Ошибка регистрации
            </Text>
            <Text style={[styles.serverErrorText, { color: colors.destructive }]}>
              {mutation.error.message}
            </Text>
          </View>
        )}

        <Card style={styles.card}>
          {/* Role Selection */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Выберите роль
          </Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setRole(r.value)}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: active ? colors.primary + '10' : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleLabel,
                      { color: active ? colors.primary : colors.text },
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text
                    style={[styles.roleDesc, { color: colors.mutedForeground }]}
                  >
                    {r.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="ФИО"
            placeholder="Иванов Иван Петрович"
            value={name}
            onChangeText={(v) => handleFieldChange('name', v, setName)}
            onBlur={() => handleBlur('name')}
            autoCapitalize="words"
            containerStyle={styles.field}
            error={errors.name}
          />

          <Input
            label="Email"
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
            label="Телефон"
            placeholder="+7 (900) 123-45-67"
            value={phone}
            onChangeText={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
            keyboardType="phone-pad"
            containerStyle={styles.field}
            error={errors.phone}
          />

          <Input
            label="Пароль"
            placeholder="Минимум 6 символов"
            value={password}
            onChangeText={(v) => handleFieldChange('password', v, setPassword)}
            onBlur={() => handleBlur('password')}
            secureTextEntry
            containerStyle={styles.field}
            error={errors.password}
          />

          <Button
            onPress={handleRegister}
            loading={mutation.isPending}
            style={styles.button}
          >
            Создать аккаунт
          </Button>
        </Card>

        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground }}>
            Уже есть аккаунт?{' '}
          </Text>
          <Link href="/(auth)/login">
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              Войти
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
    fontSize: 15,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  roleGrid: {
    gap: 8,
    marginBottom: 20,
  },
  roleCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  roleDesc: {
    fontSize: 12,
    marginTop: 2,
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
