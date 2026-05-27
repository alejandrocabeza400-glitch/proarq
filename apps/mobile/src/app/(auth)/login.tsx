import { useRouter } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Text from '../../components/ui/Text';
import { authService } from '../../services/auth/auth.service';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.login({ email, password });
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandStrip} />

        <View style={styles.header}>
          <Text variant="displaySm" color={colors.primary} weight="900" style={styles.brandText}>
            Pro
            <Text variant="displaySm" color={colors.tertiaryContainer} weight="900">
              Arq
            </Text>
          </Text>
          <Text
            variant="labelMd"
            color={colors.onSurfaceVariant}
            weight="500"
            style={styles.tagline}
          >
            Innova APU Manager
          </Text>
        </View>

        <Input
          label="Correo Electrónico"
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          aria-label="Email"
          keyboardType="email-address"
        />

        <Input
          label="Contraseña"
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          aria-label="Password"
          secureTextEntry
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Text variant="labelSm" color={colors.error} weight="500" align="center">
              {error}
            </Text>
          </View>
        ) : null}

        <Button
          onPress={handleLogin}
          disabled={loading}
          loading={loading}
          fullWidth
          style={styles.loginButton}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <Button
          variant="ghost"
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotButton}
          textVariant="labelSm"
        >
          ¿Olvidaste tu contraseña?
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: '#F8FAFC', // Slate 50
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    // Premium Shadows
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  brandStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.tertiary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 8,
  },
  brandText: {
    letterSpacing: -2,
    fontSize: 40,
  },
  tagline: {
    opacity: 0.7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 20,
  },
  errorContainer: {
    padding: 14,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  loginButton: {
    marginTop: spacing.md,
    minHeight: 52,
    borderRadius: 14,
  },
  forgotButton: {
    marginTop: 4,
  },
});
