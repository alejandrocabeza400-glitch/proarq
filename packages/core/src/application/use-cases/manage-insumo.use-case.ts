import type { InsumoRepository } from '../ports/out/insumo-repository.port';
import type { AuditRepository } from '../ports/out/audit-repository.port';
import type { Insumo } from '../../domain/entities/insumo.entity';
import { AppError } from '../../errors/app.error';

const VALID_UNIDADES = ['M3', 'KG', 'UND', 'GL'];

export class ManageInsumoUseCase {
  constructor(
    private readonly insumoRepo: InsumoRepository,
    private readonly auditRepo: AuditRepository,
  ) {}

  async create(data: {
    codigo: string;
    nombre: string;
    unidad: string;
    costBase: string;
    createdBy: string;
  }): Promise<Insumo> {
    const existing = await this.insumoRepo.findByCodigo(data.codigo);
    if (existing) {
      throw new AppError('Insumo with this code already exists', 409);
    }

    const insumo = await this.insumoRepo.create(data);

    // Audit log
    await this.auditRepo.create({
      tableName: 'insumos_maestro',
      recordId: insumo.id,
      action: 'INSERT',
      userId: data.createdBy,
      dataHistory: { before: {}, after: { codigo: data.codigo, nombre: data.nombre, unidad: data.unidad, cost_base: data.costBase } },
    });

    return insumo;
  }

  async findAll(filters?: {
    codigo?: string;
    nombre?: string;
    unidad?: string;
    page?: number;
    limit?: number;
  }): Promise<Insumo[]> {
    return this.insumoRepo.findAll(filters);
  }

  async findById(id: string): Promise<Insumo | null> {
    return this.insumoRepo.findById(id);
  }

  async update(
    id: string,
    data: { nombre?: string; unidad?: string; costBase?: string; userId: string },
  ): Promise<Insumo> {
    const existing = await this.insumoRepo.findById(id);
    if (!existing) {
      throw new AppError('Insumo not found', 404);
    }

    const before = {
      cost_base: existing.costBase,
      nombre: existing.nombre,
      unidad: existing.unidad,
    };

    const insumo = await this.insumoRepo.update(id, {
      nombre: data.nombre,
      unidad: data.unidad,
      costBase: data.costBase,
    });

    // Audit log
    const after = {
      cost_base: insumo.costBase,
      nombre: insumo.nombre,
      unidad: insumo.unidad,
    };
    await this.auditRepo.create({
      tableName: 'insumos_maestro',
      recordId: id,
      action: 'UPDATE',
      userId: data.userId,
      dataHistory: { before, after },
    });

    return insumo;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.insumoRepo.findById(id);
    if (!existing) {
      throw new AppError('Insumo not found', 404);
    }

    await this.insumoRepo.delete(id);

    // Audit log
    await this.auditRepo.create({
      tableName: 'insumos_maestro',
      recordId: id,
      action: 'DELETE',
      userId,
      dataHistory: { before: { codigo: existing.codigo, nombre: existing.nombre }, after: {} },
    });
  }

  async bulkUpload(
    rows: Array<{
      codigo: string;
      nombre: string;
      unidad: string;
      costBase: string;
    }>,
  ): Promise<{ imported: number; skipped: number; errors: Array<{ row: number; errors: string[] }> }> {
    const errors: Array<{ row: number; errors: string[] }> = [];
    const validRows: Array<{
      codigo: string;
      nombre: string;
      unidad: string;
      costBase: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors: string[] = [];

      if (!row.codigo || row.codigo.length === 0) {
        rowErrors.push('Code is required');
      }
      if (!row.nombre || row.nombre.length === 0) {
        rowErrors.push('Name is required');
      }
      if (!row.unidad || !VALID_UNIDADES.includes(row.unidad)) {
        rowErrors.push('Unit must be one of: M3, KG, UND, GL');
      }
      if (!row.costBase || !/^\d+(\.\d{1,2})?$/.test(row.costBase)) {
        rowErrors.push('Invalid cost base format');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, errors: rowErrors });
      } else {
        validRows.push(row);
      }
    }

    if (errors.length > 0) {
      throw new AppError(
        'Validation failed for bulk upload',
        422,
      );
    }

    // Check for duplicate codigos and skip them
    const rowsToInsert: typeof validRows = [];
    let skipped = 0;
    for (const row of validRows) {
      const existing = await this.insumoRepo.findByCodigo(row.codigo);
      if (existing) {
        skipped++;
      } else {
        rowsToInsert.push(row);
      }
    }

    if (rowsToInsert.length === 0) {
      return { imported: 0, skipped, errors: [] };
    }

    const result = await this.insumoRepo.bulkInsert(rowsToInsert);

    return {
      imported: result.imported,
      skipped: skipped + result.skipped,
      errors: [],
    };
  }
}
