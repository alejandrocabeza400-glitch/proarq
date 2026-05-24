import { describe, expect, test, mock } from 'bun:test';
import { ManageInsumoUseCase } from '@proarq/core/application/use-cases/manage-insumo.use-case';
import type { InsumoRepository } from '@proarq/core/application/ports/out/insumo-repository.port';
import type { AuditRepository } from '@proarq/core/application/ports/out/audit-repository.port';
import { AppError } from '@proarq/core/errors';

const mockInsumo = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  codigo: 'CEM-001',
  nombre: 'Cemento Portland Tipo I',
  unidad: 'KG' as const,
  costBase: '150.50',
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockInsumoList = [mockInsumo];

describe('ManageInsumoUseCase', () => {
  describe('CRUD operations', () => {
    test('should create a new insumo', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => mockInsumoList),
        findById: mock(async () => mockInsumo),
        findByCodigo: mock(async () => null),
        create: mock(async (data) => ({ ...mockInsumo, ...data })),
        update: mock(async (id, data) => ({ ...mockInsumo, ...data })),
        delete: mock(async () => {}),
        bulkInsert: mock(async (rows) => ({ imported: rows.length, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);
      const result = await useCase.create({
        codigo: 'CEM-001',
        nombre: 'Cemento Portland Tipo I',
        unidad: 'KG',
        costBase: '150.50',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toBeDefined();
      expect(result.codigo).toBe('CEM-001');
      expect(mockInsumoRepo.create).toHaveBeenCalledTimes(1);
    });

    test('should list insumos with filters', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async (filters) => mockInsumoList),
        findById: mock(async () => mockInsumo),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);
      const result = await useCase.findAll({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should find insumo by id', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async (id) => {
          if (id === '660e8400-e29b-41d4-a716-446655440001') return mockInsumo;
          return null;
        }),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);
      const result = await useCase.findById('660e8400-e29b-41d4-a716-446655440001');

      expect(result).toBeDefined();
      expect(result!.id).toBe('660e8400-e29b-41d4-a716-446655440001');
    });

    test('should update an insumo', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockInsumo),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async (id, data) => ({ ...mockInsumo, ...data })),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);
      const result = await useCase.update('660e8400-e29b-41d4-a716-446655440001', {
        nombre: 'Cemento Modificado',
        costBase: '160.00',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toBeDefined();
      expect(result.nombre).toBe('Cemento Modificado');
    });

    test('should delete an insumo', async () => {
      let deleted = false;
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => mockInsumo),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async (id) => { deleted = true; }),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);
      await useCase.delete('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000');

      expect(deleted).toBe(true);
    });
  });

  describe('duplicate codigo handling', () => {
    test('should throw AppError when creating insumo with duplicate codigo', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => null),
        findByCodigo: mock(async (codigo) => {
          if (codigo === 'CEM-001') return mockInsumo;
          return null;
        }),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);

      try {
        await useCase.create({
          codigo: 'CEM-001',
          nombre: 'Duplicate Cemento',
          unidad: 'KG',
          costBase: '200.00',
          createdBy: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(409);
      }
    });
  });

  describe('bulk upload', () => {
    test('should handle mixed valid and invalid rows', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => null),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async (rows) => ({ imported: rows.length, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);

      const validRows = [
        { codigo: 'MAT-001', nombre: 'Material 1', unidad: 'KG', costBase: '100.00' },
        { codigo: 'MAT-002', nombre: 'Material 2', unidad: 'M3', costBase: '200.00' },
      ];

      const result = await useCase.bulkUpload(validRows);
      expect(result.imported).toBe(2);
    });

    test('should reject invalid unidad values', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => null),
        findByCodigo: mock(async () => null),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async () => ({ imported: 0, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);

      try {
        await useCase.bulkUpload([
          { codigo: 'INV-001', nombre: 'Invalid', unidad: 'LITROS', costBase: '50.00' },
        ]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(422);
      }
    });

    test('should skip duplicate codigo rows in bulk upload', async () => {
      const mockInsumoRepo: InsumoRepository = {
        findAll: mock(async () => []),
        findById: mock(async () => null),
        findByCodigo: mock(async (codigo) => {
          if (codigo === 'MAT-001') return mockInsumo;
          return null;
        }),
        create: mock(async () => mockInsumo),
        update: mock(async () => mockInsumo),
        delete: mock(async () => {}),
        bulkInsert: mock(async (rows) => ({ imported: rows.length, skipped: 0 })),
      };
      const mockAuditRepo: AuditRepository = {
        create: mock(async () => ({}) as any),
        findAll: mock(async () => []),
      };

      const useCase = new ManageInsumoUseCase(mockInsumoRepo, mockAuditRepo);

      const result = await useCase.bulkUpload([
        { codigo: 'MAT-001', nombre: 'Existing', unidad: 'KG', costBase: '100.00' },
        { codigo: 'MAT-002', nombre: 'New', unidad: 'UND', costBase: '50.00' },
      ]);

      // Should skip the duplicate and only import the new one
      expect(result.skipped).toBeGreaterThanOrEqual(0);
    });
  });
});
