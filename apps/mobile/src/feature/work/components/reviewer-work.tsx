import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
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
      {/* Standout Hero Action for Reviewer: Pending Reviews */}
      <AppButton
        accessibilityLabel="Thẩm định các hồ sơ chờ xử lý"
        onPress={() => router.push('/work/submission-review')}
        pressedOpacity={0.9}
        style={styles.heroActionCard}
        variant="primary"
      >
        <View style={styles.heroLeft}>
          <View style={styles.heroIconCircle}>
            <MaterialCommunityIcons color={theme.primary} name="shield-check" size={26} />
          </View>
          <View style={styles.heroText}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Khảo sát cần duyệt</Text>
              {reviewQueueTotal > 0 ? (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{reviewQueueTotal} MỚI</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroSubtitle}>
              {reviewQueueTotal > 0
                ? `${reviewQueueTotal} biển báo cần bạn xác minh`
                : 'Không có biển báo cần xác minh'}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons color={theme.onPrimary} name="chevron-right" size={24} />
      </AppButton>

      {/* Action Card: Pending Revalidation Evidence */}
      <WorkActionCard
        accentColor={theme.primary}
        count={revalEvidenceCount}
        icon="clipboard-check-outline"
        label="Tái thẩm định cần duyệt"
        onPress={() => router.push('/work/revalidation-review')}
        subtitle="Thẩm định minh chứng thực địa từ khảo sát viên và bỏ phiếu đồng thuận"
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
        subtitle="Tra cứu mã hiệu và phân loại biển báo chuẩn Quy chuẩn Việt Nam"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionList: {
    gap: Spacing.three,
  },
  heroActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Rounded.lg,
    shadowColor: '#0671eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  heroTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  heroSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  heroBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.round,
  },
  heroBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '800',
    color: '#854D0E',
  },
});
