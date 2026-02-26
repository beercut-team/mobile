import { useState, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useToast } from '@/contexts/toast-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import type { UserRole } from '@/lib/auth';
import { applyPhoneMask, unmaskPhone, isPhoneComplete } from '@/lib/phone-mask';
import { getDistricts, type District } from '@/lib/districts';

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'DISTRICT_DOCTOR', label: 'Районный врач', desc: 'Подготовка пациентов' },
  { value: 'SURGEON', label: 'Хирург', desc: 'Проверка и операции' },
];

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  district?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Введите пароль';
  if (password.length < 8) return 'Минимум 8 символов';
  if (!/[A-Z]/.test(password)) return 'Требуется заглавная буква';
  if (!/[a-z]/.test(password)) return 'Требуется строчная буква';
  if (!/[0-9]/.test(password)) return 'Требуется цифра';
  return undefined;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();

  const titleSize = useAccessibilityFontSize(28);
  const subtitleSize = useAccessibilityFontSize(15);
  const errorTitleSize = useAccessibilityFontSize(14);
  const errorTextSize = useAccessibilityFontSize(13);
  const fieldLabelSize = useAccessibilityFontSize(14);
  const roleLabelSize = useAccessibilityFontSize(15);
  const roleDescSize = useAccessibilityFontSize(12);
  const passwordHintSize = useAccessibilityFontSize(12);
  const borderRadius = useAccessibilityFontSize(12);
  const roleCardPadding = useAccessibilityFontSize(14);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('DISTRICT_DOCTOR');
  const [districtId, setDistrictId] = useState<number | undefined>();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [districtsError, setDistrictsError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistrictsError(null);
      try {
        const response = await getDistricts({ limit: 100 }); // Fetch all districts
        setDistricts(response.data || []);
      } catch (err) {
        setDistrictsError(err instanceof Error ? err.message : 'Не удалось загрузить районы');
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, []);

  const handlePhoneChange = useCallback((text: string) => {
    const newValue = applyPhoneMask(text, phone);
    setPhone(newValue);
    if (touched.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  }, [phone, touched.phone]);

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
          next.password = validatePassword(password);
          break;
        case 'confirmPassword':
          if (!confirmPassword) next.confirmPassword = 'Подтвердите пароль';
          else if (confirmPassword !== password) next.confirmPassword = 'Пароли не совпадают';
          else next.confirmPassword = undefined;
          break;
      }
      return next;
    });
  }, [name, email, phone, password, confirmPassword]);

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

    next.password = validatePassword(password);

    if (!confirmPassword) next.confirmPassword = 'Подтвердите пароль';
    else if (confirmPassword !== password) next.confirmPassword = 'Пароли не совпадают';

    if (role === 'DISTRICT_DOCTOR' && !districtId) {
      next.district = 'Выберите район';
    }

    setErrors(next);
    setTouched({ name: true, email: true, password: true, confirmPassword: true, phone: true, district: true });
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
        district_id: districtId,
      });
    },
    onSuccess: () => {
      showToast('Вы успешно зарегистрировались!', 'success');
    },
  });

  const contentPaddingTop = Math.max(insets.top + 18, 26);
  const contentPaddingBottom = Math.max(insets.bottom + 20, 28);

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
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontSize: titleSize }]}>
            Регистрация
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontSize: subtitleSize }]}>
            Создайте аккаунт для начала работы
          </Text>
        </View>

        {/* Server Error */}
        {mutation.error && (
          <View style={[styles.serverError, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30', borderRadius }]}>
            <Text style={[styles.serverErrorTitle, { color: colors.destructive, fontSize: errorTitleSize }]}>
              Ошибка регистрации
            </Text>
            <Text style={[styles.serverErrorText, { color: colors.destructive, fontSize: errorTextSize }]}>
              {mutation.error.message}
            </Text>
          </View>
        )}

        <Card style={styles.card}>
          {/* Role Selection */}
          <Text style={[styles.fieldLabel, { color: colors.text, fontSize: fieldLabelSize }]}>
            Выберите роль
          </Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => {
                    setRole(r.value);
                    if (r.value !== 'DISTRICT_DOCTOR') {
                      setDistrictId(undefined);
                      setErrors((prev) => ({ ...prev, district: undefined }));
                    }
                  }}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: active ? colors.primary + '10' : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius,
                      padding: roleCardPadding,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleLabel,
                      { color: active ? colors.primary : colors.text, fontSize: roleLabelSize },
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text
                    style={[styles.roleDesc, { color: colors.mutedForeground, fontSize: roleDescSize }]}
                  >
                    {r.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* District Selection - Only for DISTRICT_DOCTOR */}
          {role === 'DISTRICT_DOCTOR' && (
            <>
              {loadingDistricts ? (
                <View style={[styles.districtLoading, { backgroundColor: colors.muted, borderRadius }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.districtLoadingText, { color: colors.mutedForeground, fontSize: errorTextSize }]}>
                    Загрузка районов...
                  </Text>
                </View>
              ) : districtsError ? (
                <View style={[styles.districtError, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30', borderRadius }]}>
                  <Text style={[styles.districtErrorText, { color: colors.destructive, fontSize: errorTextSize }]}>
                    {districtsError}
                  </Text>
                </View>
              ) : (
                <View style={styles.field}>
                  <Select
                    label="Район"
                    placeholder="Выберите район"
                    value={districtId?.toString() || ''}
                    onChange={(value) => {
                      setDistrictId(value ? parseInt(value, 10) : undefined);
                      setErrors((prev) => ({ ...prev, district: undefined }));
                    }}
                    options={districts.map((d) => ({
                      label: d.code ? `${d.name} (Код: ${d.code})` : d.name,
                      value: d.id.toString(),
                    }))}
                  />
                  {errors.district && (
                    <Text style={[styles.errorText, { color: colors.destructive, fontSize: errorTextSize }]}>
                      {errors.district}
                    </Text>
                  )}
                </View>
              )}
            </>
          )}

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
            placeholder="Минимум 8 символов"
            value={password}
            onChangeText={(v) => handleFieldChange('password', v, setPassword)}
            onBlur={() => handleBlur('password')}
            secureTextEntry
            showPasswordToggle
            containerStyle={styles.field}
            error={errors.password}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.passwordHints}>
              <View style={styles.passwordHintRow}>
                <Text style={[
                  styles.passwordHintIcon,
                  { color: password.length >= 8 ? '#10B981' : colors.mutedForeground, fontSize: passwordHintSize }
                ]}>
                  {password.length >= 8 ? '✓' : '○'}
                </Text>
                <Text style={[
                  styles.passwordHintText,
                  { color: password.length >= 8 ? '#10B981' : colors.mutedForeground, fontSize: passwordHintSize }
                ]}>
                  Минимум 8 символов
                </Text>
              </View>
              <View style={styles.passwordHintRow}>
                <Text style={[
                  styles.passwordHintIcon,
                  { color: /[A-Z]/.test(password) ? '#10B981' : colors.mutedForeground, fontSize: passwordHintSize }
                ]}>
                  {/[A-Z]/.test(password) ? '✓' : '○'}
                </Text>
                <Text style={[
                  styles.passwordHintText,
                  { color: /[A-Z]/.test(password) ? '#10B981' : colors.mutedForeground, fontSize: passwordHintSize }
                ]}>
                  Заглавная буква (A-Z)
                </Text>
              </View>
              <View style={styles.passwordHintRow}>
                <Text style={[
                  styles.passwordHintIcon,
                  { color: /[0-9]/.test(password) ? '#10B981' : colors.mutedForeground, fontSize: passwordHintSize }
                ]}>
                  {/[0-9]/.test(password) ? '✓' : '○'}
                </Text>
                <Text style={[
                  styles.passwordHintText,
                  { color: /[0-9]/.test(password) ? '#10B981' : colors.mutedForeground, fontSize: passwordHintSize }
                ]}>
                  Цифра (0-9)
                </Text>
              </View>
            </View>
          )}

          <Input
            label="Подтверждение пароля"
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChangeText={(v) => handleFieldChange('confirmPassword', v, setConfirmPassword)}
            onBlur={() => handleBlur('confirmPassword')}
            secureTextEntry
            showPasswordToggle
            containerStyle={styles.field}
            error={errors.confirmPassword}
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
          <Link href="/(auth)/doctor-login">
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
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {},
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
  fieldLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  roleGrid: {
    gap: 8,
    marginBottom: 20,
  },
  roleCard: {
    borderWidth: 1.5,
  },
  roleLabel: {
    fontWeight: '600',
  },
  roleDesc: {
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
  districtLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  districtLoadingText: {
    marginLeft: 8,
  },
  districtError: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  districtErrorText: {
    lineHeight: 18,
  },
  passwordHints: {
    marginTop: -8,
    marginBottom: 16,
    gap: 6,
  },
  passwordHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passwordHintIcon: {
    fontWeight: '600',
    width: 16,
  },
  passwordHintText: {
    flex: 1,
  },
  errorText: {
    marginTop: 4,
  },
});
