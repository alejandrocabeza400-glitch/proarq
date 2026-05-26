import type React from 'react';
import { colors } from '../../theme/colors';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '16px',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      <div
        data-testid="empty-state-icon"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: colors.surfaceContainerHigh,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}
      >
        📋
      </div>
      <h2
        style={{
          fontFamily: 'Inter',
          fontSize: '18px',
          fontWeight: 600,
          color: colors.onSurface,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontFamily: 'Inter',
            fontSize: '14px',
            color: colors.onSurfaceVariant,
            margin: 0,
            maxWidth: '300px',
          }}
        >
          {description}
        </p>
      )}
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            marginTop: '8px',
            padding: '12px 24px',
            backgroundColor: colors.tertiaryContainer,
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: 600,
            minHeight: '44px',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
