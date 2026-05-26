import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { resetMocks } from '../setup';
import { createQueryWrapper } from '../test-wrapper';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSegments: () => ['insumos', '[id]'],
  useLocalSearchParams: () => ({ id: 'i1' }),
}));

const mockInsumo = {
  id: 'i1',
  codigo: 'CEM-001',
  nombre: 'Cemento Portland',
  unidad: 'KG',
  costBase: '8500.00',
  createdBy: 'u1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('Insumo Detail Screen', () => {
  beforeEach(async () => {
    resetMocks();
    vi.restoreAllMocks();

    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
  });

  const renderDetail = async () => {
    const InsumoDetailScreen = (await import('../../app/insumos/[id]')).default;
    const { wrapper } = createQueryWrapper();
    return render(<InsumoDetailScreen />, { wrapper });
  };

  it('should show loading state initially', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockReturnValue(new Promise(() => {}));

    await renderDetail();
    await waitFor(() => {
      const loading = screen.getByTestId('loading-indicator');
      expect(loading).toBeDefined();
    });
  });

  it('should render insumo details after loading', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      expect(screen.getByText(/Cemento Portland/)).toBeDefined();
      expect(screen.getByText(/CEM-001/)).toBeDefined();
      expect(screen.getByText(/KG/)).toBeDefined();
      // cost is formatted with toLocaleString('es-CO') => $8.500
      expect(screen.getByText(/8\.500/)).toBeDefined();
    });
  });

  it('should render the code and unit info text', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      // Text is "CEM-001 | KG"
      expect(screen.getByText(/CEM-001/)).toBeDefined();
      expect(screen.getByText(/KG/)).toBeDefined();
    });
  });

  it('should show edit button for all users', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /editar|edit/i });
      expect(editButton).toBeDefined();
    });
  });

  it('should toggle to edit mode when edit button is clicked', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /editar|edit/i });
      fireEvent.click(editButton);
    });

    // In edit mode, the save button should appear
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /guardar|cambios/i });
      expect(saveButton).toBeDefined();
    });
  });

  it('should call update API when saving edits', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });
    const updateSpy = vi.spyOn(insumosApi, 'update').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /editar|edit/i });
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /guardar|cambios/i });
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'i1',
        expect.objectContaining({
          codigo: 'CEM-001',
          nombre: 'Cemento Portland',
          unidad: 'KG',
          costBase: '8500.00',
        }),
      );
    });
  });

  it('should show delete button for ADMIN users', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /eliminar|borrar|delete/i });
      expect(deleteButton).toBeDefined();
    });
  });

  it('should show confirmation dialog before deleting', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /eliminar|borrar|delete/i });
      fireEvent.click(deleteButton);
    });

    const confirmDialog = screen.getByTestId('confirm-dialog');
    expect(confirmDialog).toBeDefined();
  });

  it('should call delete API after confirmation', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });
    const deleteSpy = vi.spyOn(insumosApi, 'delete').mockResolvedValue(undefined);

    await renderDetail();

    await waitFor(() => {
      expect(screen.getByText(/Cemento Portland/)).toBeDefined();
    });

    // Click the first "Eliminar" button to open the modal
    const deleteButton = screen.getByRole('button', { name: /eliminar|borrar|delete/i });
    fireEvent.click(deleteButton);

    // Wait for the confirm dialog and click the "Eliminar" button inside it
    await waitFor(() => {
      const dialog = screen.getByTestId('confirm-dialog');
      expect(dialog).toBeDefined();
      const confirmButton = within(dialog).getByRole('button', { name: /eliminar/i });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('i1');
    });
  });

  it('should hide delete button for non-ADMIN users', async () => {
    const { useAuthStore } = await import('../../stores/auth.store');
    useAuthStore.getState().login({
      user: { id: 'u2', name: 'Gerente', email: 'gerente@test.com', role: 'GERENTE_OBRA' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /eliminar|borrar|delete/i })).toBeNull();
    });
  });

  it('should show error state when fetch fails', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockRejectedValue(new Error('Network error'));

    await renderDetail();

    await waitFor(() => {
      const errorEls = screen.getAllByText(/error|cargar/i);
      expect(errorEls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should have a back button that calls router.back()', async () => {
    const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'getById').mockResolvedValue({ data: mockInsumo });

    await renderDetail();

    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /volver|back|regresar/i });
      fireEvent.click(backButton);
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});
