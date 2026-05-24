import { describe, expect, test, mock } from 'bun:test';
import { ManageCotizacionUseCase } from '@proarq/core/application/use-cases/manage-cotizacion.use-case';
import type { CotizacionRepository } from '@proarq/core/application/ports/out/cotizacion-repository.port';
import { AppError } from '@proarq/core/errors';

const mockCotizacion = {
  id: '990e8400-e29b-41d4-a716-446655440004',
  projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
  codigo: 'COT-001',
  version: 1,
  estado: 'BORRADOR',
  clienteId: '550e8400-e29b-41d4-a716-446655440000',
  totalCostDirect: '1000.00',
  factorAPercentage: '10.00',
  factorBPercentage: '5.00',
  profitMarginPercent: '15.00',
  totalAmount: '1328.25',
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockCotizacionWithItems = {
  ...mockCotizacion,
  items: [
    {
      id: 'bb0e8400-e29b-41d4-a716-446655440006',
      cotizacionId: '990e8400-e29b-41d4-a716-446655440004',
      apuId: '770e8400-e29b-41d4-a716-446655440002',
      cantidad: '10.00',
      calculatedCostDirect: '100.00',
    },
  ],
};

const mockCotizacionList = [mockCotizacion];

describe('ManageCotizacionUseCase', () => {
  describe('CRUD operations', () => {
    test('should create a new cotizacion', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => mockCotizacionList),
        findById: mock(async () => mockCotizacionWithItems),
        create: mock(async (data) => ({ ...mockCotizacion, ...data })),
        update: mock(async (id, data) => ({ ...mockCotizacionWithItems, ...data })),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({ ...mockCotizacion, version: 2, codigo: 'COT-001-V2' })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new ManageCotizacionUseCase(mockRepo);
      const result = await useCase.create({
        projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
        codigo: 'COT-001',
        clienteId: '550e8400-e29b-41d4-a716-446655440000',
        items: [
          { apuId: '770e8400-e29b-41d4-a716-446655440002', cantidad: '10.00' },
        ],
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toBeDefined();
      expect(result.codigo).toBe('COT-001');
    });

    test('should list cotizaciones with filters', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => mockCotizacionList),
        findById: mock(async () => mockCotizacionWithItems),
        create: mock(async () => mockCotizacion),
        update: mock(async () => mockCotizacionWithItems),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({ ...mockCotizacion, version: 2 })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new ManageCotizacionUseCase(mockRepo);
      const result = await useCase.findAll({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should find cotizacion by id with items', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async (id) => {
          if (id === '990e8400-e29b-41d4-a716-446655440004') return mockCotizacionWithItems;
          return null;
        }),
        create: mock(async () => mockCotizacion),
        update: mock(async () => mockCotizacionWithItems),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({ ...mockCotizacion, version: 2 })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new ManageCotizacionUseCase(mockRepo);
      const result = await useCase.findById('990e8400-e29b-41d4-a716-446655440004');

      expect(result).toBeDefined();
      expect(result!.id).toBe('990e8400-e29b-41d4-a716-446655440004');
      expect((result as any).items).toBeDefined();
    });

    test('should update a cotizacion', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockCotizacionWithItems),
        create: mock(async () => mockCotizacion),
        update: mock(async (id, data) => ({ ...mockCotizacionWithItems, ...data })),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({ ...mockCotizacion, version: 2 })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new ManageCotizacionUseCase(mockRepo);
      const result = await useCase.update('990e8400-e29b-41d4-a716-446655440004', {
        estado: 'ENVIADA',
        profitMarginPercent: '15.00',
      });

      expect(result).toBeDefined();
      expect((result as any).estado).toBe('ENVIADA');
    });
  });

  describe('APROBADA guard', () => {
    test('should reject updates when cotizacion is APROBADA', async () => {
      const approvedCotizacion = {
        ...mockCotizacionWithItems,
        estado: 'APROBADA',
      };

      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => approvedCotizacion),
        create: mock(async () => mockCotizacion),
        update: mock(async () => ({}) as any),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({ ...mockCotizacion, version: 2 })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new ManageCotizacionUseCase(mockRepo);

      try {
        await useCase.update('990e8400-e29b-41d4-a716-446655440004', {
          factorAPercentage: '12.00',
        });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).message.toLowerCase()).toContain('approved');
      }
    });
  });

  describe('profit margin validation', () => {
    test('should allow updates with valid profit margin', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockCotizacionWithItems),
        create: mock(async () => mockCotizacion),
        update: mock(async (id, data) => ({ ...mockCotizacionWithItems, ...data })),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({ ...mockCotizacion, version: 2 })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new ManageCotizacionUseCase(mockRepo);
      const result = await useCase.update('990e8400-e29b-41d4-a716-446655440004', {
        estado: 'ENVIADA',
        profitMarginPercent: '15.00',
      });

      expect(result).toBeDefined();
      expect((result as any).profitMarginPercent).toBe('15.00');
    });
  });
});
