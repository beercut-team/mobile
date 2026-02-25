import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibility } from '@/contexts/accessibility-context';
import { useAccessibilityFontSize } from '@/hooks/use-accessibility-font-size';
import { Input } from '@/components/ui/input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { IOLCalculationRequest, IOLFormula, IOLEye } from '@/lib/iol';
import { IOL_FORMULA_LABELS } from '@/lib/iol';

interface IOLCalculatorFormProps {
  patientId: number;
  onCalculate: (data: IOLCalculationRequest) => void;
  isCalculating?: boolean;
}

const FORMULA_OPTIONS: SelectOption[] = [
  { label: IOL_FORMULA_LABELS.SRKT, value: 'SRKT' },
  { label: IOL_FORMULA_LABELS.HAIGIS, value: 'HAIGIS' },
  { label: IOL_FORMULA_LABELS.HOFFERQ, value: 'HOFFERQ' },
];

const EYE_OPTIONS: SelectOption[] = [
  { label: 'OD (правый глаз)', value: 'OD' },
  { label: 'OS (левый глаз)', value: 'OS' },
];

export function IOLCalculatorForm({ patientId, onCalculate, isCalculating = false }: IOLCalculatorFormProps) {
  const theme = useColorScheme() ?? 'light';
  const { isAccessibilityMode } = useAccessibility();
  const colors = isAccessibilityMode ? Colors.highContrast : Colors[theme];
  const titleFontSize = useAccessibilityFontSize(18);
  const labelFontSize = useAccessibilityFontSize(14);
  const padding = useAccessibilityFontSize(16);

  const [formData, setFormData] = useState({
    eye: 'OD' as IOLEye,
    axial_length: '',
    keratometry1: '',
    keratometry2: '',
    acd: '',
    target_refraction: '0',
    formula: 'SRKT' as IOLFormula,
    a_constant: '118.4',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.axial_length) {
      newErrors.axial_length = 'Обязательное поле';
    } else if (parseFloat(formData.axial_length) < 15 || parseFloat(formData.axial_length) > 35) {
      newErrors.axial_length = 'Значение должно быть от 15 до 35 мм';
    }

    if (!formData.keratometry1) {
      newErrors.keratometry1 = 'Обязательное поле';
    } else if (parseFloat(formData.keratometry1) < 35 || parseFloat(formData.keratometry1) > 55) {
      newErrors.keratometry1 = 'Значение должно быть от 35 до 55 D';
    }

    if (!formData.keratometry2) {
      newErrors.keratometry2 = 'Обязательное поле';
    } else if (parseFloat(formData.keratometry2) < 35 || parseFloat(formData.keratometry2) > 55) {
      newErrors.keratometry2 = 'Значение должно быть от 35 до 55 D';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const data: IOLCalculationRequest = {
      patient_id: patientId,
      eye: formData.eye,
      axial_length: parseFloat(formData.axial_length),
      keratometry1: parseFloat(formData.keratometry1),
      keratometry2: parseFloat(formData.keratometry2),
      acd: formData.acd ? parseFloat(formData.acd) : undefined,
      target_refraction: parseFloat(formData.target_refraction),
      formula: formData.formula,
      a_constant: parseFloat(formData.a_constant),
    };

    onCalculate(data);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
        },
      ]}
      contentContainerStyle={[styles.content, { padding }]}
    >
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: titleFontSize,
          },
        ]}
      >
        Расчёт ИОЛ
      </Text>

      <Select
        label="Глаз"
        options={EYE_OPTIONS}
        value={formData.eye}
        onChange={(value) => setFormData({ ...formData, eye: value as IOLEye })}
      />

      <Input
        label="Длина оси (мм) *"
        value={formData.axial_length}
        onChangeText={(value) => setFormData({ ...formData, axial_length: value })}
        keyboardType="decimal-pad"
        placeholder="22.5"
        error={errors.axial_length}
      />

      <Input
        label="Кератометрия K1 (D) *"
        value={formData.keratometry1}
        onChangeText={(value) => setFormData({ ...formData, keratometry1: value })}
        keyboardType="decimal-pad"
        placeholder="43.5"
        error={errors.keratometry1}
      />

      <Input
        label="Кератометрия K2 (D) *"
        value={formData.keratometry2}
        onChangeText={(value) => setFormData({ ...formData, keratometry2: value })}
        keyboardType="decimal-pad"
        placeholder="44.0"
        error={errors.keratometry2}
      />

      <Input
        label="Глубина передней камеры (мм)"
        value={formData.acd}
        onChangeText={(value) => setFormData({ ...formData, acd: value })}
        keyboardType="decimal-pad"
        placeholder="3.2"
      />

      <Input
        label="Целевая рефракция (D)"
        value={formData.target_refraction}
        onChangeText={(value) => setFormData({ ...formData, target_refraction: value })}
        keyboardType="numeric"
        placeholder="0"
      />

      <Select
        label="Формула расчёта"
        options={FORMULA_OPTIONS}
        value={formData.formula}
        onChange={(value) => setFormData({ ...formData, formula: value as IOLFormula })}
      />

      <Input
        label="A-константа"
        value={formData.a_constant}
        onChangeText={(value) => setFormData({ ...formData, a_constant: value })}
        keyboardType="decimal-pad"
        placeholder="118.4"
      />

      <Button
        onPress={handleSubmit}
        disabled={isCalculating}
        style={styles.submitButton}
      >
        {isCalculating ? 'Расчёт...' : 'Рассчитать'}
      </Button>

      <Text
        style={[
          styles.hint,
          {
            color: colors.mutedForeground,
            fontSize: labelFontSize,
          },
        ]}
      >
        * Обязательные поля
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  hint: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
