import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { apusApi } from '../../services/api/apus.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const TIPOS_APU = ['GLOBAL', 'UNITARIO', 'LUMP_SUM'];

export default function ApuDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA' || user?.role === 'DIRECTOR_OBRA';

  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('UNITARIO');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: apu,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['apu', id],
    queryFn: async () => {
      const res = await apusApi.getById(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apusApi.update(id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apu', id] });
      queryClient.invalidateQueries({ queryKey: ['apus'] });
      setIsEditing(false);
      setGeneralError('');
    },
    onError: (err: any) => {
      const apiError = err?.response?.data;
      if (apiError?.details && Array.isArray(apiError.details)) {
        const newErrors: Record<string, string> = {};
        apiError.details.forEach((detail: any) => {
          if (detail.path) newErrors[detail.path] = detail.message;
        });
        setErrors(newErrors);
      } else {
        setGeneralError(apiError?.error || apiError?.message || 'Error al actualizar el análisis.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apusApi.delete(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apus'] });
      router.back();
    },
    onError: (err: any) => {
      setGeneralError('No se pudo eliminar el APU. Verifica si tiene ítems o cotizaciones vinculadas.');
      setShowDeleteConfirm(false);
    }
  });

  const handleSave = () => {
    if (!editNombre.trim()) {
      setErrors({ nombre: 'El nombre es obligatorio.' });
      return;
    }
    updateMutation.mutate({ nombre: editNombre, tipo: editTipo });
  };

  if (isPending) return <LoadingState message="Cargando análisis..." variant="spinner" fullPage />;

  if (isError || !apu) {
    return (
      <PageLayout title="Detalle APU" showBack>
        <EmptyState
          title="Análisis no encontrado"
          description="Este análisis APU puede haber sido eliminado o no tienes acceso."
          actionLabel="Volver a la Lista"
          onAction={() => router.back()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout title={apu.codigo} showBack onBack={() => router.back()}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="headlineSm" weight="900" color={colors.primary}>{apu.nombre}</Text>
          <Text variant="labelMd" color={colors.onSurfaceVariant}>{apu.codigo}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text variant="labelSm" weight="800" color={colors.secondary}>{apu.tipo}</Text>
        </View>
      </View>

      {generalError ? (
        <View style={styles.errorBanner}>
          <Text variant="labelSm" color={colors.error} weight="700">⚠️ {generalError}</Text>
        </View>
      ) : null}

      {isEditing ? (
        <View style={styles.form}>
          <Input
            label="Nombre del Análisis"
            value={editNombre}
            onChangeText={setEditNombre}
            error={errors.nombre}
          />
          <View style={styles.selectGroup}>
            <Text variant="labelMd" weight="700" color={colors.onSurface} style={styles.label}>
              Tipo de Análisis
            </Text>
            <View style={styles.pickerContainer}>
              <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)} style={styles.nativeSelect}>
                {TIPOS_APU.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </View>
          </View>
          <View style={styles.actions}>
            <Button onPress={handleSave} loading={updateMutation.isPending} style={{ flex: 1 }}>
              Guardar Cambios
            </Button>
            <Button variant="ghost" onPress={() => setIsEditing(false)} disabled={updateMutation.isPending}>
              Cancelar
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text variant="labelSm" weight="800" color={colors.onSurfaceVariant} style={styles.sectionTitle}>ÍTEMS VINCULADOS</Text>
            <Card style={styles.infoCard}>
              <Text variant="bodyMd" weight="700" color={colors.primary}>
                {apu.itemsCount || 0} Insumos asociados
              </Text>
            </Card>
          </View>

          <View style={styles.footer}>
            {canManage && (
              <>
                <Button onPress={() => {
                  setEditNombre(apu.nombre);
                  setEditTipo(apu.tipo);
                  setIsEditing(true);
                }} variant="secondary" fullWidth>
                  Editar Información Básica
                </Button>
                <Button
                  onPress={() => setShowDeleteConfirm(true)}
                  variant="ghost"
                  fullWidth
                  style={styles.deleteButton}
                >
                  Eliminar Análisis
                </Button>
              </>
            )}
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="¿Eliminar Análisis?"
        description="Esta acción eliminará el análisis APU de forma permanente."
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
  typeBadge: {
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
  form: {
    gap: spacing.md,
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
  nativeSelect: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors.primary,
    outline: 'none',
  } as any,
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.md,
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
  infoCard: {
    padding: 16,
    backgroundColor: colors.surfaceContainerLow,
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
