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

export const backendRoleToAccountRole: Record<string, AccountRole> = {
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
  console.log(res.accessToken);
  return res;
}

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
  return jsonApiRequest<RegisterResponse>(API_PATHS.AUTH_REGISTER, {
    ...request,
    email: request.email.trim(),
    fullName: request.fullName.trim(),
    phone: request.phone.trim(),
  });
}

export type UpdateProfileRequest = {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
};

export type UserProfileResponse = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  roles?: string[];
};

export async function updateProfile(
  payload: UpdateProfileRequest,
  accessToken: string,
): Promise<UserProfileResponse> {
  return jsonApiRequest<UserProfileResponse>(
    '/auth/me',
    payload,
    accessToken,
    undefined,
    'PATCH',
  );
}

export async function getProfile(accessToken: string): Promise<UserProfileResponse> {
  return jsonApiRequest<UserProfileResponse>('/auth/me', undefined, accessToken, undefined, 'GET');
}

export type ToggleRoleResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
};

export async function toggleRole(
  role: string,
  enabled: boolean,
  accessToken: string,
): Promise<ToggleRoleResponse> {
  return jsonApiRequest<ToggleRoleResponse>(
    '/auth/me/roles',
    { role, enabled },
    accessToken,
    undefined,
    'POST',
  );
}

