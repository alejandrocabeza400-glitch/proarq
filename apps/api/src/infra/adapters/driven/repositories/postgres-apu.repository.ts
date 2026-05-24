import { NotFoundError } from '@proarq/core';
import type {
  ApuFilters,
  ApuRepository,
} from '@proarq/core/application/ports/out/apu-repository.port';
import type { Apu } from '@proarq/core/domain/entities/apu.entity';
import type { ApuInsumo } from '@proarq/core/domain/entities/apu-insumo.entity';
import { and, eq, like, sql } from 'drizzle-orm';
import { db } from '../database/connection';
import { apus } from '../database/schema/apu.schema';
import { apuInsumos } from '../database/schema/apu-insumo.schema';

export const postgresApuRepo: ApuRepository = {
  async findAll(filters?: ApuFilters): Promise<Apu[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.codigo) {
      conditions.push(like(apus.codigo, `%${filters.codigo}%`));
    }

    const query = db.select().from(apus);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const offset = (page - 1) * limit;

    return query.limit(limit).offset(offset);
  },

  async findById(id: string): Promise<(Apu & { items?: ApuInsumo[] }) | null> {
    const [apuResult] = await db.select().from(apus).where(eq(apus.id, id)).limit(1);
    if (!apuResult) return null;

    const items = await db.select().from(apuInsumos).where(eq(apuInsumos.apuId, id));

    return { ...apuResult, items: items || [] };
  },

  async findByCodigo(codigo: string): Promise<Apu | null> {
    const result = await db.select().from(apus).where(eq(apus.codigo, codigo)).limit(1);
    return result[0] ?? null;
  },

  async create(data: {
    codigo: string;
    nombre: string;
    tipo: string;
    createdBy: string;
  }): Promise<Apu> {
    const [apu] = await db
      .insert(apus)
      .values({
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        createdBy: data.createdBy,
      })
      .returning();
    return apu;
  },

  async update(id: string, data: { nombre?: string; tipo?: string }): Promise<Apu> {
    const updateData: Record<string, any> = { updatedAt: sql`NOW()` };
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;

    const [apu] = await db.update(apus).set(updateData).where(eq(apus.id, id)).returning();

    if (!apu) throw new NotFoundError('APU');
    return apu;
  },

  async delete(id: string): Promise<void> {
    const existing = await db.select().from(apus).where(eq(apus.id, id)).limit(1);
    if (!existing[0]) {
      throw new NotFoundError('APU');
    }
    await db.delete(apus).where(eq(apus.id, id));
  },

  async addInsumo(data: {
    apuId: string;
    insumoId: string;
    rendimiento: string;
    desperdicio: string;
    unitPriceSnapshot: string;
  }): Promise<ApuInsumo> {
    const [item] = await db
      .insert(apuInsumos)
      .values({
        apuId: data.apuId,
        insumoId: data.insumoId,
        rendimiento: data.rendimiento,
        desperdicio: data.desperdicio,
        unitPriceSnapshot: data.unitPriceSnapshot,
      })
      .returning();
    return item;
  },

  async removeInsumo(itemId: string): Promise<void> {
    const existing = await db.select().from(apuInsumos).where(eq(apuInsumos.id, itemId)).limit(1);
    if (!existing[0]) {
      throw new NotFoundError('ApuInsumo');
    }
    await db.delete(apuInsumos).where(eq(apuInsumos.id, itemId));
  },

  async findInsumoById(itemId: string): Promise<ApuInsumo | null> {
    const result = await db.select().from(apuInsumos).where(eq(apuInsumos.id, itemId)).limit(1);
    return result[0] ?? null;
  },
};
