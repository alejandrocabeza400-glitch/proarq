import type React from 'react';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function Card({ children, onPress, disabled, style }: CardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: '8px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    ...shadows.sm,
    cursor: onPress && !disabled ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const handleClick = () => {
    if (onPress && !disabled) {
      onPress();
    }
  };

  return (
    <div
      data-testid="card-container"
      onClick={handleClick}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      style={cardStyle}
    >
      {children}
    </div>
  );
}
