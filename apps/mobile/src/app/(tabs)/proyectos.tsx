import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import ProyectoCard from '../../components/ProyectoCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import { useProjects } from '../../hooks/useProjects';
import { proyectosApi } from '../../services/api/projects.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ExportIcon } from '../../components/ui/Icons';
import { downloadBlob } from '../../utils';

export default function ProyectosScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA';
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: proyectos = [], isPending, isError, refetch } = useProjects();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await proyectosApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setConfirmDelete(null);
    },
  });

  const handleExportPdf = async () => {
    try {
      const blob = await proyectosApi.exportPdf();
      downloadBlob(blob, 'proyectos-proarq.pdf');
    } catch (err) {
      console.error(err);
    }
  };

  if (isPending) {
    return <LoadingState message="Cargando proyectos..." variant="spinner" fullPage />;
  }

  if (isError) {
    return (
      <PageLayout title="Proyectos">
        <EmptyState
          title="Vaya, algo salió mal"
          description="No pudimos cargar los proyectos en este momento."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </PageLayout>
    );
  }

  const filteredProyectos = proyectos.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      p.estado?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (id: string) => {
    router.push(`/proyectos/${id}`);
  };

  return (
    <PageLayout
      title="Proyectos"
      headerAction={{
        icon: <ExportIcon size={22} color={colors.primary} />,
        onPress: handleExportPdf,
        label: 'Exportar PDF'
      }}
    >
      <Input
        label="Buscar Proyectos"
        placeholder="Ej: Edificio Los Alerces, PROJ-001..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
      />

      {filteredProyectos.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No se encontraron proyectos que coincidan con la búsqueda."
        />
      ) : (
        <View style={styles.listContainer}>
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
        </View>
      )}

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="¿Confirmar eliminación?"
        description="Esta acción no se puede deshacer y eliminará permanentemente este proyecto del sistema."
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
    paddingBottom: 100,
  },
});
