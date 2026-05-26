import { useRouter } from 'expo-router';
import PageLayout from '../../components/PageLayout';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuthStore } from '../../stores/auth.store';
import { slideUp } from '../../styles/animations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '120px',
        padding: spacing.md,
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: '8px',
        ...slideUp,
      }}
    >
      <p
        style={{
          fontSize: '12px',
          color: colors.onSurfaceVariant,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: colors.onSurface,
          margin: '4px 0 0',
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const {
    data: dashboardData,
    isPending: dashboardPending,
    isError: dashboardError,
    refetch: dashboardRefetch,
  } = useDashboard();
  const {
    data: analytics,
    isPending: analyticsPending,
    isError: analyticsError,
    refetch: analyticsRefetch,
  } = useAnalytics();

  const isPending = dashboardPending || analyticsPending;
  const isError = dashboardError || analyticsError;
  const refetch = () => {
    dashboardRefetch();
    analyticsRefetch();
  };

  if (isPending) {
    return <LoadingState message="Cargando..." />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Error al cargar el dashboard"
        description="No se pudieron cargar los datos. Intenta de nuevo."
        actionLabel="Reintentar"
        onAction={() => refetch()}
      />
    );
  }

  const projects = dashboardData?.projects || [];
  const quotes = dashboardData?.quotes || [];
  const activeQuotes = quotes.filter((q: any) => q.estado !== 'REEMPLAZADA');

  return (
    <PageLayout
      title="ProArq"
      fabAction={() => router.push('/cotizaciones/create')}
      fabLabel="Nueva Cotización"
      fabVisible
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: spacing.md,
        }}
      >
        <div
          data-testid="profile-avatar"
          onClick={() => router.push('/profile')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: colors.primaryContainer,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {user?.name?.[0] || 'U'}
        </div>
      </div>

      {/* Stats cards row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        <StatCard
          label="Total Cotizaciones"
          value={analytics?.totalCotizaciones ?? activeQuotes.length}
        />
        <StatCard
          label="Proyectos Activos"
          value={analytics?.proyectosActivos ?? projects.length}
        />
        <StatCard label="Total Insumos" value={analytics?.totalInsumos ?? '-'} />
        <StatCard
          label="Monto Total APU"
          value={
            analytics?.montoTotalAPU
              ? `$${Number.parseFloat(analytics.montoTotalAPU).toLocaleString('es-CO')}`
              : '-'
          }
        />
        {isAdmin && <StatCard label="Usuarios Activos" value={analytics?.usuariosActivos ?? '-'} />}
      </div>

      <h2
        style={{ fontSize: '16px', fontWeight: 600, color: colors.onSurface, margin: '0 0 12px' }}
      >
        Proyectos Recientes
      </h2>

      {projects.length === 0 ? (
        <p
          style={{
            color: colors.onSurfaceVariant,
            fontSize: '14px',
            textAlign: 'center',
            padding: spacing.lg,
          }}
        >
          No hay proyectos
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {projects.map((p: any) => (
            <div
              key={p.id}
              style={{
                padding: '12px',
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: '8px',
                cursor: 'pointer',
                ...slideUp,
              }}
              onClick={() => router.push(`/projects/${p.id}`)}
            >
              <p style={{ fontWeight: 600, color: colors.onSurface, margin: 0 }}>{p.nombre}</p>
              <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
                {p.codigo}
              </p>
            </div>
          ))}
        </div>
      )}

      {quotes.length > 0 && (
        <>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: colors.onSurface,
              margin: `${spacing.lg}px 0 12px`,
            }}
          >
            Cotizaciones Recientes
          </h2>
          {quotes.map((q: any) => (
            <div
              key={q.id}
              style={{
                padding: '12px',
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: '8px',
                marginBottom: spacing.sm,
              }}
            >
              <p style={{ fontWeight: 600, color: colors.onSurface, margin: 0 }}>{q.codigo}</p>
            </div>
          ))}
        </>
      )}

      <div data-testid="refresh-control" onClick={() => refetch()} style={{ display: 'none' }} />
    </PageLayout>
  );
}
