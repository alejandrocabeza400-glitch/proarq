import Decimal from 'decimal.js';

/**
 * Deterministic cost calculation engine using decimal.js.
 * All monetary calculations use high-precision decimal arithmetic.
 */
export class CalculationUseCase {
  /**
   * Calculate APU_INSUMO direct cost:
   * Costo Directo Item = Rendimiento × unit_price_snapshot × (1 + desperdicio/100)
   */
  calculateApuInsumoCost(params: {
    rendimiento: string;
    unitPriceSnapshot: string;
    desperdicio: string;
  }): string {
    const rendimiento = new Decimal(params.rendimiento);
    const snapshot = new Decimal(params.unitPriceSnapshot);
    const desperdicio = new Decimal(params.desperdicio);

    const factor = new Decimal(1).plus(desperdicio.div(100));
    const result = rendimiento.times(snapshot).times(factor);

    return result.toFixed(4);
  }

  /**
   * Calculate COTIZACION_ITEMS cost:
   * calculated_cost_direct = cantidad × APU total direct cost
   */
  calculateCotizacionItemCost(params: {
    cantidad: string;
    apuTotalDirectCost: string;
  }): string {
    const cantidad = new Decimal(params.cantidad);
    const apuCost = new Decimal(params.apuTotalDirectCost);

    const result = cantidad.times(apuCost);
    return result.toFixed(4);
  }

  /**
   * Calculate quote total:
   * total_amount = total_cost_direct × (1 + a%/100) × (1 + b%/100) × (1 + U%/100)
   */
  calculateQuoteTotal(params: {
    totalCostDirect: string;
    factorAPercentage: string;
    factorBPercentage: string;
    profitMarginPercent: string;
  }): string {
    const total = new Decimal(params.totalCostDirect);
    const factorA = new Decimal(1).plus(new Decimal(params.factorAPercentage).div(100));
    const factorB = new Decimal(1).plus(new Decimal(params.factorBPercentage).div(100));
    const profit = new Decimal(1).plus(new Decimal(params.profitMarginPercent).div(100));

    const result = total.times(factorA).times(factorB).times(profit);
    return result.toFixed(4);
  }
}
