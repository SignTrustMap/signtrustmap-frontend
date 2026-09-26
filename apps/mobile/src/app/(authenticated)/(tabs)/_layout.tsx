import { Slot, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppBottomTabs } from '@/components/app-bottom-tabs';
import { NavigationActiveProvider, useNavigationActive } from '@/context/navigation-active-provider';
import { SignFilterProvider } from '@/context/sign-filter-provider';

type AppTabRoute = '/home' | '/work' | '/profile';

const tabRoutes = {
  home: '/home',
  profile: '/profile',
  work: '/work',
} satisfies Record<string, AppTabRoute>;

function AppTabsContent() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const activeRoute = tabRoutes[currentRoute as keyof typeof tabRoutes] ?? '/home';
  const showTabs = currentRoute in tabRoutes;
  const { isNavigationActive } = useNavigationActive();

  return (
    <View style={styles.layout}>
      <View style={styles.content}>
        <Slot />
      </View>
      {showTabs && !isNavigationActive ? <AppBottomTabs activeRoute={activeRoute} /> : null}
    </View>
  );
}

export default function AppTabsLayout() {
  return (
    <NavigationActiveProvider>
      <SignFilterProvider>
        <AppTabsContent />
      </SignFilterProvider>
    </NavigationActiveProvider>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
