import PDFDocument from 'pdfkit';

// ---------------------------------------------------------------------------
// ProArq Professional PDF Design System
// ---------------------------------------------------------------------------
// Design tokens for a premium, high-quality PDF look.
// ---------------------------------------------------------------------------

const DESIGN = {
  colors: {
    // Primary palette
    primary: '#0D9488', // Teal 600 — brand primary
    primaryDark: '#0F766E', // Teal 700 — darker for headers/bars
    primaryLight: '#14B8A6', // Teal 500 — lighter accent
    primaryBg: '#F0FDFA', // Teal 50 — very light background
    primaryBgAlt: '#CCFBF1', // Teal 100 — alternate row color

    // Neutral palette
    dark: '#0F172A', // Slate 900 — main headings
    text: '#1E293B', // Slate 800 — body text
    muted: '#64748B', // Slate 500 — secondary text
    subtle: '#94A3B8', // Slate 400 — very subtle text
    border: '#CBD5E1', // Slate 300 — light borders
    divider: '#E2E8F0', // Slate 200 — subtle dividers
    white: '#FFFFFF',
    pageBg: '#FFFFFF',

    // Accent
    gold: '#F59E0B', // Amber — status/highlights
    success: '#10B981', // Green — positive states
    error: '#EF4444', // Red — negative states

    // Table
    tableHeaderBg: '#0D9488', // Teal header
    tableHeaderText: '#FFFFFF',
    tableBorder: '#CBD5E1',
  },

  fonts: {
    title: 22,
    subtitle: 13,
    body: 9,
    small: 8,
    tiny: 7,
    tableHeader: 9,
    tableBody: 8.5,
  },

  spacing: {
    marginX: 55,
    marginYTop: 55,
    marginYBottom: 50,
    headerBarHeight: 110,
    footerYOffset: 38,
    tableHeaderHeight: 24,
    rowMinHeight: 18,
    cellPaddingX: 6,
    cellPaddingY: 4,
  },
};

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PdfColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  key: string;
  render?: (val: unknown) => string;
}

export interface PdfReportOptions {
  generatedBy?: string;
}

// ---------------------------------------------------------------------------
// Helper: draw a page header on every page
// ---------------------------------------------------------------------------

function drawPageHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  pageNum: number,
  totalPages: number,
): void {
  const { marginX, headerBarHeight } = DESIGN.spacing;
  const pageW = doc.page.width;

  // --- Full-width header bar with gradient effect ---
  // Main bar
  doc.rect(0, 0, pageW, headerBarHeight).fill(DESIGN.colors.primaryDark);

  // Accent stripe at bottom of header bar
  doc.rect(0, headerBarHeight - 4, pageW, 4).fill(DESIGN.colors.primaryLight);

  // --- Brand watermark text ---
  doc
    .fillColor(DESIGN.colors.primaryBg)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('PROARQ', marginX, 14, { align: 'left' });

  doc
    .fillColor(DESIGN.colors.white)
    .fontSize(9)
    .font('Helvetica')
    .text('Cost Estimation System', marginX, 30, { align: 'left' });

  // --- Title on header bar ---
  doc
    .fillColor(DESIGN.colors.white)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(title, marginX, 56, { align: 'left' });

  // Decorative small line under title
  doc.rect(marginX, 82, 50, 3).fill(DESIGN.colors.gold);

  // --- Page number top right ---
  doc
    .fillColor(DESIGN.colors.primaryBg)
    .fontSize(8)
    .font('Helvetica')
    .text(`Página ${pageNum} de ${totalPages}`, 0, 16, {
      align: 'right',
      width: pageW - marginX,
    });
}

// ---------------------------------------------------------------------------
// Helper: draw a page footer on every page
// ---------------------------------------------------------------------------

function drawPageFooter(doc: PDFKit.PDFDocument, dateStr: string): void {
  const { marginX, footerYOffset } = DESIGN.spacing;
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const footerY = pageH - footerYOffset;

  // Footer line
  doc
    .strokeColor(DESIGN.colors.divider)
    .lineWidth(0.8)
    .moveTo(marginX, footerY)
    .lineTo(pageW - marginX, footerY)
    .stroke();

  // Copyright left
  doc
    .fillColor(DESIGN.colors.subtle)
    .fontSize(7)
    .font('Helvetica')
    .text('© ProArq — Documento Confidencial', marginX, footerY + 6, {
      align: 'left',
      width: (pageW - 2 * marginX) / 2,
    });

  // Date right
  doc
    .fillColor(DESIGN.colors.subtle)
    .fontSize(7)
    .font('Helvetica')
    .text(`Generado: ${dateStr}`, marginX, footerY + 6, {
      align: 'right',
      width: (pageW - 2 * marginX) / 2,
    });
}

// ---------------------------------------------------------------------------
// Helper: draw metadata section
// ---------------------------------------------------------------------------

function drawMetadata(doc: PDFKit.PDFDocument, dateStr: string, generatedBy?: string): void {
  const { marginX } = DESIGN.spacing;
  const startY = DESIGN.spacing.headerBarHeight + 20;

  // Subtle metadata box background
  doc
    .fillColor(DESIGN.colors.primaryBg)
    .rect(marginX, startY, doc.page.width - 2 * marginX, generatedBy ? 46 : 28)
    .fill();

  // Accent left border on metadata box
  doc
    .fillColor(DESIGN.colors.primary)
    .rect(marginX, startY, 4, generatedBy ? 46 : 28)
    .fill();

  // Metadata content
  doc.fillColor(DESIGN.colors.muted).fontSize(DESIGN.fonts.body).font('Helvetica');

  const textX = marginX + 14;
  if (generatedBy) {
    doc.text(`Generado por: ${generatedBy}`, textX, startY + 6);
    doc.text(`Fecha de emisión: ${dateStr}`, textX, startY + 24);
  } else {
    doc.text(`Fecha de emisión: ${dateStr}`, textX, startY + 8);
  }

  doc.moveDown(2.5);
}

// ---------------------------------------------------------------------------
// Helper: format cell value
// ---------------------------------------------------------------------------

function formatCellValue(col: PdfColumn, row: Record<string, unknown>): string {
  const rawVal = row[col.key];
  if (col.render) return col.render(rawVal);
  if (rawVal !== undefined && rawVal !== null) return String(rawVal);
  return '-';
}

// ---------------------------------------------------------------------------
// Helper: draw a beautiful table with header, alternating rows, borders
// ---------------------------------------------------------------------------

function drawTable(
  doc: PDFKit.PDFDocument,
  columns: PdfColumn[],
  data: Array<Record<string, unknown>>,
): void {
  const { marginX, tableHeaderHeight, rowMinHeight, cellPaddingX } = DESIGN.spacing;
  const pageW = doc.page.width;
  const tableWidth = pageW - 2 * marginX;
  const startX = marginX;

  let currentY = doc.y + 4;

  // -- Table Header --
  const headerY = currentY;

  // Header background — full width
  doc
    .fillColor(DESIGN.colors.tableHeaderBg)
    .rect(startX, headerY, tableWidth, tableHeaderHeight)
    .fill();

  // Header text
  doc
    .fillColor(DESIGN.colors.tableHeaderText)
    .font('Helvetica-Bold')
    .fontSize(DESIGN.fonts.tableHeader);
  let hX = startX;
  for (const col of columns) {
    doc.text(col.header, hX + cellPaddingX, headerY + 6, {
      width: col.width - 2 * cellPaddingX,
      align: col.align || 'left',
    });
    hX += col.width;
  }

  currentY = headerY + tableHeaderHeight;

  // -- Data Rows --
  doc.font('Helvetica').fontSize(DESIGN.fonts.tableBody);

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    const isOdd = rowIdx % 2 === 1;

    // Calculate row height
    let maxRowHeight = rowMinHeight;
    const cellValues: string[] = [];
    for (const col of columns) {
      const val = formatCellValue(col, row);
      cellValues.push(val);
      const textH = doc.heightOfString(val, {
        width: col.width - 2 * cellPaddingX,
      });
      const neededH = textH + 2 * DESIGN.spacing.cellPaddingY;
      if (neededH > maxRowHeight) maxRowHeight = neededH;
    }

    // --- Page break ---
    if (currentY + maxRowHeight + 20 > doc.page.height - DESIGN.spacing.footerYOffset) {
      doc.addPage();
      currentY = DESIGN.spacing.headerBarHeight + 20;
    }

    // Row background (alternating)
    if (isOdd) {
      doc
        .fillColor(DESIGN.colors.primaryBgAlt)
        .rect(startX, currentY, tableWidth, maxRowHeight)
        .fill();
    }

    // Bottom border for each row
    doc
      .strokeColor(DESIGN.colors.tableBorder)
      .lineWidth(0.5)
      .moveTo(startX, currentY + maxRowHeight)
      .lineTo(startX + tableWidth, currentY + maxRowHeight)
      .stroke();

    // Draw cell values
    doc.fillColor(DESIGN.colors.text);
    let cX = startX;
    for (let cIdx = 0; cIdx < columns.length; cIdx++) {
      const col = columns[cIdx];
      doc.text(cellValues[cIdx], cX + cellPaddingX, currentY + DESIGN.spacing.cellPaddingY, {
        width: col.width - 2 * cellPaddingX,
        align: col.align || 'left',
        lineBreak: true,
      });
      cX += col.width;
    }

    currentY += maxRowHeight;
  }
}

// ---------------------------------------------------------------------------
// Main export: generatePdfReport
// ---------------------------------------------------------------------------

/**
 * Generates a premium, professional PDF report with full branding:
 * - Branded header bar with company name
 * - Metadata section
 * - Styled table with alternating row colors and teal header
 * - Page headers and footers on every page
 * Streams the PDF to a Buffer.
 */
export function generatePdfReport(
  title: string,
  columns: PdfColumn[],
  data: Array<Record<string, unknown>>,
  options: PdfReportOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: DESIGN.spacing.marginX,
        bufferPages: true,
        info: {
          Title: title,
          Author: 'ProArq Cost Estimation System',
          Subject: 'Reporte de Gestión de Obra',
          Producer: 'ProArq PDF Engine',
          Creator: 'ProArq API',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const dateStr = new Date().toLocaleString('es-ES', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // --- Page 1: Draw first-page content ---
      drawPageHeader(doc, title, 1, 1); // We'll fix page nums in the second pass
      drawMetadata(doc, dateStr, options.generatedBy);

      // Column widths must total to (page width - 2 * marginX)
      // Verify and warn if they don't
      const totalColWidth = columns.reduce((sum, c) => sum + c.width, 0);
      const pageContentWidth = doc.page.width - 2 * DESIGN.spacing.marginX;
      if (Math.abs(totalColWidth - pageContentWidth) > 1) {
      }

      drawTable(doc, columns, data);

      // --- Second pass: fix page headers and footers on all pages ---
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        // Clear the temporary header/footer drawn in pass 1 by overlaying
        // the proper ones
        drawPageHeader(doc, title, i + 1, range.count);
        drawPageFooter(doc, dateStr);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
