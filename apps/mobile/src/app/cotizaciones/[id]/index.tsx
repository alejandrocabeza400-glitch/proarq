import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../../components/PageLayout';
import LoadingState from '../../../components/ui/LoadingState';
import EmptyState from '../../../components/ui/EmptyState';
import Text from '../../../components/ui/Text';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import type { Cotizacion } from '../../../services/api/cotizaciones.api';
import { cotizacionesApi } from '../../../services/api/cotizaciones.api';
import { useAuthStore } from '../../../stores/auth.store';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { downloadBlob } from '../../../utils';
import { ExportIcon } from '../../../components/ui/Icons';

const INTERNAL_ROLES = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'];

const formatCurrency = (val: string): string => {
  const num = Number.parseFloat(val);
  return num.toLocaleString('es-CO');
};

export default function CotizacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cotizacion, setCotizacion] = useState<Cotizacion | any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isInternal = user ? INTERNAL_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(false);
      cotizacionesApi
        .getById(id)
        .then((res) => setCotizacion(res.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleBranch = async () => {
    try {
      const res = await cotizacionesApi.branch(id!);
      router.push(`/cotizaciones/${res.data.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'No se pudo crear una nueva versión.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await cotizacionesApi.downloadPdf(id!);
      await downloadBlob(blob, `cotizacion-${cotizacion?.codigo}.pdf`);
    } catch (err) {
      alert('Error al generar el PDF.');
    }
  };

  if (loading) return <LoadingState message="Cargando cotización..." variant="spinner" fullPage />;

  if (error || !cotizacion) {
    return (
      <PageLayout title="Detalle" showBack>
        <EmptyState
          title="Cotización no encontrada"
          description="La cotización solicitada no existe o no tienes permisos para verla."
          actionLabel="Volver a la Lista"
          onAction={() => router.back()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={cotizacion.codigo} 
      showBack 
      onBack={() => router.back()}
      headerAction={{
        icon: <ExportIcon size={22} color={colors.primary} />,
        onPress: handleDownloadPdf,
        label: 'Descargar PDF'
      }}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text variant="headlineSm" weight="900" color={colors.primary}>{cotizacion.codigo}</Text>
          <Text variant="bodyMd" color={colors.onSurfaceVariant}>{cotizacion.proyectoNombre}</Text>
        </View>
        <View style={styles.versionBadge}>
          <Text variant="labelSm" weight="800" color={colors.secondary}>VERSION V{cotizacion.version}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text variant="labelSm" weight="800" color={colors.onSurfaceVariant} style={styles.sectionTitle}>ÍTÉMS DE LA OBRA</Text>
        <View style={styles.itemsList}>
          {(cotizacion.items || []).map((item: any) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyMd" weight="800" color={colors.primary}>{item.apuCodigo}</Text>
                  <Text variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={1}>{item.apuNombre}</Text>
                </View>
                <View style={styles.itemValues}>
                  <Text variant="bodyMd" weight="900" color={colors.primary}>${formatCurrency(item.calculatedCostDirect)}</Text>
                  <Text variant="labelSm" color={colors.onSurfaceVariant}>Cant: {item.cantidad}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Text variant="labelSm" weight="800" color={colors.onSurfaceVariant} style={styles.sectionTitle}>RESUMEN FINANCIERO</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text variant="bodySm" color={colors.onSurfaceVariant}>Costo Directo Total</Text>
            <Text variant="bodyMd" weight="700" color={colors.primary}>${formatCurrency(cotizacion.totalCostDirect)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="bodySm" color={colors.onSurfaceVariant}>Cargos Indirectos (A+B)</Text>
            <Text variant="bodyMd" weight="700" color={colors.primary}>{Number(cotizacion.factorAPercentage) + Number(cotizacion.factorBPercentage)}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodySm" color={colors.onSurfaceVariant}>Margen de Utilidad</Text>
            <Text variant="bodyMd" weight="700" color={colors.primary}>{cotizacion.profitMarginPercent}%</Text>
          </View>
          <View style={styles.totalRow}>
            <Text variant="titleSm" weight="800" color={colors.primary}>VALOR TOTAL</Text>
            <Text variant="titleMd" weight="900" color={colors.success}>${formatCurrency(cotizacion.totalAmount)}</Text>
          </View>
        </Card>

        <View style={styles.footer}>
          {isInternal && (
            <Button onPress={handleBranch} variant="secondary" fullWidth>
              Crear Nueva Versión (Branch)
            </Button>
          )}
          <Button onPress={handleDownloadPdf} variant="primary" fullWidth>
            Generar Reporte PDF
          </Button>
        </View>
      </View>
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
  titleGroup: {
    flex: 1,
    gap: 4,
  },
  versionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  content: {
    gap: 16,
  },
  sectionTitle: {
    letterSpacing: 1,
    paddingLeft: 4,
    marginTop: 8,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    padding: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  summaryCard: {
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.5,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.outlineVariant,
  },
  footer: {
    marginTop: spacing.xl,
    gap: 12,
    paddingBottom: 40,
  }
});
