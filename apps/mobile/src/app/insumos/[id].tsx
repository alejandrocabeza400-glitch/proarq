import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import type { Insumo } from '../../services/api/insumos.api';
import { insumosApi } from '../../services/api/insumos.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const UNIDADES = ['M3', 'KG', 'UND', 'GL'];

export default function InsumoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editUnidad, setEditUnidad] = useState('UND');
  const [editCostBase, setEditCostBase] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: insumo,
    isPending,
    isError,
    refetch,
  } = useQuery<Insumo>({
    queryKey: ['insumo', id],
    queryFn: async () => {
      const res = await insumosApi.getById(id);
      return res.data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await insumosApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumo', id] });
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Error al guardar cambios');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await insumosApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      router.back();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Error al eliminar insumo');
      setShowDeleteModal(false);
    },
  });

  const enterEditMode = () => {
    if (!insumo) return;
    setEditNombre(insumo.nombre);
    setEditUnidad(insumo.unidad);
    setEditCostBase(insumo.costBase);
    setIsEditing(true);
    setError('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSave = () => {
    if (!editNombre || !editCostBase) {
      setError('Todos los campos son requeridos');
      return;
    }
    const costNum = Number.parseFloat(editCostBase);
    if (Number.isNaN(costNum) || costNum <= 0) {
      setError('El costo base debe ser un número válido mayor a 0');
      return;
    }

    setError('');
    updateMutation.mutate({
      nombre: editNombre,
      unidad: editUnidad,
      costBase: editCostBase,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isPending) {
    return <LoadingState message="Cargando insumo..." />;
  }

  if (isError || !insumo) {
    return (
      <EmptyState
        title="Error al cargar insumo"
        description="No se pudo cargar el insumo. Intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <PageLayout title="Detalle Insumo" showBack onBack={() => router.back()}>
      {!isEditing ? (
        <>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.onSurface,
              margin: '0 0 8px',
            }}
          >
            {insumo.nombre}
          </h1>
          <p
            style={{
              color: colors.onSurfaceVariant,
              fontSize: '14px',
              margin: '0 0 24px',
            }}
          >
            {insumo.codigo} | {insumo.unidad}
          </p>

          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: '8px',
              marginBottom: spacing.lg,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: spacing.sm,
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  color: colors.onSurfaceVariant,
                }}
              >
                Costo Base
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: colors.onSurface,
                }}
              >
                ${Number.parseFloat(insumo.costBase).toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {error && (
            <p
              style={{
                color: colors.error,
                fontSize: '14px',
                margin: '0 0 spacing.md',
              }}
            >
              {error}
            </p>
          )}

          <Button onPress={enterEditMode} fullWidth>
            Editar
          </Button>

          {isAdmin && (
            <Button
              onPress={() => setShowDeleteModal(true)}
              variant="ghost"
              fullWidth
              style={{ marginTop: spacing.sm }}
            >
              Eliminar
            </Button>
          )}
        </>
      ) : (
        <>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.onSurface,
              margin: '0 0 24px',
            }}
          >
            Editar Insumo
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
            }}
          >
            <Input
              label="Nombre"
              placeholder="Ej: Cemento Portland Tipo I"
              value={editNombre}
              onChangeText={setEditNombre}
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
                data-testid="edit-unidad-select"
                value={editUnidad}
                onChange={(e) => setEditUnidad(e.target.value)}
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
              value={editCostBase}
              onChangeText={setEditCostBase}
              keyboardType="numeric"
            />

            {error && (
              <p
                style={{
                  color: colors.error,
                  fontSize: '14px',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <Button
              onPress={handleSave}
              disabled={updateMutation.isPending}
              loading={updateMutation.isPending}
              fullWidth
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>

            <Button onPress={cancelEdit} variant="ghost" fullWidth>
              Cancelar
            </Button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          data-testid="confirm-dialog"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              padding: spacing.lg,
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px',
            }}
          >
            <p
              style={{
                fontWeight: 600,
                fontSize: '18px',
                margin: '0 0 8px',
                color: colors.onSurface,
              }}
            >
              Eliminar Insumo
            </p>
            <p
              style={{
                fontSize: '14px',
                color: colors.onSurfaceVariant,
                margin: '0 0 24px',
              }}
            >
              ¿Estás seguro de que deseas eliminar este insumo? Esta acción no se puede deshacer.
            </p>

            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
              }}
            >
              <Button onPress={() => setShowDeleteModal(false)} variant="ghost" fullWidth>
                Cancelar
              </Button>
              <Button
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                loading={deleteMutation.isPending}
                fullWidth
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
