import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import CotizacionCard from '../../components/CotizacionCard';
import PageLayout from '../../components/PageLayout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
import { useCotizaciones } from '../../hooks/useCotizaciones';
import { cotizacionesApi } from '../../services/api/cotizaciones.api';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ExportIcon } from '../../components/ui/Icons';

const COTIZACION_STATUSES = ['BORRADOR', 'ENVIADA', 'APROBADA', 'REEMPLAZADA'] as const;

export default function CotizacionesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage =
    user?.role === 'ADMIN' || user?.role === 'GERENTE_OBRA' || user?.role === 'DIRECTOR_OBRA';
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: cotizaciones = [], isPending, isError, refetch } = useCotizaciones(statusFilter);

  const filteredCotizaciones = search
    ? cotizaciones.filter(
        (c) =>
          c.codigo?.toLowerCase().includes(search.toLowerCase()) ||
          c.proyectoNombre?.toLowerCase().includes(search.toLowerCase()),
      )
    : cotizaciones;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await cotizacionesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      setConfirmDelete(null);
    },
  });

  const handleExportPdf = async () => {
    try {
      // Logic for exporting all quotes PDF
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilter = (estado: string) => {
    setStatusFilter(estado === statusFilter ? '' : estado);
  };

  const handleEdit = (id: string) => {
    router.push(`/cotizaciones/${id}`);
  };

  if (isPending) {
    return <LoadingState message="Cargando cotizaciones..." variant="spinner" fullPage />;
  }

  if (isError) {
    return (
      <PageLayout title="Cotizaciones">
        <EmptyState
          title="Error al cargar cotizaciones"
          description="No se pudieron cargar las cotizaciones. Intenta de nuevo."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Cotizaciones"
      headerAction={{
        icon: <ExportIcon size={22} color={colors.primary} />,
        onPress: handleExportPdf,
        label: 'Exportar PDF'
      }}
    >
      <Input
        label="Buscar Cotizaciones"
        placeholder="Ej: COT-001, Proyecto..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
      />

      <View style={styles.chipsContainer}>
        {COTIZACION_STATUSES.map((status) => (
          <Pressable
            key={status}
            onPress={() => handleFilter(status)}
            style={[
              styles.chip,
              statusFilter === status && styles.chipActive
            ]}
          >
            <Text 
              variant="labelSm" 
              weight="700"
              color={statusFilter === status ? '#ffffff' : colors.onSurfaceVariant}
            >
              {status}
            </Text>
          </Pressable>
        ))}
      </View>

      {filteredCotizaciones.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No se encontraron cotizaciones con los criterios seleccionados."
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredCotizaciones.map((cot) => (
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
        </View>
      )}

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="¿Confirmar eliminación?"
        description="Esta acción no se puede deshacer y eliminará permanentemente esta cotización del sistema."
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
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 100, // Space for tab bar
  },
});
