import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Fonts, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { fetchFirstRevalidationSign } from '@/api/revalidation/revalidation';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import {
  useGetMyPendingSubmissions,
  useGetMySurveyStats,
} from '@/feature/upload/hooks/use-survey-submission';
import { useGetMyRecaptures } from '@/feature/review/hooks/use-recapture';
import { useGetFirstRevalidationSign } from '@/feature/revalidation/hooks/use-revalidation';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import { WorkActionBadge } from './work-action-badge';

export interface SurveyorWorkProps {
  pendingSurveyCount?: number;
  revalidationTaskCount?: number;
  recapturesCount?: number;
  firstRevalSign?: RouteSign | null;
  userCoordinate?: MapCoordinate;
  onOpenOfflineMap?: () => void;
  onOpenRevalidationMap?: () => void;
  incompleteMissionsCount?: number;
}

export function SurveyorWork({
  pendingSurveyCount: propPendingSurveyCount,
  revalidationTaskCount: propRevalidationTaskCount,
  recapturesCount: propRecapturesCount,
  firstRevalSign: propFirstRevalSign,
  userCoordinate: propUserCoordinate,
  onOpenOfflineMap,
  onOpenRevalidationMap,
  incompleteMissionsCount: propMissionsCount,
}: SurveyorWorkProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();

  const isSurveyor = Boolean(session?.account?.roles?.includes('surveyor'));

  const [deviceCoordinate, setDeviceCoordinate] = useState<MapCoordinate | undefined>(
    propUserCoordinate,
  );
  const [gpsAttempted, setGpsAttempted] = useState(Boolean(propUserCoordinate));

  useEffect(() => {
    if (propUserCoordinate) {
      setDeviceCoordinate(propUserCoordinate);
      setGpsAttempted(true);
      return;
    }

    if (!isSurveyor) return;

    let isMounted = true;
    void fetchFreshGpsPosition(3500)
      .then((pos) => {
        if (isMounted && pos) {
          setDeviceCoordinate(pos);
        }
      })
      .finally(() => {
        if (isMounted) {
          setGpsAttempted(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [propUserCoordinate, isSurveyor]);

  const effectiveCoordinate = propUserCoordinate ?? deviceCoordinate;

  // Surveyor queries live directly within the Surveyor component
  const { data: pendingData } = useGetMyPendingSubmissions(isSurveyor);
  const { data: surveyStats } = useGetMySurveyStats(isSurveyor);
  const { data: recapturesData } = useGetMyRecaptures({ page: 1, pageSize: 20 }, isSurveyor);
  const { data: firstRevalSignData } = useGetFirstRevalidationSign(
    effectiveCoordinate,
    Boolean(isSurveyor && (effectiveCoordinate || gpsAttempted)),
  );

  const pendingSurveyCount = propPendingSurveyCount ?? pendingData?.pending ?? 0;
  const revalidationTaskCount =
    propRevalidationTaskCount ?? surveyStats?.revalidationAvailable ?? 0;
  const recapturesCount = propRecapturesCount ?? recapturesData?.total ?? 0;
  const firstRevalSign = propFirstRevalSign !== undefined ? propFirstRevalSign : firstRevalSignData;

  const { data: completionsData } = useGetMyTaskCompletions(
    undefined,
    isSurveyor && propMissionsCount === undefined,
  );

  const incompleteMissionsCount = useMemo(() => {
    if (propMissionsCount !== undefined) return propMissionsCount;
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, 'surveyor'));
    const items = matched.length > 0 ? matched : getFallbackMissionsForRole('surveyor');
    return items.filter((item) => !item.isCompleted && !item.claimed).length;
  }, [completionsData, propMissionsCount]);

  const handleOpenReturnedSubmissions = () => {
    router.push('/work/returned-submissions-list');
  };

  const handleOpenRevalidationMap = async () => {
    if (onOpenRevalidationMap) {
      onOpenRevalidationMap();
      return;
    }

    let targetSign = firstRevalSign;
    if (!targetSign) {
      try {
        const coord = effectiveCoordinate ?? (await fetchFreshGpsPosition(2000));
        targetSign = await fetchFirstRevalidationSign(coord ?? undefined);
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
    <View style={styles.container}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tính năng</Text>
        </View>
        <View style={styles.gridRow}>
          {/* Standout Action: Revalidation Map */}
          <WorkActionBadge
            accentColor={theme.primary}
            count={revalidationTaskCount}
            icon="map-search-outline"
            label="Tái xác nhận biển báo"
            onPress={handleOpenRevalidationMap}
          />

          {/* Standout Action: Recaptures Requested */}
          <WorkActionBadge
            accentColor="#F59E0B"
            count={recapturesCount}
            icon="camera-retake-outline"
            label="Yêu cầu chụp lại ảnh"
            onPress={() => router.push('/work/recaptures')}
          />

          {/* Standout Action: Offline Maps */}
          {onOpenOfflineMap ? (
            <WorkActionBadge
              accentColor={theme.primary}
              icon="map-marker-down"
              label="Bản đồ ngoại tuyến"
              onPress={onOpenOfflineMap}
            />
          ) : null}

          <WorkActionBadge
            accentColor={theme.primary}
            icon="camera-document-off"
            label="Ảnh bị trả về"
            onPress={handleOpenReturnedSubmissions}
          />
        </View>
      </View>

      {/* Section 2: Nhiệm vụ và tiện ích */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhiệm vụ và tiện ích</Text>
        </View>
        <View style={styles.gridRow}>
          {/* Missions */}
          <WorkActionBadge
            accentColor={theme.primary}
            count={incompleteMissionsCount > 0 ? incompleteMissionsCount : undefined}
            icon="trophy-outline"
            label="Nhiệm vụ"
            onPress={() =>
              router.push({
                pathname: '/work/missions',
                params: { role: 'surveyor' },
              })
            }
          />

          {/* Survey / Vote History */}
          <WorkActionBadge
            accentColor={theme.primary}
            count={pendingSurveyCount}
            icon="cloud-upload-outline"
            label="Lịch sử vote"
            onPress={() => router.push('/work/survey-history')}
          />

          {/* Action Badge: Sign Catalog */}
          <WorkActionBadge
            accentColor={theme.primary}
            icon="database-search-outline"
            label="Tra cứu biển báo giao thông"
            onPress={() =>
              router.push({
                pathname: '/work/sign-catalog',
                params: { role: 'surveyor' },
              })
            }
          />
        </View>
      </View>
    </View>
  );
}

export function SurveyorFab() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Tạo bản ghi khảo sát mới"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => router.push('/work/new-survey')}
      style={({ pressed }) => [
        styles.floatingAction,
        {
          backgroundColor: theme.primary,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <MaterialCommunityIcons
        color={theme.onPrimary}
        name="plus"
        size={30}
        style={styles.fabIcon}
      />
    </Pressable>
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
  floatingAction: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    textAlign: 'center',
    alignSelf: 'center',
    lineHeight: 30,
  },
});
