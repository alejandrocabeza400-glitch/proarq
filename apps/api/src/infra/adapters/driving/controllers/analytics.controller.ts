import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../driven/database/schema';

/**
 * GET /api/v1/analytics — system-wide dashboard statistics.
 *
 * Aggregate read-only queries. No business logic — infrastructure only.
 * Optional field `usuariosActivos` is included only when the caller is ADMIN.
 */
export function analyticsController(db: PostgresJsDatabase<typeof schema>) {
  return async (req: Request, res: Response) => {
    try {
      const [[cotizacionesRow], [proyectosRow], [insumosRow], [apuTotalRow]] =
        await Promise.all([
          db.execute<{ count: number }>(
            sql`SELECT COUNT(*)::int AS count FROM cotizaciones`,
          ),
          db.execute<{ count: number }>(
            sql`SELECT COUNT(*)::int AS count FROM proyectos WHERE estado NOT IN ('FINALIZADO', 'SUSPENDIDO')`,
          ),
          db.execute<{ count: number }>(
            sql`SELECT COUNT(*)::int AS count FROM insumos_maestro`,
          ),
          db.execute<{ total: string }>(
            sql`SELECT COALESCE(SUM(rendimiento * unit_price_snapshot), 0)::text AS total FROM apu_insumos`,
          ),
        ]);

      const data: Record<string, unknown> = {
        totalCotizaciones: cotizacionesRow.count,
        proyectosActivos: proyectosRow.count,
        totalInsumos: insumosRow.count,
        montoTotalAPU: apuTotalRow.total,
      };

      // Only ADMIN users see the active user count
      if (req.user?.role === 'ADMIN') {
        const [usersRow] = await db.execute<{ count: number }>(
          sql`SELECT COUNT(*)::int AS count FROM users`,
        );
        data.usuariosActivos = usersRow.count;
      }

      res.status(200).json({ data });
    } catch {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  };
}
