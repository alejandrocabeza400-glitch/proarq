import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import InsumoForm, { type InsumoFormData } from '../../components/InsumoForm';
import { insumosApi } from '../../services/api/insumos.api';

export default function CreateInsumoScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: InsumoFormData) => {
      return await insumosApi.create(data as any);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      // Redirect to the newly created supply detail
      router.replace(`/insumos/${response.data.id}`);
    },
    onError: (err: any) => {
      const apiError = err?.response?.data;
      if (apiError?.details && Array.isArray(apiError.details)) {
        const newErrors: Record<string, string> = {};
        apiError.details.forEach((detail: any) => {
          const path = Array.isArray(detail.path) ? detail.path[0] : detail.path;
          if (path) newErrors[path] = detail.message;
        });
        setExternalErrors(newErrors);
        setGeneralError('Por favor verifica los campos resaltados.');
      } else {
        setGeneralError(apiError?.error || apiError?.message || 'Error al crear el insumo.');
      }
    },
  });

  const handleSubmit = (data: InsumoFormData) => {
    setGeneralError('');
    setExternalErrors({});
    createMutation.mutate(data);
  };

  return (
    <PageLayout title="Nuevo Insumo" showBack onBack={() => router.back()}>
      <InsumoForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={createMutation.isPending}
        submitLabel="Guardar en Catálogo"
        generalError={generalError}
        externalErrors={externalErrors}
      />
    </PageLayout>
  );
}
