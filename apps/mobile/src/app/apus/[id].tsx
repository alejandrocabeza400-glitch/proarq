import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import PageLayout from '../../components/PageLayout';
import LoadingState from '../../components/ui/LoadingState';
import type { Apu } from '../../services/api/apus.api';
import { apusApi } from '../../services/api/apus.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function ApuDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [apu, setApu] = useState<Apu | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      apusApi
        .getById(id)
        .then((res) => setApu(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <LoadingState message="Cargando..." />;
  }

  if (!apu) {
    return <div style={{ padding: spacing.lg, fontFamily: 'Inter' }}>APU no encontrado</div>;
  }

  return (
    <PageLayout title="Detalle APU" showBack onBack={() => router.back()}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.onSurface, margin: '0 0 8px' }}>
        {apu.nombre}
      </h1>
      <p style={{ color: colors.onSurfaceVariant, fontSize: '14px', margin: '0 0 24px' }}>
        {apu.codigo} | {apu.tipo}
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        {(apu.items || []).map((item) => (
          <div
            key={item.id}
            style={{
              padding: '12px',
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: '8px',
            }}
          >
            <p style={{ fontWeight: 600, margin: 0, fontSize: '14px' }}>{item.insumoNombre}</p>
            <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
              Rend: {item.rendimiento} | Desp: {item.desperdicio}%
            </p>
          </div>
        ))}
      </div>

      <div
        data-testid="cost-summary"
        style={{
          padding: spacing.md,
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: '8px',
          marginBottom: spacing.lg,
        }}
      >
        <p style={{ fontWeight: 600, color: colors.onSurface, margin: 0 }}>Resumen de Costos</p>
      </div>

      <button
        onClick={() => setShowModal(true)}
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
          width: '100%',
        }}
      >
        Agregar Insumo
      </button>

      {showModal && (
        <div
          data-testid="insumo-search-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              padding: spacing.lg,
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px',
            }}
          >
            <p style={{ fontWeight: 600, margin: '0 0 16px' }}>Buscar Insumo</p>
            <input
              placeholder="Buscar..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${colors.outlineVariant}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'Inter',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: spacing.md,
                padding: '8px 16px',
                backgroundColor: colors.surfaceContainerHigh,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Inter',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
