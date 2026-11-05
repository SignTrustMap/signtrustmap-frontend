import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginWithGoogle } from '@/api/auth/auth';
import { useSession, type AppSession } from '@/context/session-provider';
import { googleConfig } from '@/config/env';

export class GoogleAuthCancelledError extends Error {
  constructor(message = 'Đăng nhập Google đã bị hủy.') {
    super(message);
    this.name = 'GoogleAuthCancelledError';
  }
}

let cachedGoogleSignin: typeof import('@react-native-google-signin/google-signin') | null | undefined;

function getGoogleSigninModule() {
  if (cachedGoogleSignin !== undefined) {
    return cachedGoogleSignin;
  }
  try {
    cachedGoogleSignin = require('@react-native-google-signin/google-signin');
  } catch {
    cachedGoogleSignin = null;
  }
  return cachedGoogleSignin;
}

export function useGoogleLogin() {
  const { logIn } = useSession();
  const queryClient = useQueryClient();
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const mod = getGoogleSigninModule();
    if (mod && googleConfig.webClientId) {
      mod.GoogleSignin.configure({
        webClientId: googleConfig.webClientId,
        offlineAccess: false,
        scopes: ['profile', 'email'],
      });
    }
  }, []);

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
    const webClientId = googleConfig.webClientId;
    if (!webClientId) {
      throw new Error(
        'Chưa cấu hình Google Client ID. Vui lòng thêm EXPO_PUBLIC_GOOGLE_CLIENT_ID vào file .env.'
      );
    }

    const mod = getGoogleSigninModule();
    if (!mod) {
      throw new Error(
        'Thư viện Google Sign-in chưa được biên dịch vào native binary. Bạn đang mở ứng dụng bằng Expo Go hoặc chưa build lại APK. Vui lòng chạy "npx expo run:android" để cài đặt và mở bản build native.'
      );
    }

    const { GoogleSignin, isCancelledResponse, isSuccessResponse, isErrorWithCode, statusCodes } = mod;

    setIsPrompting(true);
    try {
      GoogleSignin.configure({
        webClientId,
        offlineAccess: false,
        scopes: ['profile', 'email'],
      });

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) {
        throw new GoogleAuthCancelledError();
      }

      let idToken: string | null | undefined;
      if (isSuccessResponse(response)) {
        idToken = response.data.idToken;
      }

      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }

      if (!idToken) {
        throw new Error('Không nhận được mã xác thực (ID token) từ Google.');
      }

      return await mutation.mutateAsync(idToken);
    } catch (error: any) {
      if (error instanceof GoogleAuthCancelledError) {
        throw error;
      }
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          throw new GoogleAuthCancelledError();
        }
        if (error.code === statusCodes.IN_PROGRESS) {
          throw new Error('Quá trình đăng nhập Google đang được tiến hành.');
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new Error('Google Play Services không khả dụng hoặc phiên bản đã quá cũ.');
        }
        if (
          error.code === '10' ||
          (typeof error.message === 'string' && error.message.includes('DEVELOPER_ERROR'))
        ) {
          throw new Error(
            'Lỗi cấu hình Google Sign-in (DEVELOPER_ERROR). Vui lòng đảm bảo SHA-1 và Package Name (com.signtrustmap.app) khớp trên Google Cloud Console, và webClientId là Web Application Client ID.'
          );
        }
      }
      throw error;
    } finally {
      setIsPrompting(false);
    }
  }, [logIn, mutation]);

  return {
    signIn,
    isPending: isPrompting || mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
