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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.md }}
        >
          Sesión no encontrada
        </p>
        <Button
          onPress={() => router.replace('/(auth)/login')}
          fullWidth
          style={{ maxWidth: '300px' }}
        >
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
          padding: '24px 0 32px',
        }}
      >
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '48px',
            backgroundColor: colors.primaryContainer,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            fontWeight: 800,
            marginBottom: spacing.md,
            boxShadow: '0 8px 16px rgba(4, 22, 47, 0.15)',
            border: `3px solid ${colors.outlineVariant}30`,
          }}
        >
          {user.name?.[0]?.toUpperCase() || 'U'}
        </div>

        <h2
          style={{
            color: colors.primary,
            fontSize: '22px',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {user.name}
        </h2>

        <span
          style={{
            padding: '4px 14px',
            borderRadius: '20px',
            backgroundColor: `${colors.tertiaryContainer}15`,
            color: colors.onTertiaryContainer,
            fontSize: '12px',
            fontWeight: 700,
            marginTop: spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {user.role}
        </span>
      </div>

      {/* Info section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        {isEditing ? (
          <>
            <Input label="Nombre completo" value={name} onChangeText={setName} />
            <Input label="Correo electrónico" value={email} editable={false} />
            <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
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
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid rgba(4, 22, 47, 0.06)',
                boxShadow: '0 2px 4px rgba(4, 22, 47, 0.01)',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: colors.onSurfaceVariant,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                Correo electrónico
              </p>
              <p
                style={{
                  fontSize: '15px',
                  color: colors.primary,
                  margin: '6px 0 0',
                  fontWeight: 600,
                }}
              >
                {user.email}
              </p>
            </div>

            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid rgba(4, 22, 47, 0.06)',
                boxShadow: '0 2px 4px rgba(4, 22, 47, 0.01)',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: colors.onSurfaceVariant,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                Rol asignado
              </p>
              <p
                style={{
                  fontSize: '15px',
                  color: colors.primary,
                  margin: '6px 0 0',
                  fontWeight: 600,
                }}
              >
                {user.role}
              </p>
            </div>

            <Button
              onPress={() => setIsEditing(true)}
              variant="secondary"
              fullWidth
              style={{ marginTop: '8px' }}
            >
              Editar Perfil
            </Button>
          </>
        )}

        <div
          style={{
            borderTop: `1px solid ${colors.outlineVariant}25`,
            paddingTop: spacing.lg,
            marginTop: spacing.lg,
          }}
        >
          <Button
            onPress={handleLogout}
            variant="ghost"
            fullWidth
            style={{
              color: colors.error,
              border: `1px solid ${colors.error}25`,
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.error}08`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
