import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SubmissionFinishedScreen({ reviewedCount }: { reviewedCount: number }) {
  const router = useRouter();
  const theme = useTheme();



  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.iconLabel, { color: theme.tertiary }]}>✓</Text>
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>Submission complete</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {reviewedCount} {reviewedCount === 1 ? 'sign review has' : 'sign reviews have'} been
              submitted successfully.
            </Text>
          </View>
          <View style={styles.actionFooter}>
            <AppButton
              label="Return to home"
              onPress={() => router.replace('/work')}
              style={styles.action}
              variant='surface'
            />
            <AppButton
              label="Review more signs"
              onPress={() => router.replace('/work/submission-review')}
              style={styles.action}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 480,
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  icon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
  },
  iconLabel: {
    fontFamily: Fonts.body,
    fontSize: 40,
    fontWeight: 900,
    lineHeight: 48
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.one
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 34
  },
  description: {
    maxWidth: 340,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 21,
    textAlign: 'center',
  },
  actionFooter: {
    width: '100%',
  },
  action: {
    width: '100%',
    minHeight: 50,
    borderRadius: Rounded.md,
    marginTop: Spacing.two,
  },
});
