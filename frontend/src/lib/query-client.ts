import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client.
 * Import this wherever you need to access the cache outside of React
 * (e.g. in API mutation callbacks that need to invalidate queries).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute — avoids refetching on every focus
      retry: 1,
    },
  },
});
