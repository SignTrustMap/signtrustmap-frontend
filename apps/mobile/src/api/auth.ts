import { jsonApiRequest } from '@/services/api-client';
import { API_PATHS } from '@/api/api';

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

export function login(request: LoginRequest): Promise<LoginResponse> {
  return jsonApiRequest<LoginResponse>(API_PATHS.AUTH_LOGIN, request);
}
