import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverBottomTabs } from '@/components/driver-bottom-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type DriverSectionScreenProps = {
  activeRoute: '/(driver)/tasks' | '/(driver)/credits' | '/(driver)/profile';
  title: string;
};

export function DriverSectionScreen({ activeRoute, title }: DriverSectionScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.content}>
        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="small" style={styles.copy}>
            This driver section is ready for the next workflow.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
      <DriverBottomTabs activeRoute={activeRoute} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  panel: {
    gap: Spacing.three,
    borderRadius: Spacing.two,
    padding: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
  },
});
