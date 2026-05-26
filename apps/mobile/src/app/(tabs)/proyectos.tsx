import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import ProyectoCard from '../../components/ProyectoCard';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import { useProjects } from '../../hooks/useProjects';
import { proyectosApi } from '../../services/api/projects.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const FILTER_CHIPS = ['Código', 'Nombre', 'Estado'];

export default function ProyectosScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA';
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: proyectos = [], isPending, isError, refetch } = useProjects(search);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await proyectosApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setConfirmDelete(null);
    },
  });

  if (isPending) {
    return <LoadingState message="Cargando..." />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Error al cargar proyectos"
        description="No se pudieron cargar los proyectos. Intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  const filteredProyectos = search
    ? proyectos.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
          p.codigo?.toLowerCase().includes(search.toLowerCase()),
      )
    : proyectos;

  const handleEdit = (id: string) => {
    router.push(`/proyectos/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <PageLayout
      title="Proyectos"
      fabAction={canManage ? () => router.push('/proyectos/create') : undefined}
      fabLabel="Nuevo Proyecto"
      fabVisible={canManage}
    >
      <Input
        label="Buscar Proyectos"
        placeholder="Ej: Edificio Los Alerces, PROJ-001..."
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

      {filteredProyectos.length === 0 ? (
        <p
          style={{
            color: colors.onSurfaceVariant,
            fontSize: '14px',
            textAlign: 'center',
            padding: spacing.lg,
          }}
        >
          No hay proyectos
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {filteredProyectos.map((proyecto) => (
            <ProyectoCard
              key={proyecto.id}
              proyecto={proyecto}
              onClick={() => router.push(`/proyectos/${proyecto.id}`)}
              onEdit={canManage ? () => handleEdit(proyecto.id) : undefined}
              onDelete={canManage ? () => setConfirmDelete(proyecto.id) : undefined}
              isDeleting={deleteMutation.isPending && confirmDelete === proyecto.id}
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
