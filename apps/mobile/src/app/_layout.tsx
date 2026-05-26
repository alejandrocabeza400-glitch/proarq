import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import ErrorBoundary from '../components/ErrorBoundary';
import { queryClient } from '../lib/queryClient';
import { GLOBAL_KEYFRAMES } from '../styles/animations';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <style>{GLOBAL_KEYFRAMES}</style>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
