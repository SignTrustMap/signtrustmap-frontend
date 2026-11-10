import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { useGetNavigationSessions } from '@/feature/navigation/hooks/use-navigation';
import { WorkActionCard } from './work-action-card';

export interface DriverWorkProps {
  driverSessionsTotal?: number;
}

export function DriverWork({ driverSessionsTotal: propDriverSessionsTotal }: DriverWorkProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();

  const isDriver = Boolean(session?.account?.roles?.includes('driver'));

  // Driver queries live directly within the Driver component
  const { data: driverSessions } = useGetNavigationSessions({ page: 1, pageSize: 1 }, isDriver);
  const driverSessionsTotal = propDriverSessionsTotal ?? (driverSessions?.total ?? 0);

  return (
    <View style={styles.actionList}>
      {/* Standout Action: Driver Navigation History */}
      <WorkActionCard
        accentColor={theme.primary}
        count={driverSessionsTotal}
        icon="map-clock-outline"
        label="Lịch sử di chuyển"
        onPress={() => router.push('/work/navigation-history')}
        subtitle="Xem lại các lộ trình và chuyến đi bạn đã điều hướng"
      />

      {/* Action Card: Sign Catalog */}
      <WorkActionCard
        accentColor={theme.primary}
        icon="database-search-outline"
        label="Tra cứu biển báo giao thông"
        onPress={() =>
          router.push({
            pathname: '/work/sign-catalog',
            params: { role: 'driver' },
          })
        }
        subtitle="Tra cứu mã hiệu và phân loại biển báo chuẩn Quy chuẩn Việt Nam"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionList: {
    gap: Spacing.three,
  },
});
