import { jsonApiRequest } from '@/api/api-client';
import { API_PATHS } from '@/api/api';
import type { AccountRole, AppSession } from '@/context/session-provider';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export type RegisterResponse = {
  message?: string;
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

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  return jsonApiRequest<RegisterResponse>(API_PATHS.AUTH_REGISTER, {
    ...request,
    email: request.email.trim(),
    fullName: request.fullName.trim(),
    phone: request.phone.trim(),
  });
}
