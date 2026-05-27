import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Text from '../../components/ui/Text';
import { apusApi } from '../../services/api/apus.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const TIPOS_APU = ['GLOBAL', 'UNITARIO', 'LUMP_SUM'];

export default function CreateApuScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('UNITARIO');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apusApi.create({ codigo, nombre, tipo });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['apus'] });
      router.replace(`/apus/${response.data.id}`);
    },
    onError: (err: any) => {
      const apiError = err?.response?.data;
      if (apiError?.details && Array.isArray(apiError.details)) {
        const newErrors: Record<string, string> = {};
        apiError.details.forEach((detail: any) => {
          if (detail.path) newErrors[detail.path] = detail.message;
        });
        setErrors(newErrors);
        setGeneralError('Verifica los campos obligatorios.');
      } else {
        setGeneralError(apiError?.error || apiError?.message || 'Error al crear el análisis APU.');
      }
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!codigo.trim()) newErrors.codigo = 'El código de referencia es obligatorio.';
    if (!nombre.trim()) newErrors.nombre = 'El nombre descriptivo es obligatorio.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setGeneralError('');
    setErrors({});
    if (!validate()) return;
    createMutation.mutate();
  };

  return (
    <PageLayout title="Nuevo Análisis APU" showBack onBack={() => router.back()}>
      <View style={styles.form}>
        <View style={styles.header}>
          <Text variant="titleSm" weight="800" color={colors.primary}>Estructura Técnica</Text>
          <Text variant="bodySm" color={colors.onSurfaceVariant}>Define la identificación base para este análisis de precio.</Text>
        </View>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text variant="labelSm" color={colors.error} weight="700">⚠️ {generalError}</Text>
          </View>
        ) : null}

        <Input
          label="Código de Referencia"
          placeholder="Ej: PINT-001"
          value={codigo}
          onChangeText={setCodigo}
          error={errors.codigo}
        />

        <Input
          label="Nombre del Análisis"
          placeholder="Ej: Pintura en muros interiores"
          value={nombre}
          onChangeText={setNombre}
          error={errors.nombre}
        />

        <View style={styles.selectGroup}>
          <Text variant="labelMd" weight="700" color={colors.onSurface} style={styles.label}>
            Tipo de Análisis
          </Text>
          <View style={styles.pickerContainer}>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={styles.nativeSelect}
            >
              {TIPOS_APU.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            onPress={handleSave}
            loading={createMutation.isPending}
            fullWidth
            style={styles.submitButton}
          >
            Crear Análisis
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.back()}
            disabled={createMutation.isPending}
            fullWidth
          >
            Cancelar
          </Button>
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
    gap: 4,
  },
  errorBanner: {
    padding: 14,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  selectGroup: {
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  nativeSelect: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors.primary,
    outline: 'none',
  } as any,
  footer: {
    marginTop: spacing.lg,
    gap: 12,
  },
  submitButton: {
    minHeight: 52,
  }
});
