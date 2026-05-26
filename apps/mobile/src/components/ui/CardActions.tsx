import React from 'react';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function CardActions({ onEdit, onDelete, isDeleting }: CardActionsProps) {
  return (
    <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', marginLeft: spacing.sm }}>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            backgroundColor: colors.primaryContainer,
            border: 'none',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s',
          }}
          aria-label="Editar"
          title="Editar"
        >
          <span style={{ fontSize: '14px' }}>✏️</span>
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          style={{
            backgroundColor: colors.error,
            border: 'none',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s',
            opacity: isDeleting ? 0.5 : 1,
          }}
          aria-label="Eliminar"
          title="Eliminar"
        >
          <span style={{ fontSize: '14px', color: '#ffffff' }}>
            {isDeleting ? '⏳' : '🗑️'}
          </span>
        </button>
      )}
    </div>
  );
}
