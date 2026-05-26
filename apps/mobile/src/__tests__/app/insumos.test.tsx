import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';
import { createQueryWrapper } from '../test-wrapper';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSegments: () => ['(tabs)', 'insumos'],
}));

describe('Insumos Screen', () => {
  beforeEach(() => {
    resetMocks();
  });

  const renderInsumos = async () => {
    const InsumosScreen = (await import('../../app/(tabs)/insumos')).default;
    const { wrapper } = createQueryWrapper();
    return render(<InsumosScreen />, { wrapper });
  };

  it('should render the insumos catalog header', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: [] });
    await renderInsumos();
    await waitFor(() => {
      const header = screen.getByRole('heading', { level: 1 });
      expect(header).toBeDefined();
      expect(header.textContent).toMatch(/catálogo|maestro|insumos/i);
    });
  });

  it('should render a search bar', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: [] });
    await renderInsumos();
    await waitFor(() => {
      const searchBar = screen.getByPlaceholderText(/buscar|search|código|nombre/i);
      expect(searchBar).toBeDefined();
    });
  });

  it('should render filter chips for codigo, nombre, unidad', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: [] });
    await renderInsumos();
    await waitFor(() => {
      const filterChips = screen.getAllByTestId('filter-chip');
      expect(filterChips.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should fetch and display insumos from API', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    const mockInsumos = [
      {
        id: 'i1',
        codigo: 'CEM-001',
        nombre: 'Cemento Portland',
        unidad: 'KG',
        costBase: '8500.00',
      },
      {
        id: 'i2',
        codigo: 'VAR-001',
        nombre: 'Varilla Corrugada 3/8"',
        unidad: 'KG',
        costBase: '3200.00',
      },
    ];
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: mockInsumos });

    await renderInsumos();

    await waitFor(() => {
      expect(screen.getByText(/Cemento Portland/)).toBeDefined();
      expect(screen.getByText(/Varilla Corrugada/)).toBeDefined();
    });
  });

  it('should filter insumos when search query is entered', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    const allInsumos = [
      {
        id: 'i1',
        codigo: 'CEM-001',
        nombre: 'Cemento Portland',
        unidad: 'KG',
        costBase: '8500.00',
      },
      {
        id: 'i2',
        codigo: 'VAR-001',
        nombre: 'Varilla Corrugada',
        unidad: 'KG',
        costBase: '3200.00',
      },
      { id: 'i3', codigo: 'ARE-001', nombre: 'Arena Lavada', unidad: 'M3', costBase: '45000.00' },
    ];
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: allInsumos });

    await renderInsumos();

    await waitFor(() => {
      const searchBar = screen.getByPlaceholderText(/buscar|search|código|nombre/i);
      fireEvent.change(searchBar, { target: { value: 'Cemento' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Cemento Portland/)).toBeDefined();
      expect(screen.queryByText(/Varilla Corrugada/)).toBeNull();
    });
  });

  it('should show empty state when no insumos match filter', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: [] });

    await renderInsumos();

    await waitFor(() => {
      const emptyState = screen.getByText(/no hay insumos|sin resultados|no encontrado/i);
      expect(emptyState).toBeDefined();
    });
  });

  it('should show loading indicator while fetching', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    const listSpy = vi.spyOn(insumosApi, 'list');
    listSpy.mockReturnValue(new Promise(() => {}));

    await renderInsumos();
    const loading = screen.getByTestId('loading-indicator');
    expect(loading).toBeDefined();
  });

  it('should display FAB for ADMIN users to create insumo', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: [] });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderInsumos();
    await waitFor(() => {
      const fabButton = screen.getByRole('button', { name: /nuevo insumo|crear insumo/i });
      expect(fabButton).toBeDefined();
    });
  });

  it('should navigate to create insumo on FAB press', async () => {
    const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: [] });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderInsumos();
    await waitFor(() => {
      const fabButton = screen.getByRole('button', { name: /nuevo insumo|crear insumo/i });
      fireEvent.click(fabButton);
      expect(mockRouter.push).toHaveBeenCalledWith('/insumos/create');
    });
  });

  it('should support pull-to-refresh', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    const listSpy = vi.spyOn(insumosApi, 'list').mockResolvedValue({ data: [] });

    await renderInsumos();
    await waitFor(() => {
      const refreshControl = screen.getByTestId('refresh-control');
      fireEvent.click(refreshControl);
      expect(listSpy).toHaveBeenCalled();
    });
  });
});
