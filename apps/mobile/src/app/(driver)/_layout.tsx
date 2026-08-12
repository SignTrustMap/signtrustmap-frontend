import { Slot, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DriverBottomTabs } from '@/components/driver-bottom-tabs';

type DriverTabRoute = '/(driver)' | '/(driver)/tasks' | '/(driver)/credits' | '/(driver)/profile';

const tabRoutes = {
  credits: '/(driver)/credits',
  profile: '/(driver)/profile',
  tasks: '/(driver)/tasks',
} satisfies Record<string, DriverTabRoute>;

export default function DriverLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const activeRoute = tabRoutes[currentRoute as keyof typeof tabRoutes] ?? '/(driver)';
  const showTabs = currentRoute !== 'search' && currentRoute !== 'start';

  return (
    <View style={styles.layout}>
      <View style={styles.content}>
        <Slot />
      </View>
      {showTabs ? <DriverBottomTabs activeRoute={activeRoute} /> : null}
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
