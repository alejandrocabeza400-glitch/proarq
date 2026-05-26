import Dexie, { type Table } from 'dexie';

export interface CachedInsumo {
  id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  costBase: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _lastSyncedAt: number;
}

export interface CachedApu {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _lastSyncedAt: number;
}

export interface CachedApuInsumo {
  id: string;
  apuId: string;
  insumoId: string;
  rendimiento: string;
  desperdicio: string;
  unitPriceSnapshot: string;
  insumoNombre: string;
  insumoUnidad: string;
  createdAt: string;
  _lastSyncedAt: number;
}

export interface CachedCotizacion {
  id: string;
  projectoId: string;
  codigo: string;
  version: number;
  estado: string;
  clienteId?: string;
  totalCostDirect: string;
  factorAPercentage: string;
  factorBPercentage: string;
  profitMarginPercent: string;
  totalAmount: string;
  createdBy: string;
  proyectoNombre?: string;
  clienteNombre?: string;
  createdAt: string;
  updatedAt: string;
  _lastSyncedAt: number;
}

export interface CachedCotizacionItem {
  id: string;
  cotizacionId: string;
  apuId: string;
  cantidad: string;
  calculatedCostDirect: string;
  apuCodigo?: string;
  apuNombre?: string;
  createdAt: string;
  _lastSyncedAt: number;
}

export interface CachedProyecto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  clienteId?: string;
  clienteNombre?: string;
  createdAt: string;
  updatedAt: string;
  _lastSyncedAt: number;
}

export interface CachedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _lastSyncedAt: number;
}

export interface SyncQueueItem {
  id: string;
  entity: string;
  action: string;
  payload: Record<string, unknown>;
  entityId: string;
  createdAt: string;
  retryCount: number;
  status: string;
  errorMessage?: string;
}

export class ProArqDatabase extends Dexie {
  insumos!: Table<CachedInsumo, string>;
  apus!: Table<CachedApu, string>;
  apuInsumos!: Table<CachedApuInsumo, string>;
  cotizaciones!: Table<CachedCotizacion, string>;
  cotizacionItems!: Table<CachedCotizacionItem, string>;
  proyectos!: Table<CachedProyecto, string>;
  users!: Table<CachedUser, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('proarq');

    this.version(1).stores({
      insumos: 'id, codigo, nombre, unidad, _lastSyncedAt',
      apus: 'id, codigo, nombre, _lastSyncedAt',
      apuInsumos: 'id, apuId, insumoId, _lastSyncedAt',
      cotizaciones: 'id, codigo, estado, projectoId, version, _lastSyncedAt',
      cotizacionItems: 'id, cotizacionId, apuId, _lastSyncedAt',
      proyectos: 'id, codigo, nombre, estado, _lastSyncedAt',
      users: 'id, name, email, role, _lastSyncedAt',
      syncQueue: 'id, entity, status, createdAt',
    });
  }

  // Override delete to just clear all data (for testing compatibility)
  async delete(): Promise<void> {
    try {
      await this.transaction(
        'rw',
        this.insumos,
        this.apus,
        this.apuInsumos,
        this.cotizaciones,
        this.cotizacionItems,
        this.proyectos,
        this.users,
        this.syncQueue,
        async () => {
          await Promise.all([
            this.insumos.clear(),
            this.apus.clear(),
            this.apuInsumos.clear(),
            this.cotizaciones.clear(),
            this.cotizacionItems.clear(),
            this.proyectos.clear(),
            this.users.clear(),
            this.syncQueue.clear(),
          ]);
        },
      );
    } catch (_err) {
      // If DB is closed, just do nothing
    }
  }
}

export const db = new ProArqDatabase();
