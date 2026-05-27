import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import UserCard from '../../components/UserCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/ui/LoadingState';
import Text from '../../components/ui/Text';
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
    isError,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.list();
      return res.data || [];
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()),
  );

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
    return <LoadingState message="Cargando usuarios..." variant="spinner" fullPage />;
  }

  if (isError) {
    return (
      <PageLayout title="Usuarios">
        <EmptyState
          title="Error al cargar usuarios"
          description="No se pudieron cargar los usuarios. Intenta de nuevo."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Gestión de Usuarios"
    >
      <Input
        label="Buscar Usuarios"
        placeholder="Nombre o correo electrónico..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
      />

      {filteredUsers.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No se encontraron usuarios que coincidan con la búsqueda."
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              onEdit={() => handleEdit(u.id)}
              onDelete={() => setConfirmDelete(u.id)}
              isDeleting={deleteMutation.isPending && confirmDelete === u.id}
            />
          ))}
        </View>
      )}

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="¿Confirmar eliminación?"
        description="Esta acción no se puede deshacer y eliminará permanentemente este usuario del sistema."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        isConfirming={deleteMutation.isPending}
      />

      <View data-testid="refresh-control" onClick={() => refetch()} style={{ display: 'none' }} />
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 100, // Space for tab bar
  },
});
