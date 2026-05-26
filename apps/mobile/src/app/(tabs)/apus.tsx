import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import ApuCard from '../../components/ApuCard';
import PageLayout from '../../components/PageLayout';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import { useApus } from '../../hooks/useApus';
import { apusApi } from '../../services/api/apus.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function ApusScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA' || user?.role === 'DIRECTOR_OBRA';
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: apus = [], isPending, isError, refetch } = useApus();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apusApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apus'] });
      setConfirmDelete(null);
    },
  });

  const handleEdit = (id: string) => {
    router.push(`/apus/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isPending) {
    return <LoadingState message="Cargando..." />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Error al cargar APUs"
        description="No se pudieron cargar los APUs. Intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <PageLayout
      title="Análisis de Precios Unitarios"
      fabAction={canManage ? () => router.push('/apus/create') : undefined}
      fabLabel="Nuevo APU"
      fabVisible={canManage}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {apus.length === 0 ? (
          <p
            style={{
              color: colors.onSurfaceVariant,
              fontSize: '14px',
              textAlign: 'center',
              padding: spacing.lg,
            }}
          >
            No hay APUs
          </p>
        ) : (
          apus.map((apu) => (
            <ApuCard
              key={apu.id}
              apu={apu}
              onClick={() => router.push(`/apus/${apu.id}`)}
              onEdit={canManage ? () => handleEdit(apu.id) : undefined}
              onDelete={canManage ? () => setConfirmDelete(apu.id) : undefined}
              isDeleting={deleteMutation.isPending && confirmDelete === apu.id}
            />
          ))
        )}
      </div>

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
