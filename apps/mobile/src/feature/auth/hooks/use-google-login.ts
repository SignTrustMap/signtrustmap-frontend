import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginWithGoogle } from '@/api/auth/auth';
import { useSession, type AppSession } from '@/context/session-provider';
import { googleConfig } from '@/config/env';

// Complete incoming OAuth redirect loops if running in a popup/browser session
WebBrowser.maybeCompleteAuthSession();

// Google OpenID Connect discovery endpoints
const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export class GoogleAuthCancelledError extends Error {
  constructor(message = 'Đăng nhập Google đã bị hủy.') {
    super(message);
    this.name = 'GoogleAuthCancelledError';
  }
}

export function useGoogleLogin() {
  const { logIn } = useSession();
  const queryClient = useQueryClient();
  const [isPrompting, setIsPrompting] = useState(false);

  const mutation = useMutation({
    mutationKey: ['auth', 'google-login'],
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    mutationFn: async (idToken: string) => {
      const session = await loginWithGoogle(idToken);
      await queryClient.cancelQueries();
      queryClient.removeQueries();
      await logIn(session);
      return session;
    },
  });

  const signIn = useCallback(async (): Promise<AppSession | null> => {
    // 1. Resolve client ID based on current platform
    const clientId = Platform.select({
      android: googleConfig.androidClientId || googleConfig.webClientId,
      ios: googleConfig.iosClientId || googleConfig.webClientId,
      default: googleConfig.webClientId,
    });

    if (!clientId) {
      throw new Error(
        'Chưa cấu hình Google Client ID. Vui lòng thêm EXPO_PUBLIC_GOOGLE_CLIENT_ID vào file .env.'
      );
    }

    // 2. Configure redirect URI for custom scheme
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'mobile',
      path: 'oauthredirect',
    });

    // 3. Create Google Auth Request
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
      extraParams: {
        nonce: Math.random().toString(36).substring(2, 15),
      },
    });

    setIsPrompting(true);
    let result: AuthSession.AuthSessionResult;
    try {
      result = await request.promptAsync(GOOGLE_DISCOVERY);
    } finally {
      setIsPrompting(false);
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new GoogleAuthCancelledError();
    }

    if (result.type !== 'success') {
      const errDetail = (result as any).error?.message || result.type;
      throw new Error(`Đăng nhập Google không thành công (${errDetail}).`);
    }

    // Extract ID Token from params
    let idToken: string | undefined = result.params?.id_token;

    // Fallback: If code is returned instead of id_token, perform code exchange
    if (!idToken && result.params?.code) {
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: result.params.code,
          redirectUri,
          extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
        },
        GOOGLE_DISCOVERY
      );
      idToken = tokenResult.idToken;
    }

    if (!idToken) {
      throw new Error('Không nhận được mã xác thực (ID token) từ Google.');
    }

    // 4. Send ID token to backend for verification and session initialization
    return await mutation.mutateAsync(idToken);
  }, [logIn, mutation, queryClient]);

  return {
    signIn,
    isPending: isPrompting || mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

