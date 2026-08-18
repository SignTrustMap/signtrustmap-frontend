import { Slot, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppBottomTabs } from '@/components/app-bottom-tabs';

type AppTabRoute = '/home' | '/work' | '/credits' | '/profile';

const tabRoutes = {
  credits: '/credits',
  home: '/home',
  profile: '/profile',
  work: '/work',
} satisfies Record<string, AppTabRoute>;

export default function AppTabsLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const activeRoute = tabRoutes[currentRoute as keyof typeof tabRoutes] ?? '/home';
  const showTabs = currentRoute in tabRoutes;

  return (
    <View style={styles.layout}>
      <View style={styles.content}>
        <Slot />
      </View>
      {showTabs ? <AppBottomTabs activeRoute={activeRoute} /> : null}
    </View>
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
