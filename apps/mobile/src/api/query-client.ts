import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 2 },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();
