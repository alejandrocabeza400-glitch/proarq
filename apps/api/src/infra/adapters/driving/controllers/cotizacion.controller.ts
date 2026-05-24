import type {
  CreateCotizacionInput,
  UpdateCotizacionInput,
} from '@proarq/core/application/ports/in/cotizacion.input';
import { cotizacionQuerySchema } from '@proarq/core/application/ports/in/cotizacion.input';
import type { BranchCotizacionUseCase } from '@proarq/core/application/use-cases/branch-cotizacion.use-case';
import type { ManageCotizacionUseCase } from '@proarq/core/application/use-cases/manage-cotizacion.use-case';
import type { NextFunction, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { generatePdfReport } from '../../../services/pdf.service';

export function createCotizacionController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as CreateCotizacionInput;
      const userId = req.user?.sub ?? '';
      const cotizacion = await useCase.create({
        ...data,
        createdBy: userId,
      });
      res.status(201).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

export function listCotizacionesController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = cotizacionQuerySchema.parse(req.query);
      const cotizaciones = await useCase.findAll(query);
      res.status(200).json({ data: cotizaciones });
    } catch (err) {
      next(err);
    }
  };
}

export function getCotizacionController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cotizacion = await useCase.findById(req.params.id);
      res.status(200).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

export function updateCotizacionController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as UpdateCotizacionInput;
      const cotizacion = await useCase.update(req.params.id, data, req.user?.sub);
      res.status(200).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

export function branchCotizacionController(useCase: BranchCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cotizacion = await useCase.execute(req.params.id, req.user?.sub);
      res.status(201).json({ data: cotizacion });
    } catch (err) {
      next(err);
    }
  };
}

// =============================================================================
// Professional Cotización PDF — APA 7.ª edición + Interlineado 1,5
// =============================================================================
//
// Normas APA 7.ª edición aplicadas:
//   • Fuente: Times New Roman 12 pt (Times-Roman en PDFKit)
//   • Márgenes: 1 pulgada (72 pt) en los cuatro lados
//   • Interlineado: 1,5 (12 pt × 1,5 = 18 pt)
//   • Números de página: margen superior derecho
//   • Título: negrita, centrado
//   • Encabezados Nivel 1: negrita, centrados
//   • Encabezados Nivel 2: negrita, alineados a la izquierda
//   • Tablas estilo APA: solo líneas horizontales, sin fondos de color
//
// Secciones del documento:
//   1. Encabezado e Identificación
//   2. Datos y Ficha Técnica del Proyecto
//   3. Alcance de los Servicios
//   4. Entregables
//   5. Exclusiones y Límites de la Propuesta
//   6. Propuesta Económica y Forma de Pago
//   7. Términos, Condiciones y Tiempos de Entrega
//   8. Cierre y Firmas de Conformidad
// =============================================================================

// =====================================================================
// APA Design Tokens
// =====================================================================
const APA = {
  // 1 inch = 72 pt
  margin: 72,
  font: 'Times-Roman',
  fontBold: 'Times-Bold',
  fontItalic: 'Times-Italic',
  size: 12,          // body
  sizeSmall: 10,     // table / notes
  sizeTitle: 14,     // title
  sizeHeading: 12,   // section headings
  leading: 18,       // 1,5 × 12 pt
  smallLeading: 15,  // 1,5 × 10 pt
  indent: 36,        // 0,5 pulgada para sangría
};

const MW = 612 - 2 * APA.margin; // = 468 pt de ancho de contenido

// Colores APA — sobrios, profesionales
const C = {
  text: '#1E293B',    // Slate 800 — cuerpo
  muted: '#475569',   // Slate 600 — metadatos
  subtle: '#94A3B8',  // Slate 400 — notas
  border: '#334155',  // Slate 700 — líneas de tabla
  accent: '#0F766E',  // Teal 700 — acento sutil
  gold: '#B45309',    // Amber 700 — para resaltar total
};

// =====================================================================
// Helpers APA
// =====================================================================

/** Formatea número a moneda CLP */
function fmt$(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '$0';
  const n = typeof val === 'string' ? Number.parseFloat(val) : val;
  if (Number.isNaN(n)) return '$0';
  return `$${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Calcula la altura de un bloque de texto */
function textHeight(text: string, width: number, fontSize: number, leading: number): number {
  // Estimación: cada ~90 caracteres es una línea con fuente 12pt
  const charsPerLine = Math.floor(width / (fontSize * 0.55));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * leading;
}

/** 1,5 interlineado: mueve el cursor Y una línea */
function ln(doc: PDFKit.PDFDocument, n = 1, ld = APA.leading): void {
  doc.y += n * ld;
}

/** Párrafo APA: texto alineado a la izquierda con sangría de 0,5″ */
function p(doc: PDFKit.PDFDocument, text: string): void {
  const remaining = doc.page.height - doc.y - APA.margin;

  // Altura estimada del párrafo
  const estLines = Math.ceil(text.length / 85);
  const estH = estLines * APA.leading + APA.leading;

  if (estH > remaining) {
    doc.addPage();
  }

  doc.fontSize(APA.size).font(APA.font);
  doc.fillColor(C.text);
  doc.text(text, APA.margin + APA.indent, doc.y, {
    width: MW - APA.indent,
    align: 'left',
    lineBreak: true,
    // PDFKit no soporta lineGap directamente con el método text,
    // usamos moveDown después para el espaciado 1,5
  });
  ln(doc, 1);
}

/** Título principal APA: negrita, centrado */
function tituloAPA(doc: PDFKit.PDFDocument, text: string): void {
  doc.fontSize(APA.sizeTitle).font(APA.fontBold);
  doc.fillColor(C.text);
  doc.text(text, APA.margin, doc.y, { width: MW, align: 'center' });
  ln(doc, 1.5);
}

/** Encabezado Nivel 1 APA: negrita, centrado */
function h1APA(doc: PDFKit.PDFDocument, number: string, title: string): void {
  // Salto de página si queda poco espacio
  if (doc.y > doc.page.height - APA.margin - 60) {
    doc.addPage();
  }
  // Línea separadora sutil (opcional APA, ayuda visual)
  doc.strokeColor(C.subtle).lineWidth(0.3)
    .moveTo(APA.margin, doc.y)
    .lineTo(APA.margin + MW, doc.y)
    .stroke();
  ln(doc, 0.8);

  doc.fontSize(APA.sizeHeading).font(APA.fontBold);
  doc.fillColor(C.text);
  doc.text(`${number}. ${title}`, APA.margin, doc.y, { width: MW, align: 'center' });
  ln(doc, 1.2);
}

/** Encabezado Nivel 2 APA: negrita, izquierda, cursiva opcional */
function h2APA(doc: PDFKit.PDFDocument, title: string): void {
  if (doc.y > doc.page.height - APA.margin - 40) {
    doc.addPage();
  }
  doc.fontSize(APA.size).font(APA.fontBold);
  doc.fillColor(C.text);
  doc.text(title, APA.margin, doc.y, { width: MW, align: 'left' });
  ln(doc, 0.5);
}

/** Texto informativo en una línea (negrita la etiqueta) */
function infoLine(doc: PDFKit.PDFDocument, label: string, value: string): void {
  if (doc.y + APA.leading > doc.page.height - APA.margin) {
    doc.addPage();
  }
  const y = doc.y;
  doc.fontSize(APA.size).font(APA.fontBold);
  doc.fillColor(C.text);
  const labelW = doc.widthOfString(label);
  doc.text(label, APA.margin, y, { width: labelW + 2, align: 'left' });
  doc.font(APA.font).fillColor(C.muted);
  doc.text(value, APA.margin + labelW + 4, y, { width: MW - labelW - 8, align: 'left' });
  ln(doc, 1);
}

/** Tabla estilo APA: solo líneas horizontales, sin colores de fondo */
function apaTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  colW: number[],
  rows: string[][],
  caption?: string,
): void {
  const tableY = doc.y;
  const totalW = colW.reduce((a, b) => a + b, 0);
  const hdrH = 22;
  const rowH = 18;

  // Altura total estimada
  const totalH = hdrH + rows.length * rowH + 30;

  if (tableY + totalH > doc.page.height - APA.margin) {
    doc.addPage();
    return apaTable(doc, headers, colW, rows, caption);
  }

  // --- APA Table Number & Title (italic) ---
  if (caption) {
    doc.fontSize(APA.size).font(APA.fontItalic);
    doc.fillColor(C.text);
    doc.text(caption, APA.margin, doc.y, { width: MW, align: 'left' });
    ln(doc, 0.5);
  }

  const y0 = doc.y;

  // --- Top border (double line APA style) ---
  doc.strokeColor(C.border).lineWidth(1.2)
    .moveTo(APA.margin, y0)
    .lineTo(APA.margin + totalW, y0)
    .stroke();

  // --- Header row ---
  doc.fontSize(APA.sizeSmall).font(APA.fontBold);
  doc.fillColor(C.text);
  let hx = APA.margin;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], hx + 2, y0 + 4, {
      width: colW[i] - 4,
      align: i >= 2 ? 'right' : 'left',
    });
    hx += colW[i];
  }

  // --- Line below header ---
  const y1 = y0 + hdrH;
  doc.strokeColor(C.border).lineWidth(0.6)
    .moveTo(APA.margin, y1)
    .lineTo(APA.margin + totalW, y1)
    .stroke();

  // --- Data rows ---
  doc.fontSize(APA.sizeSmall).font(APA.font);
  let ry = y1 + 3;
  for (let r = 0; r < rows.length; r++) {
    let cx = APA.margin;
    for (let c = 0; c < rows[r].length; c++) {
      doc.fillColor(C.text);
      doc.text(rows[r][c], cx + 2, ry, {
        width: colW[c] - 4,
        align: c >= 2 ? 'right' : 'left',
      });
      cx += colW[c];
    }
    ry += rowH;
  }

  // --- Bottom border ---
  const y2 = y1 + rows.length * rowH + 3;
  doc.strokeColor(C.border).lineWidth(1.2)
    .moveTo(APA.margin, y2)
    .lineTo(APA.margin + totalW, y2)
    .stroke();

  doc.y = y2 + APA.leading;
  ln(doc, 0.5);
}

/** Lista con viñetas estilo APA */
function bulletList(doc: PDFKit.PDFDocument, items: string[]): void {
  const estH = items.length * APA.leading + APA.leading;
  if (doc.y + estH > doc.page.height - APA.margin) {
    doc.addPage();
  }

  doc.fontSize(APA.size).font(APA.font);
  for (const item of items) {
    doc.fillColor(C.text);
    doc.text(`•  ${item}`, APA.margin + APA.indent, doc.y, {
      width: MW - APA.indent,
      align: 'left',
    });
    ln(doc, 0.8);
  }
  ln(doc, 0.3);
}

// =====================================================================
// MAIN — pdfCotizacionController
// =====================================================================

export function pdfCotizacionController(getUseCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cotizacion = await getUseCase.findById(req.params.id);
      if (!cotizacion) {
        res.status(404).json({ error: 'Cotizacion not found' });
        return;
      }

      const doc = new PDFDocument({
        margin: APA.margin,
        bufferPages: true,
        info: {
          Title: `Cotización ${cotizacion.codigo}`,
          Author: 'ProArq',
          Subject: 'Cotización de Servicios Profesionales de Arquitectura',
          Producer: 'ProArq PDF Engine',
          Creator: 'ProArq API',
        },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${cotizacion.codigo}.pdf`);
      doc.pipe(res);

      // --- Fechas ---
      const dateStr = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      const vig = new Date();
      vig.setDate(vig.getDate() + 30);
      const vigStr = vig.toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      const statusColors: Record<string, string> = {
        BORRADOR: C.muted, ENVIADA: C.accent, APROBADA: C.accent, RECHAZADA: '#991B1B',
      };
      const statusColor = statusColors[cotizacion.estado] || C.muted;

      // ===============================================================
      // PAGE CONTENT — FIRST PASS
      // ===============================================================

      // Título APA centrado
      tituloAPA(doc, 'Cotización de Servicios Profesionales de Arquitectura');

      // ===============================================================
      // SECTION 1 — Encabezado e Identificación
      // ===============================================================
      h1APA(doc, '1', 'Encabezado e Identificación');

      infoLine(doc, 'N.° de Cotización:', cotizacion.codigo);
      infoLine(doc, 'Fecha de Emisión:', dateStr);
      infoLine(doc, 'Vigencia:', `${vigStr} (30 días)`);
      infoLine(doc, 'Cliente / Contratante:', cotizacion.clienteId || '—');
      infoLine(doc, 'Proyecto Asociado:', cotizacion.projectoId || '—');
      infoLine(doc, 'Elaborado por:', 'ProArq');
      infoLine(doc, 'Estado:', cotizacion.estado);

      // ===============================================================
      // SECTION 2 — Datos y Ficha Técnica del Proyecto
      // ===============================================================
      h1APA(doc, '2', 'Datos y Ficha Técnica del Proyecto');

      infoLine(doc, 'Nombre / Código:', cotizacion.projectoId || '—');
      infoLine(doc, 'Ubicación:', 'Por definir');
      infoLine(doc, 'Uso de Suelo / Tipología:', 'Habitacional / Comercial / Mixto');
      infoLine(doc, 'Área Estimada:', 'Por confirmar en visita técnica');

      // ===============================================================
      // SECTION 3 — Alcance de los Servicios
      // ===============================================================
      h1APA(doc, '3', 'Alcance de los Servicios');

      const fases = [
        'Fase 1 — Levantamiento y Diagnóstico: Visita técnica al terreno, levantamiento de medidas, análisis de asoleamiento, estudio de normativa local y registro fotográfico del estado actual.',
        'Fase 2 — Anteproyecto / Diseño Conceptual: Distribución de espacios en plantas arquitectónicas, fachadas conceptuales, modelado 3D volumétrico y moodboard de materiales y acabados.',
        'Fase 3 — Proyecto Arquitectónico: Plantas arquitectónicas definitivas acotadas, cortes generales y de detalle, fachadas con elevaciones, y cuadro de áreas actualizado.',
        'Fase 4 — Proyecto Ejecutivo: Planos de acabados, carpintería, albañilería, herrería, instalaciones hidráulicas, sanitarias, eléctricas y de gas.',
      ];
      bulletList(doc, fases);

      // ===============================================================
      // SECTION 4 — Entregables
      // ===============================================================
      h1APA(doc, '4', 'Entregables');

      const entregas = [
        'Archivos digitales en formato PDF (alta resolución) y CAD (formato DWG) de cada plano.',
        'Un juego de planos impresos en formato 90 × 60 cm para firma y visado.',
        'Memoria descriptiva del proyecto en formato PDF.',
        'Render 3D del volumen aprobado (dos tomas exteriores).',
        'Carpeta digital con todos los archivos fuente organizados por fase.',
      ];
      bulletList(doc, entregas);

      // ===============================================================
      // SECTION 5 — Exclusiones y Límites de la Propuesta
      // ===============================================================
      h1APA(doc, '5', 'Exclusiones y Límites de la Propuesta');

      const exclusiones = [
        'Cálculo y firma estructural (realizado por ingeniero externo; cotización por separado).',
        'Pago de derechos, licencias de construcción, permisos municipales y tramitaciones gubernamentales.',
        'Estudios de mecánica de suelos, topografía de alta precisión ni estudios de impacto ambiental.',
        'Diseño de interiores detallado (mobiliario, iluminación decorativa) y paisajismo ejecutivo.',
        'Supervisión de obra o administración de la construcción (servicio complementario).',
        'Viáticos ni hospedaje del personal técnico fuera del área metropolitana.',
      ];
      bulletList(doc, exclusiones);

      // ===============================================================
      // SECTION 6 — Propuesta Económica y Forma de Pago
      // ===============================================================
      h1APA(doc, '6', 'Propuesta Económica y Forma de Pago');

      h2APA(doc, 'Desglose de Partidas');

      // Tabla APA
      const itemHeaders = ['Concepto / APU', 'Cantidad', 'Costo Directo', 'Total'];
      const itemColW = [190, 60, 109, 109]; // sum = 468

      const itemRows: string[][] = [];
      if (cotizacion.items && cotizacion.items.length > 0) {
        for (const item of cotizacion.items) {
          itemRows.push([
            item.apuId || item.nombre || item.concepto || '—',
            item.cantidad || '-',
            fmt$(item.calculatedCostDirect),
            fmt$(item.calculatedTotal),
          ]);
        }
      } else {
        itemRows.push(['No hay partidas registradas', '', '', '']);
      }

      apaTable(doc, itemHeaders, itemColW, itemRows, 'Tabla 1. Desglose de partidas de la cotización.');

      // Totals
      h2APA(doc, 'Resumen de Costos');

      const totHeaders = ['Concepto', '', 'Valor'];
      const totColW = [200, 68, 200];
      const totRows = [
        ['Costo Directo Total', '', fmt$(cotizacion.totalCostDirect)],
        ['Factor A', '', cotizacion.factorAPercentage ? `${cotizacion.factorAPercentage}%` : '—'],
        ['Factor B', '', cotizacion.factorBPercentage ? `${cotizacion.factorBPercentage}%` : '—'],
        ['Margen de Utilidad', '', cotizacion.profitMarginPercent ? `${cotizacion.profitMarginPercent}%` : '—'],
      ];

      apaTable(doc, totHeaders, totColW, totRows);

      // Total final destacado
      if (doc.y + 40 > doc.page.height - APA.margin) doc.addPage();

      doc.strokeColor(C.gold).lineWidth(0.8)
        .moveTo(APA.margin, doc.y)
        .lineTo(APA.margin + MW, doc.y)
        .stroke();
      ln(doc, 0.6);

      doc.fontSize(APA.sizeHeading).font(APA.fontBold);
      doc.fillColor(C.text);
      const totalLabel = 'Monto Total de la Propuesta:';
      doc.text(totalLabel, APA.margin, doc.y, { width: MW, align: 'left' });

      doc.fontSize(APA.sizeTitle).font(APA.fontBold);
      doc.fillColor(C.accent);
      doc.text(fmt$(cotizacion.totalAmount), APA.margin, doc.y, {
        width: MW, align: 'right',
      });
      ln(doc, 1.5);

      // --- Payment schedule ---
      h2APA(doc, 'Calendario de Pagos');

      const payHeaders = ['Hito', '', 'Porcentaje'];
      const payColW = [250, 68, 150];
      const payRows = [
        ['Anticipo (firma de contrato)', '', '30 % – 40 %'],
        ['2.° pago (aprobación de Anteproyecto)', '', '30 %'],
        ['3.° pago (entrega de Proyecto Arquitectónico)', '', '30 %'],
        ['Finiquito (entrega de Planos Ejecutivos)', '', '10 %'],
      ];

      apaTable(doc, payHeaders, payColW, payRows, 'Tabla 2. Esquema de pagos por hitos.');

      // ===============================================================
      // SECTION 7 — Términos, Condiciones y Tiempos de Entrega
      // ===============================================================
      h1APA(doc, '7', 'Términos, Condiciones y Tiempos de Entrega');

      const terms = [
        'El tiempo de entrega total es de seis semanas hábiles a partir de la recepción del anticipo y la firma del contrato.',
        'Se incluyen dos rondas de modificaciones gratuitas por fase. Las revisiones adicionales se cobrarán por separado.',
        'Los retrasos en la aprobación de entregables por parte del cliente correrán el cronograma en la misma cantidad de días.',
        'Los precios expresados en esta cotización tienen una vigencia de 30 días calendario desde la fecha de emisión.',
        'El pago se realizará mediante transferencia electrónica. Se emitirá factura electrónica por cada pago.',
        'El proyecto no comenzará hasta confirmar el pago del anticipo.',
      ];
      bulletList(doc, terms);

      // ===============================================================
      // SECTION 8 — Cierre y Firmas de Conformidad
      // ===============================================================
      h1APA(doc, '8', 'Cierre y Firmas de Conformidad');

      // Texto de aceptación APA (párrafo con sangría)
      p(doc,
        'Al firmar el presente documento, el contratante declara haber leído, entendido y aceptado los términos, ' +
        'alcances, exclusiones y costos aquí descritos. Esta cotización constituye una oferta formal vinculante ' +
        'durante su período de vigencia.',
      );

      // --- Signature lines ---
      if (doc.y + 60 > doc.page.height - APA.margin) doc.addPage();

      ln(doc, 0.5);
  const sigY = doc.y;
      const sigW = 200;
      const sigSpacing = 30;
      const lineY = sigY;

      // Proveedor
      doc.strokeColor(C.border).lineWidth(0.6)
        .moveTo(APA.margin, lineY)
        .lineTo(APA.margin + sigW, lineY)
        .stroke();
      doc.fontSize(APA.sizeSmall).font(APA.fontBold);
      doc.fillColor(C.text);
      doc.text('ProArq', APA.margin, lineY + 4, { width: sigW, align: 'center' });
      doc.fontSize(APA.sizeSmall).font(APA.font);
      doc.fillColor(C.muted);
      doc.text('Prestador del servicio', APA.margin, lineY + 16, { width: sigW, align: 'center' });

      // Cliente
      const cX = APA.margin + MW - sigW;
      doc.strokeColor(C.border).lineWidth(0.6)
        .moveTo(cX, lineY)
        .lineTo(cX + sigW, lineY)
        .stroke();
      doc.fontSize(APA.sizeSmall).font(APA.fontBold);
      doc.fillColor(C.text);
      doc.text(cotizacion.clienteId || 'Cliente', cX, lineY + 4, { width: sigW, align: 'center' });
      doc.fontSize(APA.sizeSmall).font(APA.font);
      doc.fillColor(C.muted);
      doc.text('Contratante', cX, lineY + 16, { width: sigW, align: 'center' });

      doc.y = lineY + 40;

      // ===============================================================
      // SECOND PASS — Page numbers (top right, APA style)
      // ===============================================================
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        // APA page number: top right, 1 inch from edge
        doc.fontSize(APA.size).font(APA.font);
        doc.fillColor(C.text);
        doc.text(String(i + 1), APA.margin + MW - 30, APA.margin - 6, {
          width: 40, align: 'right',
        });
      }

      doc.end();
    } catch (err) {
      next(err);
    }
  };
}

// =============================================================================
// List PDF export
// =============================================================================

export function exportPdfCotizacionesController(useCase: ManageCotizacionUseCase) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = cotizacionQuerySchema.parse(req.query);
      const cotizaciones = await useCase.findAll(query);

      const columns = [
        { header: 'Código', key: 'codigo', width: 80 },
        { header: 'Ver.', key: 'version', width: 45, align: 'center' as const },
        { header: 'Estado', key: 'estado', width: 80, align: 'center' as const },
        { header: 'ID Proyecto', key: 'projectoId', width: 95 },
        {
          header: 'Costo Directo',
          key: 'totalCostDirect',
          width: 102,
          align: 'right' as const,
          render: (val: any) => fmt$(val),
        },
        {
          header: 'Total Final',
          key: 'totalAmount',
          width: 100,
          align: 'right' as const,
          render: (val: any) => fmt$(val),
        },
      ];

      const pdfBuffer = await generatePdfReport('Listado de Cotizaciones', columns, cotizaciones, {
        generatedBy: req.user?.sub || 'Usuario Registrado',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=listado-cotizaciones.pdf');
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };
}
