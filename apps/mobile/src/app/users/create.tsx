import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PageLayout from '../../components/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Text from '../../components/ui/Text';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      return await usersApi.create({ name, email, password, role });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.replace(`/users/${response.data.id}`);
    },
    onError: (err: any) => {
      const apiError = err?.response?.data;
      if (apiError?.details && Array.isArray(apiError.details)) {
        const newErrors: Record<string, string> = {};
        apiError.details.forEach((detail: any) => {
          const path = Array.isArray(detail.path) ? detail.path[0] : detail.path;
          if (path) newErrors[path] = detail.message;
        });
        setErrors(newErrors);
        setGeneralError('Verifica los datos del usuario.');
      } else {
        setGeneralError(apiError?.error || apiError?.message || 'Error al crear usuario');
      }
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Ingresa un correo válido.';
    if (password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setGeneralError('');
    setErrors({});
    if (!validate()) return;
    createMutation.mutate();
  };

  return (
    <PageLayout title="Nuevo Usuario" showBack onBack={() => router.back()}>
      <View style={styles.form}>
        <View style={styles.header}>
          <Text variant="titleSm" weight="800" color={colors.primary}>Perfil de Acceso</Text>
          <Text variant="bodySm" color={colors.onSurfaceVariant}>Crea una cuenta para que un nuevo integrante acceda al sistema.</Text>
        </View>

        {generalError ? (
          <View style={styles.errorBanner}>
            <Text variant="labelSm" color={colors.error} weight="700">⚠️ {generalError}</Text>
          </View>
        ) : null}

        <Input
          label="Nombre Completo"
          placeholder="Ej: Juan Pérez"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        <Input
          label="Correo Electrónico"
          placeholder="ejemplo@proarq.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />
        <Input
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <View style={styles.selectGroup}>
          <Text variant="labelMd" weight="700" color={colors.onSurface} style={styles.label}>
            Rol de Usuario
          </Text>
          <View style={styles.pickerContainer}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.nativeSelect}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            onPress={handleSave}
            disabled={createMutation.isPending}
            loading={createMutation.isPending}
            fullWidth
            style={styles.submitButton}
          >
            Crear Cuenta
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.back()}
            disabled={createMutation.isPending}
            fullWidth
          >
            Cancelar
          </Button>
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
    gap: 4,
  },
  errorBanner: {
    padding: 14,
    backgroundColor: colors.errorContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  selectGroup: {
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  nativeSelect: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors.primary,
    outline: 'none',
  } as any,
  footer: {
    marginTop: spacing.lg,
    gap: 12,
  },
  submitButton: {
    minHeight: 52,
  }
});
