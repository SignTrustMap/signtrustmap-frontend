import type {
  AuthLoginPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResendOtpPayload,
  ResendOtpResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  UpdateProfilePayload,
  UserProfileResponse as SharedUserProfileResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from '@shared/types';
import { jsonApiRequest } from '@/api/api-client';
import { API_PATHS } from '@/api/api';
import type { AccountRole, AppSession } from '@/context/session-provider';

export type LoginRequest = AuthLoginPayload;

export type GoogleLoginRequest = {
  token: string;
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
    avatarUrl?: string | null;
    avatar?: string | null;
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
      avatarUrl: response.user.avatarUrl ?? response.user.avatar ?? null,
    },
  };
  return res;
}

export async function loginWithGoogle(idToken: string): Promise<AppSession> {
  const response = await jsonApiRequest<LoginResponse>(API_PATHS.AUTH_GOOGLE, {
    token: idToken.trim(),
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
      avatarUrl:
        response.user.avatarUrl ??
        response.user.avatar ??
        (response.user as any).picture ??
        null,
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

export type UpdateProfileRequest = UpdateProfilePayload;

export type UserProfileResponse = Pick<
  SharedUserProfileResponse,
  'id' | 'email' | 'fullName' | 'phone' | 'avatarUrl'
> &
  Partial<
    Pick<SharedUserProfileResponse, 'status' | 'roles' | 'walletBalance' | 'profileStats'>
  > & {
    address?: string | null;
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

export type ForgotPasswordRequest = ForgotPasswordPayload;
export type VerifyOtpRequest = VerifyOtpPayload;
export type ResendOtpRequest = ResendOtpPayload;
export type ResetPasswordRequest = ResetPasswordPayload;

export type {
  ForgotPasswordResponse,
  ResendOtpResponse,
  ResetPasswordResponse,
  VerifyOtpResponse,
};

export async function forgotPassword(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return jsonApiRequest<ForgotPasswordResponse>(API_PATHS.AUTH_FORGOT_PASSWORD, {
    email: request.email.trim(),
  });
}

export async function verifyOtp(
  request: VerifyOtpRequest,
): Promise<VerifyOtpResponse> {
  return jsonApiRequest<VerifyOtpResponse>(API_PATHS.AUTH_VERIFY_OTP, {
    email: request.email.trim(),
    otp: request.otp.trim(),
  });
}

export async function resendOtp(
  request: ResendOtpRequest,
): Promise<ResendOtpResponse> {
  return jsonApiRequest<ResendOtpResponse>(API_PATHS.AUTH_RESEND_OTP, {
    email: request.email.trim(),
  });
}

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  return jsonApiRequest<ResetPasswordResponse>(API_PATHS.AUTH_RESET_PASSWORD, {
    email: request.email.trim(),
    otp: request.otp.trim(),
    newPassword: request.newPassword,
  });
}

