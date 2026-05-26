import type React from 'react';
import { colors } from '../../theme/colors';

interface Column {
  key: string;
  header: string;
  numeric?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  onRowPress?: (row: Record<string, any>) => void;
  onSort?: (key: string) => void;
  sortable?: boolean;
}

export default function Table({ columns, data, onRowPress, onSort, sortable }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 16px',
          color: colors.onSurfaceVariant,
          fontFamily: 'Inter',
          fontSize: '14px',
        }}
      >
        No data available
      </div>
    );
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Inter',
  };

  const headerStyle: React.CSSProperties = {
    textTransform: 'uppercase',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerLowest,
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: `1px solid ${colors.outlineVariant}`,
    cursor: sortable ? 'pointer' : 'default',
  };

  const getRowStyle = (index: number): React.CSSProperties => ({
    backgroundColor: index % 2 === 0 ? colors.surface : colors.surfaceContainerLow,
    cursor: onRowPress ? 'pointer' : 'default',
    transition: 'background-color 0.15s',
  });

  const cellStyle = (numeric?: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    fontSize: '14px',
    color: colors.onSurface,
    textAlign: numeric ? 'right' : 'left',
    borderBottom: `1px solid ${colors.outlineVariant}33`,
  });

  return (
    <table style={tableStyle}>
      <thead>
        <tr className="header">
          {columns.map((col) => (
            <th key={col.key} style={headerStyle} onClick={() => sortable && onSort?.(col.key)}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={`row-${rowIndex % 2 === 0 ? 'even' : 'odd'}`}
            style={getRowStyle(rowIndex)}
            onClick={() => onRowPress?.(row)}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={col.numeric ? 'numeric' : ''}
                style={cellStyle(col.numeric)}
              >
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
