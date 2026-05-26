import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import UserCard from '../../components/UserCard';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import type { User } from '../../services/api/users.api';
import { usersApi } from '../../services/api/users.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function UsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const {
    data: users = [],
    isPending,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['users', search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.name = search;
      const res = await usersApi.list(params);
      return res.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await usersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setConfirmDelete(null);
    },
  });

  const handleEdit = (id: string) => {
    router.push(`/users/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isPending && users.length === 0) {
    return <LoadingState message="Cargando..." />;
  }

  return (
    <PageLayout
      title="Usuarios"
      fabAction={() => router.push('/users/create')}
      fabLabel="Nuevo Usuario"
      fabVisible
    >
      <Input
        label="Buscar Usuarios"
        placeholder="Nombre o correo electrónico..."
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: spacing.md }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {users.map((u) => (
          <UserCard
            key={u.id}
            user={u}
            onEdit={() => handleEdit(u.id)}
            onDelete={() => setConfirmDelete(u.id)}
            isDeleting={deleteMutation.isPending && confirmDelete === u.id}
          />
        ))}
      </div>

      {confirmDelete && (
        <div
          data-testid="confirm-dialog"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              padding: spacing.lg,
              borderRadius: '12px',
              maxWidth: '300px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
                color: colors.onSurface,
                margin: '0 0 16px',
              }}
            >
              ¿Confirmar eliminación?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.surfaceContainerHigh,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.error,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                }}
                aria-label="Confirmar"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div data-testid="refresh-control" onClick={() => refetch()} style={{ display: 'none' }} />
    </PageLayout>
  );
}
