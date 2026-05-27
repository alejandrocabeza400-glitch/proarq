import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Button from './ui/Button';
import Input from './ui/Input';
import Text from './ui/Text';
import { proyectosApi } from '../services/api/projects.api';
import { apusApi } from '../services/api/apus.api';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { PlusIcon, DeleteIcon } from './ui/Icons';

export interface CotizacionItem {
  apuId: string;
  cantidad: string;
}

export interface CotizacionFormData {
  projectoId: string;
  codigo: string;
  clienteId?: string;
  items: CotizacionItem[];
}

interface CotizacionFormProps {
  onSubmit: (data: CotizacionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  generalError?: string;
  externalErrors?: Record<string, string>;
}

export default function CotizacionForm({
  onSubmit,
  onCancel,
  isLoading,
  generalError,
  externalErrors = {},
}: CotizacionFormProps) {
  const [projectoId, setProjectoId] = useState('');
  const [items, setItems] = useState<CotizacionItem[]>([{ apuId: '', cantidad: '1' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch projects
  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['proyectos'],
    queryFn: () => proyectosApi.list(),
  });

  // Fetch available APUs
  const { data: apusResponse, isLoading: isLoadingApus } = useQuery({
    queryKey: ['apus'],
    queryFn: () => apusApi.list(),
  });

  const projects = projectsResponse?.data || [];
  const apus = apusResponse?.data || [];

  const addItem = () => {
    setItems([...items, { apuId: '', cantidad: '1' }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof CotizacionItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!projectoId) newErrors.projectoId = 'Debes seleccionar un proyecto.';
    
    items.forEach((item, index) => {
      if (!item.apuId) newErrors[`item_${index}_apu`] = 'Selecciona un análisis.';
      if (!item.cantidad || isNaN(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
        newErrors[`item_${index}_qty`] = 'Cantidad inválida.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const selectedProject = projects.find((p: any) => p.id === projectoId);
      const generatedCodigo = `COT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      onSubmit({ 
        projectoId, 
        codigo: generatedCodigo,
        clienteId: selectedProject?.clienteId,
        items: items.map(i => ({ apuId: i.apuId, cantidad: i.cantidad }))
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

      <View style={styles.header}>
        <Text variant="titleSm" weight="800" color={colors.primary}>Generar Cotización</Text>
        <Text variant="bodySm" color={colors.onSurfaceVariant}>
          Selecciona el proyecto y los análisis (APU) que compondrán esta oferta.
        </Text>
      </View>

      {/* Proyecto Selection */}
      <View style={styles.selectGroup}>
        <Text variant="labelMd" weight="700" color={colors.onSurface} style={styles.label}>
          Proyecto Destino
        </Text>
        <View style={[styles.pickerContainer, errors.projectoId ? styles.pickerError : null]}>
          <select
            value={projectoId}
            onChange={(e) => {
              setProjectoId(e.target.value);
              if (errors.projectoId) setErrors({ ...errors, projectoId: '' });
            }}
            style={styles.nativeSelect}
            disabled={isLoadingProjects}
          >
            <option value="">{isLoadingProjects ? 'Cargando proyectos...' : 'Selecciona un proyecto'}</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
            ))}
          </select>
        </View>
        {errors.projectoId && <Text variant="labelSm" color={colors.error}>{errors.projectoId}</Text>}
      </View>

      {/* Dynamic APU Items */}
      <View style={styles.itemsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text variant="labelMd" weight="800" color={colors.primary}>Análisis y Cantidades</Text>
          <Pressable onPress={addItem} style={styles.addButton}>
            <PlusIcon size={16} color={colors.tertiary} />
            <Text variant="labelSm" weight="800" color={colors.tertiary}>AÑADIR</Text>
          </Pressable>
        </View>

        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={[styles.miniPickerContainer, { flex: 2 }, errors[`item_${index}_apu`] ? styles.pickerError : null]}>
                <select
                  value={item.apuId}
                  onChange={(e) => updateItem(index, 'apuId', e.target.value)}
                  style={styles.miniNativeSelect}
                  disabled={isLoadingApus}
                >
                  <option value="">{isLoadingApus ? '...' : 'Elegir APU'}</option>
                  {apus.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                  ))}
                </select>
              </View>

              <Input
                placeholder="0"
                value={item.cantidad}
                onChangeText={(val) => updateItem(index, 'cantidad', val)}
                style={{ flex: 1, marginBottom: 0 }}
                keyboardType="numeric"
                error={errors[`item_${index}_qty`] ? ' ' : undefined}
              />

              {items.length > 1 && (
                <Pressable onPress={() => removeItem(index)} style={styles.removeButton}>
                  <DeleteIcon size={18} color={colors.error} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Info Box (The previous design element) */}
      <View style={styles.infoBox}>
        <Text variant="labelSm" color={colors.secondary} weight="700">IDENTIFICADOR DE SISTEMA</Text>
        <Text variant="bodySm" color={colors.onSurfaceVariant} italic>
          El código de cotización será generado automáticamente por el servidor tras la creación.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button 
          onPress={handleSubmit} 
          loading={isLoading} 
          fullWidth
          style={styles.submitButton}
        >
          Generar Cotización
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
  header: {
    gap: 4,
    marginBottom: 4,
  },
  errorContainer: {
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
  itemsSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.tertiary}10`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  miniPickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    height: 48,
    justifyContent: 'center',
  },
  miniNativeSelect: {
    width: '100%',
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Inter',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors.primary,
    outline: 'none',
  } as any,
  removeButton: {
    padding: 4,
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
  footer: {
    marginTop: spacing.xl,
    gap: 12,
    paddingBottom: 60,
  },
  submitButton: {
    minHeight: 52,
  }
});
