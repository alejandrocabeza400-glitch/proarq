import type {
  CotizacionFilters,
  CotizacionRepository,
  CotizacionWithItems,
} from '@proarq/core/application/ports/out/cotizacion-repository.port';
import type { Cotizacion } from '@proarq/core/domain/entities/cotizacion.entity';
import type { CotizacionItem } from '@proarq/core/domain/entities/cotizacion-item.entity';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../database/connection';
import { cotizaciones } from '../database/schema/cotizacion.schema';
import { cotizacionItems } from '../database/schema/cotizacion-item.schema';

export const postgresCotizacionRepo: CotizacionRepository = {
  async findAll(filters?: CotizacionFilters): Promise<Cotizacion[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.projectoId) {
      conditions.push(eq(cotizaciones.projectoId, filters.projectoId));
    }
    if (filters?.estado) {
      conditions.push(eq(cotizaciones.estado, filters.estado));
    }

    const query = db.select().from(cotizaciones);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const offset = (page - 1) * limit;

    return query.limit(limit).offset(offset);
  },

  async findById(id: string): Promise<CotizacionWithItems | null> {
    const [result] = await db.select().from(cotizaciones).where(eq(cotizaciones.id, id)).limit(1);
    if (!result) return null;

    const items = await db
      .select()
      .from(cotizacionItems)
      .where(eq(cotizacionItems.cotizacionId, id));

    return { ...result, items: items || [] };
  },

  async create(data: {
    projectoId: string;
    codigo: string;
    version?: number;
    estado?: string;
    clienteId?: string | null;
    totalCostDirect?: string;
    factorAPercentage?: string;
    factorBPercentage?: string;
    profitMarginPercent?: string;
    totalAmount?: string;
    createdBy: string;
    items?: Array<{ apuId: string; cantidad: string; calculatedCostDirect: string }>;
  }): Promise<Cotizacion> {
    const [cotizacion] = await db
      .insert(cotizaciones)
      .values({
        projectoId: data.projectoId,
        codigo: data.codigo,
        version: data.version ?? 1,
        estado: data.estado ?? 'BORRADOR',
        clienteId: data.clienteId ?? null,
        totalCostDirect: data.totalCostDirect ?? '0',
        factorAPercentage: data.factorAPercentage ?? '0',
        factorBPercentage: data.factorBPercentage ?? '0',
        profitMarginPercent: data.profitMarginPercent ?? '0',
        totalAmount: data.totalAmount ?? '0',
        createdBy: data.createdBy,
      })
      .returning();

    // Create items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await db.insert(cotizacionItems).values({
          cotizacionId: cotizacion.id,
          apuId: item.apuId,
          cantidad: item.cantidad,
          calculatedCostDirect: item.calculatedCostDirect,
        });
      }
    }

    return cotizacion;
  },

  async update(
    id: string,
    data: {
      estado?: string;
      clienteId?: string | null;
      totalCostDirect?: string;
      factorAPercentage?: string;
      factorBPercentage?: string;
      profitMarginPercent?: string;
      totalAmount?: string;
    },
  ): Promise<Cotizacion> {
    const updateData: Record<string, any> = { updatedAt: sql`NOW()` };
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.clienteId !== undefined) updateData.clienteId = data.clienteId;
    if (data.totalCostDirect !== undefined) updateData.totalCostDirect = data.totalCostDirect;
    if (data.factorAPercentage !== undefined) updateData.factorAPercentage = data.factorAPercentage;
    if (data.factorBPercentage !== undefined) updateData.factorBPercentage = data.factorBPercentage;
    if (data.profitMarginPercent !== undefined)
      updateData.profitMarginPercent = data.profitMarginPercent;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;

    const [cotizacion] = await db
      .update(cotizaciones)
      .set(updateData)
      .where(eq(cotizaciones.id, id))
      .returning();

    if (!cotizacion) throw new Error('Cotizacion not found');
    return cotizacion;
  },

  async delete(id: string): Promise<void> {
    await db.delete(cotizaciones).where(eq(cotizaciones.id, id));
  },

  async cloneQuote(id: string, newVersion: number): Promise<Cotizacion> {
    const original = await this.findById(id);
    if (!original) throw new Error('Cotizacion not found');

    // Create new cotizacion (clone)
    const [cloned] = await db
      .insert(cotizaciones)
      .values({
        projectoId: original.projectoId,
        codigo: `${original.codigo}-V${newVersion}`,
        version: newVersion,
        estado: 'BORRADOR',
        clienteId: original.clienteId,
        totalCostDirect: original.totalCostDirect,
        factorAPercentage: original.factorAPercentage,
        factorBPercentage: original.factorBPercentage,
        profitMarginPercent: original.profitMarginPercent,
        totalAmount: original.totalAmount,
        createdBy: original.createdBy,
      })
      .returning();

    // Clone items
    if (original.items) {
      for (const item of original.items) {
        await db.insert(cotizacionItems).values({
          cotizacionId: cloned.id,
          apuId: item.apuId,
          cantidad: item.cantidad,
          calculatedCostDirect: item.calculatedCostDirect,
        });
      }
    }

    return cloned;
  },

  async countVersionsByProject(projectoId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(cotizaciones)
      .where(eq(cotizaciones.projectoId, projectoId));
    return Number(result[0]?.count ?? 0);
  },

  async createItem(data: {
    cotizacionId: string;
    apuId: string;
    cantidad: string;
    calculatedCostDirect: string;
  }): Promise<CotizacionItem> {
    const [item] = await db
      .insert(cotizacionItems)
      .values({
        cotizacionId: data.cotizacionId,
        apuId: data.apuId,
        cantidad: data.cantidad,
        calculatedCostDirect: data.calculatedCostDirect,
      })
      .returning();
    return item;
  },

  async findItemsByCotizacionId(cotizacionId: string): Promise<CotizacionItem[]> {
    return db.select().from(cotizacionItems).where(eq(cotizacionItems.cotizacionId, cotizacionId));
  },

  async deleteItemsByCotizacionId(cotizacionId: string): Promise<void> {
    await db.delete(cotizacionItems).where(eq(cotizacionItems.cotizacionId, cotizacionId));
  },
};
