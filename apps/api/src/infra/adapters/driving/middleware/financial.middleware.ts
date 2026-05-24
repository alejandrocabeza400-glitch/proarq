import Decimal from 'decimal.js';
import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware that validates profit margin >= 8% when estado
 * is being set to ENVIADA or APROBADA.
 */
export function validateProfitMargin(req: Request, res: Response, next: NextFunction) {
  const { estado, profitMarginPercent } = req.body;

  // Only validate when estado is ENVIADA or APROBADA
  if (estado === 'ENVIADA' || estado === 'APROBADA') {
    const margin = new Decimal(profitMarginPercent ?? 0);

    if (margin.lessThan(8)) {
      res.status(403).json({ error: 'Profit margin must be at least 8%' });
      return;
    }
  }

  next();
}
