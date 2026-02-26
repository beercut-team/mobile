import { useState, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/contexts/toast-context';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { applyPhoneMask, unmaskPhone, isPhoneComplete } from '@/lib/phone-mask';
import { getDistricts, type District } from '@/lib/districts';
import {
  createPatient,
  OPERATION_LABELS,
  EYE_LABELS,
  type OperationType,
  type Eye,
} from '@/lib/patients';

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  phone?: string;
  operation_type?: string;
  eye?: string;
  district_id?: string;
}

export default function CreatePatientScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAccessibilityMode } = useAccessibility();
  const theme = useColorScheme() ?? 'light';
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const titleSize = useAccessibilityFontSize(28);
  const subtitleSize = useAccessibilityFontSize(15);
  const errorTitleSize = useAccessibilityFontSize(14);
  const errorTextSize = useAccessibilityFontSize(13);
  const borderRadius = useAccessibilityFontSize(12);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [snils, setSnils] = useState('');
  const [passportSeries, setPassportSeries] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [operationType, setOperationType] = useState<OperationType | ''>('');
  const [eye, setEye] = useState<Eye | ''>('');
  const [districtId, setDistrictId] = useState<number | undefined>();
  const [notes, setNotes] = useState('');

  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [districtsError, setDistrictsError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistrictsError(null);
      try {
        const response = await getDistricts({ limit: 100 });
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
        case 'first_name':
          if (!firstName.trim()) next.first_name = 'Введите имя';
          else next.first_name = undefined;
          break;
        case 'last_name':
          if (!lastName.trim()) next.last_name = 'Введите фамилию';
          else next.last_name = undefined;
          break;
        case 'phone':
          if (phone && !isPhoneComplete(phone)) next.phone = 'Введите полный номер';
          else next.phone = undefined;
          break;
        case 'operation_type':
          if (!operationType) next.operation_type = 'Выберите тип операции';
          else next.operation_type = undefined;
          break;
        case 'eye':
          if (!eye) next.eye = 'Выберите глаз';
          else next.eye = undefined;
          break;
        case 'district_id':
          if (!districtId) next.district_id = 'Выберите район';
          else next.district_id = undefined;
          break;
      }
      return next;
    });
  }, [firstName, lastName, phone, operationType, eye, districtId]);

  const handleFieldChange = useCallback((field: keyof FieldErrors, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [touched]);

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!firstName.trim()) next.first_name = 'Введите имя';
    if (!lastName.trim()) next.last_name = 'Введите фамилию';
    if (phone && !isPhoneComplete(phone)) next.phone = 'Введите полный номер';
    if (!operationType) next.operation_type = 'Выберите тип операции';
    if (!eye) next.eye = 'Выберите глаз';
    if (!districtId) next.district_id = 'Выберите район';

    setErrors(next);
    setTouched({
      first_name: true,
      last_name: true,
      phone: true,
      operation_type: true,
      eye: true,
      district_id: true,
    });
    return !Object.values(next).some(Boolean);
  };

  const mutation = useMutation({
    mutationFn: () => {
      const rawPhone = unmaskPhone(phone);
      return createPatient({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || undefined,
        date_of_birth: dateOfBirth.trim() || undefined,
        phone: rawPhone.length === 11 ? `+${rawPhone}` : undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        snils: snils.trim() || undefined,
        passport_series: passportSeries.trim() || undefined,
        passport_number: passportNumber.trim() || undefined,
        policy_number: policyNumber.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        operation_type: operationType as OperationType,
        eye: eye as Eye,
        district_id: districtId!,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: (response) => {
      showToast('Пациент успешно создан', 'success');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/(tabs)/patients/${response.data.id}`);
    },
    onError: (error: Error) => {
      showToast(error.message || 'Не удалось создать пациента', 'error');
    },
  });

  const contentPaddingTop = Math.max(insets.top + 18, 26);
  const contentPaddingBottom = Math.max(insets.bottom + 20, 28);

  const handleCreate = () => {
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
            Новый пациент
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontSize: subtitleSize }]}>
            Заполните данные для создания карты пациента
          </Text>
        </View>

        {/* Server Error */}
        {mutation.error && (
          <View style={[styles.serverError, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30', borderRadius }]}>
            <Text style={[styles.serverErrorTitle, { color: colors.destructive, fontSize: errorTitleSize }]}>
              Ошибка создания
            </Text>
            <Text style={[styles.serverErrorText, { color: colors.destructive, fontSize: errorTextSize }]}>
              {mutation.error.message}
            </Text>
          </View>
        )}

        <Card style={styles.card}>
          {/* Required Fields Section */}
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: errorTitleSize }]}>
            Основная информация *
          </Text>

          <Input
            label="Имя *"
            placeholder="Иван"
            value={firstName}
            onChangeText={(v) => handleFieldChange('first_name', v, setFirstName)}
            onBlur={() => handleBlur('first_name')}
            autoCapitalize="words"
            containerStyle={styles.field}
            error={errors.first_name}
          />

          <Input
            label="Фамилия *"
            placeholder="Иванов"
            value={lastName}
            onChangeText={(v) => handleFieldChange('last_name', v, setLastName)}
            onBlur={() => handleBlur('last_name')}
            autoCapitalize="words"
            containerStyle={styles.field}
            error={errors.last_name}
          />

          <Input
            label="Отчество"
            placeholder="Петрович"
            value={middleName}
            onChangeText={setMiddleName}
            autoCapitalize="words"
            containerStyle={styles.field}
          />

          <Input
            label="Дата рождения"
            placeholder="ДД.ММ.ГГГГ"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            keyboardType="numbers-and-punctuation"
            containerStyle={styles.field}
          />

          {/* District Selection */}
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
                label="Район *"
                placeholder="Выберите район"
                value={districtId?.toString() || ''}
                onChange={(value) => {
                  setDistrictId(value ? parseInt(value, 10) : undefined);
                  if (touched.district_id) {
                    setErrors((prev) => ({ ...prev, district_id: undefined }));
                  }
                }}
                options={districts.map((d) => ({
                  label: d.code ? `${d.name} (Код: ${d.code})` : d.name,
                  value: d.id.toString(),
                }))}
              />
              {errors.district_id && (
                <Text style={[styles.errorText, { color: colors.destructive, fontSize: errorTextSize }]}>
                  {errors.district_id}
                </Text>
              )}
            </View>
          )}

          {/* Operation Details */}
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: errorTitleSize, marginTop: 16 }]}>
            Операция *
          </Text>

          <View style={styles.field}>
            <Select
              label="Тип операции *"
              placeholder="Выберите тип"
              value={operationType}
              onChange={(value) => {
                setOperationType(value as OperationType);
                if (touched.operation_type) {
                  setErrors((prev) => ({ ...prev, operation_type: undefined }));
                }
              }}
              options={Object.entries(OPERATION_LABELS).map(([value, label]) => ({
                label,
                value,
              }))}
            />
            {errors.operation_type && (
              <Text style={[styles.errorText, { color: colors.destructive, fontSize: errorTextSize }]}>
                {errors.operation_type}
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Select
              label="Глаз *"
              placeholder="Выберите глаз"
              value={eye}
              onChange={(value) => {
                setEye(value as Eye);
                if (touched.eye) {
                  setErrors((prev) => ({ ...prev, eye: undefined }));
                }
              }}
              options={Object.entries(EYE_LABELS).map(([value, label]) => ({
                label,
                value,
              }))}
            />
            {errors.eye && (
              <Text style={[styles.errorText, { color: colors.destructive, fontSize: errorTextSize }]}>
                {errors.eye}
              </Text>
            )}
          </View>

          <Input
            label="Диагноз"
            placeholder="Введите диагноз"
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
            numberOfLines={3}
            containerStyle={styles.field}
            style={styles.multiline}
          />

          {/* Contact Information */}
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: errorTitleSize, marginTop: 16 }]}>
            Контактная информация
          </Text>

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
            label="Email"
            placeholder="patient@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
          />

          <Input
            label="Адрес"
            placeholder="Введите адрес"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
            containerStyle={styles.field}
            style={styles.multiline}
          />

          {/* Passport Data */}
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: errorTitleSize, marginTop: 16 }]}>
            Документы
          </Text>

          <Input
            label="СНИЛС"
            placeholder="123-456-789 00"
            value={snils}
            onChangeText={setSnils}
            keyboardType="numbers-and-punctuation"
            containerStyle={styles.field}
          />

          <View style={styles.row}>
            <Input
              label="Серия паспорта"
              placeholder="1234"
              value={passportSeries}
              onChangeText={setPassportSeries}
              keyboardType="number-pad"
              containerStyle={[styles.field, styles.halfField]}
            />

            <Input
              label="Номер паспорта"
              placeholder="567890"
              value={passportNumber}
              onChangeText={setPassportNumber}
              keyboardType="number-pad"
              containerStyle={[styles.field, styles.halfField]}
            />
          </View>

          <Input
            label="Номер полиса ОМС"
            placeholder="1234567890123456"
            value={policyNumber}
            onChangeText={setPolicyNumber}
            keyboardType="number-pad"
            containerStyle={styles.field}
          />

          {/* Additional Notes */}
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: errorTitleSize, marginTop: 16 }]}>
            Дополнительно
          </Text>

          <Input
            label="Примечания"
            placeholder="Дополнительная информация"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            containerStyle={styles.field}
            style={styles.multiline}
          />

          <Button
            onPress={handleCreate}
            loading={mutation.isPending}
            style={styles.button}
          >
            Создать пациента
          </Button>
        </Card>
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
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  multiline: {
    height: 'auto',
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 8,
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
  errorText: {
    marginTop: 4,
  },
});
