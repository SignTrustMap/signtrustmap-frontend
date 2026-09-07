import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { LoginRequest } from '@/api/auth';
import { useSession } from '@/context/session-provider';
import { logInWithPassword } from '@/feature/auth/services/auth-api';

export function useLogin() {
  const { logIn } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['auth', 'login'],
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    mutationFn: async ({ email, password }: LoginRequest) => {
      const session = await logInWithPassword(email.trim(), password);
      // Remove data belonging to a previous account before activating this session.
      await queryClient.cancelQueries();
      queryClient.removeQueries();
      await logIn(session);
      // SessionProvider owns the token; do not retain it as mutation result data.
    },
  });
}
