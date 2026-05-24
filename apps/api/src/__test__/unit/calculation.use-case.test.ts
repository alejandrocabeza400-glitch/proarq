import { describe, expect, test } from 'bun:test';
import { CalculationUseCase } from '@proarq/core/application/use-cases/calculation.use-case';

describe('CalculationUseCase', () => {
  describe('APU_INSUMO cost formula', () => {
    test('should calculate direct cost correctly: rendimiento × snapshot × (1 + desperdicio/100)', async () => {
      const useCase = new CalculationUseCase();

      // rendimiento = 2.5, unit_price_snapshot = 1.50, desperdicio = 5%
      // Costo = 2.5 × 1.50 × (1 + 5/100) = 2.5 × 1.50 × 1.05 = 3.9375
      const result = useCase.calculateApuInsumoCost({
        rendimiento: '2.5',
        unitPriceSnapshot: '1.50',
        desperdicio: '5.00',
      });

      expect(result).toBe('3.9375');
    });

    test('should handle zero desperdicio', async () => {
      const useCase = new CalculationUseCase();

      // rendimiento = 10, snapshot = 5.00, desperdicio = 0%
      // Costo = 10 × 5.00 × (1 + 0/100) = 50.00
      const result = useCase.calculateApuInsumoCost({
        rendimiento: '10',
        unitPriceSnapshot: '5.00',
        desperdicio: '0',
      });

      expect(result).toBe('50.0000');
    });

    test('should handle 100% desperdicio', async () => {
      const useCase = new CalculationUseCase();

      // rendimiento = 1, snapshot = 100.00, desperdicio = 100%
      // Costo = 1 × 100.00 × (1 + 100/100) = 200.00
      const result = useCase.calculateApuInsumoCost({
        rendimiento: '1',
        unitPriceSnapshot: '100.00',
        desperdicio: '100',
      });

      expect(result).toBe('200.0000');
    });
  });

  describe('COTIZACION_ITEMS cost formula', () => {
    test('should calculate item cost correctly: cantidad × APU total direct cost', async () => {
      const useCase = new CalculationUseCase();

      // cantidad = 10, apu_total_direct_cost = 150.00
      // Costo = 10 × 150.00 = 1500.00
      const result = useCase.calculateCotizacionItemCost({
        cantidad: '10',
        apuTotalDirectCost: '150.00',
      });

      expect(result).toBe('1500.0000');
    });

    test('should handle zero cantidad', async () => {
      const useCase = new CalculationUseCase();

      const result = useCase.calculateCotizacionItemCost({
        cantidad: '0',
        apuTotalDirectCost: '150.00',
      });

      expect(result).toBe('0.0000');
    });
  });

  describe('quote totals formula', () => {
    test('should calculate total_amount correctly', async () => {
      const useCase = new CalculationUseCase();

      // total_cost_direct = 1000.00
      // factor_a = 10%, factor_b = 5%, profit_margin = 15%
      // total = 1000 × 1.10 × 1.05 × 1.15 = 1328.25
      const result = useCase.calculateQuoteTotal({
        totalCostDirect: '1000.00',
        factorAPercentage: '10.00',
        factorBPercentage: '5.00',
        profitMarginPercent: '15.00',
      });

      expect(result).toBe('1328.2500');
    });

    test('should handle zero overhead factors', async () => {
      const useCase = new CalculationUseCase();

      // total_cost_direct = 500.00, all factors = 0%
      const result = useCase.calculateQuoteTotal({
        totalCostDirect: '500.00',
        factorAPercentage: '0',
        factorBPercentage: '0',
        profitMarginPercent: '0',
      });

      expect(result).toBe('500.0000');
    });

    test('should handle minimum profit margin (8%)', async () => {
      const useCase = new CalculationUseCase();

      // total = 1000 × 1.00 × 1.00 × 1.08 = 1080.00
      const result = useCase.calculateQuoteTotal({
        totalCostDirect: '1000.00',
        factorAPercentage: '0',
        factorBPercentage: '0',
        profitMarginPercent: '8',
      });

      expect(result).toBe('1080.0000');
    });
  });

  describe('decimal precision', () => {
    test('should round to exactly 4 decimal places', async () => {
      const useCase = new CalculationUseCase();

      // 1/3 × 100.00 × (1 + 1/100) = 0.3333... × 100 × 1.01 = 33.6666...
      const result = useCase.calculateApuInsumoCost({
        rendimiento: '0.3333333333',
        unitPriceSnapshot: '100.00',
        desperdicio: '1.00',
      });

      // Should have exactly 4 decimal places
      expect(result).toMatch(/^\d+\.\d{4}$/);
    });

    test('should maintain precision with very small numbers', async () => {
      const useCase = new CalculationUseCase();

      // 0.001 × 0.01 = 0.00001 → rounded to 4 decimal places = 0.0000
      const result = useCase.calculateApuInsumoCost({
        rendimiento: '0.001',
        unitPriceSnapshot: '0.01',
        desperdicio: '0',
      });

      expect(result).toBe('0.0000');
    });

    test('should handle large numbers without floating point errors', async () => {
      const useCase = new CalculationUseCase();

      // 0.1 + 0.2 = 0.3 (classic floating point test)
      // Using decimal.js, this should not produce 0.30000000000000004
      const result = useCase.calculateApuInsumoCost({
        rendimiento: '0.1',
        unitPriceSnapshot: '3.00',
        desperdicio: '0',
      });

      expect(result).toBe('0.3000');
    });
  });
});
