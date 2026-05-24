import { db } from '../database/connection';
import { insumosMaestro } from '../database/schema/insumo.schema';
import { apus } from '../database/schema/apu.schema';
import { apuInsumos } from '../database/schema/apu-insumo.schema';
import { cotizaciones } from '../database/schema/cotizacion.schema';
import { cotizacionItems } from '../database/schema/cotizacion-item.schema';

/**
 * Sync handler — batch inserts with ON CONFLICT DO NOTHING for idempotent offline-first sync.
 * Extracted from sync.routes.ts for SRP and DRY compliance.
 */

type RowMapper<T> = (row: any) => T;

function createInserter<T>(insertFn: (values: T) => any, mapRow: RowMapper<T>) {
  return async (rows: any[]): Promise<number> => {
    let count = 0;
    for (const row of rows) {
      try {
        await insertFn(mapRow(row));
        count++;
      } catch {
        // ON CONFLICT DO NOTHING — conflict skipped
      }
    }
    return count;
  };
}

const insertInsumo = createInserter(
  (values: any) =>
    db.insert(insumosMaestro).values(values).onConflictDoNothing(),
  (row: any) => ({
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    unidad: row.unidad,
    costBase: row.cost_base,
    createdBy: row.created_by || null,
  }),
);

const insertApu = createInserter(
  (values: any) =>
    db.insert(apus).values(values).onConflictDoNothing(),
  (row: any) => ({
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    tipo: row.tipo,
    createdBy: row.created_by || null,
  }),
);

const insertApuInsumo = createInserter(
  (values: any) =>
    db.insert(apuInsumos).values(values).onConflictDoNothing(),
  (row: any) => ({
    id: row.id,
    apuId: row.apu_id,
    insumoId: row.insumo_id,
    rendimiento: row.rendimiento,
    desperdicio: row.desperdicio || '0',
    unitPriceSnapshot: row.unit_price_snapshot,
  }),
);

const insertCotizacion = createInserter(
  (values: any) =>
    db.insert(cotizaciones).values(values).onConflictDoNothing(),
  (row: any) => ({
    id: row.id,
    projectoId: row.projecto_id,
    codigo: row.codigo,
    version: row.version || 1,
    estado: row.estado || 'BORRADOR',
    clienteId: row.cliente_id || null,
    createdBy: row.created_by || null,
  }),
);

const insertCotizacionItem = createInserter(
  (values: any) =>
    db.insert(cotizacionItems).values(values).onConflictDoNothing(),
  (row: any) => ({
    id: row.id,
    cotizacionId: row.cotizacion_id,
    apuId: row.apu_id,
    cantidad: row.cantidad,
  }),
);

export const syncHandler = {
  insertInsumos: insertInsumo,
  insertApus: insertApu,
  insertApuInsumos: insertApuInsumo,
  insertCotizaciones: insertCotizacion,
  insertCotizacionItems: insertCotizacionItem,
};
