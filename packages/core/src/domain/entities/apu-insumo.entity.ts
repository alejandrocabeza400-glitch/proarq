/** Pure domain entity for APU_INSUMO (APU component with snapshot pricing). */
export interface ApuInsumo {
  id: string;
  apuId: string;
  insumoId: string;
  rendimiento: string;
  desperdicio: string;
  unitPriceSnapshot: string;
  createdAt: Date;
}
