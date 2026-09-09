import { jsonApiRequest } from '@/api/api-client';
import { API_PATHS } from '@/api/api';
import type { AccountRole, AppSession } from '@/context/session-provider';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    email: string;
    fullName: string;
    id: string;
    roles: string[];
  };
};

const backendRoleToAccountRole: Record<string, AccountRole> = {
  DRIVER: 'driver',
  REVIEWER: 'reviewer',
  SURVEYOR: 'surveyor',
};

export async function login(request: LoginRequest): Promise<AppSession> {
  const response = await jsonApiRequest<LoginResponse>(API_PATHS.AUTH_LOGIN, {
    ...request,
    email: request.email.trim(),
  });
  const roles = response.user.roles
    .map((role) => backendRoleToAccountRole[role.toUpperCase()])
    .filter((role): role is AccountRole => Boolean(role));

  const res = {
    accessToken: response.accessToken,
    account: {
      displayName: response.user.fullName,
      email: response.user.email,
      id: response.user.id,
      roles,
    },
  };

  console.log('login response', res);

  return res;
}
