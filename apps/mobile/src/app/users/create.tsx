import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { usersApi } from '../../services/api/users.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const USER_ROLES = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'];

export default function CreateUserScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENTE');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      await usersApi.create({ name, email, password, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.back();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Error al crear usuario');
    },
  });

  const isFormValid = (): boolean => {
    if (!name || !email || !password) {
      setError('Todos los campos son requeridos');
      return false;
    }
    if (!email.includes('@')) {
      setError('Ingresa un correo electrónico válido');
      return false;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    setError('');
    if (!isFormValid()) return;
    createMutation.mutate();
  };

  return (
    <PageLayout title="Nuevo Usuario" showBack onBack={() => router.back()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Input
          label="Nombre Completo"
          placeholder="Ej: Juan Pérez"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Correo Electrónico"
          placeholder="ejemplo@proarq.com"
          type="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          type="password"
          value={password}
          onChangeText={setPassword}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 500,
              color: colors.onSurface,
            }}
          >
            Rol de Usuario
          </label>
          <select
            data-testid="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${colors.outlineVariant}15`,
              borderRadius: '6px',
              fontSize: '16px',
              fontFamily: 'Inter',
              outline: 'none',
              backgroundColor: colors.surface,
              color: colors.onSurface,
            }}
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: colors.error, fontSize: '14px', margin: 0 }}>{error}</p>}

        <Button
          onPress={handleSave}
          disabled={createMutation.isPending}
          loading={createMutation.isPending}
          fullWidth
        >
          {createMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </PageLayout>
  );
}
