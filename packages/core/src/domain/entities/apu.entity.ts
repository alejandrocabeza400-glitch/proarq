/** Pure domain entity for APU (Unit Price Analysis). */
export interface Apu {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
