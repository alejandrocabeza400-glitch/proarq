import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
import { auditApi, type AuditLog } from '../../services/api/audit.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { ExportIcon } from '../../components/ui/Icons';
import { downloadBlob } from '../../utils';

function getActionColor(action: string) {
  switch (action) {
    case 'INSERT': return colors.success;
    case 'UPDATE': return colors.tertiary;
    case 'DELETE': return colors.error;
    default: return colors.primary;
  }
}

export default function AuditLogsScreen() {
  const [search, setSearch] = useState('');

  const {
    data: response,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      return await auditApi.list();
    },
  });

  const handleExportPdf = async () => {
    try {
      const blob = await auditApi.exportPdf();
      downloadBlob(blob, 'bitacora-auditoria.pdf');
    } catch (err) {
      console.error(err);
    }
  };

  const logs = response?.data || [];

  const filteredLogs = logs.filter((log) => {
    const searchLower = search.toLowerCase();
    const table = (log.tableName || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const email = (log.userEmail || '').toLowerCase();
    const name = (log.userName || '').toLowerCase();

    return (
      table.includes(searchLower) ||
      action.includes(searchLower) ||
      email.includes(searchLower) ||
      name.includes(searchLower)
    );
  });

  if (isPending) {
    return <LoadingState message="Cargando registros de auditoría..." variant="spinner" fullPage />;
  }

  if (isError) {
    return (
      <PageLayout title="Auditoría">
        <EmptyState
          title="Error al cargar logs"
          description="No se pudieron recuperar los registros de auditoría."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Auditoría de Cambios"
      headerAction={{
        icon: <ExportIcon size={22} color={colors.primary} />,
        onPress: handleExportPdf,
        label: 'Exportar PDF'
      }}
    >
      <Input
        label="Buscar en Registros"
        placeholder="Ej: INSERT, Proyectos, usuario@..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
      />

      {filteredLogs.length === 0 ? (
        <EmptyState
          title="Sin registros"
          description="No se encontraron registros que coincidan con la búsqueda."
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredLogs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={[styles.actionBadge, { backgroundColor: `${getActionColor(log.action)}15` }]}>
                  <Text variant="labelSm" weight="800" color={getActionColor(log.action)}>
                    {log.action}
                  </Text>
                </View>
                <Text variant="labelSm" color={colors.onSurfaceVariant}>
                  {new Date(log.createdAt).toLocaleString()}
                </Text>
              </View>

              <View style={styles.logBody}>
                <Text variant="bodyMd" weight="800" color={colors.primary}>
                  {log.tableName.charAt(0).toUpperCase() + log.tableName.slice(1)}
                </Text>
                <Text variant="bodySm" color={colors.onSurfaceVariant}>
                  Realizado por: <Text variant="bodySm" weight="700" color={colors.primary}>{log.userName || log.userEmail || 'Sistema'}</Text>
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

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
    paddingBottom: 120,
  },
  logCard: {
    padding: 16,
    borderRadius: 20,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  logBody: {
    gap: 4,
  },
});
