import 'expo-blob';
import * as WebBrowser from 'expo-web-browser';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { AppState, LogBox, View } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';

// Complete incoming OAuth redirect loops if running in a popup/browser session
WebBrowser.maybeCompleteAuthSession();
import { QueryClientProvider } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { SPLASH_PROGRESS_DURATION_MS } from '@/constants/const';
import { AppSplashScreen } from '@/feature/splash/pages/splash-screen';
import { SessionProvider, useSession } from '@/context/session-provider';
import {
  type GpsDenialReason,
  type GpsPermissionStatus,
  checkMandatoryGpsStatus,
  openLocationSettings,
} from '@/services/location-permission';
import { queryClient } from '@/api/query-client';
import { authExpiredEmitter } from '@/api/api-client';
import { reconcilePendingCrops } from '@/feature/upload/utils/crop-sync-manager';

import { ErrorBoundary, RouteErrorBoundary } from '@/components/error-boundary';

LogBox.ignoreLogs([
  // Known Expo Router 57 / React 19 Fabric dev-only warning triggered when resolving initial deep link in useLinking
  "Can't perform a React state update on a component that hasn't mounted yet",
]);

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={DefaultTheme}>
          <SessionProvider>
            <RootNavigation />
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Export route error boundary for Expo Router screen-level errors
export { RouteErrorBoundary as ErrorBoundary };

function RootNavigation() {
  const { isInitializing, logOut, session } = useSession();
  const [hasSplashProgressElapsed, setHasSplashProgressElapsed] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsPermissionStatus>('checking');
  const [gpsDenialReason, setGpsDenialReason] = useState<GpsDenialReason>(null);
  const [isRetryingGps, setIsRetryingGps] = useState(false);
  const hasValidSession = Boolean(session?.accessToken);
  const shouldShowSplash =
    isInitializing || !hasSplashProgressElapsed || gpsStatus !== 'granted';

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasSplashProgressElapsed(true);
    }, SPLASH_PROGRESS_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  // Verify mandatory GPS permission & device GPS status while the splash screen is loading.
  useEffect(() => {
    let isMounted = true;

    checkMandatoryGpsStatus({ promptPermission: true })
      .then((result) => {
        if (isMounted) {
          setGpsStatus(result.status);
          setGpsDenialReason(result.reason);
        }
      })
      .catch(() => {
        if (isMounted) {
          setGpsStatus('denied');
          setGpsDenialReason('permission');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Re-check silently when returning from Settings / Quick Settings if GPS was denied or off.
  useEffect(() => {
    if (gpsStatus !== 'denied') return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      void checkMandatoryGpsStatus({ promptPermission: false })
        .then((result) => {
          setGpsStatus(result.status);
          setGpsDenialReason(result.reason);
        })
        .catch(() => {
          // Keep prompt visible when check fails.
        });
    });

    return () => {
      subscription.remove();
    };
  }, [gpsStatus]);

  const handleRetryGps = useCallback(async () => {
    setIsRetryingGps(true);
    try {
      const result = await checkMandatoryGpsStatus({ promptPermission: true });
      setGpsStatus(result.status);
      setGpsDenialReason(result.reason);
    } catch {
      setGpsStatus('denied');
      setGpsDenialReason('permission');
    } finally {
      setIsRetryingGps(false);
    }
  }, []);

  const handleOpenGpsSettings = useCallback(() => {
    void openLocationSettings(gpsDenialReason);
  }, [gpsDenialReason]);

  useEffect(() => {
    if (shouldShowSplash) return;

    if (hasValidSession && session?.accessToken) {
      void reconcilePendingCrops(session.accessToken);
    }
  }, [hasValidSession, session?.accessToken, shouldShowSplash]);

  // Redirect to login when any API call returns 401 / 403 (expired token).
  useEffect(() => {
    const unsubscribe = authExpiredEmitter.subscribe(() => {
      logOut().catch(() => {
        // Ignore storage errors during forced log-out.
      });
    });
    return () => {
      unsubscribe();
    };
  }, [logOut]);

  return (
    <View style={{ flex: 1 }}>
      <NavigationBar style="dark" />
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
          <Stack.Screen name="(public)/forgot-password" />
        </Stack.Protected>
        <Stack.Protected guard={hasValidSession}>
          <Stack.Screen name="(authenticated)" />
        </Stack.Protected>
      </Stack>
      {shouldShowSplash ? (
        <AppSplashScreen
          gpsStatus={gpsStatus}
          gpsDenialReason={gpsDenialReason}
          isRetryingGps={isRetryingGps}
          onRetryGps={handleRetryGps}
          onOpenSettings={handleOpenGpsSettings}
        />
      ) : null}
    </View>
  );
}
