import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';
import { createQueryWrapper } from '../test-wrapper';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useSegments: () => ['(tabs)', 'dashboard'],
}));

describe('Dashboard Screen', () => {
  beforeEach(() => {
    resetMocks();
    vi.restoreAllMocks();
  });

  const renderDashboard = async () => {
    const DashboardScreen = (await import('../../app/(tabs)/dashboard')).default;
    const { wrapper } = createQueryWrapper();
    return render(<DashboardScreen />, { wrapper });
  };

  const mockAnalytics = async () => {
    const { analyticsApi } = await import('../../services/api/analytics.api');
    vi.spyOn(analyticsApi, 'getStats').mockResolvedValue({
      totalCotizaciones: 5,
      proyectosActivos: 3,
      totalInsumos: 120,
      montoTotalAPU: '50000000',
      usuariosActivos: 8,
    });
  };

  it('should render the dashboard header with app name', async () => {
    // Set up API mocks before render
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();
    await waitFor(() => {
      const header = screen.getByText(/proarq|panel|dashboard/i);
      expect(header).toBeDefined();
    });
  });

  it('should render project stats cards', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();
    await waitFor(() => {
      const statsElements = screen.getAllByText(/proyectos|cotizaciones|insumos|monto|usuario/i);
      expect(statsElements.length).toBeGreaterThan(0);
    });
  });

  it('should show loading state while fetching projects', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();
    const loadingIndicator = screen.getByTestId('loading-indicator');
    expect(loadingIndicator).toBeDefined();
  });

  it('should render a list of projects from API', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    const mockProjects = [
      { id: 'p1', codigo: 'PRJ-001', nombre: 'Edificio Torre Norte', estado: 'EN_EJECUCION' },
      { id: 'p2', codigo: 'PRJ-002', nombre: 'Puente Vehicular Sur', estado: 'PLANIFICACION' },
    ];
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: mockProjects });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Edificio Torre Norte')).toBeDefined();
      expect(screen.getByText('Puente Vehicular Sur')).toBeDefined();
    });
  });

  it('should show empty state when no projects exist', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();

    await waitFor(() => {
      const emptyState = screen.getByText(/no hay proyectos|sin proyectos/i);
      expect(emptyState).toBeDefined();
    });
  });

  it('should navigate to create cotizacion on FAB press', async () => {
    const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();
    await waitFor(() => {
      const fabButton = screen.getByRole('button', { name: /nueva cotización|crear cotización/i });
      fireEvent.click(fabButton);
      expect(mockRouter.push).toHaveBeenCalledWith('/cotizaciones/create');
    });
  });

  it('should display recent quotes snapshot', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    const mockQuotes = [
      { id: 'c1', codigo: 'COT-001', totalAmount: '1500000', estado: 'BORRADOR' },
    ];
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: mockQuotes });
    await mockAnalytics();

    await renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('COT-001')).toBeDefined();
    });
  });

  it('should support pull-to-refresh', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    const listSpy = vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();
    await waitFor(() => {
      const refreshControl = screen.getByTestId('refresh-control');
      fireEvent.click(refreshControl);
      expect(listSpy).toHaveBeenCalledTimes(2); // initial fetch + refresh
    });
  });

  it('should display user profile avatar in header', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();
    await waitFor(() => {
      const avatar = screen.getByTestId('profile-avatar');
      expect(avatar).toBeDefined();
    });
  });

  it('should navigate to profile on avatar tap', async () => {
    const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    const { proyectosApi } = await import('../../services/api/projects.api');
    const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
    await mockAnalytics();

    await renderDashboard();
    await waitFor(() => {
      const avatar = screen.getByTestId('profile-avatar');
      fireEvent.click(avatar);
      expect(mockRouter.push).toHaveBeenCalledWith('/profile');
    });
  });
});
