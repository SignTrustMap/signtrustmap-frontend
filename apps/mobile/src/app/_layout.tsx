import { DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  QueryClientProvider
} from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { SPLASH_PROGRESS_DURATION_MS } from '@/constants/const';
import { AppSplashScreen } from '@/feature/splash/pages/splash-screen';
import { SessionProvider, useSession } from '@/context/session-provider';
import { requestLocationPermissionOnFirstLaunch } from '@/services/location-permission';
import { queryClient } from '@/api/query-client';
import { authExpiredEmitter } from '@/api/api-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DefaultTheme}>
        <SessionProvider>
          <RootNavigation />
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootNavigation() {
  const { isInitializing, logOut, session } = useSession();
  const [hasSplashProgressElapsed, setHasSplashProgressElapsed] = useState(false);
  const hasValidSession = Boolean(session?.accessToken);
  const shouldShowSplash = isInitializing || !hasSplashProgressElapsed;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasSplashProgressElapsed(true);
    }, SPLASH_PROGRESS_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (shouldShowSplash) return;

    requestLocationPermissionOnFirstLaunch().catch(() => {
      // Permission storage failures should not prevent the app from opening.
    });
  }, [shouldShowSplash]);

  // Redirect to login when any API call returns 401 / 403 (expired token).
  useEffect(() => {
    const unsubscribe = authExpiredEmitter.subscribe(() => {
      logOut().catch(() => {
        // Ignore storage errors during forced log-out.
      });
    });
    return () => { unsubscribe(); };
  }, [logOut]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={!hasValidSession}>
          <Stack.Screen name="(public)/login" />
          <Stack.Screen name="(public)/register" />
        </Stack.Protected>
        <Stack.Protected guard={hasValidSession}>
          <Stack.Screen name="(authenticated)" />
        </Stack.Protected>
      </Stack>
      {shouldShowSplash ? <AppSplashScreen /> : null}
    </View>
  );
}
