import type { AccountRole, AppSession } from '@/context/session-provider';
import { jsonApiRequest } from '@/services/api-client';

type LoginResponse = {
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

export async function logInWithPassword(email: string, password: string): Promise<AppSession> {
  const response = await jsonApiRequest<LoginResponse>('/auth/login', { email, password });
  const roles = response.user.roles
    .map((role) => backendRoleToAccountRole[role.toUpperCase()])
    .filter((role): role is AccountRole => Boolean(role));

  return {
    accessToken: response.accessToken,
    account: {
      displayName: response.user.fullName,
      email: response.user.email,
      id: response.user.id,
      roles,
    },
  };
}
