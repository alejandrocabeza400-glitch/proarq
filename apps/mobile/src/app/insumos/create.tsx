import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { insumosApi } from '../../services/api/insumos.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const UNIDADES = ['M3', 'KG', 'UND', 'GL'];

export default function CreateInsumoScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('UND');
  const [costBase, setCostBase] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      await insumosApi.create({ nombre, unidad, costBase } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      router.back();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Error al crear insumo');
    },
  });

  const isFormValid = (): boolean => {
    if (!nombre || !costBase) {
      setError('Todos los campos son requeridos');
      return false;
    }
    const costNum = Number.parseFloat(costBase);
    if (Number.isNaN(costNum) || costNum <= 0) {
      setError('El costo base debe ser un número válido mayor a 0');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    setError('');
    if (!isFormValid()) return;
    createMutation.mutate();
  };

  return (
    <PageLayout title="Nuevo Insumo" showBack onBack={() => router.back()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Input
          label="Nombre"
          placeholder="Ej: Cemento Portland Tipo I"
          value={nombre}
          onChangeText={setNombre}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 500,
              color: colors.onSurface,
            }}
          >
            Unidad de Medida
          </label>
          <select
            data-testid="unidad-select"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${colors.outlineVariant}15`,
              borderRadius: '6px',
              fontSize: '16px',
              fontFamily: 'Inter',
              outline: 'none',
              backgroundColor: colors.surface,
              color: colors.onSurface,
            }}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Costo Base"
          placeholder="0.00"
          value={costBase}
          onChangeText={setCostBase}
          keyboardType="numeric"
        />

        {error && <p style={{ color: colors.error, fontSize: '14px', margin: 0 }}>{error}</p>}

        <Button
          onPress={handleSave}
          disabled={createMutation.isPending}
          loading={createMutation.isPending}
          fullWidth
        >
          {createMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </PageLayout>
  );
}
