import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import LoadingState from '../components/ui/LoadingState';
import { useAuthStore } from '../stores/auth.store';

/**
 * Root entry point - decides where to send the user based on auth state.
 * Uses useFocusEffect to ensure the Root Layout navigator is mounted.
 */
export default function IndexScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    }, [isAuthenticated, router]),
  );

  return <LoadingState message="Iniciando..." />;
}
