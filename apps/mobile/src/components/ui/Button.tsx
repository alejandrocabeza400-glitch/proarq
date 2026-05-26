import type React from 'react';
import { colors } from '../../theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export default function Button({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  style,
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    minHeight: '44px',
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: '1.4',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'opacity 0.2s',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.tertiaryContainer,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: colors.primaryContainer,
      color: '#ffffff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.primary,
    },
  };

  const classes = [variant, fullWidth ? 'full' : '', disabled ? 'disabled' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      className={classes}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {loading ? (
        <span data-testid="loading-spinner" role="status" aria-label="loading">
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        </span>
      ) : (
        children
      )}
    </button>
  );
}
