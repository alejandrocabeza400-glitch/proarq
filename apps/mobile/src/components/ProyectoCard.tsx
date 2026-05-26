import React from 'react';
import { colors } from '../theme/colors';
import CardActions from './ui/CardActions';

interface ProyectoCardProps {
  proyecto: {
    id: string;
    codigo: string;
    nombre: string;
    estado?: string;
    clienteNombre?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onClick?: () => void;
}

function getStatusColor(estado: string): string {
  switch (estado?.toUpperCase()) {
    case 'ACTIVO':
      return '#2e7d32';
    case 'PLANEADO':
      return colors.primaryContainer;
    case 'FINALIZADO':
      return '#555555';
    case 'CANCELADO':
      return colors.error;
    default:
      return colors.onSurfaceVariant;
  }
}

function ProyectoCardComponent({
  proyecto,
  onEdit,
  onDelete,
  isDeleting,
  onClick,
}: ProyectoCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 600, color: colors.onSurface, margin: 0, fontSize: '14px' }}>
            {proyecto.codigo} - {proyecto.nombre}
          </p>
          {proyecto.estado && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: getStatusColor(proyecto.estado),
                color: '#ffffff',
                textTransform: 'uppercase',
                marginLeft: '8px',
              }}
            >
              {proyecto.estado}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>
          {proyecto.clienteNombre || 'Sin cliente asignado'}
        </p>
      </div>
      {(onEdit || onDelete) && (
        <CardActions onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      )}
    </div>
  );
}

const ProyectoCard = React.memo(ProyectoCardComponent);
export default ProyectoCard;
