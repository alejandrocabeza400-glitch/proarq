import { describe, expect, it, vi } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';

describe('DataTable Component', () => {
  const columns = [
    { key: 'codigo', header: 'Código' },
    { key: 'nombre', header: 'Nombre' },
    { key: 'unidad', header: 'Unidad' },
  ];

  const data = [
    { codigo: 'CEM-001', nombre: 'Cemento Portland', unidad: 'KG' },
    { codigo: 'VAR-001', nombre: 'Varilla 3/8"', unidad: 'KG' },
  ];

  const renderDataTable = async (props: Record<string, any> = {}) => {
    const DataTable = (await import('../../components/ui/Table')).default;
    return render(<DataTable columns={columns} data={data} {...props} />);
  };

  it('should render header row with column titles', async () => {
    await renderDataTable();
    expect(screen.getByText('Código')).toBeDefined();
    expect(screen.getByText('Nombre')).toBeDefined();
    expect(screen.getByText('Unidad')).toBeDefined();
  });

  it('should render data rows', async () => {
    await renderDataTable();
    expect(screen.getByText('CEM-001')).toBeDefined();
    expect(screen.getByText('Cemento Portland')).toBeDefined();
    expect(screen.getByText('VAR-001')).toBeDefined();
  });

  it('should render empty state when data is empty', async () => {
    await renderDataTable({ data: [] });
    const emptyMessage = screen.getByText(/no data|sin datos|empty/i);
    expect(emptyMessage).toBeDefined();
  });

  it('should call onRowPress when a row is clicked', async () => {
    const onRowPress = vi.fn();
    await renderDataTable({ onRowPress });

    const firstRow = screen.getByText('CEM-001').closest('tr') || screen.getByText('CEM-001');
    fireEvent.click(firstRow);

    expect(onRowPress).toHaveBeenCalledWith(data[0]);
  });

  it('should render zebra striping on rows', async () => {
    await renderDataTable();
    const rows = screen.getAllByRole('row');
    // Body rows should have alternating classes
    const bodyRows = rows.slice(1); // skip header
    if (bodyRows.length >= 2) {
      expect(bodyRows[0].className).not.toBe(bodyRows[1].className);
    }
  });

  it('should have all-caps labels on header', async () => {
    await renderDataTable();
    const headerRow = screen.getAllByRole('row')[0];
    expect(headerRow.className).toContain('header');
  });

  it('should support sortable columns when sortable prop is true', async () => {
    const onSort = vi.fn();
    await renderDataTable({ sortable: true, onSort });

    const headerCell = screen.getByText('Código');
    fireEvent.click(headerCell);

    expect(onSort).toHaveBeenCalledWith('codigo');
  });

  it('should render numeric values right-aligned', async () => {
    const numericColumns = [
      { key: 'name', header: 'Name' },
      { key: 'amount', header: 'Amount', numeric: true },
    ];

    await renderDataTable({
      columns: numericColumns,
      data: [{ name: 'Test', amount: '1500' }],
    });

    const amountCell = screen.getByText('1500');
    expect(amountCell.className).toContain('numeric');
  });
});
