import React from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';

const mockLogIn = jest.fn();
jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ logIn: mockLogIn }),
}));

const mockLoginWithGoogle = jest.fn();
jest.mock('@/api/auth/auth', () => ({
  loginWithGoogle: (...args: any[]) => mockLoginWithGoogle(...args),
}));

const mockConfigure = jest.fn();
const mockHasPlayServices = jest.fn();
const mockSignIn = jest.fn();
const mockGetTokens = jest.fn();
const mockIsCancelledResponse = jest.fn();
const mockIsSuccessResponse = jest.fn();
const mockIsErrorWithCode = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: mockConfigure,
    hasPlayServices: mockHasPlayServices,
    signIn: mockSignIn,
    getTokens: mockGetTokens,
  },
  isCancelledResponse: (r: any) => mockIsCancelledResponse(r),
  isSuccessResponse: (r: any) => mockIsSuccessResponse(r),
  isErrorWithCode: (e: any) => mockIsErrorWithCode(e),
  statusCodes: {
    SIGN_IN_CANCELLED: 'CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_NOT_AVAILABLE',
  },
}));

import { googleConfig } from '@/config/env';
import { GoogleAuthCancelledError, useGoogleLogin } from '@/feature/auth/hooks/use-google-login';

describe('useGoogleLogin Branch Coverage', () => {
  const origWebClientId = googleConfig.webClientId;
  const origPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (googleConfig as any).webClientId = 'google-client-id';
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    mockIsCancelledResponse.mockReturnValue(false);
    mockIsSuccessResponse.mockReturnValue(true);
    mockIsErrorWithCode.mockReturnValue(false);
    mockHasPlayServices.mockResolvedValue(true);
  });

  afterEach(() => {
    (googleConfig as any).webClientId = origWebClientId;
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
  });

  const makeWrapper = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };

  it('completes sign-in with idToken + fallback photoUrl, and with getTokens fallback', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { idToken: 'tok-123', user: { photo: 'https://photo.test/a.jpg' } },
    });
    mockLoginWithGoogle.mockResolvedValueOnce({
      accessToken: 'jwt',
      account: { id: 'u1', email: 'a@b.c', displayName: 'A', roles: ['driver'], avatarUrl: null },
    });

    const { result } = await renderHook(() => useGoogleLogin(), { wrapper: makeWrapper() });

    let session: any;
    await act(async () => {
      session = await result.current.signIn();
    });
    expect(session.account.avatarUrl).toBe('https://photo.test/a.jpg');
    expect(mockLogIn).toHaveBeenCalled();

    // Missing idToken from response -> falls back to getTokens
    mockIsSuccessResponse.mockReturnValueOnce(false);
    mockSignIn.mockResolvedValueOnce({});
    mockGetTokens.mockResolvedValueOnce({ idToken: 'tok-from-getTokens' });
    mockLoginWithGoogle.mockResolvedValueOnce({
      accessToken: 'jwt2',
      account: { id: 'u2', email: 'b@c.d', displayName: 'B', roles: ['driver'] },
    });
    await act(async () => {
      await result.current.signIn();
    });
    expect(mockLoginWithGoogle).toHaveBeenCalledWith('tok-from-getTokens');
  });

  it('throws localized errors for missing config, cancel, missing token, and Google status codes', async () => {
    const wrapper = makeWrapper();
    const { result } = await renderHook(() => useGoogleLogin(), { wrapper });

    (googleConfig as any).webClientId = '';
    await act(async () => {
      await expect(result.current.signIn()).rejects.toThrow(/Chưa cấu hình Google Client ID/);
    });
    (googleConfig as any).webClientId = 'google-client-id';

    mockIsCancelledResponse.mockReturnValueOnce(true);
    mockSignIn.mockResolvedValueOnce({});
    await act(async () => {
      await expect(result.current.signIn()).rejects.toBeInstanceOf(GoogleAuthCancelledError);
    });

    // Missing idToken even after getTokens
    mockIsSuccessResponse.mockReturnValueOnce(false);
    mockSignIn.mockResolvedValueOnce({});
    mockGetTokens.mockResolvedValueOnce({ idToken: null });
    await act(async () => {
      await expect(result.current.signIn()).rejects.toThrow(/Không nhận được mã xác thực/);
    });

    // Mapped status codes: CANCELLED, IN_PROGRESS, PLAY_SERVICES_NOT_AVAILABLE, DEVELOPER_ERROR
    mockIsErrorWithCode.mockReturnValue(true);
    for (const [code, regex] of [
      ['CANCELLED', /hủy/],
      ['IN_PROGRESS', /đang được tiến hành/],
      ['PLAY_NOT_AVAILABLE', /Play Services/],
      ['10', /DEVELOPER_ERROR/],
    ] as const) {
      mockSignIn.mockRejectedValueOnce({ code, message: 'err' });
      await act(async () => {
        await expect(result.current.signIn()).rejects.toThrow(regex);
      });
    }
  });
});
