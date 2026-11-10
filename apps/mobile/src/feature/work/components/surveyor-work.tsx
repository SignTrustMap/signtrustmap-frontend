import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
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
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import { WorkActionCard } from './work-action-card';

export interface SurveyorWorkProps {
  pendingSurveyCount?: number;
  revalidationTaskCount?: number;
  recapturesCount?: number;
  firstRevalSign?: RouteSign | null;
  userCoordinate?: MapCoordinate;
  onOpenOfflineMap?: () => void;
  onOpenRevalidationMap?: () => void;
}

export function SurveyorWork({
  pendingSurveyCount: propPendingSurveyCount,
  revalidationTaskCount: propRevalidationTaskCount,
  recapturesCount: propRecapturesCount,
  firstRevalSign: propFirstRevalSign,
  userCoordinate: propUserCoordinate,
  onOpenOfflineMap,
  onOpenRevalidationMap,
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
    <View style={styles.actionList}>
      {/* Standout Action: Survey History */}
      <WorkActionCard
        accentColor={theme.primary}
        count={pendingSurveyCount}
        icon="cloud-upload-outline"
        label="Lịch sử khảo sát"
        onPress={() => router.push('/work/survey-history')}
        subtitle="Lịch sử ghi nhận biển báo đã nộp, duyệt, từ chối"
      />

      {/* Standout Action: Revalidation Map */}
      <WorkActionCard
        accentColor={theme.primary}
        count={revalidationTaskCount}
        icon="map-search-outline"
        label="Tái xác nhận biển báo"
        onPress={handleOpenRevalidationMap}
        subtitle="Xem bản đồ để kiểm tra các biển báo cần xác nhận lại"
      />

      {/* Standout Action: Recaptures Requested */}
      <WorkActionCard
        accentColor="#F59E0B"
        count={recapturesCount}
        icon="camera-retake-outline"
        label="Yêu cầu chụp lại ảnh"
        onPress={() => router.push('/work/recaptures')}
        subtitle="Chụp lại biển báo bị mờ hoặc thiếu thông tin theo yêu cầu của Thẩm định viên"
      />

      {/* Standout Action: Offline Maps */}
      {onOpenOfflineMap ? (
        <WorkActionCard
          accentColor={theme.primary}
          icon="map-marker-down"
          label="Bản đồ ngoại tuyến"
          onPress={onOpenOfflineMap}
          subtitle="Tải bản đồ vector PMTiles để khảo sát khi không có sóng di động"
        />
      ) : null}

      {/* Action Card: Sign Catalog */}
      <WorkActionCard
        accentColor={theme.primary}
        icon="database-search-outline"
        label="Tra cứu biển báo giao thông"
        onPress={() =>
          router.push({
            pathname: '/work/sign-catalog',
            params: { role: 'surveyor' },
          })
        }
        subtitle="Tra cứu mã hiệu và phân loại biển báo chuẩn Quy chuẩn Việt Nam"
      />
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
  actionList: {
    gap: Spacing.three,
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
