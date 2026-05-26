import React from 'react';
import type { Apu } from '../services/api/apus.api';
import { colors } from '../theme/colors';
import CardActions from './ui/CardActions';

interface ApuCardProps {
  apu: Apu;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onClick?: () => void;
}

function ApuCardComponent({ apu, onEdit, onDelete, isDeleting, onClick }: ApuCardProps) {
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
          <span>{apu.codigo}</span> - {apu.nombre}
        </p>
        <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
          {apu.tipo} | {apu.itemsCount || 0} items
        </p>
      </div>
      {(onEdit || onDelete) && (
        <CardActions onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      )}
    </div>
  );
}

const ApuCard = React.memo(ApuCardComponent);
export default ApuCard;
