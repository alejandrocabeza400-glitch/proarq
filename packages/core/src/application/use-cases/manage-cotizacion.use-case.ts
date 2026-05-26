import type { Cotizacion } from '../../domain/entities/cotizacion.entity';
import { AppError } from '../../errors/app.error';
import type { AuditRepository } from '../ports/out/audit-repository.port';
import type {
  CotizacionFilters,
  CotizacionRepository,
  CotizacionWithItems,
} from '../ports/out/cotizacion-repository.port';

export class ManageCotizacionUseCase {
  constructor(
    private readonly cotizacionRepo: CotizacionRepository,
    private readonly auditRepo?: AuditRepository,
  ) {}

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
      items:
        data.items?.map((item) => ({
          apuId: item.apuId,
          cantidad: item.cantidad,
          calculatedCostDirect: '0',
        })) || [],
    });

    if (this.auditRepo && data.createdBy) {
      await this.auditRepo.create({
        tableName: 'cotizaciones',
        recordId: cotizacion.id,
        action: 'INSERT',
        userId: data.createdBy,
        dataHistory: {
          before: {},
          after: {
            projectoId: cotizacion.projectoId,
            codigo: cotizacion.codigo,
            clienteId: cotizacion.clienteId,
            estado: cotizacion.estado,
            version: cotizacion.version,
          },
        },
      });
    }

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
    actorUserId?: string,
  ): Promise<Cotizacion> {
    const existing = await this.cotizacionRepo.findById(id);
    if (!existing) {
      throw new AppError('Cotizacion not found', 404);
    }

    // APROBADA guard
    if (existing.estado === 'APROBADA') {
      throw new AppError('Cannot modify an approved cotizacion', 400);
    }

    const before = {
      estado: existing.estado,
      factorAPercentage: existing.factorAPercentage,
      factorBPercentage: existing.factorBPercentage,
      profitMarginPercent: existing.profitMarginPercent,
    };

    const updateData: {
      estado?: string;
      factorAPercentage?: string;
      factorBPercentage?: string;
      profitMarginPercent?: string;
    } = {};
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.factorAPercentage !== undefined) updateData.factorAPercentage = data.factorAPercentage;
    if (data.factorBPercentage !== undefined) updateData.factorBPercentage = data.factorBPercentage;
    if (data.profitMarginPercent !== undefined)
      updateData.profitMarginPercent = data.profitMarginPercent;

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

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'cotizaciones',
        recordId: id,
        action: 'UPDATE',
        userId: actorUserId,
        dataHistory: {
          before,
          after: {
            estado: updated.estado,
            factorAPercentage: updated.factorAPercentage,
            factorBPercentage: updated.factorBPercentage,
            profitMarginPercent: updated.profitMarginPercent,
          },
        },
      });
    }

    return updated;
  }

  async delete(id: string, actorUserId?: string): Promise<void> {
    const existing = await this.cotizacionRepo.findById(id);
    if (!existing) {
      throw new AppError('Cotizacion not found', 404);
    }

    // APROBADA guard
    if (existing.estado === 'APROBADA') {
      throw new AppError('Cannot delete an approved cotizacion', 400);
    }

    await this.cotizacionRepo.delete(id);

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'cotizaciones',
        recordId: id,
        action: 'DELETE',
        userId: actorUserId,
        dataHistory: {
          before: {
            codigo: existing.codigo,
            estado: existing.estado,
          },
          after: {},
        },
      });
    }
  }
}
