import { colors } from '../theme/colors';

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
        borderRadius: '50%',
        backgroundColor: colors.tertiaryContainer,
        color: '#ffffff',
        border: 'none',
        cursor: 'pointer',
        fontSize: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        transition: 'transform 0.2s, box-shadow 0.2s',
        overflow: 'hidden',
        position: 'fixed' as const,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
    >
      +
    </button>
  );
}
