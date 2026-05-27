import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import InsumoForm, { type InsumoFormData } from '../../components/InsumoForm';
import type { Insumo } from '../../services/api/insumos.api';
import { insumosApi } from '../../services/api/insumos.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function InsumoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [isEditing, setIsEditing] = useState(false);
  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: insumo,
    isPending,
    isError,
    refetch,
  } = useQuery<Insumo>({
    queryKey: ['insumo', id],
    queryFn: async () => {
      const res = await insumosApi.getById(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsumoFormData) => {
      await insumosApi.update(id!, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumo', id] });
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
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
        setGeneralError('Por favor verifica los campos resaltados.');
      } else {
        setGeneralError(apiError?.error || apiError?.message || 'Error al actualizar el insumo.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await insumosApi.delete(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      router.back();
    },
    onError: (err: any) => {
      setGeneralError('No se pudo eliminar el insumo. Verifica si está siendo usado en algún APU.');
      setShowDeleteConfirm(false);
    },
  });

  if (isPending) return <LoadingState message="Cargando insumo..." variant="spinner" fullPage />;

  if (isError || !insumo) {
    return (
      <PageLayout title="Detalle" showBack>
        <EmptyState
          title="Insumo no encontrado"
          description="El insumo que buscas no existe o ha sido eliminado del catálogo maestro."
          actionLabel="Volver al Catálogo"
          onAction={() => router.back()}
        />
      </PageLayout>
    );
  }

  const handleSave = (data: InsumoFormData) => {
    setExternalErrors({});
    setGeneralError('');
    updateMutation.mutate(data);
  };

  return (
    <PageLayout title={insumo.codigo} showBack onBack={() => router.back()}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="headlineSm" weight="900" color={colors.primary}>{insumo.nombre}</Text>
          <Text variant="labelMd" color={colors.onSurfaceVariant}>{insumo.codigo}</Text>
        </View>
        <View style={styles.unitBadge}>
          <Text variant="labelSm" weight="800" color={colors.secondary}>{insumo.unidad}</Text>
        </View>
      </View>

      {generalError && !isEditing ? (
        <View style={styles.errorBanner}>
          <Text variant="labelSm" color={colors.error} weight="700">⚠️ {generalError}</Text>
        </View>
      ) : null}

      {isEditing ? (
        <InsumoForm 
          initialData={{
            codigo: insumo.codigo,
            nombre: insumo.nombre,
            unidad: insumo.unidad,
            costBase: insumo.costBase,
          }}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
          isLoading={updateMutation.isPending}
          isEdition
          submitLabel="Guardar Cambios"
          generalError={generalError}
          externalErrors={externalErrors}
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text variant="labelSm" weight="800" color={colors.onSurfaceVariant} style={styles.sectionTitle}>VALOR UNITARIO BASE</Text>
            <Card style={styles.priceCard}>
              <Text variant="displaySm" weight="900" color={colors.success}>
                ${Number.parseFloat(insumo.costBase).toLocaleString('es-CO')}
                <Text variant="titleSm" color={colors.onSurfaceVariant}> / {insumo.unidad}</Text>
              </Text>
            </Card>
          </View>

          <View style={styles.section}>
            <Text variant="labelSm" weight="800" color={colors.onSurfaceVariant} style={styles.sectionTitle}>INFORMACIÓN DE CATÁLOGO</Text>
            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text variant="bodyMd" color={colors.onSurfaceVariant}>Unidad de medida:</Text>
                <Text variant="bodyMd" weight="700" color={colors.primary}>{insumo.unidad}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMd" color={colors.onSurfaceVariant}>Fecha de registro:</Text>
                <Text variant="bodyMd" weight="700" color={colors.primary}>{new Date(insumo.createdAt).toLocaleDateString()}</Text>
              </View>
            </Card>
          </View>

          <View style={styles.footer}>
            {isAdmin && (
              <>
                <Button onPress={() => setIsEditing(true)} variant="secondary" fullWidth>
                  Editar Insumo
                </Button>
                <Button
                  onPress={() => setShowDeleteConfirm(true)}
                  variant="ghost"
                  fullWidth
                  style={styles.deleteButton}
                >
                  Eliminar del Catálogo
                </Button>
              </>
            )}
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="¿Eliminar Insumo?"
        description="Esta acción eliminará el insumo de forma permanente. No se podrá recuperar si está siendo usado en análisis de precios (APUs)."
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
    marginBottom: spacing.xl,
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  unitBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  errorBanner: {
    padding: 14,
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
    gap: 10,
  },
  sectionTitle: {
    letterSpacing: 1,
    paddingLeft: 4,
  },
  priceCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  infoCard: {
    padding: 16,
    backgroundColor: colors.surfaceContainerLow,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
