/** Pure domain entity for Cotizacion (Quote). */
export interface Cotizacion {
  id: string;
  projectoId: string;
  codigo: string;
  version: number;
  estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'REEMPLAZADA';
  clienteId?: string | null;
  totalCostDirect: string;
  factorAPercentage: string;
  factorBPercentage: string;
  profitMarginPercent: string;
  totalAmount: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
