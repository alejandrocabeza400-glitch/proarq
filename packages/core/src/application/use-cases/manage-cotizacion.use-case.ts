import type { CotizacionRepository, CotizacionWithItems, CotizacionFilters } from '../ports/out/cotizacion-repository.port';
import type { Cotizacion } from '../../domain/entities/cotizacion.entity';
import { AppError } from '../../errors/app.error';

export class ManageCotizacionUseCase {
  constructor(private readonly cotizacionRepo: CotizacionRepository) {}

  async create(data: {
    projectoId: string;
    codigo: string;
    clienteId?: string;
    items?: Array<{ apuId: string; cantidad: string }>;
    createdBy: string;
  }): Promise<Cotizacion> {
    const cotizacion = await this.cotizacionRepo.create({
      projectoId: data.projectoId,
      codigo: data.codigo,
      clienteId: data.clienteId || null,
      createdBy: data.createdBy,
      items: data.items?.map((item) => ({
        apuId: item.apuId,
        cantidad: item.cantidad,
        calculatedCostDirect: '0',
      })) || [],
    });

    return cotizacion;
  }

  async findAll(filters?: CotizacionFilters): Promise<Cotizacion[]> {
    return this.cotizacionRepo.findAll(filters);
  }

  async findById(id: string): Promise<CotizacionWithItems | null> {
    return this.cotizacionRepo.findById(id);
  }

  async update(
    id: string,
    data: {
      estado?: string;
      items?: Array<{ apuId: string; cantidad: string }>;
      factorAPercentage?: string;
      factorBPercentage?: string;
      profitMarginPercent?: string;
    },
  ): Promise<Cotizacion> {
    const existing = await this.cotizacionRepo.findById(id);
    if (!existing) {
      throw new AppError('Cotizacion not found', 404);
    }

    // APROBADA guard
    if (existing.estado === 'APROBADA') {
      throw new AppError('Cannot modify an approved cotizacion', 400);
    }

    const updateData: {
      estado?: string;
      factorAPercentage?: string;
      factorBPercentage?: string;
      profitMarginPercent?: string;
    } = {};
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.factorAPercentage !== undefined) updateData.factorAPercentage = data.factorAPercentage;
    if (data.factorBPercentage !== undefined) updateData.factorBPercentage = data.factorBPercentage;
    if (data.profitMarginPercent !== undefined) updateData.profitMarginPercent = data.profitMarginPercent;

    const updated = await this.cotizacionRepo.update(id, updateData);

    // Update items if provided
    if (data.items && data.items.length > 0) {
      await this.cotizacionRepo.deleteItemsByCotizacionId(id);
      for (const item of data.items) {
        await this.cotizacionRepo.createItem({
          cotizacionId: id,
          apuId: item.apuId,
          cantidad: item.cantidad,
          calculatedCostDirect: '0',
        });
      }
    }

    return updated;
  }
}
