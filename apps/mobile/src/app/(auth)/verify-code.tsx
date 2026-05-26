import { colors } from '../../theme/colors';

export default function VerifyCodeScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: colors.surface,
        fontFamily: 'Inter',
      }}
    >
      <p>Verificación de código</p>
    </div>
  );
}
