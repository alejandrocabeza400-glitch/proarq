import { db } from '../database/connection';
import { insumosMaestro } from '../database/schema/insumo.schema';
import { eq, like, and, sql } from 'drizzle-orm';
import type { InsumoRepository, InsumoFilters } from '@proarq/core/application/ports/out/insumo-repository.port';
import type { Insumo } from '@proarq/core/domain/entities/insumo.entity';
import { NotFoundError } from '@proarq/core';

export const postgresInsumoRepo: InsumoRepository = {
  async findAll(filters?: InsumoFilters): Promise<Insumo[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.codigo) {
      conditions.push(like(insumosMaestro.codigo, `%${filters.codigo}%`));
    }
    if (filters?.nombre) {
      conditions.push(like(insumosMaestro.nombre, `%${filters.nombre}%`));
    }
    if (filters?.unidad) {
      conditions.push(eq(insumosMaestro.unidad, filters.unidad));
    }

    const query = db.select().from(insumosMaestro);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const offset = (page - 1) * limit;

    return query.limit(limit).offset(offset);
  },

  async findById(id: string): Promise<Insumo | null> {
    const result = await db
      .select()
      .from(insumosMaestro)
      .where(eq(insumosMaestro.id, id))
      .limit(1);
    return result[0] ?? null;
  },

  async findByCodigo(codigo: string): Promise<Insumo | null> {
    const result = await db
      .select()
      .from(insumosMaestro)
      .where(eq(insumosMaestro.codigo, codigo))
      .limit(1);
    return result[0] ?? null;
  },

  async create(data: {
    codigo: string;
    nombre: string;
    unidad: string;
    costBase: string;
    createdBy: string;
  }): Promise<Insumo> {
    const [insumo] = await db
      .insert(insumosMaestro)
      .values({
        codigo: data.codigo,
        nombre: data.nombre,
        unidad: data.unidad,
        costBase: data.costBase,
        createdBy: data.createdBy,
      })
      .returning();
    return insumo;
  },

  async update(
    id: string,
    data: { nombre?: string; unidad?: string; costBase?: string },
  ): Promise<Insumo> {
    const updateData: Record<string, any> = { updatedAt: sql`NOW()` };
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.unidad !== undefined) updateData.unidad = data.unidad;
    if (data.costBase !== undefined) updateData.costBase = data.costBase;

    const [insumo] = await db
      .update(insumosMaestro)
      .set(updateData)
      .where(eq(insumosMaestro.id, id))
      .returning();

    if (!insumo) {
      throw new NotFoundError('Insumo');
    }
    return insumo;
  },

  async delete(id: string): Promise<void> {
    const existing = await db.select().from(insumosMaestro).where(eq(insumosMaestro.id, id)).limit(1);
    if (!existing[0]) {
      throw new NotFoundError('Insumo');
    }
    await db.delete(insumosMaestro).where(eq(insumosMaestro.id, id));
  },

  async bulkInsert(
    rows: Array<{
      codigo: string;
      nombre: string;
      unidad: string;
      costBase: string;
      createdBy?: string;
    }>,
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;

    // Process in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      for (const row of chunk) {
        try {
          await db.insert(insumosMaestro).values({
            codigo: row.codigo,
            nombre: row.nombre,
            unidad: row.unidad,
            costBase: row.costBase,
            createdBy: row.createdBy || null,
          });
          imported++;
        } catch {
          // Skip on conflict
        }
      }
    }

    return { imported, skipped: rows.length - imported };
  },
};
