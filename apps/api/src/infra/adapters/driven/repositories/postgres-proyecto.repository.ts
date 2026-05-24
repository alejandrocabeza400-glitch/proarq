import { NotFoundError } from '@proarq/core';
import type {
  ProyectoFilters,
  ProyectoRepository,
} from '@proarq/core/application/ports/out/proyecto-repository.port';
import type { Proyecto } from '@proarq/core/domain/entities/proyecto.entity';
import { and, eq, like, sql } from 'drizzle-orm';
import { db } from '../database/connection';
import { proyectos } from '../database/schema/proyecto.schema';

export const postgresProyectoRepo: ProyectoRepository = {
  async findByCodigo(codigo: string): Promise<Proyecto | null> {
    const result = await db.select().from(proyectos).where(eq(proyectos.codigo, codigo)).limit(1);
    return (result[0] as unknown as Proyecto) ?? null;
  },

  async findById(id: string): Promise<Proyecto | null> {
    const result = await db.select().from(proyectos).where(eq(proyectos.id, id)).limit(1);
    return (result[0] as unknown as Proyecto) ?? null;
  },

  async findAll(filters?: ProyectoFilters): Promise<Proyecto[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.codigo) {
      conditions.push(like(proyectos.codigo, `%${filters.codigo}%`));
    }
    if (filters?.nombre) {
      conditions.push(like(proyectos.nombre, `%${filters.nombre}%`));
    }
    if (filters?.estado) {
      conditions.push(eq(proyectos.estado, filters.estado));
    }

    const query = db.select().from(proyectos);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const offset = (page - 1) * limit;

    return query.limit(limit).offset(offset) as unknown as Promise<Proyecto[]>;
  },

  async create(data: {
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    estado: string;
    clienteId?: string | null;
    createdBy?: string | null;
  }): Promise<Proyecto> {
    const [proyecto] = await db
      .insert(proyectos)
      .values({
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: data.estado,
        clienteId: data.clienteId,
        createdBy: data.createdBy,
      })
      .returning();
    return proyecto as unknown as Proyecto;
  },

  async update(
    id: string,
    data: Partial<Pick<Proyecto, 'nombre' | 'descripcion' | 'estado' | 'clienteId'>>,
  ): Promise<Proyecto> {
    const [proyecto] = await db
      .update(proyectos)
      .set({ ...data, updatedAt: sql`NOW()` })
      .where(eq(proyectos.id, id))
      .returning();

    if (!proyecto) {
      throw new NotFoundError('Project');
    }
    return proyecto as unknown as Proyecto;
  },

  async delete(id: string): Promise<void> {
    const existing = await db.select().from(proyectos).where(eq(proyectos.id, id)).limit(1);
    if (!existing[0]) {
      throw new NotFoundError('Project');
    }
    await db.delete(proyectos).where(eq(proyectos.id, id));
  },
};
