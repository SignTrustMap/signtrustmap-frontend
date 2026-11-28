import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveS3Url } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/button';
import { DateFilterSortList } from '@/components/date-filter-sort-list';
import { ListSkeleton, Skeleton } from '@/components/skeleton';
import { Rounded, Spacing } from '@/constants/theme';
import { useGetMyReviewHistory, useGetMyReviewerStats } from '@/feature/review/hooks/use-review';
import type { MyReviewHistoryParams } from '@/types/reviewsType';
import { useBackButton } from '@/hooks/use-back-button';
import { useTheme } from '@/hooks/use-theme';
import { useWorkRoute } from '@/hooks/use-work-route';
import { styles } from '@/feature/review/styles/reviewer-stats-screen.styles';

function formatReviewDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizePercentage(value?: number) {
  if (value == null) return 0;
  // If backend returns 0.95 -> 95%, if 95 -> 95%
  if (value <= 1 && value > 0) {
    return Math.round(value * 100);
  }
  return Math.round(value);
}

export function ReviewerStatsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const reviewerWorkRoute = useWorkRoute('/work', { currentRole: 'reviewer' });

  useBackButton(reviewerWorkRoute);

  const [activeHistoryTab, setActiveHistoryTab] = useState<'all' | 'approved' | 'rejected'>('all');
  const [historyPage, setHistoryPage] = useState(1);
  const PAGE_SIZE = 10;

  const {
    data: stats,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    refetch: refetchStats,
    error: statsError,
  } = useGetMyReviewerStats();

  const historyParams: MyReviewHistoryParams = {
    page: String(historyPage),
    pageSize: String(PAGE_SIZE),
    ...(activeHistoryTab !== 'all' ? { state: activeHistoryTab } : {}),
  };

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useGetMyReviewHistory(historyParams);

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsPullRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchHistory()]);
    } finally {
      setIsPullRefreshing(false);
    }
  };

  const reliabilityPercent = normalizePercentage(stats?.reliabilityScore);
  const accuracyPercent = normalizePercentage(stats?.accuracyRate);
  const totalReviews = stats?.totalReviews ?? 0;
  const approvedCount = stats?.approved ?? 0;
  const rejectedCount = stats?.rejected ?? 0;
  const streak = stats?.currentStreak ?? 0;

  // Reputation tier calculation
  let tierLabel = 'Thẩm định viên tập sự';
  let tierColor = '#0284C7';

  if (reliabilityPercent >= 90) {
    tierLabel = 'Thẩm định viên cao cấp';
    tierColor = '#10B981';
  } else if (reliabilityPercent >= 75) {
    tierLabel = 'Thẩm định viên tin cậy';
    tierColor = theme.primary;
  } else if (reliabilityPercent < 50 && totalReviews > 10) {
    tierLabel = 'Cần cải thiện độ chính xác';
    tierColor = '#EF4444';
  }

  const rawHistoryItems = historyData?.items ?? [];
  const filteredHistoryItems = rawHistoryItems.filter((item) => {
    if (activeHistoryTab === 'approved') return item.vote > 0;
    if (activeHistoryTab === 'rejected') return item.vote < 0;
    return true;
  });

  const totalHistoryCount = historyData?.total ?? filteredHistoryItems.length;
  const totalPages = Math.max(
    1,
    historyData?.totalPages ?? Math.ceil(totalHistoryCount / PAGE_SIZE),
  );

  const handleTabChange = (tab: 'all' | 'approved' | 'rejected') => {
    setActiveHistoryTab(tab);
    setHistoryPage(1);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        {/* Top Header */}
        <View style={styles.header}>
          <AppButton
            accessibilityLabel="Quay lại danh mục công việc thẩm định"
            onPress={() => router.replace(reviewerWorkRoute)}
            style={styles.iconButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>

          <View style={styles.headerTitleWrap}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
              Thống kê thẩm định
            </Text>
          </View>

          <AppButton
            accessibilityLabel="Làm mới thống kê"
            disabled={isPullRefreshing || isStatsFetching}
            onPress={onRefresh}
            style={styles.iconButton}
            variant="ghost"
          >
            <MaterialCommunityIcons
              color={theme.primary}
              name={isPullRefreshing || isStatsFetching ? 'loading' : 'refresh'}
              size={22}
            />
          </AppButton>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={isPullRefreshing}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {isStatsLoading ? (
            <View style={styles.skeletonContainer}>
              {/* Hero Banner Skeleton */}
              <Skeleton
                borderRadius={Rounded.xlg}
                height={150}
                style={{ marginBottom: Spacing.two }}
              />

              {/* 4 Metrics Grid Skeleton */}
              <View style={styles.metricsGrid}>
                <Skeleton borderRadius={Rounded.lg} height={78} style={styles.metricCardSkeleton} />
                <Skeleton borderRadius={Rounded.lg} height={78} style={styles.metricCardSkeleton} />
              </View>
              <View style={[styles.metricsGrid, { marginTop: Spacing.two }]}>
                <Skeleton borderRadius={Rounded.lg} height={78} style={styles.metricCardSkeleton} />
                <Skeleton borderRadius={Rounded.lg} height={78} style={styles.metricCardSkeleton} />
              </View>

              {/* Action Button Skeleton */}
              <Skeleton
                borderRadius={Rounded.lg}
                height={48}
                style={{ marginVertical: Spacing.three }}
              />

              {/* History Section Skeleton */}
              <View style={{ gap: Spacing.two }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: Spacing.one,
                  }}
                >
                  <Skeleton height={20} width={180} />
                  <Skeleton height={14} width={60} />
                </View>
                <Skeleton
                  borderRadius={Rounded.md}
                  height={38}
                  style={{ marginBottom: Spacing.two }}
                />
                <ListSkeleton count={PAGE_SIZE} lines={2} showThumbnail={true} />
              </View>
            </View>
          ) : statsError ? (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <MaterialCommunityIcons color="#EF4444" name="alert-circle-outline" size={36} />
              <Text style={[styles.errorTitle, { color: theme.text }]}>
                Không thể tải dữ liệu thống kê
              </Text>
              <Text style={[styles.errorDesc, { color: theme.grey }]}>
                Vui lòng kiểm tra kết nối mạng và thử lại.
              </Text>
              <AppButton label="Thử lại" onPress={onRefresh} style={{ marginTop: Spacing.two }} />
            </View>
          ) : (
            <>
              {/* Hero Banner: Reliability Score */}
              <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
                <View style={styles.heroScoreRow}>
                  <View style={styles.heroScoreCircle}>
                    <Text style={styles.heroScoreNumber}>{reliabilityPercent}%</Text>
                    <Text style={styles.heroScoreCaption}>Độ tin cậy</Text>
                  </View>

                  <View style={styles.heroScoreInfo}>
                    <Text style={styles.heroScoreHeading}>{tierLabel}</Text>
                    <Text style={styles.heroScoreDesc}>
                      Dựa trên sự đồng thuận của cộng đồng SignTrustMap với các phiếu thẩm định biển
                      báo của bạn.
                    </Text>

                    {streak > 1 ? (
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons color="#F59E0B" name="fire" size={16} />
                        <Text style={styles.streakText}>
                          Chuỗi {streak} phiếu chính xác liên tiếp
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* 4 Key Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* 1. Total Reviews */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: '#0671eb15' }]}>
                    <MaterialCommunityIcons
                      color={theme.primary}
                      name="shield-check-outline"
                      size={22}
                    />
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{totalReviews}</Text>
                  <Text style={[styles.metricLabel, { color: theme.grey }]}>
                    Tổng lượt thẩm định
                  </Text>
                </View>

                {/* 2. Accuracy Rate */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: '#10B98115' }]}>
                    <MaterialCommunityIcons color="#10B981" name="target" size={22} />
                  </View>
                  <Text style={[styles.metricValue, { color: '#10B981' }]}>{accuracyPercent}%</Text>
                  <Text style={[styles.metricLabel, { color: theme.grey }]}>Tỷ lệ chính xác</Text>
                </View>

                {/* 3. Approved count */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: '#10B98115' }]}>
                    <MaterialCommunityIcons color="#10B981" name="thumb-up-outline" size={22} />
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{approvedCount}</Text>
                  <Text style={[styles.metricLabel, { color: theme.grey }]}>Biển đã đồng ý</Text>
                </View>

                {/* 4. Rejected count */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: '#EF444415' }]}>
                    <MaterialCommunityIcons color="#EF4444" name="thumb-down-outline" size={22} />
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>{rejectedCount}</Text>
                  <Text style={[styles.metricLabel, { color: theme.grey }]}>Biển đã từ chối</Text>
                </View>
              </View>

              {/* Action Link to review queue */}
              <AppButton
                accessibilityLabel="Vào hàng đợi thẩm định biển báo"
                onPress={() => router.push('/work/submission-review')}
                pressedOpacity={0.9}
                style={styles.reviewNowButton}
                variant="primary"
              >
                <MaterialCommunityIcons
                  color="#FFFFFF"
                  name="checkbox-multiple-marked-outline"
                  size={20}
                />
                <Text style={styles.reviewNowButtonText}>Tiếp tục thẩm định hồ sơ</Text>
              </AppButton>

              {/* Recent Review History Section */}
              <View style={styles.historySection}>
                <View style={styles.historyHeaderRow}>
                  <View style={styles.historyTitleWrap}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Lịch sử thẩm định gần đây
                    </Text>
                    {isHistoryFetching ? (
                      <ActivityIndicator
                        color={theme.primary}
                        size="small"
                        style={{ marginLeft: Spacing.one }}
                      />
                    ) : null}
                  </View>
                </View>

                {/* Filter Pills */}
                <View
                  accessibilityLabel="Lọc lịch sử"
                  accessibilityRole="tablist"
                  style={[
                    styles.historyFilterBar,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  {(['all', 'approved', 'rejected'] as const).map((tab) => {
                    const isActive = activeHistoryTab === tab;
                    return (
                      <Pressable
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                        key={tab}
                        onPress={() => handleTabChange(tab)}
                        style={[
                          styles.historyFilterTab,
                          isActive && [
                            styles.historyFilterTabActive,
                            { backgroundColor: theme.primary },
                          ],
                        ]}
                      >
                        <Text
                          style={[
                            styles.historyFilterTabText,
                            { color: isActive ? '#FFFFFF' : theme.textSecondary },
                          ]}
                        >
                          {tab === 'all'
                            ? 'Tất cả'
                            : tab === 'approved'
                              ? `Đồng ý (${approvedCount})`
                              : `Từ chối (${rejectedCount})`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* History Item Cards */}
                {isHistoryLoading || isHistoryFetching ? (
                  <ListSkeleton count={PAGE_SIZE} lines={2} showThumbnail={true} />
                ) : filteredHistoryItems.length === 0 ? (
                  <View
                    style={[
                      styles.emptyHistoryBox,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      color={theme.grey}
                      name="file-document-outline"
                      size={32}
                    />
                    <Text style={[styles.emptyHistoryText, { color: theme.grey }]}>
                      {activeHistoryTab === 'all'
                        ? 'Bạn chưa thực hiện lượt thẩm định nào.'
                        : 'Không có bản ghi phù hợp với bộ lọc.'}
                    </Text>
                  </View>
                ) : (
                  <DateFilterSortList
                    items={filteredHistoryItems}
                    getDate={(item) => (item as any).reviewedAt || (item as any).createdAt}
                    headerTitle="Lọc theo ngày"
                    startDateLabel="Từ ngày"
                    endDateLabel="Đến ngày"
                    showPresets
                    showSortToggle
                    controlsCardStyle={{ marginBottom: Spacing.two }}
                  >
                    {({ items: dateFilteredItems, totalCount }) => {
                      if (dateFilteredItems.length === 0) {
                        return (
                          <View
                            style={[
                              styles.emptyHistoryBox,
                              {
                                backgroundColor: theme.backgroundElement,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              color={theme.grey}
                              name="file-document-outline"
                              size={32}
                            />
                            <Text style={[styles.emptyHistoryText, { color: theme.grey }]}>
                              {totalCount === 0
                                ? 'Bạn chưa thực hiện lượt thẩm định nào.'
                                : 'Không có bản ghi phù hợp với bộ lọc ngày.'}
                            </Text>
                          </View>
                        );
                      }

                      return (
                        <View
                          style={[
                            styles.historyList,
                            isHistoryFetching && styles.historyListFetching,
                          ]}
                        >
                          {dateFilteredItems.map((item, index) => {
                            const isApproved = item.vote > 0;
                            const candidate = item.candidate;
                            const signName =
                              candidate?.predictedSignType?.nameVi ||
                              candidate?.predictedSignType?.nameEn ||
                              candidate?.predictedSignType?.signCode ||
                              'Biển báo ứng viên';
                            const signCode = candidate?.predictedSignType?.signCode;
                            const cropUrl = resolveS3Url(
                              candidate?.signCropUrl || candidate?.bestFrameUrl,
                            );

                            return (
                              <View
                                key={item.candidateId || String(index)}
                                style={[
                                  styles.historyCard,
                                  {
                                    backgroundColor: theme.backgroundElement,
                                    borderColor: theme.border,
                                  },
                                ]}
                              >
                                {/* Image Thumbnail or fallback */}
                                <View
                                  style={[
                                    styles.historyThumbWrap,
                                    { backgroundColor: `${theme.grey}15` },
                                  ]}
                                >
                                  {cropUrl ? (
                                    <Image
                                      contentFit="cover"
                                      source={{ uri: cropUrl }}
                                      style={styles.historyThumb}
                                      transition={200}
                                    />
                                  ) : (
                                    <MaterialCommunityIcons
                                      color={theme.primary}
                                      name="sign-direction"
                                      size={22}
                                    />
                                  )}
                                </View>

                                {/* Info */}
                                <View style={styles.historyBody}>
                                  <View style={styles.historyTopRow}>
                                    <Text
                                      numberOfLines={1}
                                      style={[styles.historySignName, { color: theme.text }]}
                                    >
                                      {signName}
                                    </Text>

                                    <View
                                      style={[
                                        styles.historyVoteBadge,
                                        {
                                          backgroundColor: isApproved
                                            ? 'rgba(16, 185, 129, 0.12)'
                                            : 'rgba(239, 68, 68, 0.12)',
                                        },
                                      ]}
                                    >
                                      <MaterialCommunityIcons
                                        color={isApproved ? '#10B981' : '#EF4444'}
                                        name={isApproved ? 'check-circle' : 'close-circle'}
                                        size={13}
                                      />
                                      <Text
                                        style={[
                                          styles.historyVoteText,
                                          { color: isApproved ? '#10B981' : '#EF4444' },
                                        ]}
                                      >
                                        {isApproved ? 'Đồng ý' : 'Từ chối'}
                                      </Text>
                                    </View>
                                  </View>

                                  {signCode ? (
                                    <Text style={[styles.historySignCode, { color: theme.grey }]}>
                                      Mã hiệu: {signCode}
                                    </Text>
                                  ) : null}

                                  {item.declineReason ? (
                                    <Text numberOfLines={1} style={styles.historyDeclineReason}>
                                      Lý do: {item.declineReason}
                                    </Text>
                                  ) : null}

                                  <View style={styles.historyFooter}>
                                    <MaterialCommunityIcons
                                      color={theme.grey}
                                      name="clock-outline"
                                      size={12}
                                    />
                                    <Text style={[styles.historyDateText, { color: theme.grey }]}>
                                      {formatReviewDate(item.reviewedAt || (item as any).createdAt)}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    }}
                  </DateFilterSortList>
                )}

                {/* Pagination */}
                {totalPages > 1 ? (
                  <View
                    accessibilityLabel="Phân trang lịch sử"
                    style={[
                      styles.pagination,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    ]}
                  >
                    <AppButton
                      accessibilityLabel="Trang trước"
                      disabled={historyPage <= 1 || isHistoryFetching}
                      label="Trước"
                      onPress={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      style={historyPage <= 1 ? styles.paginationBtnDisabled : undefined}
                      variant="surface"
                    />
                    <View style={styles.paginationCenter}>
                      <Text style={[styles.pageIndicator, { color: theme.text }]}>
                        Trang {historyPage} / {totalPages}
                      </Text>
                      {isHistoryFetching ? (
                        <ActivityIndicator
                          color={theme.primary}
                          size="small"
                          style={{ marginLeft: 6 }}
                        />
                      ) : null}
                    </View>
                    <AppButton
                      accessibilityLabel="Trang sau"
                      disabled={historyPage >= totalPages || isHistoryFetching}
                      label="Sau"
                      onPress={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                      style={historyPage >= totalPages ? styles.paginationBtnDisabled : undefined}
                      variant="surface"
                    />
                  </View>
                ) : null}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
