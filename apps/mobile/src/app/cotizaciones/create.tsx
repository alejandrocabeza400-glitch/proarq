import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import PageLayout from '../../components/PageLayout';
import CotizacionForm, { type CotizacionFormData } from '../../components/CotizacionForm';
import { cotizacionesApi } from '../../services/api/cotizaciones.api';

export default function CrearCotizacionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [externalErrors, setExternalErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: CotizacionFormData) => {
      return await cotizacionesApi.create(data as any);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      // Redirect to the newly created quote's detail view
      router.replace(`/cotizaciones/${response.data.id}`);
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
        setGeneralError(apiError?.error || apiError?.message || 'Error al crear la cotización.');
      }
    },
  });

  const handleSubmit = (data: CotizacionFormData) => {
    setGeneralError('');
    setExternalErrors({});
    createMutation.mutate(data);
  };

  return (
    <PageLayout title="Nueva Cotización" showBack onBack={() => router.back()}>
      <CotizacionForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={createMutation.isPending}
        generalError={generalError}
        externalErrors={externalErrors}
      />
    </PageLayout>
  );
}
