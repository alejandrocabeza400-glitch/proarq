import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Apu } from '../services/api/apus.api';
import { colors } from '../theme/colors';
import Card from './ui/Card';
import CardActions from './ui/CardActions';
import Text from './ui/Text';

interface ApuCardProps {
  apu: Apu;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onClick?: () => void;
}

function ApuCardComponent({ apu, onEdit, onDelete, isDeleting, onClick }: ApuCardProps) {
  return (
    <Card onPress={onClick} style={styles.card}>
      <View style={styles.content}>
        <Text variant="bodyMd" weight="700" color={colors.primary} style={styles.title}>
          <Text variant="bodyMd" weight="800" style={styles.code}>
            {apu.codigo}
          </Text>
          {' — '}{apu.nombre}
        </Text>
        
        <View style={styles.meta}>
          <View style={styles.typeBadge}>
            <Text variant="labelSm" weight="800" color={colors.secondary}>
              {apu.tipo.toUpperCase()}
            </Text>
          </View>
          <Text variant="labelSm" color={colors.onSurfaceVariant} style={styles.itemsCount}>
            {apu.itemsCount || 0} ítems
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
    minHeight: 90,
  },
  content: {
    flex: 1,
    gap: 8,
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
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 6,
  },
  itemsCount: {
    opacity: 0.7,
    fontWeight: '600',
  },
});

const ApuCard = React.memo(ApuCardComponent);
export default ApuCard;
