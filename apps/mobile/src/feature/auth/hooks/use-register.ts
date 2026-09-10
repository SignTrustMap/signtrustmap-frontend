import { useMutation } from '@tanstack/react-query';

import { register, type RegisterRequest } from '@/api/auth/auth';

export function useRegister() {
  return useMutation({
    mutationKey: ['auth', 'register'],
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    mutationFn: (request: RegisterRequest) => register(request),
  });
}
