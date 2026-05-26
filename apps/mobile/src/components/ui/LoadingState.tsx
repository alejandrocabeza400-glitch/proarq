import type React from 'react';
import { colors } from '../../theme/colors';

interface LoadingStateProps {
  message?: string;
  variant?: 'skeleton' | 'spinner';
  fullPage?: boolean;
}

export default function LoadingState({
  message,
  variant = 'skeleton',
  fullPage = false,
}: LoadingStateProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    gap: '16px',
    width: '100%',
    ...(fullPage
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.surface,
          zIndex: 9999,
        }
      : {}),
  };

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: `3px solid ${colors.outlineVariant}`,
    borderTopColor: colors.primaryContainer,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const skeletonStyle: React.CSSProperties = {
    width: '100%',
    height: '80px',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  if (variant === 'spinner') {
    return (
      <div
        data-testid="loading-container"
        className={fullPage ? 'fullpage' : ''}
        style={containerStyle}
      >
        <div data-testid="loading-indicator" role="status" aria-label="loading">
          <div data-testid="spinner" style={spinnerStyle} />
        </div>
        {message && (
          <p style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant, fontSize: '14px' }}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="loading-container"
      className={fullPage ? 'fullpage' : ''}
      style={containerStyle}
    >
      <div data-testid="loading-indicator" role="status" aria-label="loading">
        <div data-testid="skeleton-placeholder" style={skeletonStyle} />
      </div>
      {message && (
        <p style={{ fontFamily: 'Inter', color: colors.onSurfaceVariant, fontSize: '14px' }}>
          {message}
        </p>
      )}
    </div>
  );
}
