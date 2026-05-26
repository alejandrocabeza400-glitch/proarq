import { useRouter } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authService } from '../../services/auth/auth.service';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const _result = await authService.login({ email, password });
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      if (err?.message?.includes('Network Error') || err?.message?.includes('fetch')) {
        setError('No se puede conectar con el servidor. Verifica que el backend esté activo.');
      } else if (err?.response?.status === 401) {
        setError('Credenciales inválidas');
      } else if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.code === 'ECONNABORTED') {
        setError('El servidor no responde (timeout). ¿Está el backend corriendo?');
      } else {
        setError('Error de conexión. Verifica que el backend esté activo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
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
      <form style={formStyle} onSubmit={handleLogin}>
        <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          <h1
            style={{ color: colors.primaryContainer, fontSize: '28px', margin: 0, fontWeight: 700 }}
          >
            ProArq
          </h1>
          <p style={{ color: colors.onSurfaceVariant, fontSize: '14px', margin: '8px 0 0' }}>
            Innova APU Manager
          </p>
        </div>

        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="ejemplo@proarq.com"
          value={email}
          onChangeText={setEmail}
          aria-label="Email"
          name="email"
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          aria-label="Password"
          name="password"
        />

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fdecea',
              borderRadius: '6px',
              border: `1px solid ${colors.error}40`,
            }}
          >
            <p style={{ color: colors.error, fontSize: '14px', margin: 0, lineHeight: '1.4' }}>
              {error}
            </p>
          </div>
        )}

        <Button type="submit" disabled={loading} loading={loading} fullWidth>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <button
          type="button"
          onClick={() => router.push('/(auth)/forgot-password')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.primary,
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'Inter',
            textDecoration: 'underline',
            padding: spacing.sm,
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </div>
  );
}
