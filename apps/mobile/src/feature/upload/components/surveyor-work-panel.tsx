import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { WorkActionCard } from '@/feature/work/components/work-action-card';
import { useGetMyPendingSubmissions, useGetMySurveyStats } from '@/feature/upload/hooks/use-survey-submission';
import { useGetFirstRevalidationSign } from '@/feature/revalidation/hooks/use-revalidation';
import { fetchFirstRevalidationSign } from '@/api/revalidation/revalidation';

export function SurveyorWorkPanel() {
  const router = useRouter();
  const { data: pending } = useGetMyPendingSubmissions();
  const { data: stats } = useGetMySurveyStats();
  const { data: firstSign } = useGetFirstRevalidationSign();

  const handleOpenRevalidationMap = async () => {
    let targetSign = firstSign;
    if (!targetSign) {
      try {
        targetSign = await fetchFirstRevalidationSign();
      } catch {
        targetSign = null;
      }
    }

    if (targetSign) {
      router.push({
        pathname: '/work/revalidation-map',
        params: {
          autoSelectFirst: 'true',
          selectedSignId: targetSign.id,
          snapLon: String(targetSign.coordinate[0]),
          snapLat: String(targetSign.coordinate[1]),
          snapRequestId: String(Date.now()),
          signJson: JSON.stringify(targetSign),
        },
      });
    } else {
      router.push({
        pathname: '/work/revalidation-map',
        params: {
          autoSelectFirst: 'true',
          snapRequestId: String(Date.now()),
        },
      });
    }
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
        count={pending?.countsByStatus?.DRAFT}
        label="Bản nháp khảo sát"
        onPress={() => router.push('/work/new-survey')}
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
