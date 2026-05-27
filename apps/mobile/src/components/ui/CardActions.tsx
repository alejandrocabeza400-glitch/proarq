import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { DeleteIcon, EditIcon } from './Icons';

interface CardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function CardActions({ onEdit, onDelete, isDeleting }: CardActionsProps) {
  return (
    <View style={styles.container}>
      {onEdit && (
        <Pressable
          onPress={(e) => {
            // This is critical for Web compatibility when nested in other Pressables
            if (typeof e?.stopPropagation === 'function') e.stopPropagation();
            onEdit();
          }}
          style={({ pressed, hovered }) => [
            styles.button,
            styles.editButton,
            (pressed || hovered) && styles.editActive,
            { transform: [{ scale: pressed ? 0.95 : hovered ? 1.05 : 1 }] }
          ]}
          accessibilityLabel="Editar"
        >
          <EditIcon size={18} color={colors.primary} />
        </Pressable>
      )}
      {onDelete && (
        <Pressable
          onPress={(e) => {
            if (typeof e?.stopPropagation === 'function') e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          style={({ pressed, hovered }) => [
            styles.button,
            styles.deleteButton,
            (pressed || hovered) && styles.deleteActive,
            { 
              transform: [{ scale: pressed ? 0.95 : hovered ? 1.05 : 1 }],
              opacity: isDeleting ? 0.5 : 1
            }
          ]}
          accessibilityLabel="Eliminar"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <DeleteIcon size={18} color={colors.error} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  button: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 40,
    minHeight: 40,
  },
  editButton: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(15, 23, 42, 0.1)',
  },
  editActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderColor: 'rgba(15, 23, 42, 0.3)',
  },
  deleteButton: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
