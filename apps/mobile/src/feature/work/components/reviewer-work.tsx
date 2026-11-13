import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { useGetMyReviewerStats, useGetReviewQueue } from '@/feature/review/hooks/use-review';
import { useGetRevalidationEvidenceQueue } from '@/feature/revalidation/hooks/use-revalidation';
import type { ReviewerStatsResponse } from '@/types/reviewsType';
import { WorkActionCard } from './work-action-card';

export interface ReviewerWorkProps {
  reviewQueueTotal?: number;
  revalEvidenceCount?: number;
  reviewerStats?: ReviewerStatsResponse | null;
}

export function ReviewerWork({
  reviewQueueTotal: propReviewQueueTotal,
  revalEvidenceCount: propRevalEvidenceCount,
  reviewerStats: propReviewerStats,
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

  return (
    <View style={styles.actionList}>
      {/* Standout Action for Reviewer: Pending Reviews */}
      <WorkActionCard
        accessibilityLabel="Thẩm định các hồ sơ chờ xử lý"
        accentColor={theme.primary}
        badgeLabel={reviewQueueTotal > 0 ? `${reviewQueueTotal} MỚI` : undefined}
        count={reviewQueueTotal}
        icon="shield-check"
        label="Khảo sát cần duyệt"
        onPress={() => router.push('/work/submission-review')}
        subtitle={
          reviewQueueTotal > 0
            ? `${reviewQueueTotal} biển báo cần bạn xác minh`
            : 'Không có biển báo cần xác minh'
        }
      />

      {/* Action Card: Pending Revalidation Evidence */}
      <WorkActionCard
        accentColor={theme.primary}
        count={revalEvidenceCount}
        icon="clipboard-check-outline"
        label="Tái thẩm định cần duyệt"
        onPress={() => router.push('/work/revalidation-review')}
        subtitle="Bỏ phiếu tái thẩm định các biển báo."
      />

      {/* Action Card: Reviewer Stats */}
      <WorkActionCard
        accentColor={theme.primary}
        count={reviewerStats?.totalReviews}
        icon="chart-timeline-variant-shimmer"
        label="Thống kê của bạn"
        onPress={() => router.push('/work/reviewer-stats')}
      />

      {/* Secondary Standout Action: Sign Catalog */}
      <WorkActionCard
        accentColor={theme.primary}
        icon="database-search-outline"
        label="Tra cứu biển báo giao thông"
        onPress={() =>
          router.push({
            pathname: '/work/sign-catalog',
            params: { role: 'reviewer' },
          })
        }
        subtitle="Tra cứu biển báo chuẩn theo Quy chuẩn Việt Nam"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionList: {
    gap: Spacing.three,
  },
});
