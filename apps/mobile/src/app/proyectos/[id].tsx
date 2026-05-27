import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProyectoForm, { type ProyectoFormData } from '../../components/ProyectoForm';
import { proyectosApi } from '../../services/api/projects.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

function getStatusColor(estado: string): string {
  switch (estado?.toUpperCase()) {
    case 'EN_EJECUCION': return colors.success;
    case 'PLANIFICACION': return colors.secondary;
    case 'FINALIZADO': return colors.primary;
    case 'SUSPENDIDO': return colors.error;
    default: return colors.onSurfaceVariant;
  }
}

export default function ProyectoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA';
  const canDelete = user?.role === 'ADMIN';

  const [isEditing, setIsEditing] = useState(false);
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    mutationFn: async (payload: ProyectoFormData) => {
      await proyectosApi.update(id!, payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setIsEditing(false);
      setGeneralError('');
      setExternalErrors({});
    },
    onError: (err: any) => {
      const apiError = err?.response?.data;
      if (apiError?.details && Array.isArray(apiError.details)) {
        const newErrors: Record<string, string> = {};
        apiError.details.forEach((detail: any) => {
          const path = Array.isArray(detail.path) ? detail.path[0] : detail.path;
          if (path) newErrors[path] = detail.message;
        });
        setExternalErrors(newErrors);
      } else {
        setGeneralError(apiError?.error || apiError?.message || 'Error al guardar los cambios.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await proyectosApi.delete(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      router.back();
    },
    onError: (err: any) => {
      setGeneralError('No se pudo eliminar el proyecto. Verifica si tiene cotizaciones asociadas.');
    }
  });

  if (isPending) return <LoadingState message="Cargando proyecto..." variant="spinner" fullPage />;

  if (isError || !proyecto) {
    return (
      <PageLayout title="Detalle" showBack>
        <EmptyState
          title="Proyecto no encontrado"
          description="El proyecto que buscas no existe o ha sido eliminado."
          actionLabel="Volver a Proyectos"
          onAction={() => router.back()}
        />
      </PageLayout>
    );
  }

  const handleSave = (data: ProyectoFormData) => {
    setExternalErrors({});
    setGeneralError('');
    updateMutation.mutate(data);
  };

  return (
    <PageLayout title={proyecto.codigo} showBack onBack={() => router.back()}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="headlineSm" weight="900" color={colors.primary}>{proyecto.nombre}</Text>
          <Text variant="labelMd" color={colors.onSurfaceVariant}>{proyecto.codigo}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${getStatusColor(proyecto.estado)}15` }]}>
          <Text variant="labelSm" weight="800" color={getStatusColor(proyecto.estado)}>
            {proyecto.estado.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {generalError && !isEditing ? (
        <View style={styles.errorBanner}>
          <Text variant="labelSm" color={colors.error} weight="700">⚠️ {generalError}</Text>
        </View>
      ) : null}

      {isEditing ? (
        <ProyectoForm 
          initialData={{
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion || '',
            estado: proyecto.estado,
            clienteId: proyecto.clienteId || '',
          }}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
          isLoading={updateMutation.isPending}
          submitLabel="Guardar Cambios"
          generalError={generalError}
          externalErrors={externalErrors}
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text variant="labelSm" weight="800" color={colors.onSurfaceVariant} style={styles.sectionTitle}>DESCRIPCIÓN</Text>
            <Card style={styles.infoCard}>
              <Text variant="bodyMd" color={colors.primary}>{proyecto.descripcion || 'Sin descripción detallada.'}</Text>
            </Card>
          </View>

          <View style={styles.section}>
            <Text variant="labelSm" weight="800" color={colors.onSurfaceVariant} style={styles.sectionTitle}>PARTES INTERESADAS</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="labelSm" color={colors.onSurfaceVariant}>CLIENTE</Text>
                <Text variant="bodyMd" weight="700" color={colors.primary}>{proyecto.cliente?.name || 'Sin cliente'}</Text>
                <Text variant="labelSm" color={colors.onSurfaceVariant}>{proyecto.cliente?.email || '-'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="labelSm" color={colors.onSurfaceVariant}>CREADO POR</Text>
                <Text variant="bodyMd" weight="700" color={colors.primary}>{proyecto.creator?.name || 'Sistema'}</Text>
                <Text variant="labelSm" color={colors.onSurfaceVariant}>{proyecto.creator?.email || '-'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.meta}>
            <Text variant="labelSm" color={colors.onSurfaceVariant}>
              Última actualización: {new Date(proyecto.updatedAt).toLocaleString()}
            </Text>
          </View>

          <View style={styles.footer}>
            {canManage && (
              <Button 
                onPress={() => setIsEditing(true)} 
                variant="secondary" 
                fullWidth
              >
                Editar Proyecto
              </Button>
            )}
            {canDelete && (
              <Button
                onPress={() => setShowDeleteConfirm(true)}
                variant="ghost"
                fullWidth
                style={styles.deleteButton}
              >
                Eliminar Proyecto
              </Button>
            )}
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="¿Eliminar Proyecto?"
        description="Esta acción es permanente. No podrás recuperar los datos ni las cotizaciones asociadas a este proyecto."
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteConfirm(false)}
        isConfirming={deleteMutation.isPending}
      />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  content: {
    gap: spacing.lg,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    letterSpacing: 1,
    paddingLeft: 4,
  },
  infoCard: {
    padding: 16,
    backgroundColor: colors.surfaceContainerLow,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
  },
  meta: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    gap: 12,
    paddingBottom: 40,
  },
  deleteButton: {
    color: colors.error,
  }
});
