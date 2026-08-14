import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';

type RoleEntryScreenProps = {
  role: 'driver' | 'surveyor' | 'reviewer';
  title: string;
};

export function RoleEntryScreen({ role, title }: RoleEntryScreenProps) {
  const { logOut } = useSession();

  const handleLogOut = async () => {
    await logOut();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="small" style={styles.copy}>
            You are signed in as {role}.
          </ThemedText>
          <AppButton label="Log out" onPress={handleLogOut} style={styles.button} />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: MaxContentWidth,
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
  button: {
    alignSelf: 'stretch',
  },
});
