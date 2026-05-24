import type { ApuRepository } from '../ports/out/apu-repository.port';
import type { InsumoRepository } from '../ports/out/insumo-repository.port';
import type { Apu } from '../../domain/entities/apu.entity';
import type { ApuInsumo } from '../../domain/entities/apu-insumo.entity';
import { AppError } from '../../errors/app.error';

export class ManageApuUseCase {
  constructor(
    private readonly apuRepo: ApuRepository,
    private readonly insumoRepo: InsumoRepository,
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
    return this.apuRepo.create(data);
  }

  async findAll(filters?: {
    codigo?: string;
    page?: number;
    limit?: number;
  }): Promise<Apu[]> {
    return this.apuRepo.findAll(filters);
  }

  async findById(id: string): Promise<(Apu & { items?: ApuInsumo[] }) | null> {
    return this.apuRepo.findById(id);
  }

  async update(
    id: string,
    data: { nombre?: string; tipo?: string },
  ): Promise<Apu> {
    const existing = await this.apuRepo.findById(id);
    if (!existing) {
      throw new AppError('APU not found', 404);
    }
    return this.apuRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.apuRepo.findById(id);
    if (!existing) {
      throw new AppError('APU not found', 404);
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
    return this.apuRepo.addInsumo({
      apuId,
      insumoId: data.insumoId,
      rendimiento: data.rendimiento,
      desperdicio: data.desperdicio ?? '0',
      unitPriceSnapshot: insumo.costBase,
    });
  }

  async removeInsumo(apuId: string, itemId: string): Promise<void> {
    const apu = await this.apuRepo.findById(apuId);
    if (!apu) {
      throw new AppError('APU not found', 404);
    }

    const insumo = await this.apuRepo.findInsumoById(itemId);
    if (!insumo) {
      throw new AppError('Insumo not found in APU', 404);
    }

    return this.apuRepo.removeInsumo(itemId);
  }
}
