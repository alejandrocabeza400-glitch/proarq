import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import { proyectosApi } from '../../services/api/projects.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

function getStatusColor(estado: string): string {
  switch (estado?.toUpperCase()) {
    case 'ACTIVO':
      return '#2e7d32';
    case 'PLANEADO':
      return colors.primaryContainer;
    case 'FINALIZADO':
      return '#555555';
    case 'CANCELADO':
      return colors.error;
    default:
      return colors.onSurfaceVariant;
  }
}

export default function ProyectoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA';
  const canDelete = user?.role === 'ADMIN';

  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  const {
    data: proyecto,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => {
      const res = await proyectosApi.getById(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { nombre?: string; descripcion?: string }) => {
      await proyectosApi.update(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await proyectosApi.delete(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.back();
    },
  });

  if (isPending) {
    return <LoadingState message="Cargando..." />;
  }

  if (isError || !proyecto) {
    return (
      <EmptyState
        title="Error al cargar proyecto"
        description="No se pudo cargar el proyecto. Intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  const handleEdit = () => {
    setEditNombre(proyecto.nombre);
    setEditDescripcion(proyecto.descripcion || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      nombre: editNombre,
      descripcion: editDescripcion,
    });
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <PageLayout title="Detalle Proyecto" showBack onBack={() => router.back()}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.md,
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.onSurface, margin: 0 }}>
            {proyecto.nombre}
          </h1>
          <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
            {proyecto.codigo}
          </p>
        </div>
        {proyecto.estado && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: getStatusColor(proyecto.estado),
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            {proyecto.estado}
          </span>
        )}
      </div>

      {isEditing ? (
        <div style={{ marginTop: spacing.md }}>
          <Input
            label="Nombre"
            value={editNombre}
            onChangeText={setEditNombre}
            style={{ marginBottom: spacing.sm }}
          />
          <Input
            label="Descripción"
            value={editDescripcion}
            onChangeText={setEditDescripcion}
            style={{ marginBottom: spacing.md }}
          />
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button onPress={handleSave} loading={updateMutation.isPending}>
              Guardar
            </Button>
            <Button variant="ghost" onPress={() => setIsEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: '8px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: colors.onSurfaceVariant,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Descripción
            </p>
            <p style={{ fontSize: '14px', color: colors.onSurface, margin: '4px 0 0' }}>
              {proyecto.descripcion || 'Sin descripción'}
            </p>
          </div>

          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: '8px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: colors.onSurfaceVariant,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Cliente
            </p>
            <p style={{ fontSize: '14px', color: colors.onSurface, margin: '4px 0 0' }}>
              {proyecto.clienteNombre || 'Sin asignar'}
            </p>
          </div>

          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: '8px',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: colors.onSurfaceVariant,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Fechas
            </p>
            <p style={{ fontSize: '14px', color: colors.onSurface, margin: '4px 0 0' }}>
              Creado: {new Date(proyecto.createdAt).toLocaleDateString()}
            </p>
            <p style={{ fontSize: '14px', color: colors.onSurface, margin: '2px 0 0' }}>
              Actualizado: {new Date(proyecto.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {canEdit && (
            <Button onPress={handleEdit} variant="secondary" fullWidth>
              Editar
            </Button>
          )}

          {canDelete && (
            <Button
              onPress={handleDelete}
              loading={deleteMutation.isPending}
              variant="ghost"
              fullWidth
              style={{ color: colors.error }}
            >
              Eliminar
            </Button>
          )}
        </div>
      )}
    </PageLayout>
  );
}
