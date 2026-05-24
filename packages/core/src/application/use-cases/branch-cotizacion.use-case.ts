import type { Cotizacion } from '../../domain/entities/cotizacion.entity';
import { AppError } from '../../errors/app.error';
import type { AuditRepository } from '../ports/out/audit-repository.port';
import type { CotizacionRepository } from '../ports/out/cotizacion-repository.port';

export class BranchCotizacionUseCase {
  constructor(
    private readonly cotizacionRepo: CotizacionRepository,
    private readonly auditRepo?: AuditRepository,
  ) {}

  async execute(id: string, actorUserId?: string): Promise<Cotizacion> {
    const existing = await this.cotizacionRepo.findById(id);
    if (!existing) {
      throw new AppError('Cotizacion not found', 404);
    }

    // Check max version limit
    const versionCount = await this.cotizacionRepo.countVersionsByProject(existing.projectoId);
    if (versionCount >= 15) {
      throw new AppError('Maximum 15 versions per project reached', 400);
    }

    // Mark old quote as REEMPLAZADA
    await this.cotizacionRepo.update(id, { estado: 'REEMPLAZADA' });

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'cotizaciones',
        recordId: id,
        action: 'UPDATE',
        userId: actorUserId,
        dataHistory: {
          before: { estado: existing.estado },
          after: { estado: 'REEMPLAZADA' },
        },
      });
    }

    // Clone the quote with new version
    const newVersion = existing.version + 1;
    const cloned = await this.cotizacionRepo.cloneQuote(id, newVersion);

    if (this.auditRepo && actorUserId) {
      await this.auditRepo.create({
        tableName: 'cotizaciones',
        recordId: cloned.id,
        action: 'INSERT',
        userId: actorUserId,
        dataHistory: {
          before: {},
          after: {
            projectoId: cloned.projectoId,
            codigo: cloned.codigo,
            clienteId: cloned.clienteId,
            estado: cloned.estado,
            version: cloned.version,
          },
        },
      });
    }

    return cloned;
  }
}
