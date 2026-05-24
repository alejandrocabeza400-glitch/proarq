import { describe, expect, mock, test } from 'bun:test';
import type { AuditRepository } from '@proarq/core/application/ports/out/audit-repository.port';
import { AuditUseCase } from '@proarq/core/application/use-cases/audit.use-case';

const mockAuditLog = {
  id: 'dd0e8400-e29b-41d4-a716-446655440008',
  tableName: 'insumos_maestro',
  recordId: '660e8400-e29b-41d4-a716-446655440001',
  action: 'UPDATE' as const,
  userId: '550e8400-e29b-41d4-a716-446655440000',
  dataHistory: {
    before: { cost_base: '100.00', nombre: 'Cemento V1' },
    after: { cost_base: '150.00', nombre: 'Cemento V2' },
  },
  createdAt: new Date('2025-01-01'),
};

const mockAuditLogs = [mockAuditLog];

describe('AuditUseCase', () => {
  describe('creating audit logs', () => {
    test('should create an audit log entry', async () => {
      let createdEntry: any = null;

      const mockRepo: AuditRepository = {
        create: mock(async (data) => {
          createdEntry = data;
          return { ...mockAuditLog, ...data };
        }),
        findAll: mock(async () => mockAuditLogs),
      };

      const useCase = new AuditUseCase(mockRepo);
      const result = await useCase.createLog({
        tableName: 'insumos_maestro',
        recordId: '660e8400-e29b-41d4-a716-446655440001',
        action: 'UPDATE',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        dataHistory: {
          before: { cost_base: '100.00' },
          after: { cost_base: '150.00' },
        },
      });

      expect(result).toBeDefined();
      expect(createdEntry).not.toBeNull();
      expect(createdEntry.tableName).toBe('insumos_maestro');
    });

    test('should support INSERT, UPDATE, DELETE actions', async () => {
      const actions = ['INSERT', 'UPDATE', 'DELETE'] as const;
      const mockRepo: AuditRepository = {
        create: mock(async (data) => ({ ...mockAuditLog, ...data })),
        findAll: mock(async () => mockAuditLogs),
      };

      const useCase = new AuditUseCase(mockRepo);

      for (const action of actions) {
        const result = await useCase.createLog({
          tableName: 'insumos_maestro',
          recordId: '660e8400-e29b-41d4-a716-446655440001',
          action,
          userId: '550e8400-e29b-41d4-a716-446655440000',
          dataHistory: {
            before: {},
            after: { cost_base: '150.00' },
          },
        });

        expect(result).toBeDefined();
      }
    });
  });

  describe('JSONB diff storage', () => {
    test('should store correct before/after diff', async () => {
      let capturedDataHistory: any = null;

      const mockRepo: AuditRepository = {
        create: mock(async (data) => {
          capturedDataHistory = data.dataHistory;
          return { ...mockAuditLog, ...data };
        }),
        findAll: mock(async () => mockAuditLogs),
      };

      const before = { cost_base: '100.00', nombre: 'Original' };
      const after = { cost_base: '200.00', nombre: 'Updated' };

      const useCase = new AuditUseCase(mockRepo);
      await useCase.createLog({
        tableName: 'insumos_maestro',
        recordId: '660e8400-e29b-41d4-a716-446655440001',
        action: 'UPDATE',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        dataHistory: { before, after },
      });

      expect(capturedDataHistory).toBeDefined();
      expect(capturedDataHistory.before).toEqual(before);
      expect(capturedDataHistory.after).toEqual(after);
    });
  });

  describe('querying audit logs', () => {
    test('should return audit logs with filters', async () => {
      const mockRepo: AuditRepository = {
        create: mock(async () => mockAuditLog),
        findAll: mock(async (filters) => {
          if (filters?.tableName === 'insumos_maestro') return mockAuditLogs;
          return [];
        }),
      };

      const useCase = new AuditUseCase(mockRepo);
      const result = await useCase.findLogs({
        tableName: 'insumos_maestro',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should filter by record_id', async () => {
      const mockRepo: AuditRepository = {
        create: mock(async () => mockAuditLog),
        findAll: mock(async (filters) => {
          if (filters?.recordId === '660e8400-e29b-41d4-a716-446655440001') return mockAuditLogs;
          return [];
        }),
      };

      const useCase = new AuditUseCase(mockRepo);
      const result = await useCase.findLogs({
        recordId: '660e8400-e29b-41d4-a716-446655440001',
      });

      expect(result).toHaveLength(1);
    });

    test('should filter by user_id', async () => {
      const mockRepo: AuditRepository = {
        create: mock(async () => mockAuditLog),
        findAll: mock(async (filters) => {
          if (filters?.userId === '550e8400-e29b-41d4-a716-446655440000') return mockAuditLogs;
          return [];
        }),
      };

      const useCase = new AuditUseCase(mockRepo);
      const result = await useCase.findLogs({
        userId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toHaveLength(1);
    });
  });
});
