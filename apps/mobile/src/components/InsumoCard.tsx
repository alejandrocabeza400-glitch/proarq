import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Insumo } from '../services/api/insumos.api';
import { colors } from '../theme/colors';
import Card from './ui/Card';
import CardActions from './ui/CardActions';
import Text from './ui/Text';

interface InsumoCardProps {
  insumo: Insumo;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onClick?: () => void;
}

function InsumoCardComponent({ insumo, onEdit, onDelete, isDeleting, onClick }: InsumoCardProps) {
  return (
    <Card onPress={onClick} style={styles.card}>
      <View style={styles.content}>
        <Text variant="bodyMd" weight="700" color={colors.primary} style={styles.title}>
          <Text variant="bodyMd" weight="800" style={styles.code}>
            {insumo.codigo}
          </Text>
          {' — '}{insumo.nombre}
        </Text>
        
        <View style={styles.meta}>
          <Text variant="labelSm" color={colors.onSurfaceVariant} style={styles.metaText}>
            {insumo.unidad}
            {'  •  '}
            Base:{' '}
            <Text variant="labelSm" weight="800" style={styles.price}>
              ${Number(insumo.costBase).toLocaleString('es-CO')}
            </Text>
          </Text>
        </View>
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
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    lineHeight: 22,
    fontSize: 16,
  },
  code: {
    marginRight: 6,
    color: colors.tertiary,
  },
  meta: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  price: {
    color: colors.success,
  },
});

const InsumoCard = React.memo(InsumoCardComponent);
export default InsumoCard;
