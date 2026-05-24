/** Pure domain entity for InsumoMaestro (Master Supplies Catalog). */
export interface Insumo {
  id: string;
  codigo: string;
  nombre: string;
  unidad: 'M3' | 'KG' | 'UND' | 'GL';
  costBase: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
