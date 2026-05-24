/** Pure domain entity for CotizacionItem (Quote Line Item). */
export interface CotizacionItem {
  id: string;
  cotizacionId: string;
  apuId: string;
  cantidad: string;
  calculatedCostDirect: string;
  createdAt: Date;
}
