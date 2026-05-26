import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetMocks } from '../setup';

describe('Offline Database (Dexie.js)', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(async () => {
    // Clean up database after each test
    try {
      const { db } = await import('../../services/storage/database');
      await db.delete();
    } catch {
      // DB might not exist yet
    }
  });

  describe('Database initialization', () => {
    it('should open database with correct name', async () => {
      const { db } = await import('../../services/storage/database');
      expect(db.name).toBe('proarq');
    });

    it('should create all required tables', async () => {
      const { db } = await import('../../services/storage/database');
      const tableNames = db.tables.map((t) => t.name);
      expect(tableNames).toContain('insumos');
      expect(tableNames).toContain('apus');
      expect(tableNames).toContain('apuInsumos');
      expect(tableNames).toContain('cotizaciones');
      expect(tableNames).toContain('cotizacionItems');
      expect(tableNames).toContain('proyectos');
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('syncQueue');
    });
  });

  describe('Insumos CRUD', () => {
    it('should insert an insumo and retrieve it', async () => {
      const { db } = await import('../../services/storage/database');

      const insumo = {
        id: 'ins-001',
        codigo: 'CEM-001',
        nombre: 'Cemento Portland',
        unidad: 'KG' as const,
        costBase: '8500.00',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _lastSyncedAt: Date.now(),
      };

      await db.insumos.add(insumo);
      const result = await db.insumos.get('ins-001');

      expect(result).toBeDefined();
      expect(result?.codigo).toBe('CEM-001');
      expect(result?.nombre).toBe('Cemento Portland');
    });

    it('should update an existing insumo', async () => {
      const { db } = await import('../../services/storage/database');

      const insumo = {
        id: 'ins-002',
        codigo: 'VAR-001',
        nombre: 'Varilla Corrugada',
        unidad: 'KG' as const,
        costBase: '3200.00',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _lastSyncedAt: Date.now(),
      };

      await db.insumos.add(insumo);
      await db.insumos.update('ins-002', { costBase: '3500.00' });

      const updated = await db.insumos.get('ins-002');
      expect(updated?.costBase).toBe('3500.00');
    });

    it('should delete an insumo', async () => {
      const { db } = await import('../../services/storage/database');

      await db.insumos.add({
        id: 'ins-003',
        codigo: 'ARE-001',
        nombre: 'Arena Lavada',
        unidad: 'M3' as const,
        costBase: '45000.00',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _lastSyncedAt: Date.now(),
      });

      await db.insumos.delete('ins-003');
      const result = await db.insumos.get('ins-003');
      expect(result).toBeUndefined();
    });

    it('should query insumos by indexed fields', async () => {
      const { db } = await import('../../services/storage/database');

      await db.insumos.bulkAdd([
        {
          id: 'i1',
          codigo: 'CEM-001',
          nombre: 'Cemento Portland',
          unidad: 'KG',
          costBase: '8500',
          createdBy: 'u1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
        {
          id: 'i2',
          codigo: 'VAR-001',
          nombre: 'Varilla',
          unidad: 'KG',
          costBase: '3200',
          createdBy: 'u1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
        {
          id: 'i3',
          codigo: 'ARE-001',
          nombre: 'Arena',
          unidad: 'M3',
          costBase: '45000',
          createdBy: 'u1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
      ]);

      const kgInsumos = await db.insumos.where('unidad').equals('KG').toArray();
      expect(kgInsumos.length).toBe(2);

      const byCodigo = await db.insumos.where('codigo').equals('CEM-001').first();
      expect(byCodigo).toBeDefined();
    });
  });

  describe('APUs CRUD', () => {
    it('should insert and retrieve an APU with items', async () => {
      const { db } = await import('../../services/storage/database');

      await db.apus.add({
        id: 'apu-001',
        codigo: 'APU-001',
        nombre: 'Muro de ladrillo',
        tipo: 'Estructural',
        createdBy: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        _lastSyncedAt: 1,
      });

      await db.apuInsumos.bulkAdd([
        {
          id: 'ai-1',
          apuId: 'apu-001',
          insumoId: 'i1',
          rendimiento: '1.5',
          desperdicio: '5',
          unitPriceSnapshot: '8500',
          insumoNombre: 'Cemento',
          insumoUnidad: 'KG',
          createdAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
        {
          id: 'ai-2',
          apuId: 'apu-001',
          insumoId: 'i2',
          rendimiento: '0.8',
          desperdicio: '3',
          unitPriceSnapshot: '500',
          insumoNombre: 'Ladrillo',
          insumoUnidad: 'UND',
          createdAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
      ]);

      const apu = await db.apus.get('apu-001');
      expect(apu).toBeDefined();
      expect(apu?.codigo).toBe('APU-001');

      const items = await db.apuInsumos.where('apuId').equals('apu-001').toArray();
      expect(items.length).toBe(2);
    });
  });

  describe('Cotizaciones CRUD', () => {
    it('should insert and query cotizaciones by status', async () => {
      const { db } = await import('../../services/storage/database');

      await db.cotizaciones.bulkAdd([
        {
          id: 'c1',
          projectoId: 'p1',
          codigo: 'COT-001',
          version: 1,
          estado: 'BORRADOR',
          totalCostDirect: '100000',
          factorAPercentage: '10',
          factorBPercentage: '5',
          profitMarginPercent: '8',
          totalAmount: '125000',
          createdBy: 'u1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
        {
          id: 'c2',
          projectoId: 'p1',
          codigo: 'COT-002',
          version: 1,
          estado: 'ENVIADA',
          totalCostDirect: '200000',
          factorAPercentage: '10',
          factorBPercentage: '5',
          profitMarginPercent: '8',
          totalAmount: '250000',
          createdBy: 'u1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
      ]);

      const borradores = await db.cotizaciones.where('estado').equals('BORRADOR').toArray();
      expect(borradores.length).toBe(1);

      const enviadas = await db.cotizaciones.where('estado').equals('ENVIADA').toArray();
      expect(enviadas.length).toBe(1);
    });

    it('should query cotizaciones by project', async () => {
      const { db } = await import('../../services/storage/database');

      const byProject = await db.cotizaciones.where('projectoId').equals('p1').toArray();
      expect(byProject).toBeDefined();
    });
  });

  describe('Sync Queue operations', () => {
    it('should enqueue a sync item with pending status', async () => {
      const { db } = await import('../../services/storage/database');

      await db.syncQueue.add({
        id: 'sq-001',
        entity: 'insumo',
        action: 'create',
        payload: { codigo: 'NEW-001', nombre: 'New Item', unidad: 'UND', costBase: '1000' },
        entityId: 'new-ins-001',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
      });

      const item = await db.syncQueue.get('sq-001');
      expect(item).toBeDefined();
      expect(item?.status).toBe('pending');
      expect(item?.retryCount).toBe(0);
    });

    it('should query pending sync items ordered by creation date', async () => {
      const { db } = await import('../../services/storage/database');

      await db.syncQueue.bulkAdd([
        {
          id: 'sq-1',
          entity: 'insumo',
          action: 'create',
          payload: {},
          entityId: 'e1',
          createdAt: '2024-01-01T00:00:00Z',
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'sq-2',
          entity: 'apu',
          action: 'update',
          payload: {},
          entityId: 'e2',
          createdAt: '2024-01-02T00:00:00Z',
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'sq-3',
          entity: 'cotizacion',
          action: 'delete',
          payload: {},
          entityId: 'e3',
          createdAt: '2024-01-03T00:00:00Z',
          retryCount: 0,
          status: 'syncing',
        },
      ]);

      const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

      expect(pendingItems.length).toBe(2);
      // Should be ordered by createdAt
      expect(pendingItems[0].entity).toBe('insumo');
    });

    it('should mark a sync item as synced', async () => {
      const { db } = await import('../../services/storage/database');

      await db.syncQueue.add({
        id: 'sq-004',
        entity: 'apu',
        action: 'create',
        payload: {},
        entityId: 'apu-1',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
      });

      await db.syncQueue.update('sq-004', { status: 'syncing' });
      let item = await db.syncQueue.get('sq-004');
      expect(item?.status).toBe('syncing');

      await db.syncQueue.update('sq-004', { status: 'synced' });
      item = await db.syncQueue.get('sq-004');
      expect(item?.status).toBe('synced');
    });

    it('should mark a sync item as failed with error message', async () => {
      const { db } = await import('../../services/storage/database');

      await db.syncQueue.add({
        id: 'sq-005',
        entity: 'insumo',
        action: 'create',
        payload: {},
        entityId: 'i1',
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
      });

      await db.syncQueue.update('sq-005', {
        status: 'failed',
        retryCount: 3,
        errorMessage: 'Network error after 3 retries',
      });

      const item = await db.syncQueue.get('sq-005');
      expect(item?.status).toBe('failed');
      expect(item?.retryCount).toBe(3);
      expect(item?.errorMessage).toBeDefined();
    });
  });

  describe('Projects CRUD', () => {
    it('should insert and retrieve projects', async () => {
      const { db } = await import('../../services/storage/database');

      await db.proyectos.add({
        id: 'p1',
        codigo: 'PRJ-001',
        nombre: 'Torre Norte',
        descripcion: 'Edificio de 20 pisos',
        estado: 'EN_EJECUCION',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        _lastSyncedAt: 1,
      });

      const project = await db.proyectos.get('p1');
      expect(project).toBeDefined();
      expect(project?.nombre).toBe('Torre Norte');
    });
  });

  describe('Users CRUD (cached)', () => {
    it('should insert and query cached users by role', async () => {
      const { db } = await import('../../services/storage/database');

      await db.users.bulkAdd([
        {
          id: 'u1',
          name: 'Admin',
          email: 'admin@test.com',
          role: 'ADMIN',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
        {
          id: 'u2',
          name: 'Client',
          email: 'client@test.com',
          role: 'CLIENTE',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _lastSyncedAt: 1,
        },
      ]);

      const admins = await db.users.where('role').equals('ADMIN').toArray();
      expect(admins.length).toBe(1);
    });
  });

  describe('Database versioning', () => {
    it('should have correct schema version', async () => {
      const { db } = await import('../../services/storage/database');
      expect(db.verno).toBe(1);
    });

    it('should have all required indexes on tables', async () => {
      const { db } = await import('../../services/storage/database');

      const insumosTable = db.insumos;
      // Should be able to query by any indexed field
      expect(typeof insumosTable.where).toBe('function');
    });
  });
});
