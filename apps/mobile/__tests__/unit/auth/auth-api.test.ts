import {
  login,
  loginWithGoogle,
  register,
  updateProfile,
  getProfile,
  toggleRole,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  backendRoleToAccountRole,
} from '@/api/auth/auth';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  jsonApiRequest: jest.fn(),
  apiRequest: jest.fn(),
}));

describe('Auth API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('backendRoleToAccountRole mapping', () => {
    it('correctly maps backend roles to mobile account roles', () => {
      expect(backendRoleToAccountRole.DRIVER).toBe('driver');
      expect(backendRoleToAccountRole.REVIEWER).toBe('reviewer');
      expect(backendRoleToAccountRole.SURVEYOR).toBe('surveyor');
    });
  });

  describe('login', () => {
    it('authenticates with email & password and maps roles and avatar', async () => {
      const mockResponse = {
        accessToken: 'mock-jwt-token',
        user: {
          id: 'user-1',
          email: 'driver@signmap.site',
          fullName: 'Nguyen Van A',
          roles: ['DRIVER', 'REVIEWER', 'UNKNOWN_ROLE'],
          avatarUrl: 'https://cdn.signmap.site/avatars/u1.jpg',
        },
      };

      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      const session = await login({
        email: '  driver@signmap.site  ',
        password: 'secretPassword123',
      });

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/login',
        {
          email: 'driver@signmap.site',
          password: 'secretPassword123',
        },
      );
      expect(session.accessToken).toBe('mock-jwt-token');
      expect(session.account.id).toBe('user-1');
      expect(session.account.displayName).toBe('Nguyen Van A');
      expect(session.account.email).toBe('driver@signmap.site');
      expect(session.account.roles).toEqual(['driver', 'reviewer']);
      expect(session.account.avatarUrl).toBe('https://cdn.signmap.site/avatars/u1.jpg');
    });

    it('falls back to avatar property when avatarUrl is missing', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({
        accessToken: 'token-abc',
        user: {
          id: 'user-2',
          email: 'test@signmap.site',
          fullName: 'Tran Van B',
          roles: ['SURVEYOR'],
          avatar: 'https://cdn.signmap.site/avatars/fallback.png',
        },
      });

      const session = await login({ email: 'test@signmap.site', password: '123' });
      expect(session.account.avatarUrl).toBe('https://cdn.signmap.site/avatars/fallback.png');
    });

    it('sets avatarUrl to null when both avatarUrl and avatar are absent', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({
        accessToken: 'token-abc',
        user: {
          id: 'user-3',
          email: 'noavatar@signmap.site',
          fullName: 'Le Van C',
          roles: ['DRIVER'],
        },
      });

      const session = await login({ email: 'noavatar@signmap.site', password: '123' });
      expect(session.account.avatarUrl).toBeNull();
    });
  });

  describe('loginWithGoogle', () => {
    it('authenticates with Google idToken and maps picture fallback', async () => {
      const mockResponse = {
        accessToken: 'google-session-token',
        user: {
          id: 'google-user-1',
          email: 'google@gmail.com',
          fullName: 'Google User',
          roles: ['DRIVER'],
          picture: 'https://lh3.googleusercontent.com/a/photo.jpg',
        },
      };

      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      const session = await loginWithGoogle('  mock-google-id-token  ');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/google',
        { token: 'mock-google-id-token' },
      );
      expect(session.account.avatarUrl).toBe('https://lh3.googleusercontent.com/a/photo.jpg');
      expect(session.account.roles).toEqual(['driver']);
    });
  });

  describe('register', () => {
    it('trims input fields and posts to register endpoint', async () => {
      const mockResult = { message: 'Đăng ký tài khoản thành công.' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await register({
        email: '  newuser@signmap.site  ',
        password: 'Password@123',
        fullName: '  Nguyen Newbie  ',
        phone: '  0901234567  ',
      });

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/register',
        {
          email: 'newuser@signmap.site',
          password: 'Password@123',
          fullName: 'Nguyen Newbie',
          phone: '0901234567',
        },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateProfile', () => {
    it('sends PATCH request to /auth/me with bearer token', async () => {
      const payload = { fullName: 'Updated Name', phone: '0987654321' };
      const response = { id: 'u1', email: 'test@signmap.site', fullName: 'Updated Name' };

      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(response);

      const result = await updateProfile(payload, 'token-xyz');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/me',
        payload,
        'token-xyz',
        undefined,
        'PATCH',
      );
      expect(result).toEqual(response);
    });
  });

  describe('getProfile', () => {
    it('sends GET request to /auth/me with bearer token', async () => {
      const response = { id: 'u1', email: 'user@signmap.site', fullName: 'User One' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(response);

      const result = await getProfile('token-xyz');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/me',
        undefined,
        'token-xyz',
        undefined,
        'GET',
      );
      expect(result).toEqual(response);
    });
  });

  describe('toggleRole', () => {
    it('sends POST request to /auth/me/roles with role toggle payload', async () => {
      const response = {
        accessToken: 'new-token',
        user: { id: 'u1', email: 'u@test.com', fullName: 'User', roles: ['DRIVER', 'SURVEYOR'] },
      };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(response);

      const result = await toggleRole('SURVEYOR', true, 'token-123');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/me/roles',
        { role: 'SURVEYOR', enabled: true },
        'token-123',
        undefined,
        'POST',
      );
      expect(result).toEqual(response);
    });
  });

  describe('forgotPassword', () => {
    it('sends POST request to /auth/forgot-password with trimmed email', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ sent: true });

      const result = await forgotPassword({ email: '  forgot@signmap.site  ' });

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: 'forgot@signmap.site' },
      );
      expect(result.sent).toBe(true);
    });
  });

  describe('verifyOtp', () => {
    it('sends POST request to /auth/verify-otp with trimmed email and otp', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ valid: true, email: 'user@test.com' });

      const result = await verifyOtp({ email: '  user@test.com  ', otp: '  123456  ' });

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/verify-otp',
        { email: 'user@test.com', otp: '123456' },
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('resendOtp', () => {
    it('sends POST request to /auth/resend-otp with trimmed email', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ sent: true });

      const result = await resendOtp({ email: '  resend@test.com  ' });

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/resend-otp',
        { email: 'resend@test.com' },
      );
      expect(result.sent).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('sends POST request to /auth/reset-password with trimmed credentials and new password', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ reset: true });

      const result = await resetPassword({
        email: '  reset@test.com  ',
        otp: '  654321  ',
        newPassword: 'MyNewSecretPassword99!',
      });

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/auth/reset-password',
        {
          email: 'reset@test.com',
          otp: '654321',
          newPassword: 'MyNewSecretPassword99!',
        },
      );
      expect(result.reset).toBe(true);
    });
  });
});
