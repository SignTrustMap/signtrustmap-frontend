import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppButton } from '@/components/button';
import { DateFilterSortList } from '@/components/date-filter-sort-list';
import { VirtualList } from '@/components/virtual-list';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useBackButton } from '@/hooks/use-back-button';
import { useTheme } from '@/hooks/use-theme';
import { useWorkRoute } from '@/hooks/use-work-route';
import { useGetMyRawReviewHistory } from '@/feature/review/hooks/use-review';
import { useReviewWorkflow } from '@/feature/review/context/review-workflow-provider';
import {
  ReviewHistoryItemCard,
  isVoteEditable,
  type ReviewHistoryRecord,
} from '@/feature/review/components/review-history-item-card';

export function ReviewerHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const reviewerWorkRoute = useWorkRoute('/work', { currentRole: 'reviewer' });
  useBackButton(reviewerWorkRoute);
  const { data: historyData, isLoading, refetch } = useGetMyRawReviewHistory(true);
  const { loadSubmissionForEdit } = useReviewWorkflow();

  const rawRecords: ReviewHistoryRecord[] = useMemo(() => {
    const items = historyData?.items;
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      candidate: item.candidate,
      candidateId: item.candidateId || item.candidate?.id,
      declineNote: item.declineNote,
      declineReason: item.declineReason,
      reviewedAt: item.reviewedAt,
      vote: item.vote,
    }));
  }, [historyData]);

  const editableTodayCount = useMemo(() => {
    return rawRecords.filter((rec) => isVoteEditable(rec)).length;
  }, [rawRecords]);

  const handleEditRecord = (record: ReviewHistoryRecord) => {
    if (loadSubmissionForEdit) {
      loadSubmissionForEdit(record);
    }
    router.push('/work/submission-review');
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <AppButton
          accessibilityHint="Quay lại màn hình làm việc"
          accessibilityLabel="Quay lại"
          hitSlop={Spacing.one}
          onPress={() => router.replace(reviewerWorkRoute)}
          style={styles.backButton}
          testID="btn-back-reviewer-history"
          variant="ghost"
        >
          <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
        </AppButton>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Lịch sử thẩm định</Text>
        <AppButton
          accessibilityHint="Làm mới danh sách lịch sử thẩm định"
          accessibilityLabel="Làm mới"
          hitSlop={Spacing.one}
          onPress={() => void refetch()}
          style={styles.refreshButton}
          testID="btn-refresh-reviewer-history"
          variant="ghost"
        >
          <MaterialCommunityIcons color={theme.text} name="reload" size={20} />
        </AppButton>
      </View>

      {/* Info Notice Banner */}
      <View
        style={[
          styles.noticeBanner,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}
      >
        <MaterialCommunityIcons color={theme.primary} name="information-outline" size={18} />
        <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
          Chỉ cho phép sửa vote đối với biển báo{' '}
          <Text style={{ fontWeight: '700', color: theme.text }}>chưa công bố</Text> và trong thời
          hạn <Text style={{ fontWeight: '700', color: theme.text }}>24 giờ</Text>.
        </Text>
      </View>

      {/* Date Filter & Virtual List */}
      <View style={{ paddingHorizontal: Spacing.two, flex: 1 }}>
        <DateFilterSortList<ReviewHistoryRecord>
          getDate={(record) => record.reviewedAt}
          headerTitle="Lọc theo ngày vote"
          items={rawRecords}
        >
          {({ filteredCount, items: filteredRecords }) => (
            <View style={styles.listContainer}>
              <VirtualList<ReviewHistoryRecord>
                contentContainerStyle={styles.listContent}
                data={filteredRecords}
                emptyDescription="Không tìm thấy bản ghi thẩm định nào trong khoảng thời gian đã chọn."
                emptyTitle="Chưa có dữ liệu"
                estimatedItemSize={120}
                isLoading={isLoading}
                keyExtractor={(item) => item.candidateId}
                renderItem={({ item }) => (
                  <ReviewHistoryItemCard onEdit={handleEditRecord} record={item} />
                )}
              />
            </View>
          )}
        </DateFilterSortList>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: '700',
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginHorizontal: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
    padding: Spacing.two,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  listContainer: {
    flex: 1,
  },
  listSubheader: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  countText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
});
