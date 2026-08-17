import { DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { AppSplashScreen } from '@/feature/splash/pages/splash-screen';
import { SessionProvider, useSession } from '@/context/session-provider';
import { requestLocationPermissionOnFirstLaunch } from '@/services/location-permission';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <SessionProvider>
        <RootNavigation />
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigation() {
  const { isInitializing, session } = useSession();
  const hasValidSession = Boolean(session?.trim());

  useEffect(() => {
    if (isInitializing) return;

    requestLocationPermissionOnFirstLaunch().catch(() => {
      // Permission storage failures should not prevent the app from opening.
    });
  }, [isInitializing]);

  if (isInitializing) {
    return <AppSplashScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Protected guard={!hasValidSession}>
        <Stack.Screen name="(public)/login" />
      </Stack.Protected>
      <Stack.Protected guard={hasValidSession}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(surveyor)" />
        <Stack.Screen name="(reviewer)" />
      </Stack.Protected>
    </Stack>
  );
}
