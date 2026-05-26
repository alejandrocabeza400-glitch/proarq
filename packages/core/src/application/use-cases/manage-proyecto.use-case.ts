import type { Proyecto } from '../../domain/entities/proyecto.entity';
import { AppError } from '../../errors/app.error';
import type { AuditRepository } from '../ports/out/audit-repository.port';
import type { ProyectoFilters, ProyectoRepository } from '../ports/out/proyecto-repository.port';

export class ManageProyectoUseCase {
  constructor(
    private readonly proyectoRepo: ProyectoRepository,
    private readonly auditRepo?: AuditRepository,
  ) {}

  async create(data: {
    nombre: string;
    descripcion?: string | null;
    estado: string;
    clienteId?: string | null;
    createdBy?: string | null;
  }): Promise<Proyecto> {
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigo = `PRJ-${datePart}-${randomPart}`;

    const proyecto = await this.proyectoRepo.create({
      ...data,
      codigo,
    });

    if (this.auditRepo && data.createdBy) {
      await this.auditRepo.create({
        tableName: 'proyectos',
        recordId: proyecto.id,
        action: 'INSERT',
        userId: data.createdBy,
        dataHistory: {
          before: {},
          after: { codigo: proyecto.codigo, nombre: proyecto.nombre, estado: proyecto.estado },
        },
      });
    }

    return proyecto;
  }

  async findAll(filters?: ProyectoFilters): Promise<Proyecto[]> {
    return this.proyectoRepo.findAll(filters);
  }

  async findById(id: string): Promise<Proyecto | null> {
    return this.proyectoRepo.findById(id);
  }

  async update(
    id: string,
    data: {
      nombre?: string;
      descripcion?: string | null;
      estado?: string;
      clienteId?: string | null;
    },
    actorUserId?: string,
  ): Promise<Proyecto> {
    const existing = await this.proyectoRepo.findById(id);
    if (!existing) {
      throw new AppError('Project not found', 404);
    }

    const before = {
      nombre: existing.nombre,
      descripcion: existing.descripcion,
      estado: existing.estado,
      clienteId: existing.clienteId,
    };

    const updated = await this.proyectoRepo.update(id, data);

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'proyectos',
        recordId: id,
        action: 'UPDATE',
        userId: actorUserId,
        dataHistory: { before, after: { nombre: updated.nombre, estado: updated.estado } },
      });
    }

    return updated;
  }

  async delete(id: string, actorUserId?: string): Promise<void> {
    const existing = await this.proyectoRepo.findById(id);
    if (!existing) {
      throw new AppError('Project not found', 404);
    }

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'proyectos',
        recordId: id,
        action: 'DELETE',
        userId: actorUserId,
        dataHistory: {
          before: { codigo: existing.codigo, nombre: existing.nombre, estado: existing.estado },
          after: {},
        },
      });
    }

    return this.proyectoRepo.delete(id);
  }
}
