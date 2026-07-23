import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';

import { ThemeProvider } from '@/features/theme/theme-provider';
import { UnauthorizedError } from '@/lib/api-fetch';
import { redirectToLogin } from '@/lib/auth-redirect';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
          },
        },
        mutationCache: new MutationCache({
          onError: handleAuthError,
        }),
        queryCache: new QueryCache({
          onError: handleAuthError,
        }),
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

function handleAuthError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    redirectToLogin();
  }
}
