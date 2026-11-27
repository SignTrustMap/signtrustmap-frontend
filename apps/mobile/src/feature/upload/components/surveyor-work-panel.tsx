import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { WorkActionCard } from '@/feature/work/components/work-action-card';
import { useGetMyPendingSubmissions, useGetMySurveyStats } from '@/feature/upload/hooks/use-survey-submission';

export function SurveyorWorkPanel() {
  const router = useRouter();
  const { data: pending } = useGetMyPendingSubmissions();
  const { data: stats } = useGetMySurveyStats();

  const handleOpenRevalidationMap = () => {
    router.push('/work/revalidation-map');
  };

  return (
    <View style={styles.panel}>
      <WorkActionCard
        count={pending?.pending}
        label="Hồ sơ đang xử lý"
        onPress={() => router.push('/work/survey-history')}
        symbol={{ android: 'assignment_late', ios: 'clipboard', web: 'assignment_late' }}
      />
      <WorkActionCard
        count={stats?.revalidationAvailable ?? 0}
        label="Bản đồ tái thẩm định"
        onPress={handleOpenRevalidationMap}
        symbol={{ android: 'explore', ios: 'location.north.circle', web: 'explore' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Spacing.three,
  },
});
