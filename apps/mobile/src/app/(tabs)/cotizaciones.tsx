import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import CotizacionCard from '../../components/CotizacionCard';
import PageLayout from '../../components/PageLayout';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import { useCotizaciones } from '../../hooks/useCotizaciones';
import { cotizacionesApi } from '../../services/api/cotizaciones.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';

const COTIZACION_STATUSES = ['BORRADOR', 'ENVIADA', 'APROBADA', 'REEMPLAZADA'] as const;

export default function CotizacionesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA' || user?.role === 'DIRECTOR_OBRA';
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: cotizaciones = [], isPending, isError, refetch } = useCotizaciones(statusFilter);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await cotizacionesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      setConfirmDelete(null);
    },
  });

  const handleFilter = (estado: string) => {
    setStatusFilter(estado === statusFilter ? '' : estado);
  };

  const handleEdit = (id: string) => {
    router.push(`/cotizaciones/${id}`);
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
        title="Error al cargar cotizaciones"
        description="No se pudieron cargar las cotizaciones. Intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <PageLayout
      title="Cotizaciones"
      fabAction={canManage ? () => router.push('/cotizaciones/create') : undefined}
      fabLabel="Nueva Cotización"
      fabVisible={canManage}
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {COTIZACION_STATUSES.map((status) => (
          <span
            key={status}
            onClick={() => handleFilter(status)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              backgroundColor:
                statusFilter === status ? colors.primaryContainer : colors.surfaceContainerHigh,
              color: statusFilter === status ? '#ffffff' : colors.onSurfaceVariant,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {status}
          </span>
        ))}
      </div>

      {cotizaciones.length === 0 ? (
        <p
          style={{
            color: colors.onSurfaceVariant,
            fontSize: '14px',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          No hay cotizaciones
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cotizaciones.map((cot) => (
            <CotizacionCard
              key={cot.id}
              cotizacion={cot}
              onClick={() => router.push(`/cotizaciones/${cot.id}`)}
              onEdit={canManage ? () => handleEdit(cot.id) : undefined}
              onDelete={
                canManage && cot.estado !== 'APROBADA' ? () => setConfirmDelete(cot.id) : undefined
              }
              isDeleting={deleteMutation.isPending && confirmDelete === cot.id}
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
              padding: '24px',
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
    </PageLayout>
  );
}
