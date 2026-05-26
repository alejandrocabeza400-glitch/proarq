import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { proyectosApi } from '../../services/api/projects.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function CrearProyectoScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      await proyectosApi.create({
        nombre,
        descripcion,
        estado: 'PLANEADO',
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.back();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Error al crear proyecto');
    },
  });

  const handleSubmit = () => {
    setError('');
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    createMutation.mutate();
  };

  return (
    <PageLayout title="Nuevo Proyecto" showBack onBack={() => router.back()}>
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: colors.errorContainer,
            borderRadius: '6px',
            marginBottom: spacing.md,
            color: colors.onErrorContainer,
            fontSize: '14px',
            fontFamily: 'Inter',
          }}
        >
          {error}
        </div>
      )}

      <Input
        label="Nombre"
        placeholder="Nombre del proyecto"
        value={nombre}
        onChangeText={setNombre}
      />

      <Input
        label="Descripción"
        placeholder="Descripción del proyecto"
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <div style={{ marginTop: spacing.md }}>
        <Button onPress={handleSubmit} loading={createMutation.isPending} fullWidth>
          Crear Proyecto
        </Button>
      </div>
    </PageLayout>
  );
}
