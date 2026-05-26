import React from 'react';
import type { Insumo } from '../services/api/insumos.api';
import { colors } from '../theme/colors';
import CardActions from './ui/CardActions';

interface InsumoCardProps {
  insumo: Insumo;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onClick?: () => void;
}

function InsumoCardComponent({ insumo, onEdit, onDelete, isDeleting, onClick }: InsumoCardProps) {
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: colors.onSurface, margin: 0, fontSize: '14px' }}>
          {insumo.codigo} - {insumo.nombre}
        </p>
        <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
          {insumo.unidad} | ${insumo.costBase}
        </p>
      </div>
      {(onEdit || onDelete) && (
        <CardActions onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      )}
    </div>
  );
}

const InsumoCard = React.memo(InsumoCardComponent);
export default InsumoCard;
