import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import Card from './ui/Card';
import CardActions from './ui/CardActions';
import Text from './ui/Text';

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

function getStatusStyles(estado: string): { bg: string; text: string } {
  switch (estado?.toUpperCase()) {
    case 'ACTIVO':
      return { bg: '#e8f5e9', text: '#2e7d32' };
    case 'PLANEADO':
      return { bg: '#e8f4fd', text: '#1565c0' };
    case 'FINALIZADO':
      return { bg: '#eceff1', text: '#455a64' };
    case 'CANCELADO':
      return { bg: '#ffebee', text: '#c62828' };
    default:
      return { bg: '#f5f5f5', text: '#616161' };
  }
}

function ProyectoCardComponent({
  proyecto,
  onEdit,
  onDelete,
  isDeleting,
  onClick,
}: ProyectoCardProps) {
  const badge = getStatusStyles(proyecto.estado || '');

  return (
    <Card onPress={onClick} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="bodyMd" weight="700" color={colors.onSurface} style={styles.title}>
            <Text variant="bodyMd" weight="800" color={colors.surfaceTint} style={styles.code}>
              {proyecto.codigo}
            </Text>
            {' — '}{proyecto.nombre}
          </Text>
          
          {proyecto.estado && (
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text variant="labelSm" weight="700" color={badge.text} style={styles.badgeText}>
                {proyecto.estado}
              </Text>
            </View>
          )}
        </View>
        
        <Text variant="labelSm" color={colors.onSurfaceVariant} style={styles.subtitle}>
          Cliente:{' '}
          <Text variant="labelSm" weight="600" color={colors.onSurface}>
            {proyecto.clienteNombre || 'Sin cliente asignado'}
          </Text>
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
    minHeight: 90,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  title: {
    lineHeight: 22,
    fontSize: 16,
  },
  code: {
    marginRight: 4,
    color: colors.tertiary,
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

const ProyectoCard = React.memo(ProyectoCardComponent);
export default ProyectoCard;
