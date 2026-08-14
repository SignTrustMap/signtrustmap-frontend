import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { AppButton } from '@/components/ui/button';
import { useSession } from '@/context/session-provider';

type DriverSectionScreenProps = {
  title: string;
};

export function DriverSectionScreen({ title }: DriverSectionScreenProps) {
  const { logOut } = useSession();

  const handleLogOut = async () => {
    await logOut();
  };

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
          <AppButton
            label="Log out"
            onPress={handleLogOut}
          />
        </ThemedView>
      </SafeAreaView>
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
