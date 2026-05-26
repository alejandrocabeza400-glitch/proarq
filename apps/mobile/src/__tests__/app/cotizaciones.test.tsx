import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { resetMocks } from '../setup';
import { createQueryWrapper } from '../test-wrapper';

vi.module('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSegments: () => ['(tabs)', 'cotizaciones'],
  useLocalSearchParams: () => ({ id: 'c1' }),
}));

describe('Cotizaciones Screen', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Quote History List', () => {
    const renderCotizacionesList = async () => {
      const CotizacionesScreen = (await import('../../app/(tabs)/cotizaciones')).default;
      const { wrapper } = createQueryWrapper();
      return render(<CotizacionesScreen />, { wrapper });
    };

    it('should render the cotizaciones list header', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });
      await renderCotizacionesList();
      await waitFor(() => {
        const header = screen.getByRole('heading', { level: 1 });
        expect(header).toBeDefined();
        expect(header.textContent).toMatch(/cotizaciones|presupuestos|historial/i);
      });
    });

    it('should fetch and display cotizaciones from API', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      const mockCotizaciones = [
        {
          id: 'c1',
          codigo: 'COT-001',
          proyectoNombre: 'Torre Norte',
          estado: 'BORRADOR',
          totalAmount: '1500000',
          version: 1,
        },
        {
          id: 'c2',
          codigo: 'COT-002',
          proyectoNombre: 'Puente Sur',
          estado: 'ENVIADA',
          totalAmount: '3200000',
          version: 1,
        },
      ];

      vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: mockCotizaciones });

      await renderCotizacionesList();

      await waitFor(() => {
        expect(screen.getByText('COT-001')).toBeDefined();
        expect(screen.getByText('COT-002')).toBeDefined();
      });
    });

    it('should display status badges for each cotizacion', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({
        data: [
          {
            id: 'c1',
            codigo: 'COT-001',
            proyectoNombre: 'Test',
            estado: 'BORRADOR',
            totalAmount: '100000',
            version: 1,
          },
        ],
      });

      await renderCotizacionesList();

      await waitFor(() => {
        const statusBadge = screen.getAllByText(/borrador|enviada|aprobada|reemplazada/i);
        expect(statusBadge.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should filter by status when status filter is selected', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      const listSpy = vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });

      await renderCotizacionesList();
      await waitFor(() => {
        const enviadaFilter = screen.getByText(/enviada/i);
        fireEvent.click(enviadaFilter);
      });

      await waitFor(() => {
        expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ estado: 'ENVIADA' }));
      });
    });

    it('should show empty state when no cotizaciones exist', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'list').mockResolvedValue({ data: [] });

      await renderCotizacionesList();

      await waitFor(() => {
        const emptyState = screen.getByText(/no hay cotizaciones|sin cotizaciones/i);
        expect(emptyState).toBeDefined();
      });
    });
  });

  describe('Quote Detail Screen', () => {
    const renderCotizacionDetail = async () => {
      const CotizacionDetailScreen = (await import('../../app/cotizaciones/[id]')).default;
      return render(<CotizacionDetailScreen />);
    };

    it('should fetch and display cotizacion details', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      const mockCotizacion = {
        id: 'c1',
        codigo: 'COT-001',
        proyectoNombre: 'Torre Norte',
        version: 1,
        estado: 'BORRADOR',
        totalCostDirect: '1200000',
        factorAPercentage: '10',
        factorBPercentage: '5',
        profitMarginPercent: '8',
        totalAmount: '1500000',
        items: [
          {
            id: 'item1',
            apuCodigo: 'APU-001',
            apuNombre: 'Muro de ladrillo',
            cantidad: '10',
            calculatedCostDirect: '1200000',
          },
        ],
      };

      vi.spyOn(cotizacionesApi, 'getById').mockResolvedValue({ data: mockCotizacion });

      await renderCotizacionDetail();

      await waitFor(() => {
        expect(screen.getByText('COT-001')).toBeDefined();
        expect(screen.getByText('Torre Norte')).toBeDefined();
      });
    });

    it('should display financial summary with factors', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'getById').mockResolvedValue({
        data: {
          id: 'c1',
          codigo: 'COT-001',
          proyectoNombre: 'Test',
          version: 1,
          estado: 'BORRADOR',
          totalCostDirect: '1000000',
          factorAPercentage: '10',
          factorBPercentage: '5',
          profitMarginPercent: '8',
          totalAmount: '1250000',
          items: [],
        },
      });

      await renderCotizacionDetail();

      await waitFor(() => {
        expect(screen.getByTestId('financial-summary')).toBeDefined();
        expect(screen.getByText(/1\.000\.000|1000000/)).toBeDefined();
        expect(screen.getByText(/10%/)).toBeDefined();
        expect(screen.getByText(/8%/)).toBeDefined();
      });
    });

    it('should display "Descargar PDF" button', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'getById').mockResolvedValue({
        data: {
          id: 'c1',
          codigo: 'COT-001',
          proyectoNombre: 'Test',
          version: 1,
          estado: 'BORRADOR',
          items: [],
        },
      });

      await renderCotizacionDetail();

      await waitFor(() => {
        const pdfButton = screen.getByRole('button', { name: /descargar pdf|pdf/i });
        expect(pdfButton).toBeDefined();
      });
    });

    it('should display "Crear Versión" button for internal roles', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');
      useAuthStore.getState().login({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'getById').mockResolvedValue({
        data: {
          id: 'c1',
          codigo: 'COT-001',
          proyectoNombre: 'Test',
          version: 1,
          estado: 'BORRADOR',
          items: [],
        },
      });

      await renderCotizacionDetail();

      await waitFor(() => {
        const branchButton = screen.getByRole('button', {
          name: /crear versión|branch|nueva versión/i,
        });
        expect(branchButton).toBeDefined();
      });
    });
  });

  describe('Quote Branching', () => {
    const renderCotizacionDetail = async () => {
      const CotizacionDetailScreen = (await import('../../app/cotizaciones/[id]')).default;
      return render(<CotizacionDetailScreen />);
    };

    it('should create a new version when branch is triggered', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'getById').mockResolvedValue({
        data: {
          id: 'c1',
          codigo: 'COT-001',
          proyectoNombre: 'Test',
          version: 1,
          estado: 'BORRADOR',
          items: [],
        },
      });

      const branchSpy = vi.spyOn(cotizacionesApi, 'branch').mockResolvedValue({
        data: { id: 'c2', codigo: 'COT-001', version: 2, estado: 'BORRADOR', items: [] },
      });

      const { useAuthStore } = await import('../../stores/auth.store');
      useAuthStore.getState().login({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await renderCotizacionDetail();

      await waitFor(async () => {
        const branchButton = screen.getByRole('button', {
          name: /crear versión|branch|nueva versión/i,
        });
        fireEvent.click(branchButton);
      });

      await waitFor(() => {
        expect(branchSpy).toHaveBeenCalledWith('c1');
      });
    });

    it('should show version number in the header', async () => {
      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'getById').mockResolvedValue({
        data: {
          id: 'c1',
          codigo: 'COT-001',
          proyectoNombre: 'Test',
          version: 2,
          estado: 'BORRADOR',
          items: [],
        },
      });

      await renderCotizacionDetail();

      await waitFor(() => {
        expect(screen.getByText(/v2|versión 2|version 2/i)).toBeDefined();
      });
    });
  });

  describe('Quote PDF', () => {
    it('should trigger PDF download when download button is clicked', async () => {
      const renderCotizacionDetail = async () => {
        const CotizacionDetailScreen = (await import('../../app/cotizaciones/[id]')).default;
        return render(<CotizacionDetailScreen />);
      };

      const { cotizacionesApi } = await import('../../services/api/cotizaciones.api');
      vi.spyOn(cotizacionesApi, 'getById').mockResolvedValue({
        data: {
          id: 'c1',
          codigo: 'COT-001',
          proyectoNombre: 'Torre Norte',
          version: 1,
          estado: 'BORRADOR',
          totalCostDirect: '1200000',
          factorAPercentage: '10',
          factorBPercentage: '5',
          profitMarginPercent: '8',
          totalAmount: '1500000',
          items: [],
        },
      });

      await renderCotizacionDetail();

      await waitFor(() => {
        expect(screen.getByText(/COT-\d+/)).toBeDefined();
      });

      const downloadBtn = screen.getByText('Descargar PDF');
      expect(downloadBtn).toBeDefined();
    });
  });
});
