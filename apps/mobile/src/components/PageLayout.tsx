import type React from 'react';
import { fadeIn } from '../styles/animations';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import Fab from './Fab';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  fabAction?: () => void;
  fabLabel?: string;
  fabVisible?: boolean;
}

export default function PageLayout({
  title,
  children,
  onBack,
  showBack = false,
  fabAction,
  fabLabel = '+',
  fabVisible = false,
}: PageLayoutProps) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        padding: spacing.md,
        backgroundColor: colors.surface,
        minHeight: '100vh',
        ...fadeIn,
      }}
    >
      {/* Back button */}
      {showBack && (
        <button
          onClick={onBack}
          aria-label="Volver"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: spacing.md,
            fontFamily: 'Inter',
            fontSize: '14px',
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Volver
        </button>
      )}

      {/* Title */}
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: colors.onSurface,
          margin: showBack ? '0 0 16px' : '0 0 16px',
        }}
      >
        {title}
      </h1>

      {/* Content */}
      {children}

      {/* FAB */}
      {fabAction && <Fab onClick={fabAction} ariaLabel={fabLabel} visible={fabVisible} />}
    </div>
  );
}
