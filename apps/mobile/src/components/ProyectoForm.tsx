import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Button from './ui/Button';
import Input from './ui/Input';
import Text from './ui/Text';
import { usersApi } from '../services/api/users.api';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const ESTADOS_PROYECTO = [
  { label: 'Planificación', value: 'PLANIFICACION' },
  { label: 'En Ejecución', value: 'EN_EJECUCION' },
  { label: 'Finalizado', value: 'FINALIZADO' },
  { label: 'Suspendido', value: 'SUSPENDIDO' },
];

export interface ProyectoFormData {
  nombre: string;
  descripcion: string;
  estado: string;
  clienteId: string;
}

interface ProyectoFormProps {
  initialData?: Partial<ProyectoFormData>;
  onSubmit: (data: ProyectoFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  generalError?: string;
  externalErrors?: Record<string, string>;
}

export default function ProyectoForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar Proyecto',
  generalError,
  externalErrors = {},
}: ProyectoFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  const [estado, setEstado] = useState(initialData?.estado || 'PLANIFICACION');
  const [clienteId, setClientId] = useState(initialData?.clienteId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors(externalErrors);
    }
  }, [externalErrors]);

  // Fetch users with CLIENTE role
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ['users', 'CLIENTE'],
    queryFn: async () => {
      const res = await usersApi.list();
      return (res.data || []).filter((u: any) => u.role === 'CLIENTE');
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre del proyecto es obligatorio.';
    if (nombre.length > 0 && nombre.length < 3) newErrors.nombre = 'El nombre debe tener al menos 3 caracteres.';
    if (!clienteId) newErrors.clienteId = 'Debes seleccionar un cliente para el proyecto.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setErrors({});
    if (validate()) {
      onSubmit({ nombre, descripcion, estado, clienteId });
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

      <Input
        label="Nombre del Proyecto"
        placeholder="Ej: Edificio Los Alerces"
        value={nombre}
        onChangeText={(val) => {
          setNombre(val);
          if (errors.nombre) setErrors({ ...errors, nombre: '' });
        }}
        error={errors.nombre}
      />

      <Input
        label="Descripción (Opcional)"
        placeholder="Detalles sobre la ubicación o el alcance..."
        value={descripcion}
        onChangeText={setDescripcion}
        style={styles.textArea}
        maxLength={200}
        error={errors.descripcion}
      />

      <View style={styles.selectGroup}>
        <Text variant="labelMd" weight="700" color={colors.onSurface} style={styles.label}>
          Cliente Responsable
        </Text>
        <View style={[styles.pickerContainer, errors.clienteId ? styles.pickerError : null]}>
          <select
            value={clienteId}
            onChange={(e) => {
              setClientId(e.target.value);
              if (errors.clienteId) setErrors({ ...errors, clienteId: '' });
            }}
            style={styles.nativeSelect}
            disabled={isLoadingClientes}
          >
            <option value="">{isLoadingClientes ? 'Cargando clientes...' : 'Selecciona un cliente'}</option>
            {clientes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </View>
        {errors.clienteId ? (
          <Text variant="labelSm" color={colors.error} style={styles.errorText}>{errors.clienteId}</Text>
        ) : null}
      </View>

      <View style={styles.selectGroup}>
        <Text variant="labelMd" weight="700" color={colors.onSurface} style={styles.label}>
          Estado del Proyecto
        </Text>
        <View style={[styles.pickerContainer, errors.estado ? styles.pickerError : null]}>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            style={styles.nativeSelect}
          >
            {ESTADOS_PROYECTO.map((est) => (
              <option key={est.value} value={est.value}>{est.label}</option>
            ))}
          </select>
        </View>
      </View>

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
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  errorContainer: {
    padding: 14,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 80,
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
  pickerError: {
    borderColor: colors.error,
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
  errorText: {
    marginTop: 2,
    paddingLeft: 4,
  },
  footer: {
    marginTop: spacing.lg,
    gap: 12,
    paddingBottom: 40,
  },
  submitButton: {
    minHeight: 52,
  }
});
