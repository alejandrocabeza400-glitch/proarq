import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { apusApi } from '../../services/api/apus.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export default function ApuCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      await apusApi.create({ nombre, tipo } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apus'] });
      router.back();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Error al guardar');
    },
  });

  const handleSave = () => {
    if (!nombre || !tipo) {
      setError('Todos los campos son requeridos');
      return;
    }
    setError('');
    createMutation.mutate();
  };

  return (
    <PageLayout title="Nuevo APU" showBack onBack={() => router.back()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <Input
          label="Nombre"
          placeholder="Nombre descriptivo de la actividad"
          value={nombre}
          onChangeText={setNombre}
        />
        <Input
          label="Tipo"
          placeholder="Ej: Estructuras, Acabados..."
          value={tipo}
          onChangeText={setTipo}
        />

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
