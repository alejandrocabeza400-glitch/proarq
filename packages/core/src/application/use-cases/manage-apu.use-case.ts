import type { Apu } from '../../domain/entities/apu.entity';
import type { ApuInsumo } from '../../domain/entities/apu-insumo.entity';
import { AppError } from '../../errors/app.error';
import type { ApuRepository } from '../ports/out/apu-repository.port';
import type { AuditRepository } from '../ports/out/audit-repository.port';
import type { InsumoRepository } from '../ports/out/insumo-repository.port';

export class ManageApuUseCase {
  constructor(
    private readonly apuRepo: ApuRepository,
    private readonly insumoRepo: InsumoRepository,
    private readonly auditRepo?: AuditRepository,
  ) {}

  async create(data: {
    codigo: string;
    nombre: string;
    tipo: string;
    createdBy: string;
  }): Promise<Apu> {
    const existing = await this.apuRepo.findByCodigo(data.codigo);
    if (existing) {
      throw new AppError('APU with this code already exists', 409);
    }
    const apu = await this.apuRepo.create(data);

    if (this.auditRepo && data.createdBy) {
      await this.auditRepo.create({
        tableName: 'apus',
        recordId: apu.id,
        action: 'INSERT',
        userId: data.createdBy,
        dataHistory: {
          before: {},
          after: { codigo: apu.codigo, nombre: apu.nombre, tipo: apu.tipo },
        },
      });
    }

    return apu;
  }

  async findAll(filters?: { codigo?: string; page?: number; limit?: number }): Promise<Apu[]> {
    return this.apuRepo.findAll(filters);
  }

  async findById(id: string): Promise<(Apu & { items?: ApuInsumo[] }) | null> {
    return this.apuRepo.findById(id);
  }

  async update(
    id: string,
    data: { nombre?: string; tipo?: string },
    actorUserId?: string,
  ): Promise<Apu> {
    const existing = await this.apuRepo.findById(id);
    if (!existing) {
      throw new AppError('APU not found', 404);
    }
    const before = { nombre: existing.nombre, tipo: existing.tipo };
    const apu = await this.apuRepo.update(id, data);

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'apus',
        recordId: id,
        action: 'UPDATE',
        userId: actorUserId,
        dataHistory: { before, after: { nombre: apu.nombre, tipo: apu.tipo } },
      });
    }

    return apu;
  }

  async delete(id: string, actorUserId?: string): Promise<void> {
    const existing = await this.apuRepo.findById(id);
    if (!existing) {
      throw new AppError('APU not found', 404);
    }

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'apus',
        recordId: id,
        action: 'DELETE',
        userId: actorUserId,
        dataHistory: {
          before: { codigo: existing.codigo, nombre: existing.nombre, tipo: existing.tipo },
          after: {},
        },
      });
    }

    return this.apuRepo.delete(id);
  }

  async addInsumo(
    apuId: string,
    data: {
      insumoId: string;
      rendimiento: string;
      desperdicio: string;
    },
    actorUserId?: string,
  ): Promise<ApuInsumo> {
    const apu = await this.apuRepo.findById(apuId);
    if (!apu) {
      throw new AppError('APU not found', 404);
    }

    // Fetch the insumo to get current cost_base for snapshot
    const insumo = await this.insumoRepo.findById(data.insumoId);
    if (!insumo) {
      throw new AppError('Insumo not found', 404);
    }

    // Create APU_INSUMO with snapshot of current cost_base
    const apuInsumo = await this.apuRepo.addInsumo({
      apuId,
      insumoId: data.insumoId,
      rendimiento: data.rendimiento,
      desperdicio: data.desperdicio ?? '0',
      unitPriceSnapshot: insumo.costBase,
    });

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'apu_insumos',
        recordId: apuInsumo.id,
        action: 'INSERT',
        userId: actorUserId,
        dataHistory: {
          before: {},
          after: {
            apuId,
            insumoId: data.insumoId,
            rendimiento: data.rendimiento,
            desperdicio: data.desperdicio,
            unitPriceSnapshot: insumo.costBase,
          },
        },
      });
    }

    return apuInsumo;
  }

  async removeInsumo(apuId: string, itemId: string, actorUserId?: string): Promise<void> {
    const apu = await this.apuRepo.findById(apuId);
    if (!apu) {
      throw new AppError('APU not found', 404);
    }

    const insumo = await this.apuRepo.findInsumoById(itemId);
    if (!insumo) {
      throw new AppError('Insumo not found in APU', 404);
    }

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'apu_insumos',
        recordId: itemId,
        action: 'DELETE',
        userId: actorUserId,
        dataHistory: {
          before: {
            apuId,
            insumoId: insumo.insumoId,
            rendimiento: insumo.rendimiento,
            desperdicio: insumo.desperdicio,
            unitPriceSnapshot: insumo.unitPriceSnapshot,
          },
          after: {},
        },
      });
    }

    return this.apuRepo.removeInsumo(itemId);
  }
}
