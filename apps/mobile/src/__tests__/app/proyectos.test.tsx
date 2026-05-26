import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';
import { createQueryWrapper } from '../test-wrapper';

const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };

vi.module('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => ['(tabs)', 'proyectos'],
  useLocalSearchParams: () => ({ id: 'p1' }),
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  Stack: { Screen: () => null },
}));

describe('Proyectos List Screen', () => {
  beforeEach(() => {
    resetMocks();
    mockRouter.push.mockClear();
    mockRouter.back.mockClear();
  });

  const renderProyectos = async () => {
    const ProyectosScreen = (await import('../../app/(tabs)/proyectos')).default;
    const { wrapper } = createQueryWrapper();
    return render(<ProyectosScreen />, { wrapper });
  };

  it('should render the proyectos header', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    await renderProyectos();
    await waitFor(() => {
      const header = screen.getByRole('heading', { level: 1 });
      expect(header).toBeDefined();
      expect(header.textContent).toMatch(/proyectos/i);
    });
  });

  it('should render a search bar', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });
    await renderProyectos();
    await waitFor(() => {
      const searchBar = screen.getByPlaceholderText(/buscar|código|nombre/i);
      expect(searchBar).toBeDefined();
    });
  });

  it('should fetch and display proyectos from API', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const mockProyectos = [
      {
        id: 'p1',
        codigo: 'PRO-001',
        nombre: 'Edificio Torres',
        estado: 'ACTIVO',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'p2',
        codigo: 'PRO-002',
        nombre: 'Puente Peatonal',
        estado: 'PLANEADO',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
    ];
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: mockProyectos });

    await renderProyectos();

    await waitFor(() => {
      expect(screen.getByText(/Edificio Torres/)).toBeDefined();
      expect(screen.getByText(/Puente Peatonal/)).toBeDefined();
    });
  });

  it('should show loading indicator while fetching', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const listSpy = vi.spyOn(proyectosApi, 'list');
    listSpy.mockReturnValue(new Promise(() => {}));

    await renderProyectos();
    const loading = screen.getByTestId('loading-indicator');
    expect(loading).toBeDefined();
  });

  it('should show empty state when no proyectos', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });

    await renderProyectos();

    await waitFor(() => {
      const emptyState = screen.getByText(/no hay proyectos|sin resultados/i);
      expect(emptyState).toBeDefined();
    });
  });

  it('should display FAB for ADMIN users to create proyecto', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderProyectos();
    await waitFor(() => {
      const fabButton = screen.getByRole('button', { name: /nuevo proyecto/i });
      expect(fabButton).toBeDefined();
    });
  });

  it('should display FAB for GERENTE_OBRA users to create proyecto', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u2', name: 'Gerente', email: 'gerente@test.com', role: 'GERENTE_OBRA' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderProyectos();
    await waitFor(() => {
      const fabButton = screen.getByRole('button', { name: /nuevo proyecto/i });
      expect(fabButton).toBeDefined();
    });
  });

  it('should NOT display FAB for non-admin/gerente users', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u3', name: 'User', email: 'user@test.com', role: 'CONSULTOR' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderProyectos();
    await waitFor(() => {
      const fabButton = screen.queryByRole('button', { name: /nuevo proyecto/i });
      expect(fabButton).toBeNull();
    });
  });

  it('should navigate to create proyecto on FAB press', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderProyectos();
    await waitFor(() => {
      const fabButton = screen.getByRole('button', { name: /nuevo proyecto/i });
      fireEvent.click(fabButton);
      expect(mockRouter.push).toHaveBeenCalledWith('/proyectos/create');
    });
  });

  it('should navigate to proyecto detail when clicking a project card', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const mockProyectos = [
      {
        id: 'p1',
        codigo: 'PRO-001',
        nombre: 'Edificio Torres',
        estado: 'ACTIVO',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];
    vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: mockProyectos });

    await renderProyectos();

    await waitFor(() => {
      const card = screen.getByText(/Edificio Torres/);
      fireEvent.click(card);
      expect(mockRouter.push).toHaveBeenCalledWith('/proyectos/p1');
    });
  });

  it('should support refresh control', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const listSpy = vi.spyOn(proyectosApi, 'list').mockResolvedValue({ data: [] });

    await renderProyectos();
    await waitFor(() => {
      const refreshControl = screen.getByTestId('refresh-control');
      fireEvent.click(refreshControl);
      expect(listSpy).toHaveBeenCalled();
    });
  });
});

describe('Proyectos Create Screen', () => {
  beforeEach(() => {
    resetMocks();
  });

  const renderCreateProyecto = async () => {
    const CreateScreen = (await import('../../app/proyectos/create')).default;
    const { wrapper } = createQueryWrapper();
    return render(<CreateScreen />, { wrapper });
  };

  it('should render the create form header', async () => {
    await renderCreateProyecto();
    const header = screen.getByRole('heading', { level: 1 });
    expect(header).toBeDefined();
    expect(header.textContent).toMatch(/nuevo proyecto/i);
  });

  it('should render form fields: codigo, nombre, descripcion', async () => {
    await renderCreateProyecto();
    expect(screen.getByPlaceholderText(/código/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/nombre.*proyecto/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/descripción/i)).toBeDefined();
  });

  it('should submit form and navigate back on success', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    const createSpy = vi.spyOn(proyectosApi, 'create').mockResolvedValue({
      data: { id: 'p1', codigo: 'PRO-001', nombre: 'Test', descripcion: 'Desc', estado: 'ACTIVO' },
    } as any);

    await renderCreateProyecto();

    fireEvent.change(screen.getByPlaceholderText(/código/i), { target: { value: 'PRO-001' } });
    fireEvent.change(screen.getByPlaceholderText(/nombre.*proyecto/i), {
      target: { value: 'Test Project' },
    });
    fireEvent.change(screen.getByPlaceholderText(/descripción/i), {
      target: { value: 'A test project' },
    });

    const submitButton = screen.getByRole('button', { name: /crear/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        codigo: 'PRO-001',
        nombre: 'Test Project',
        descripcion: 'A test project',
        estado: 'PLANEADO',
      });
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});

describe('Proyectos Detail Screen', () => {
  beforeEach(() => {
    resetMocks();
  });

  const mockProyecto = {
    id: 'p1',
    codigo: 'PRO-001',
    nombre: 'Edificio Torres',
    descripcion: 'Construcción de edificio residencial',
    estado: 'ACTIVO',
    clienteNombre: 'Cliente Test',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  const renderDetail = async () => {
    const DetailScreen = (await import('../../app/proyectos/[id]')).default;
    const { wrapper } = createQueryWrapper();
    return render(<DetailScreen />, { wrapper });
  };

  it('should render loading state initially', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'getById').mockReturnValue(new Promise(() => {}));

    await renderDetail();
    const loading = screen.getByTestId('loading-indicator');
    expect(loading).toBeDefined();
  });

  it('should render proyecto details when loaded', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'getById').mockResolvedValue({ data: mockProyecto });

    await renderDetail();

    await waitFor(() => {
      expect(screen.getByText(/Edificio Torres/)).toBeDefined();
      expect(screen.getByText(/PRO-001/)).toBeDefined();
    });
  });

  it('should show edit button for ADMIN users', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'getById').mockResolvedValue({ data: mockProyecto });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderDetail();
    await waitFor(() => {
      const editBtn = screen.getByRole('button', { name: /editar/i });
      expect(editBtn).toBeDefined();
    });
  });

  it('should show delete button for ADMIN users', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'getById').mockResolvedValue({ data: mockProyecto });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderDetail();
    await waitFor(() => {
      const deleteBtn = screen.getByRole('button', { name: /eliminar/i });
      expect(deleteBtn).toBeDefined();
    });
  });

  it('should show edit button for GERENTE_OBRA users', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'getById').mockResolvedValue({ data: mockProyecto });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u2', name: 'Gerente', email: 'gerente@test.com', role: 'GERENTE_OBRA' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderDetail();
    await waitFor(() => {
      const editBtn = screen.getByRole('button', { name: /editar/i });
      expect(editBtn).toBeDefined();
    });
  });

  it('should NOT show edit button for CONSULTOR users', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'getById').mockResolvedValue({ data: mockProyecto });

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u3', name: 'Consultor', email: 'consultor@test.com', role: 'CONSULTOR' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await renderDetail();
    await waitFor(() => {
      const editBtn = screen.queryByRole('button', { name: /editar/i });
      expect(editBtn).toBeNull();
    });
  });

  it('should call delete and navigate back on confirm', async () => {
    const { proyectosApi } = await import('../../services/api/projects.api');
    vi.spyOn(proyectosApi, 'getById').mockResolvedValue({ data: mockProyecto });
    const deleteSpy = vi.spyOn(proyectosApi, 'delete').mockResolvedValue(undefined);

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    await renderDetail();
    await waitFor(() => {
      const deleteBtn = screen.getByRole('button', { name: /eliminar/i });
      fireEvent.click(deleteBtn);
    });

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('p1');
      expect(mockRouter.back).toHaveBeenCalled();
    });

    window.confirm = originalConfirm;
  });
});
