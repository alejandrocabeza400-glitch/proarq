import { auditLogQuerySchema } from '@proarq/core/application/ports/in/audit-log.input';
import type { AuditUseCase } from '@proarq/core/application/use-cases/audit.use-case';
import type { NextFunction, Request, Response } from 'express';
import { generatePdfReport } from '../../../services/pdf.service';

export function listAuditLogsController(useCase: AuditUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = auditLogQuerySchema.parse(req.query);
      const logs = await useCase.findLogs(query);
      res.status(200).json({ data: logs });
    } catch (err) {
      next(err);
    }
  };
}

export function exportPdfAuditLogsController(useCase: AuditUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = auditLogQuerySchema.parse(req.query);
      const logs = await useCase.findLogs(query);

      const columns = [
        {
          header: 'Fecha',
          key: 'createdAt',
          width: 115,
          render: (val: any) => (val ? new Date(val).toLocaleString('es-ES') : '-'),
        },
        { header: 'Tabla', key: 'tableName', width: 75, align: 'center' as const },
        { header: 'Acción', key: 'action', width: 60, align: 'center' as const },
        { header: 'ID Usuario', key: 'userId', width: 120 },
        { header: 'ID Registro', key: 'recordId', width: 132 },
      ];

      const pdfBuffer = await generatePdfReport(
        'Registro de Auditoría del Sistema (Logs)',
        columns,
        logs,
        { generatedBy: req.user?.sub || 'Usuario Registrado' },
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=bitacora-auditoria.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };
}
