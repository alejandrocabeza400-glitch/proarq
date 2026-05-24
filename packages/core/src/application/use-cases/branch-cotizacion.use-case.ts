import type { CotizacionRepository } from '../ports/out/cotizacion-repository.port';
import type { Cotizacion } from '../../domain/entities/cotizacion.entity';
import { AppError } from '../../errors/app.error';

export class BranchCotizacionUseCase {
  constructor(private readonly cotizacionRepo: CotizacionRepository) {}

  async execute(id: string): Promise<Cotizacion> {
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

    // Clone the quote with new version
    const newVersion = existing.version + 1;
    const cloned = await this.cotizacionRepo.cloneQuote(id, newVersion);

    return cloned;
  }
}
