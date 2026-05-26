import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import { usersApi } from '../../services/api/users.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const USER_ROLES = ['ADMIN', 'GERENTE_OBRA', 'DIRECTOR_OBRA', 'CLIENTE', 'REPRESENTANTE'];

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CLIENTE');
  const [error, setError] = useState('');

  const { data: user, isPending } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await usersApi.getById(id);
      return res.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await usersApi.update(id, { name, email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.back();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Error al actualizar usuario');
    },
  });

  const handleSave = () => {
    setError('');
    if (!name || !email) {
      setError('Nombre y correo son requeridos');
      return;
    }
    updateMutation.mutate();
  };

  if (isPending) {
    return <LoadingState message="Cargando usuario..." />;
  }

  return (
    <PageLayout title="Editar Usuario" showBack onBack={() => router.back()}>
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
          disabled={updateMutation.isPending}
          loading={updateMutation.isPending}
          fullWidth
        >
          {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </PageLayout>
  );
}
