import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import Card from './ui/Card';
import CardActions from './ui/CardActions';
import Text from './ui/Text';

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

function getStatusStyles(estado: string): { bg: string; text: string } {
  switch (estado?.toUpperCase()) {
    case 'APROBADA':
      return { bg: '#e8f5e9', text: '#2e7d32' };
    case 'ENVIADA':
      return { bg: '#e3f2fd', text: '#1565c0' };
    case 'BORRADOR':
      return { bg: '#fff3eb', text: '#d84315' };
    case 'REEMPLAZADA':
      return { bg: '#eceff1', text: '#455a64' };
    default:
      return { bg: '#f5f5f5', text: '#616161' };
  }
}

function CotizacionCardComponent({
  cotizacion,
  onEdit,
  onDelete,
  isDeleting,
  onClick,
}: CotizacionCardProps) {
  const badge = getStatusStyles(cotizacion.estado);

  return (
    <Card onPress={onClick} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="bodyMd" weight="800" color={colors.onSurface} style={styles.title}>
            {cotizacion.codigo}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text variant="labelSm" weight="700" color={badge.text} style={styles.badgeText}>
              {cotizacion.estado}
            </Text>
          </View>
        </View>
        <Text variant="labelSm" color={colors.onSurfaceVariant} style={styles.subtitle}>
          {cotizacion.proyectoNombre || 'Sin proyecto asignado'}
        </Text>
      </View>
      
      {(onEdit || onDelete) && (
        <CardActions onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    minHeight: 80,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    letterSpacing: -0.16,
    fontSize: 16,
  },
  subtitle: {
    opacity: 0.7,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

const CotizacionCard = React.memo(CotizacionCardComponent);
export default CotizacionCard;
