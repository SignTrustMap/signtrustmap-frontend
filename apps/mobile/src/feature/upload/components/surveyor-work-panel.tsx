import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { WorkActionCard } from '@/feature/work/components/work-action-card';
import { useGetMyPendingSubmissions } from '@/feature/upload/hooks/use-survey-submission';

export function SurveyorWorkPanel() {
  const router = useRouter();
  const { data: pending } = useGetMyPendingSubmissions();

  return (
    <View style={styles.panel}>
      <WorkActionCard
        count={2}
        label="Revalidation Map"
        onPress={() => router.replace('/home')}
        symbol={{ android: 'explore', ios: 'location.north.circle', web: 'explore' }}
      />
      <WorkActionCard
        count={pending?.pending}
        label="Pending Submissions"
        onPress={() => router.push('/work/survey-history')}
        symbol={{ android: 'assignment_late', ios: 'clipboard', web: 'assignment_late' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Spacing.three,
  },
});
