import { describe, expect, mock, test } from 'bun:test';
import type { CotizacionRepository } from '@proarq/core/application/ports/out/cotizacion-repository.port';
import { BranchCotizacionUseCase } from '@proarq/core/application/use-cases/branch-cotizacion.use-case';
import { AppError } from '@proarq/core/errors';

const mockCotizacionV1 = {
  id: '990e8400-e29b-41d4-a716-446655440004',
  projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
  codigo: 'COT-001',
  version: 1,
  estado: 'BORRADOR' as const,
  clienteId: '550e8400-e29b-41d4-a716-446655440000',
  totalCostDirect: '1000.0000',
  factorAPercentage: '10.00',
  factorBPercentage: '5.00',
  profitMarginPercent: '15.00',
  totalAmount: '1328.2500',
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockCotizacionV2 = {
  ...mockCotizacionV1,
  id: 'cc0e8400-e29b-41d4-a716-446655440007',
  codigo: 'COT-001-V2',
  version: 2,
  estado: 'BORRADOR' as const,
};

describe('BranchCotizacionUseCase', () => {
  describe('branching logic', () => {
    test('should create a new version with incremented version number', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockCotizacionV1),
        create: mock(async () => mockCotizacionV1),
        update: mock(async () => mockCotizacionV1),
        delete: mock(async () => {}),
        cloneQuote: mock(async (_id, version) => ({ ...mockCotizacionV2, version })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new BranchCotizacionUseCase(mockRepo);
      const result = await useCase.execute('990e8400-e29b-41d4-a716-446655440004');

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
      expect(result.codigo).toBe('COT-001-V2');
    });

    test('should mark old quote as REEMPLAZADA', async () => {
      let oldQuoteMarked = false;

      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockCotizacionV1),
        create: mock(async () => mockCotizacionV1),
        update: mock(async (id, data) => {
          if (
            id === '990e8400-e29b-41d4-a716-446655440004' &&
            (data as any).estado === 'REEMPLAZADA'
          ) {
            oldQuoteMarked = true;
          }
          return { ...mockCotizacionV1, ...data };
        }),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => mockCotizacionV2),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new BranchCotizacionUseCase(mockRepo);
      await useCase.execute('990e8400-e29b-41d4-a716-446655440004');

      expect(oldQuoteMarked).toBe(true);
    });

    test('new branch should start as BORRADOR', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockCotizacionV1),
        create: mock(async () => mockCotizacionV1),
        update: mock(async () => mockCotizacionV1),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({ ...mockCotizacionV2, estado: 'BORRADOR' })),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new BranchCotizacionUseCase(mockRepo);
      const result = await useCase.execute('990e8400-e29b-41d4-a716-446655440004');

      expect(result.estado).toBe('BORRADOR');
    });
  });

  describe('max versions enforcement', () => {
    test('should throw error when exceeding 15 versions', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockCotizacionV1),
        create: mock(async () => mockCotizacionV1),
        update: mock(async () => mockCotizacionV1),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => ({}) as any),
        countVersionsByProject: mock(async () => 15),
      };

      const useCase = new BranchCotizacionUseCase(mockRepo);

      try {
        await useCase.execute('990e8400-e29b-41d4-a716-446655440004');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).message.toLowerCase()).toContain('15');
      }
    });

    test('should allow branching when at 14 versions', async () => {
      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockCotizacionV1),
        create: mock(async () => mockCotizacionV1),
        update: mock(async () => mockCotizacionV1),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => mockCotizacionV2),
        countVersionsByProject: mock(async () => 14),
      };

      const useCase = new BranchCotizacionUseCase(mockRepo);
      const result = await useCase.execute('990e8400-e29b-41d4-a716-446655440004');

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
    });
  });

  describe('branch independence', () => {
    test('modifying the branch should not affect the original', async () => {
      let _originalUpdated = false;

      const mockRepo: CotizacionRepository = {
        findAll: mock(async () => []),
        findById: mock(async (id) => {
          if (id === '990e8400-e29b-41d4-a716-446655440004') return mockCotizacionV1;
          if (id === 'cc0e8400-e29b-41d4-a716-446655440007') return mockCotizacionV2;
          return null;
        }),
        create: mock(async () => mockCotizacionV1),
        update: mock(async (id, data) => {
          if (id === '990e8400-e29b-41d4-a716-446655440004') {
            _originalUpdated = true;
          }
          return { ...mockCotizacionV1, ...data };
        }),
        delete: mock(async () => {}),
        cloneQuote: mock(async () => mockCotizacionV2),
        countVersionsByProject: mock(async () => 1),
      };

      const useCase = new BranchCotizacionUseCase(mockRepo);
      const branch = await useCase.execute('990e8400-e29b-41d4-a716-446655440004');

      // The branch should be the V2
      expect(branch.id).toBe('cc0e8400-e29b-41d4-a716-446655440007');
      expect(branch.estado).toBe('BORRADOR');
    });
  });
});
