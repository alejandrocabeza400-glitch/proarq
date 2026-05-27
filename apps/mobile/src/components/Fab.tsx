import { colors } from '../theme/colors';
import { PlusIcon } from './ui/Icons';

interface FabProps {
  onClick: () => void;
  ariaLabel: string;
  visible?: boolean;
}

export default function Fab({ onClick, ariaLabel, visible = true }: FabProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        bottom: '80px',
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '28px',
        backgroundColor: colors.tertiaryContainer,
        color: '#ffffff',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(243, 112, 33, 0.35), 0 2px 5px rgba(243, 112, 33, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        transition:
          'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background-color 0.2s ease',
        overflow: 'hidden',
        position: 'fixed' as const,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
        e.currentTarget.style.boxShadow =
          '0 8px 24px rgba(243, 112, 33, 0.45), 0 4px 10px rgba(243, 112, 33, 0.25)';
        e.currentTarget.style.backgroundColor = '#ed6c1c';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        e.currentTarget.style.boxShadow =
          '0 4px 14px rgba(243, 112, 33, 0.35), 0 2px 5px rgba(243, 112, 33, 0.2)';
        e.currentTarget.style.backgroundColor = colors.tertiaryContainer;
      }}
    >
      <PlusIcon size={24} color="#ffffff" />
    </button>
  );
}
