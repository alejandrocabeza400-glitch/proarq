import { useRouter } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authService } from '../../services/auth/auth.service';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email?.includes('@')) {
      setError('Ingresa un correo electrónico válido');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await authService.forgotPassword({ email });
      setSuccess(result.message);
      router.push('/(auth)/verify-code');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    fontFamily: 'Inter',
  };

  const formStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  };

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <div style={{ marginBottom: spacing.md }}>
          <button
            data-testid="back-button"
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '4px',
              color: colors.onSurface,
            }}
            aria-label="Volver"
          >
            ←
          </button>
        </div>

        <p
          style={{
            color: colors.onSurfaceVariant,
            fontSize: '14px',
            margin: 0,
            marginBottom: spacing.md,
          }}
        >
          Ingresa tu correo electrónico y te enviaremos un código de verificación
        </p>

        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="ejemplo@proarq.com"
          value={email}
          onChangeText={setEmail}
        />

        {error && <p style={{ color: colors.error, fontSize: '14px', margin: 0 }}>{error}</p>}

        {success && <p style={{ color: '#2e7d32', fontSize: '14px', margin: 0 }}>{success}</p>}

        <Button onPress={handleSubmit} disabled={loading} loading={loading} fullWidth>
          {loading ? 'Enviando...' : 'Enviar código'}
        </Button>
      </div>
    </div>
  );
}
