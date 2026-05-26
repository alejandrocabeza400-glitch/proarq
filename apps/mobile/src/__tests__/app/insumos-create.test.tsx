import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSegments: () => ['insumos', 'create'],
  useLocalSearchParams: () => ({}),
}));

describe('Create Insumo Screen', () => {
  beforeEach(() => {
    resetMocks();
    vi.restoreAllMocks();
  });

  const renderCreateInsumo = async () => {
    const CreateInsumoScreen = (await import('../../app/insumos/create')).default;
    return render(<CreateInsumoScreen />);
  };

  it('should render the create insumo header', async () => {
    await renderCreateInsumo();
    const header = screen.getByRole('heading', { level: 1 });
    expect(header).toBeDefined();
    expect(header.textContent).toMatch(/nuevo insumo|crear insumo/i);
  });

  it('should render form fields: codigo, nombre, unidad, costBase', async () => {
    await renderCreateInsumo();

    expect(screen.getByPlaceholderText(/código|codigo/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/nombre|name/i)).toBeDefined();
    expect(screen.getByTestId('unidad-select')).toBeDefined();
    expect(screen.getByPlaceholderText(/costo base|cost/i)).toBeDefined();
  });

  it('should include all 4 unidades in the dropdown', async () => {
    await renderCreateInsumo();

    const select = screen.getByTestId('unidad-select');
    const options = select.querySelectorAll('option');

    const unidades = Array.from(options).map((o) => o.textContent?.trim());
    expect(unidades).toContain('M3');
    expect(unidades).toContain('KG');
    expect(unidades).toContain('UND');
    expect(unidades).toContain('GL');
  });

  it('should create insumo via POST on form submit', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    const createSpy = vi.spyOn(insumosApi, 'create').mockResolvedValue({
      data: {
        id: 'new-insumo',
        codigo: 'CEM-001',
        nombre: 'Cemento Portland',
        unidad: 'KG',
        costBase: '8500.00',
        createdBy: 'u1',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    });

    await renderCreateInsumo();

    fireEvent.change(screen.getByPlaceholderText(/código|codigo/i), {
      target: { value: 'CEM-001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/nombre|name/i), {
      target: { value: 'Cemento Portland' },
    });

    const unidadSelect = screen.getByTestId('unidad-select');
    fireEvent.change(unidadSelect, { target: { value: 'KG' } });

    fireEvent.change(screen.getByPlaceholderText(/costo base|cost/i), {
      target: { value: '8500.00' },
    });

    const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        codigo: 'CEM-001',
        nombre: 'Cemento Portland',
        unidad: 'KG',
        costBase: '8500.00',
      });
    });
  });

  it('should navigate back after successful creation', async () => {
    const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
    vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'create').mockResolvedValue({
      data: {
        id: 'new-insumo',
        codigo: 'CEM-001',
        nombre: 'Cemento Portland',
        unidad: 'KG',
        costBase: '8500.00',
        createdBy: 'u1',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    });

    await renderCreateInsumo();

    fireEvent.change(screen.getByPlaceholderText(/código|codigo/i), {
      target: { value: 'CEM-001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/nombre|name/i), { target: { value: 'Cemento' } });
    fireEvent.change(screen.getByPlaceholderText(/costo base|cost/i), {
      target: { value: '8500' },
    });

    const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  it('should validate required fields before submitting', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    const createSpy = vi.spyOn(insumosApi, 'create');

    await renderCreateInsumo();

    // Don't fill in any fields, just click save
    const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createSpy).not.toHaveBeenCalled();
      expect(screen.getByText(/requerido|campo/i)).toBeDefined();
    });
  });

  it('should validate costBase is numeric and positive', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    const createSpy = vi.spyOn(insumosApi, 'create');

    await renderCreateInsumo();

    fireEvent.change(screen.getByPlaceholderText(/código|codigo/i), {
      target: { value: 'CEM-001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/nombre|name/i), { target: { value: 'Cemento' } });
    fireEvent.change(screen.getByPlaceholderText(/costo base|cost/i), { target: { value: 'abc' } });

    const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  it('should show error message on API failure', async () => {
    const { insumosApi } = await import('../../services/api/insumos.api');
    vi.spyOn(insumosApi, 'create').mockRejectedValue({
      response: { data: { error: 'Error al crear insumo' } },
    });

    await renderCreateInsumo();

    fireEvent.change(screen.getByPlaceholderText(/código|codigo/i), {
      target: { value: 'CEM-001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/nombre|name/i), { target: { value: 'Cemento' } });
    fireEvent.change(screen.getByPlaceholderText(/costo base|cost/i), {
      target: { value: '8500' },
    });

    const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Error al crear insumo/)).toBeDefined();
    });
  });
});
