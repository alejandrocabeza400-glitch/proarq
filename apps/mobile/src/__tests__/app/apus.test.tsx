import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';
import { createQueryWrapper } from '../test-wrapper';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSegments: () => ['(tabs)', 'apus'],
  useLocalSearchParams: () => ({ id: 'a1' }),
}));

describe('APU Screen', () => {
  beforeEach(async () => {
    resetMocks();
    vi.restoreAllMocks();
  });

  const renderApusList = async () => {
    const ApusScreen = (await import('../../app/(tabs)/apus')).default;
    const { wrapper } = createQueryWrapper();
    return render(<ApusScreen />, { wrapper });
  };

  const mockApis = async () => {
    const { apusApi } = await import('../../services/api/apus.api');
    vi.spyOn(apusApi, 'list').mockResolvedValue({ data: [] });
  };

  describe('APU List', () => {
    it('should render the APU list header', async () => {
      await mockApis();
      await renderApusList();
      await waitFor(() => {
        const header = screen.getByText(/apus|análisis|precios unitarios/i);
        expect(header).toBeDefined();
      });
    });

    it('should fetch and display APUs from API', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      const mockApus = [
        {
          id: 'a1',
          codigo: 'APU-001',
          nombre: 'Muro de ladrillo',
          tipo: 'Estructural',
          itemsCount: 3,
        },
        {
          id: 'a2',
          codigo: 'APU-002',
          nombre: 'Enchape cerámico',
          tipo: 'Acabados',
          itemsCount: 2,
        },
      ];

      vi.spyOn(apusApi, 'list').mockResolvedValue({ data: mockApus });

      await renderApusList();

      await waitFor(() => {
        expect(screen.getByText('APU-001')).toBeDefined();
        expect(screen.getByText('APU-002')).toBeDefined();
      });
    });

    it('should show items count for each APU', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      vi.spyOn(apusApi, 'list').mockResolvedValue({
        data: [{ id: 'a1', codigo: 'APU-001', nombre: 'Muro de ladrillo', tipo: 'Estructural' }],
      });

      await renderApusList();

      await waitFor(() => {
        // APU cards should show item count
        const itemCount = screen.getByText(/items|insumos|3/i);
        expect(itemCount).toBeDefined();
      });
    });

    it('should show loading state', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      const promise = new Promise(() => {}); // Never resolves - keeps loading
      vi.spyOn(apusApi, 'list').mockReturnValue(promise);
      await renderApusList();
      const loading = screen.getByTestId('loading-indicator');
      expect(loading).toBeDefined();
    });

    it('should show FAB to create new APU', async () => {
      await mockApis();
      await renderApusList();
      await waitFor(() => {
        const fabButton = screen.getByRole('button', { name: /nuevo apu|crear apu/i });
        expect(fabButton).toBeDefined();
      });
    });

    it('should navigate to create APU on FAB press', async () => {
      const mockRouter = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
      vi.spyOn(await import('expo-router'), 'useRouter').mockReturnValue(mockRouter as any);

      await mockApis();
      await renderApusList();

      await waitFor(() => {
        const fabButton = screen.getByRole('button', { name: /nuevo apu|crear apu/i });
        fireEvent.click(fabButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/apus/create');
      });
    });

    it('should support pull-to-refresh', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      const listSpy = vi.spyOn(apusApi, 'list').mockResolvedValue({ data: [] });

      await renderApusList();
      await waitFor(() => {
        const refreshControl = screen.getByTestId('refresh-control');
        fireEvent.click(refreshControl);
        expect(listSpy).toHaveBeenCalled();
      });
    });
  });

  describe('APU Create Screen', () => {
    const renderApuCreate = async () => {
      const ApuCreateScreen = (await import('../../app/apus/create')).default;
      return render(<ApuCreateScreen />);
    };

    it('should render create APU form with codigo, nombre, tipo fields', async () => {
      await renderApuCreate();

      expect(screen.getByPlaceholderText(/código|codigo/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/nombre/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/tipo/i)).toBeDefined();
    });

    it('should save APU with POST /apus', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      const createSpy = vi.spyOn(apusApi, 'create').mockResolvedValue({
        data: { id: 'new-apu', codigo: 'APU-003', nombre: 'Nuevo APU', tipo: 'Estructural' },
      });

      await renderApuCreate();

      fireEvent.change(screen.getByPlaceholderText(/código|codigo/i), {
        target: { value: 'APU-003' },
      });
      fireEvent.change(screen.getByPlaceholderText(/nombre/i), { target: { value: 'Nuevo APU' } });
      fireEvent.change(screen.getByPlaceholderText(/tipo/i), { target: { value: 'Estructural' } });

      const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({
          codigo: 'APU-003',
          nombre: 'Nuevo APU',
          tipo: 'Estructural',
        });
      });
    });

    it('should validate required fields before submitting', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      vi.spyOn(apusApi, 'create');
      await renderApuCreate();

      const saveButton = screen.getByRole('button', { name: /guardar|crear/i });
      fireEvent.click(saveButton);

      // Should show validation errors without calling API
      expect(apusApi.create).not.toHaveBeenCalled();
    });
  });

  describe('APU Detail Screen', () => {
    const renderApuDetail = async () => {
      const ApuDetailScreen = (await import('../../app/apus/[id]')).default;
      return render(<ApuDetailScreen />);
    };

    it('should fetch and display APU details with items', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      const mockApu = {
        id: 'a1',
        codigo: 'APU-001',
        nombre: 'Muro de ladrillo',
        tipo: 'Estructural',
        items: [
          {
            id: 'item1',
            insumoNombre: 'Ladrillo',
            rendimiento: '1.5',
            desperdicio: '5',
            unitPriceSnapshot: '500',
          },
          {
            id: 'item2',
            insumoNombre: 'Cemento',
            rendimiento: '0.8',
            desperdicio: '3',
            unitPriceSnapshot: '8500',
          },
        ],
      };

      vi.spyOn(apusApi, 'getById').mockResolvedValue({ data: mockApu });

      await renderApuDetail();

      await waitFor(() => {
        expect(screen.getByText('Muro de ladrillo')).toBeDefined();
        expect(screen.getByText('Ladrillo')).toBeDefined();
        expect(screen.getByText('Cemento')).toBeDefined();
      });
    });

    it('should display cost summary footer', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      vi.spyOn(apusApi, 'getById').mockResolvedValue({
        data: { id: 'a1', codigo: 'APU-001', nombre: 'Test APU', tipo: 'Test', items: [] },
      });

      await renderApuDetail();

      await waitFor(() => {
        const costSummary = screen.getByTestId('cost-summary');
        expect(costSummary).toBeDefined();
      });
    });

    it('should allow adding an insumo to the APU', async () => {
      const { apusApi } = await import('../../services/api/apus.api');
      vi.spyOn(apusApi, 'addInsumo').mockResolvedValue({
        data: { id: 'new-item', apuId: 'a1', insumoId: 'i1', rendimiento: '2.0', desperdicio: '0' },
      });

      vi.spyOn(apusApi, 'getById').mockResolvedValue({
        data: { id: 'a1', codigo: 'APU-001', nombre: 'Test APU', tipo: 'Test', items: [] },
      });

      await renderApuDetail();

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /agregar insumo|añadir/i });
        fireEvent.click(addButton);

        // Modal/insumo search should appear
        expect(screen.getByTestId('insumo-search-modal')).toBeDefined();
      });
    });
  });
});
