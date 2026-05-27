import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
import {
  CotizacionesIcon,
  ProyectosIcon,
  InsumosIcon,
  UsersIcon,
  ApusIcon,
} from '../../components/ui/Icons';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuthStore } from '../../stores/auth.store';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>{icon}</View>
        <Text variant="labelSm" color={colors.onSurfaceVariant} style={styles.statLabel}>
          {label}
        </Text>
      </View>
      <View style={styles.statBottom}>
        <Text variant="headlineSm" weight="900" color={colors.primary} style={styles.statValue}>
          {value}
        </Text>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const {
    data: dashboardData,
    isPending: dashboardPending,
    refetch: dashboardRefetch,
  } = useDashboard();
  const {
    data: analytics,
    isPending: analyticsPending,
    refetch: analyticsRefetch,
  } = useAnalytics();

  const isPending = dashboardPending || analyticsPending;
  const refetch = () => {
    dashboardRefetch();
    analyticsRefetch();
  };

  if (isPending) {
    return <LoadingState message="Generando analíticas..." variant="spinner" fullPage />;
  }

  const projectsCount = analytics?.proyectosActivos ?? dashboardData?.projects?.length ?? 0;
  const quotesCount = analytics?.totalCotizaciones ?? dashboardData?.quotes?.length ?? 0;

  return (
    <PageLayout title="Resumen del Sistema" scrollable={false}>
      <View style={styles.container}>
        {/* Header / Greeting */}
        <View style={styles.headerSection}>
          <Text
            variant="headlineSm"
            weight="900"
            color={colors.primary}
            style={styles.greetingText}
          >
            ¡Hola, {user?.name?.split(' ')[0] || 'Usuario'}! 👋
          </Text>
          <Text variant="bodyMd" color={colors.onSurfaceVariant} style={styles.subText}>
            Estado administrativo de ProArq.
          </Text>
        </View>

        {/* Main Stats Grid */}
        <View style={styles.analyticsGrid}>
          <View style={styles.gridRow}>
            <StatCard
              label="Proyectos Activos"
              value={projectsCount}
              icon={<ProyectosIcon size={18} color={colors.primary} />}
              color={colors.primary}
            />
            <StatCard
              label="Cotizaciones"
              value={quotesCount}
              icon={<CotizacionesIcon size={18} color={colors.tertiary} />}
              color={colors.tertiary}
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="Catálogo Insumos"
              value={analytics?.totalInsumos ?? '-'}
              icon={<InsumosIcon size={18} color={colors.success} />}
              color={colors.success}
            />
            <StatCard
              label="Análisis APU"
              value={analytics?.totalApus ?? dashboardData?.apus?.length ?? '-'}
              icon={<ApusIcon size={18} color={colors.secondary} />}
              color={colors.secondary}
            />
          </View>

          <View style={styles.fullWidthStat}>
            <StatCard
              label="Monto Total Contratado (APU)"
              value={
                analytics?.montoTotalAPU
                  ? `$${Number.parseFloat(analytics.montoTotalAPU).toLocaleString('es-CO')}`
                  : '$0'
              }
              icon={<Text variant="titleSm">💰</Text>}
              color={colors.success}
            />
          </View>

          {isAdmin && (
            <View style={styles.fullWidthStat}>
              <StatCard
                label="Usuarios en el Sistema"
                value={analytics?.usuariosActivos ?? '-'}
                icon={<UsersIcon size={18} color={colors.primary} />}
                color={colors.primary}
              />
            </View>
          )}
        </View>

        {/* Extra Visual Indicator / Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBadge}>
            <Text variant="labelSm" color={colors.onSurfaceVariant} weight="800">
              ACTUALIZADO: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>

      <View data-testid="refresh-control" onClick={() => refetch()} style={{ display: 'none' }} />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
  },
  headerSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: 4,
  },
  greetingText: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 12,
  },
  subText: {
    opacity: 0.7,
    fontSize: 14,
  },
  analyticsGrid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fullWidthStat: {
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 110,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTop: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  statBottom: {
    marginTop: 2,
  },
  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 9,
    fontWeight: '800',
    opacity: 0.6,
    marginTop: 8.5,
  },
  statValue: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  summaryContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  summaryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 8,
  },
});
