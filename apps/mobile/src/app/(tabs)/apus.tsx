import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ApuCard from '../../components/ApuCard';
import PageLayout from '../../components/PageLayout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import { useApus } from '../../hooks/useApus';
import { apusApi } from '../../services/api/apus.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ExportIcon } from '../../components/ui/Icons';

export default function ApusScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA' || user?.role === 'DIRECTOR_OBRA';
  const [search, setSearch] = useState('');
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

  const handleExportPdf = async () => {
    try {
      // Logic for exporting all APUs PDF
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/apus/${id}`);
  };

  if (isPending) {
    return <LoadingState message="Cargando APUs..." variant="spinner" fullPage />;
  }

  if (isError) {
    return (
      <PageLayout title="Análisis de Precios Unitarios">
        <EmptyState
          title="Error al cargar APUs"
          description="No se pudieron cargar los APUs. Intenta de nuevo."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </PageLayout>
    );
  }

  const filteredApus = apus.filter(
    (a) =>
      a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      a.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      a.tipo?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageLayout
      title="Análisis APU"
      headerAction={{
        icon: <ExportIcon size={22} color={colors.primary} />,
        onPress: handleExportPdf,
        label: 'Exportar PDF'
      }}
    >
      <Input
        label="Buscar Análisis"
        placeholder="Ej: Muro, PINT-001..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
      />

      {filteredApus.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No se encontraron análisis que coincidan con la búsqueda."
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredApus.map((apu) => (
            <ApuCard
              key={apu.id}
              apu={apu}
              onClick={() => router.push(`/apus/${apu.id}`)}
              onEdit={canManage ? () => handleEdit(apu.id) : undefined}
              onDelete={canManage ? () => setConfirmDelete(apu.id) : undefined}
              isDeleting={deleteMutation.isPending && confirmDelete === apu.id}
            />
          ))}
        </View>
      )}

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="¿Confirmar eliminación?"
        description="Esta acción no se puede deshacer y eliminará permanentemente este APU del sistema."
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
  listContainer: {
    gap: 12,
    paddingBottom: 100, // Space for tab bar
  },
});
