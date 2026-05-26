import React from 'react';
import { colors } from '../theme/colors';
import CardActions from './ui/CardActions';

interface CotizacionCardProps {
  cotizacion: {
    id: string;
    codigo: string;
    proyectoNombre?: string;
    estado: string;
    [key: string]: any;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onClick?: () => void;
}

function CotizacionCardComponent({
  cotizacion,
  onEdit,
  onDelete,
  isDeleting,
  onClick,
}: CotizacionCardProps) {
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={onClick}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: colors.onSurface, margin: 0, fontSize: '14px' }}>
          {cotizacion.codigo}
        </p>
        <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
          {cotizacion.proyectoNombre} |{' '}
          <span
            style={{
              color: cotizacion.estado === 'BORRADOR' ? colors.tertiaryContainer : '#2e7d32',
            }}
          >
            {cotizacion.estado}
          </span>
        </p>
      </div>
      {(onEdit || onDelete) && (
        <CardActions onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      )}
    </div>
  );
}

const CotizacionCard = React.memo(CotizacionCardComponent);
export default CotizacionCard;
