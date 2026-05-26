import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import InsumoCard from '../../components/InsumoCard';
import PageLayout from '../../components/PageLayout';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import { useInsumos } from '../../hooks/useInsumos';
import { insumosApi } from '../../services/api/insumos.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const FILTER_CHIPS = ['Código', 'Nombre', 'Unidad'];

export default function InsumosScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA' || user?.role === 'DIRECTOR_OBRA';
  const canDelete = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: insumos = [], isPending, isError, refetch } = useInsumos(search);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await insumosApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      setConfirmDelete(null);
    },
  });

  if (isPending) {
    return <LoadingState message="Cargando..." />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Error al cargar insumos"
        description="No se pudieron cargar los insumos. Intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  const filteredInsumos = search
    ? insumos.filter(
        (i) =>
          i.nombre?.toLowerCase().includes(search.toLowerCase()) ||
          i.codigo?.toLowerCase().includes(search.toLowerCase()),
      )
    : insumos;

  const handleEdit = (id: string) => {
    router.push(`/insumos/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <PageLayout
      title="Catálogo Maestro"
      fabAction={isAdmin ? () => router.push('/insumos/create') : undefined}
      fabLabel="Nuevo Insumo"
      fabVisible={isAdmin}
    >
      <Input
        label="Buscar Insumos"
        placeholder="Ej: Cemento, CEM-001..."
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: spacing.md }}
      />

      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
        {FILTER_CHIPS.map((chip) => (
          <span
            key={chip}
            data-testid="filter-chip"
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              backgroundColor: colors.surfaceContainerHigh,
              fontSize: '12px',
              color: colors.onSurfaceVariant,
              cursor: 'pointer',
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      {filteredInsumos.length === 0 ? (
        <p
          style={{
            color: colors.onSurfaceVariant,
            fontSize: '14px',
            textAlign: 'center',
            padding: spacing.lg,
          }}
        >
          No hay insumos
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {filteredInsumos.map((insumo) => (
            <InsumoCard
              key={insumo.id}
              insumo={insumo}
              onClick={() => router.push(`/insumos/${insumo.id}`)}
              onEdit={canEdit ? () => handleEdit(insumo.id) : undefined}
              onDelete={canDelete ? () => setConfirmDelete(insumo.id) : undefined}
              isDeleting={deleteMutation.isPending && confirmDelete === insumo.id}
            />
          ))}
        </div>
      )}

      {confirmDelete && (
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
              maxWidth: '300px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
                color: colors.onSurface,
                margin: '0 0 16px',
              }}
            >
              ¿Confirmar eliminación?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.surfaceContainerHigh,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.error,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                }}
                aria-label="Confirmar"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div data-testid="refresh-control" onClick={() => refetch()} style={{ display: 'none' }} />
    </PageLayout>
  );
}
