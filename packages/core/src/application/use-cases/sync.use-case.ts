import type { SyncPayloadInput, SyncResult } from '../ports/in/sync.input';

/**
 * Sync endpoint - processes pre-generated UUID payloads with
 * ON CONFLICT DO NOTHING for idempotent offline-first sync.
 *
 * Infrastructure repositories are injected for ON CONFLICT handling.
 */
export class SyncUseCase {
  constructor(
    private readonly syncHandler: {
      insertInsumos: (rows: any[]) => Promise<number>;
      insertApus: (rows: any[]) => Promise<number>;
      insertApuInsumos: (rows: any[]) => Promise<number>;
      insertCotizaciones: (rows: any[]) => Promise<number>;
      insertCotizacionItems: (rows: any[]) => Promise<number>;
    },
  ) {}

  async execute(payload: SyncPayloadInput): Promise<SyncResult> {
    let accepted = 0;
    let conflicts = 0;

    if (payload.insumos && payload.insumos.length > 0) {
      const inserted = await this.syncHandler.insertInsumos(payload.insumos);
      accepted += inserted;
      conflicts += payload.insumos.length - inserted;
    }

    if (payload.apus && payload.apus.length > 0) {
      const inserted = await this.syncHandler.insertApus(payload.apus);
      accepted += inserted;
      conflicts += payload.apus.length - inserted;
    }

    if (payload.apuInsumos && payload.apuInsumos.length > 0) {
      const inserted = await this.syncHandler.insertApuInsumos(payload.apuInsumos);
      accepted += inserted;
      conflicts += payload.apuInsumos.length - inserted;
    }

    if (payload.cotizaciones && payload.cotizaciones.length > 0) {
      const inserted = await this.syncHandler.insertCotizaciones(payload.cotizaciones);
      accepted += inserted;
      conflicts += payload.cotizaciones.length - inserted;
    }

    if (payload.cotizacionItems && payload.cotizacionItems.length > 0) {
      const inserted = await this.syncHandler.insertCotizacionItems(payload.cotizacionItems);
      accepted += inserted;
      conflicts += payload.cotizacionItems.length - inserted;
    }

    return { accepted, conflicts };
  }
}
