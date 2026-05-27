import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import InsumoCard from '../../components/InsumoCard';
import PageLayout from '../../components/PageLayout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
import { useInsumos } from '../../hooks/useInsumos';
import { insumosApi } from '../../services/api/insumos.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ExportIcon } from '../../components/ui/Icons';

const FILTER_CHIPS = ['Código', 'Nombre', 'Unidad'];

export default function InsumosScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const canEdit =
    user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA' || user?.role === 'DIRECTOR_OBRA';
  const canDelete = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: insumos = [], isPending, isError, refetch } = useInsumos();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await insumosApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      setConfirmDelete(null);
    },
  });

  const handleExportPdf = async () => {
    try {
      // Logic for exporting all supplies PDF
    } catch (err) {
      console.error(err);
    }
  };

  if (isPending) {
    return <LoadingState message="Cargando catálogo..." variant="spinner" fullPage />;
  }

  if (isError) {
    return (
      <PageLayout title="Catálogo Maestro">
        <EmptyState
          title="Error al cargar insumos"
          description="No se pudieron cargar los insumos. Intenta de nuevo."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </PageLayout>
    );
  }

  const filteredInsumos = insumos.filter(
    (i) =>
      i.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      i.codigo?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (id: string) => {
    router.push(`/insumos/${id}`);
  };

  return (
    <PageLayout
      title="Catálogo Maestro"
      headerAction={{
        icon: <ExportIcon size={22} color={colors.primary} />,
        onPress: handleExportPdf,
        label: 'Exportar PDF'
      }}
    >
      <Input
        label="Buscar Insumos"
        placeholder="Ej: Cemento, CEM-001..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
      />

      <View style={styles.chipsContainer}>
        {FILTER_CHIPS.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text variant="labelSm" color={colors.onSurfaceVariant} weight="700">
              {chip}
            </Text>
          </View>
        ))}
      </View>

      {filteredInsumos.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No se encontraron insumos que coincidan con la búsqueda."
        />
      ) : (
        <View style={styles.listContainer}>
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
        </View>
      )}

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="¿Confirmar eliminación?"
        description="Esta acción no se puede deshacer y eliminará permanentemente este insumo del catálogo."
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        isConfirming={deleteMutation.isPending}
      />

      <View data-testid="refresh-control" onClick={() => refetch()} style={{ display: 'none' }} />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    marginBottom: spacing.lg,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 100,
  },
});
