import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import PageLayout from '../../../components/PageLayout';
import LoadingState from '../../../components/ui/LoadingState';
import type { Cotizacion } from '../../../services/api/cotizaciones.api';
import { cotizacionesApi } from '../../../services/api/cotizaciones.api';
import { useAuthStore } from '../../../stores/auth.store';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

const INTERNAL_ROLES = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA'];

const formatCurrency = (val: string): string => {
  const num = Number.parseFloat(val);
  return num.toLocaleString('es-CO');
};

export default function CotizacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);

  const isInternal = user ? INTERNAL_ROLES.includes(user.role) : false;

  useEffect(() => {
    if (id) {
      setLoading(true);
      cotizacionesApi
        .getById(id)
        .then((res) => setCotizacion(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleBranch = async () => {
    try {
      const res = await cotizacionesApi.branch(id);
      router.push(`/cotizaciones/${res.data.id}`);
    } catch {
      // ignore
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await cotizacionesApi.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${cotizacion?.codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (_err) {}
  };

  if (loading) {
    return <LoadingState message="Cargando..." />;
  }

  if (!cotizacion) {
    return <div style={{ padding: spacing.lg, fontFamily: 'Inter' }}>Cotización no encontrada</div>;
  }

  return (
    <PageLayout title="Cotización" showBack onBack={() => router.back()}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.onSurface, margin: '0 0 4px' }}>
        {cotizacion.codigo}
      </h1>
      <p style={{ color: colors.onSurfaceVariant, fontSize: '14px', margin: '0 0 4px' }}>
        {cotizacion.proyectoNombre}
      </p>
      <p style={{ color: colors.onSurfaceVariant, fontSize: '14px', margin: '0 0 24px' }}>
        Versión: V{cotizacion.version}
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        {(cotizacion.items || []).map((item) => (
          <div
            key={item.id}
            style={{
              padding: '12px',
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: '8px',
            }}
          >
            <p style={{ fontWeight: 600, margin: 0, fontSize: '14px' }}>
              {item.apuCodigo} - {item.apuNombre}
            </p>
            <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
              Cant: {item.cantidad} | Costo: ${formatCurrency(item.calculatedCostDirect)}
            </p>
          </div>
        ))}
      </div>

      <div
        data-testid="financial-summary"
        style={{
          padding: spacing.md,
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: '8px',
          marginBottom: spacing.lg,
        }}
      >
        <p style={{ fontWeight: 600, color: colors.onSurface, margin: '0 0 8px' }}>
          Resumen Financiero
        </p>
        <p style={{ fontSize: '14px', color: colors.onSurface, margin: '4px 0' }}>
          Costo Directo: ${formatCurrency(cotizacion.totalCostDirect)}
        </p>
        <p style={{ fontSize: '14px', color: colors.onSurface, margin: '4px 0' }}>
          Factor A: {cotizacion.factorAPercentage}%
        </p>
        <p style={{ fontSize: '14px', color: colors.onSurface, margin: '4px 0' }}>
          Factor B: {cotizacion.factorBPercentage}%
        </p>
        <p style={{ fontSize: '14px', color: colors.onSurface, margin: '4px 0' }}>
          Margen U: {cotizacion.profitMarginPercent}%
        </p>
        <p
          style={{ fontSize: '16px', fontWeight: 700, color: colors.onSurface, margin: '8px 0 0' }}
        >
          Total: ${formatCurrency(cotizacion.totalAmount)}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <button
          onClick={handleDownloadPdf}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primaryContainer,
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'Inter',
            cursor: 'pointer',
          }}
        >
          Descargar PDF
        </button>

        {isInternal && (
          <button
            onClick={handleBranch}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.tertiaryContainer,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Inter',
              cursor: 'pointer',
            }}
          >
            Crear Versión
          </button>
        )}
      </div>
    </PageLayout>
  );
}
