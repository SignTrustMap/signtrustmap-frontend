import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { useGetNavigationSessions } from '@/feature/navigation/hooks/use-navigation';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import { WorkActionBadge } from './work-action-badge';

export interface DriverWorkProps {
  driverSessionsTotal?: number;
  incompleteMissionsCount?: number;
}

export function DriverWork({
  driverSessionsTotal: propDriverSessionsTotal,
  incompleteMissionsCount: propMissionsCount,
}: DriverWorkProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();

  const isDriver = Boolean(session?.account?.roles?.includes('driver'));

  // Driver queries live directly within the Driver component
  const { data: driverSessions } = useGetNavigationSessions({ page: 1, pageSize: 1 }, isDriver);
  const driverSessionsTotal = propDriverSessionsTotal ?? driverSessions?.total ?? 0;

  const { data: completionsData } = useGetMyTaskCompletions(
    undefined,
    isDriver && propMissionsCount === undefined,
  );

  const incompleteMissionsCount = useMemo(() => {
    if (propMissionsCount !== undefined) return propMissionsCount;
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, 'driver'));
    const items = matched.length > 0 ? matched : getFallbackMissionsForRole('driver');
    return items.filter((item) => !item.isCompleted && !item.claimed).length;
  }, [completionsData, propMissionsCount]);

  return (
    <View style={styles.container}>
      {/* Section 1: Tính năng khác */}
      <View style={styles.sectionContainer}></View>

      {/* Section 2: Nhiệm vụ và tiện ích */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhiệm vụ và tiện ích</Text>
        </View>
        <View style={styles.gridRow}>
          {/* Standout Action: Missions */}
          <WorkActionBadge
            accentColor={theme.primary}
            count={incompleteMissionsCount > 0 ? incompleteMissionsCount : undefined}
            icon="trophy-outline"
            label="Nhiệm vụ"
            onPress={() =>
              router.push({
                pathname: '/work/missions',
                params: { role: 'driver' },
              })
            }
          />

          {/* Standout Action: Driver Navigation History */}
          <WorkActionBadge
            accentColor={theme.primary}
            count={driverSessionsTotal}
            icon="map-clock-outline"
            label="Lịch sử di chuyển"
            onPress={() => router.push('/work/navigation-history')}
          />

          {/* Action Badge: Sign Catalog */}
          <WorkActionBadge
            accentColor={theme.primary}
            icon="database-search-outline"
            label="Tra cứu biển báo"
            onPress={() =>
              router.push({
                pathname: '/work/sign-catalog',
                params: { role: 'driver' },
              })
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  sectionContainer: {
    gap: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  sectionTitle: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 18,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two,
  },
});
