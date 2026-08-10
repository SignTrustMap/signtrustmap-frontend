import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, type ColorSchemeName } from 'react-native';

import { Colors } from '@/constants/theme';
import { AppSplashScreen } from '@/feature/splash/pages/splash-screen';
import { SessionProvider, useSession } from '@/context/session-provider';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <RootNavigation colorScheme={colorScheme} />
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { isInitializing } = useSession();

  if (isInitializing) {
    return <AppSplashScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      {/* <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected> */}
    </Stack>
  );
}
