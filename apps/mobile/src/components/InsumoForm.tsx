import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from './ui/Button';
import Input from './ui/Input';
import Text from './ui/Text';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const UNIDADES = ['M3', 'KG', 'UND', 'GL', 'M2', 'ML'];

export interface InsumoFormData {
  codigo: string;
  nombre: string;
  unidad: string;
  costBase: string;
}

interface InsumoFormProps {
  initialData?: Partial<InsumoFormData>;
  onSubmit: (data: InsumoFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEdition?: boolean;
  submitLabel?: string;
  generalError?: string;
  externalErrors?: Record<string, string>;
}

export default function InsumoForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  isEdition = false,
  submitLabel = 'Guardar Insumo',
  generalError,
  externalErrors = {},
}: InsumoFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [unidad, setUnidad] = useState(initialData?.unidad || 'UND');
  const [costBase, setCostBase] = useState(initialData?.costBase || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors(externalErrors);
    }
  }, [externalErrors]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    
    const cost = costBase.replace(',', '.');
    if (!costBase) {
      newErrors.costBase = 'El costo base es obligatorio.';
    } else if (isNaN(Number(cost)) || Number(cost) <= 0) {
      newErrors.costBase = 'Ingresa un valor numérico válido mayor a 0.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // For creation, generate a temporary code if needed, 
      // though the user says it's automatic (handled by backend or app logic)
      const generatedCodigo = initialData?.codigo || `INS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      onSubmit({ 
        codigo: generatedCodigo,
        nombre, 
        unidad, 
        costBase: costBase.replace(',', '.') 
      });
    }
  };

  return (
    <View style={styles.form}>
      {generalError ? (
        <View style={styles.errorContainer}>
          <Text variant="labelSm" color={colors.error} weight="700">
            ⚠️ {generalError}
          </Text>
        </View>
      ) : null}

      {!isEdition ? (
        <View style={styles.infoBox}>
          <Text variant="labelSm" color={colors.secondary} weight="700">IDENTIFICADOR AUTOMÁTICO</Text>
          <Text variant="bodySm" color={colors.onSurfaceVariant} italic>
            El sistema asignará un código único al insumo una vez guardado.
          </Text>
        </View>
      ) : (
        <View style={styles.idDisplay}>
          <Text variant="labelSm" color={colors.onSurfaceVariant} weight="800">CÓDIGO DE CATÁLOGO</Text>
          <Text variant="titleSm" weight="900" color={colors.primary}>{initialData?.codigo}</Text>
        </View>
      )}

      <Input
        label="Nombre del Insumo"
        placeholder="Ej: Cemento Portland Tipo I"
        value={nombre}
        onChangeText={(val) => {
          setNombre(val);
          if (errors.nombre) setErrors({ ...errors, nombre: '' });
        }}
        error={errors.nombre}
      />

      <View style={styles.selectGroup}>
        <Text variant="labelMd" weight="700" color={colors.onSurface} style={styles.label}>
          Unidad de Medida
        </Text>
        <View style={styles.pickerContainer}>
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            style={styles.nativeSelect}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </View>
      </View>

      <Input
        label="Costo Base (COP)"
        placeholder="0.00"
        value={costBase}
        onChangeText={(val) => {
          setCostBase(val);
          if (errors.costBase) setErrors({ ...errors, costBase: '' });
        }}
        keyboardType="numeric"
        error={errors.costBase}
      />

      <View style={styles.footer}>
        <Button 
          onPress={handleSubmit} 
          loading={isLoading} 
          fullWidth
          style={styles.submitButton}
        >
          {submitLabel}
        </Button>
        <Button 
          variant="ghost" 
          onPress={onCancel} 
          fullWidth
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  errorContainer: {
    padding: 14,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  infoBox: {
    padding: 16,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    gap: 6,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  idDisplay: {
    paddingHorizontal: 4,
    gap: 4,
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
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors.primary,
    outline: 'none',
  } as any,
  footer: {
    marginTop: spacing.xl,
    gap: 12,
    paddingBottom: 40,
  },
  submitButton: {
    minHeight: 52,
  }
});
