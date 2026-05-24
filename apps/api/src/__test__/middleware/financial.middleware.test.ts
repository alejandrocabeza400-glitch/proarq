import { describe, expect, mock, test } from 'bun:test';
import type { NextFunction, Request, Response } from 'express';
import { validateProfitMargin } from '../../infra/adapters/driving/middleware/financial.middleware';

function createMockReq(body: any = {}): Partial<Request> {
  return { body } as Partial<Request>;
}

function createMockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = mock((_code: number) => res) as any;
  res.json = mock((_body: any) => res) as any;
  return res;
}

describe('validateProfitMargin middleware', () => {
  describe('when estado changes to ENVIADA', () => {
    test('should pass when profit_margin_percent >= 8%', () => {
      const req = createMockReq({ estado: 'ENVIADA', profitMarginPercent: '8.00' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 403 when profit_margin_percent < 8%', () => {
      const req = createMockReq({ estado: 'ENVIADA', profitMarginPercent: '7.99' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 when profit_margin_percent is 0', () => {
      const req = createMockReq({ estado: 'ENVIADA', profitMarginPercent: '0' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when estado changes to APROBADA', () => {
    test('should pass when profit_margin_percent >= 8%', () => {
      const req = createMockReq({ estado: 'APROBADA', profitMarginPercent: '15.00' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    test('should return 403 when profit_margin_percent < 8%', () => {
      const req = createMockReq({ estado: 'APROBADA', profitMarginPercent: '7.50' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when estado is not ENVIADA or APROBADA', () => {
    test('should pass even with profit_margin_percent < 8% for BORRADOR', () => {
      const req = createMockReq({ estado: 'BORRADOR', profitMarginPercent: '1.00' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should pass when estado is not in body', () => {
      const req = createMockReq({ profitMarginPercent: '5.00' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('should handle missing profit_margin_percent field', () => {
      const req = createMockReq({ estado: 'ENVIADA' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      // Missing profitMarginPercent treated as 0, should fail
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should use decimal.js precision for exact comparison', () => {
      const req = createMockReq({ estado: 'ENVIADA', profitMarginPercent: '8.000000000001' });
      const res = createMockRes();
      const next = mock(() => {});

      validateProfitMargin(req as Request, res as Response, next as NextFunction);

      // Exactly 8% or above should pass
      expect(next).toHaveBeenCalled();
    });
  });
});
