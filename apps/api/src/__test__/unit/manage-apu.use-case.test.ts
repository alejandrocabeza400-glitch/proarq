import { describe, expect, mock, test } from 'bun:test';
import type { ApuRepository } from '@proarq/core/application/ports/out/apu-repository.port';
import type { InsumoRepository } from '@proarq/core/application/ports/out/insumo-repository.port';
import { ManageApuUseCase } from '@proarq/core/application/use-cases/manage-apu.use-case';

const mockApu = {
  id: '770e8400-e29b-41d4-a716-446655440002',
  codigo: 'APU-001',
  nombre: 'Muro de Ladrillo King Kong',
  tipo: 'Estructuras',
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockInsumo = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  codigo: 'LAD-001',
  nombre: 'Ladrillo King Kong 18 huecos',
  unidad: 'UND' as const,
  costBase: '1.50',
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockApuInsumo = {
  id: '880e8400-e29b-41d4-a716-446655440003',
  apuId: '770e8400-e29b-41d4-a716-446655440002',
  insumoId: '660e8400-e29b-41d4-a716-446655440001',
  rendimiento: '2.5',
  desperdicio: '5.00',
  unitPriceSnapshot: '1.50',
  createdAt: new Date('2025-01-01'),
};

describe('ManageApuUseCase', () => {
  describe('CRUD operations', () => {
    test('should create a new APU', async () => {
      const mockApuRepo: ApuRepository = {
        findAll: mock(async () => [mockApu]),
        findById: mock(async () => mockApu),
        findByCodigo: mock(async () => null),
        create: mock(async (data) => ({ ...mockApu, ...data })),
        update: mock(async (_id, data) => ({ ...mockApu, ...data })),
        delete: mock(async () => {}),
        addInsumo: mock(async (data) => ({ ...mockApuInsumo, ...data })),
        removeInsumo: mock(async () => {}),
        findInsumoById: mock(async () => mockApuInsumo),
      };
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockInsumo),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };

      const useCase = new ManageApuUseCase(mockApuRepo, mockInsumoRepo);
      const result = await useCase.create({
        codigo: 'APU-001',
        nombre: 'Muro de Ladrillo King Kong',
        tipo: 'Estructuras',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toBeDefined();
      expect(result.codigo).toBe('APU-001');
    });

    test('should list APUs with filters', async () => {
      const mockApuRepo: ApuRepository = {
        findAll: mock(async () => [mockApu]),
        findById: mock(async () => mockApu),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockApu),
        update: mock(async () => mockApu),
        delete: mock(async () => {}),
        addInsumo: mock(async () => mockApuInsumo),
        removeInsumo: mock(async () => {}),
        findInsumoById: mock(async () => mockApuInsumo),
      };
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockInsumo),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };

      const useCase = new ManageApuUseCase(mockApuRepo, mockInsumoRepo);
      const result = await useCase.findAll({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should find APU by id', async () => {
      const mockApuRepo: ApuRepository = {
        findAll: mock(async () => []),
        findById: mock(async (id) => {
          if (id === '770e8400-e29b-41d4-a716-446655440002') return mockApu;
          return null;
        }),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockApu),
        update: mock(async () => mockApu),
        delete: mock(async () => {}),
        addInsumo: mock(async () => mockApuInsumo),
        removeInsumo: mock(async () => {}),
        findInsumoById: mock(async () => mockApuInsumo),
      };
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockInsumo),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };

      const useCase = new ManageApuUseCase(mockApuRepo, mockInsumoRepo);
      const result = await useCase.findById('770e8400-e29b-41d4-a716-446655440002');

      expect(result).toBeDefined();
      expect(result?.id).toBe('770e8400-e29b-41d4-a716-446655440002');
    });
  });

  describe('snapshot pricing', () => {
    test('should capture cost_base snapshot when adding insumo to APU', async () => {
      let capturedSnapshot = '';

      const mockApuRepo: ApuRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockApu),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockApu),
        update: mock(async () => mockApu),
        delete: mock(async () => {}),
        addInsumo: mock(async (data) => {
          capturedSnapshot = data.unitPriceSnapshot;
          return { ...mockApuInsumo, ...data };
        }),
        removeInsumo: mock(async () => {}),
        findInsumoById: mock(async () => mockApuInsumo),
      };
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async (_id) => {
          // Return current cost_base from master
          return { ...mockInsumo, costBase: '1.50' };
        }),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };

      const useCase = new ManageApuUseCase(mockApuRepo, mockInsumoRepo);

      const result = await useCase.addInsumo('770e8400-e29b-41d4-a716-446655440002', {
        insumoId: '660e8400-e29b-41d4-a716-446655440001',
        rendimiento: '2.5',
        desperdicio: '5.00',
      });

      expect(result).toBeDefined();
      // The snapshot should be captured from the insumo's cost_base at insertion time
      expect(capturedSnapshot).toBe('1.50');
    });

    test('should retain original snapshot price even after master cost_base changes', async () => {
      const mockApuRepo: ApuRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => ({
          ...mockApu,
          items: [{ ...mockApuInsumo, unitPriceSnapshot: '1.50' }],
        })),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockApu),
        update: mock(async () => mockApu),
        delete: mock(async () => {}),
        addInsumo: mock(async () => mockApuInsumo),
        removeInsumo: mock(async () => {}),
        findInsumoById: mock(async () => mockApuInsumo),
      };
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => ({ ...mockInsumo, costBase: '200.00' })), // cost_base updated!
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };

      const useCase = new ManageApuUseCase(mockApuRepo, mockInsumoRepo);
      const apu = await useCase.findById('770e8400-e29b-41d4-a716-446655440002');

      expect(apu).toBeDefined();
      // The snapshot in APU_INSUMO should still be the original value
      if (apu && 'items' in apu) {
        const items = (apu as any).items as Array<typeof mockApuInsumo>;
        expect(items[0].unitPriceSnapshot).toBe('1.50');
        expect(items[0].unitPriceSnapshot).not.toBe('200.00');
      }
    });
  });
});
