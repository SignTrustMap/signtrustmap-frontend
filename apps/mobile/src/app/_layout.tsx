import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AppSplashScreen } from '@/feature/splash/pages/splash-screen';
import { SessionProvider } from '@/context/session-provider';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <AppSplashScreen />
        <RootNavigation />
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigation() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
