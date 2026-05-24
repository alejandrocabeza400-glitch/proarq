import type { Request, Response } from 'express';
import { db } from '../../driven/database/connection';

/** Health check — purely infrastructure, no use case needed. */
export async function healthCheck(_req: Request, res: Response) {
  const checks: Record<string, string> = {
    server: 'ok',
  };

  try {
    await db.execute('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
}
