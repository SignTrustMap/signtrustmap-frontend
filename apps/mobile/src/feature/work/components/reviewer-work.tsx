import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { useGetMyReviewerStats, useGetReviewQueue } from '@/feature/review/hooks/use-review';
import { useGetRevalidationEvidenceQueue } from '@/feature/revalidation/hooks/use-revalidation';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import type { ReviewerStatsResponse } from '@/types/reviewsType';
import { WorkActionBadge } from './work-action-badge';

export interface ReviewerWorkProps {
  reviewQueueTotal?: number;
  revalEvidenceCount?: number;
  reviewerStats?: ReviewerStatsResponse | null;
  incompleteMissionsCount?: number;
}

export function ReviewerWork({
  reviewQueueTotal: propReviewQueueTotal,
  revalEvidenceCount: propRevalEvidenceCount,
  reviewerStats: propReviewerStats,
  incompleteMissionsCount: propMissionsCount,
}: ReviewerWorkProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();

  const isReviewer = Boolean(session?.account?.roles?.includes('reviewer'));

  // Reviewer queries live directly within the Reviewer component
  const { data: reviewerStatsData } = useGetMyReviewerStats(isReviewer);
  const { data: reviewQueueData } = useGetReviewQueue({ page: '1', pageSize: '20' }, isReviewer);
  const { data: revalEvidenceQueueData } = useGetRevalidationEvidenceQueue(
    { page: 1, pageSize: 1 },
    isReviewer,
  );

  const reviewerStats = propReviewerStats ?? reviewerStatsData;
  const reviewQueueTotal = propReviewQueueTotal ?? reviewQueueData?.total ?? 0;
  const revalEvidenceCount = propRevalEvidenceCount ?? revalEvidenceQueueData?.total ?? 0;

  const { data: completionsData } = useGetMyTaskCompletions(
    undefined,
    isReviewer && propMissionsCount === undefined,
  );

  const incompleteMissionsCount = useMemo(() => {
    if (propMissionsCount !== undefined) return propMissionsCount;
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, 'reviewer'));
    const items = matched.length > 0 ? matched : getFallbackMissionsForRole('reviewer');
    return items.filter((item) => !item.isCompleted && !item.claimed).length;
  }, [completionsData, propMissionsCount]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tính năng</Text>
        </View>
        <View style={styles.gridRow}>
          {/* Standout Action for Reviewer: Pending Reviews */}
          <WorkActionBadge
            accessibilityLabel="Thẩm định các hồ sơ chờ xử lý"
            accentColor={theme.primary}
            badgeLabel={reviewQueueTotal > 0 ? `${reviewQueueTotal} MỚI` : undefined}
            count={reviewQueueTotal}
            icon="shield-check"
            label="Khảo sát cần duyệt"
            onPress={() => router.push('/work/submission-review')}
          />

          {/* Action Badge: Pending Revalidation Evidence */}
          <WorkActionBadge
            accentColor={theme.primary}
            count={revalEvidenceCount}
            icon="clipboard-check-outline"
            label="Tái thẩm định cần duyệt"
            onPress={() => router.push('/work/revalidation-review')}
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
                params: { role: 'reviewer' },
              })
            }
          />

          {/* Sign Catalog */}
          <WorkActionBadge
            accentColor={theme.primary}
            icon="database-search-outline"
            label="Tra cứu biển báo giao thông"
            onPress={() =>
              router.push({
                pathname: '/work/sign-catalog',
                params: { role: 'reviewer' },
              })
            }
          />

          {/* Reviewer Stats */}
          <WorkActionBadge
            accentColor={theme.primary}
            count={reviewerStats?.totalReviews}
            icon="chart-timeline-variant-shimmer"
            label="Thống kê của bạn"
            onPress={() => router.push('/work/reviewer-stats')}
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
