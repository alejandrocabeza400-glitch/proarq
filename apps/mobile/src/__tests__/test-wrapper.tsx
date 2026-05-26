import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';

/**
 * Creates a fresh QueryClient with test-appropriate defaults.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

/**
 * Creates a wrapper component factory for testing.
 * Each call to `createWrapper()` creates a new QueryClientProvider,
 * ensuring tests do not share cached data.
 */
export function createQueryWrapper() {
  const queryClient = createQueryClient();
  return {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
    queryClient,
  };
}
