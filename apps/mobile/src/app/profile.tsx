import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../components/PageLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { authService } from '../services/auth/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const _logout = useAuthStore((s) => s.logout);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/(auth)/login');
  };

  const handleSave = () => {
    // In a real app, this would call PUT /users/:id
    // For now, just close editing
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div
        style={{
          fontFamily: 'Inter',
          padding: spacing.md,
          backgroundColor: colors.surface,
          minHeight: '100vh',
        }}
      >
        <p style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: '40%' }}>
          Sesión no encontrada
        </p>
        <Button onPress={() => router.replace('/(auth)/login')} fullWidth>
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <PageLayout title="Mi Perfil" showBack onBack={() => router.back()}>
      {/* Avatar section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: spacing.xl,
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: colors.primaryContainer,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: spacing.md,
          }}
        >
          {user.name?.[0] || 'U'}
        </div>
        <h2 style={{ color: colors.onSurface, fontSize: '20px', fontWeight: 700, margin: 0 }}>
          {user.name}
        </h2>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            backgroundColor: colors.tertiaryContainer,
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            marginTop: spacing.sm,
          }}
        >
          {user.role}
        </span>
      </div>

      {/* Info section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {isEditing ? (
          <>
            <Input label="Nombre" value={name} onChangeText={setName} />
            <Input label="Correo electrónico" value={email} editable={false} />
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button onPress={handleSave} fullWidth>
                Guardar
              </Button>
              <Button onPress={() => setIsEditing(false)} variant="ghost" fullWidth>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: '8px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: colors.onSurfaceVariant,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Correo electrónico
              </p>
              <p
                style={{
                  fontSize: '16px',
                  color: colors.onSurface,
                  margin: '4px 0 0',
                  fontWeight: 500,
                }}
              >
                {user.email}
              </p>
            </div>
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: '8px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: colors.onSurfaceVariant,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Rol
              </p>
              <p
                style={{
                  fontSize: '16px',
                  color: colors.onSurface,
                  margin: '4px 0 0',
                  fontWeight: 500,
                }}
              >
                {user.role}
              </p>
            </div>

            <Button onPress={() => setIsEditing(true)} variant="secondary" fullWidth>
              Editar Perfil
            </Button>
          </>
        )}

        <div
          style={{
            borderTop: `1px solid ${colors.outlineVariant}20`,
            paddingTop: spacing.lg,
            marginTop: spacing.md,
          }}
        >
          <Button onPress={handleLogout} variant="ghost" fullWidth style={{ color: colors.error }}>
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
