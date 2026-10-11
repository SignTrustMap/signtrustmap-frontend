import AntDesign from '@expo/vector-icons/AntDesign';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useGetMySubmissions } from '@/feature/upload/hooks/use-survey-submission';
import { useTheme } from '@/hooks/use-theme';
import type { SubmissionStatus, SubmissionType, SurveySubmission } from '@/types/surveySubmissionType';

const submissionLabels: Record<SubmissionType, string> = {
  SINGLE_IMAGE: 'Khảo sát hình ảnh',
  VIDEO_GPX: 'Khảo sát Video',
  LIVE_TRIP: 'Chuyến đi trực tiếp',
};

const statusLabels: Record<SubmissionStatus, string> = {
  DRAFT: 'Bản nháp',
  QUEUED: 'Đang chờ xử lý',
  SYNCHRONIZING: 'Đang đồng bộ hóa',
  DETECTING: 'Đang nhận diện biển báo',
  TRACKING: 'Đang theo dõi biển báo',
  ESTIMATING: 'Đang ước tính tọa độ',
  CLASSIFYING: 'Đang phân loại biển báo',
  COMPLETED: 'Đã hoàn tất',
  PARTIALLY_PROCESSED: 'Xử lý một phần',
  FAILED: 'Thất bại',
  PENDING_CORRECTION: 'Cần chỉnh sửa',
  NO_SIGN_DETECTED: 'Không phát hiện biển báo',
  REJECTED: 'Bị từ chối',
};

const pendingStatuses: SubmissionStatus[] = [
  'QUEUED',
  'SYNCHRONIZING',
  'DETECTING',
  'TRACKING',
  'ESTIMATING',
  'CLASSIFYING',
  'PENDING_CORRECTION',
];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Không có ngày'
    : date.toLocaleString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
}

function SubmissionRow({
  onPress,
  submission,
}: {
  onPress: () => void;
  submission: SurveySubmission;
}) {
  const theme = useTheme();
  const needsAttention = ['FAILED', 'REJECTED', 'PENDING_CORRECTION'].includes(submission.status);
  const isVideo = submission.submissionType === 'VIDEO_GPX';

  return (
    <Pressable
      accessibilityLabel={`View submission details for ${submissionLabels[submission.submissionType] ?? 'Survey'}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.rowMain}>
        <View
          style={[
            styles.typeIconBox,
            { backgroundColor: isVideo ? 'rgba(239, 68, 68, 0.12)' : 'rgba(37, 99, 235, 0.12)' },
          ]}
        >
          <MaterialCommunityIcons
            color={isVideo ? '#EF4444' : '#2563EB'}
            name={isVideo ? 'video-outline' : 'camera-outline'}
            size={22}
          />
        </View>

        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.text }]}>
              {submissionLabels[submission.submissionType] ?? 'Survey'}
            </Text>
            <View
              style={[
                styles.status,
                {
                  backgroundColor: needsAttention
                    ? 'rgba(239, 68, 68, 0.12)'
                    : submission.status === 'COMPLETED'
                      ? 'rgba(22, 163, 74, 0.12)'
                      : theme.backgroundSelected,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: needsAttention
                      ? '#EF4444'
                      : submission.status === 'COMPLETED'
                        ? '#16A34A'
                        : theme.primary,
                  },
                ]}
              >
                {statusLabels[submission.status] ?? submission.status}
              </Text>
            </View>
          </View>

          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(submission.createdAt)}
          </Text>

          <View style={styles.rowFooter}>
            <Text selectable style={[styles.identifier, { color: theme.placeholder }]}>
              #{submission.id.slice(0, 8)}
            </Text>
            <Text style={[styles.detail, { color: theme.text }]}>
              {submission.totalCandidatesExtracted} biển báo ứng viên
            </Text>
          </View>

          {submission.failureReason ? (
            <Text numberOfLines={2} style={styles.failureText}>
              {submission.failureReason}
            </Text>
          ) : null}
        </View>

        <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={22} />
      </View>
    </Pressable>
  );
}

type FilterTab = 'all' | 'pending' | 'completed';

export function SurveyHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ filter?: string; status?: string }>();

  const initialTab: FilterTab =
    params.filter === 'pending' || params.status === 'pending'
      ? 'pending'
      : params.filter === 'completed' || params.status === 'completed'
        ? 'completed'
        : 'all';

  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);
  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<SurveySubmission>>(null);

  const { data, isLoading, isFetching, isRefetching, error, refetch } = useGetMySubmissions({
    page: String(page),
    pageSize: '50',
  });

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    if (activeTab === 'pending') {
      return items.filter((item) => pendingStatuses.includes(item.status));
    }
    if (activeTab === 'completed') {
      return items.filter((item) => item.status === 'COMPLETED');
    }
    return items;
  }, [data?.items, activeTab]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleOpenSubmission = (submissionId: string) => {
    router.push({
      pathname: '/work/survey-submission-details',
      params: { id: submissionId },
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <AppButton
            accessibilityLabel="Quay lại công việc khảo sát"
            onPress={() => router.replace({ pathname: '/work', params: { currentRole: 'surveyor' } })}
            style={styles.iconButton}
            variant="ghost"
          >
            <AntDesign color={theme.text} name="arrow-left" size={22} />
          </AppButton>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
            {activeTab === 'pending'
              ? 'Hồ sơ đang xử lý'
              : activeTab === 'completed'
                ? 'Lịch sử khảo sát'
                : 'Hồ sơ khảo sát'}
          </Text>
          <AppButton
            accessibilityLabel="Làm mới lịch sử khảo sát"
            disabled={isFetching}
            onPress={() => {
              void refetch();
            }}
            style={styles.iconButton}
            variant="ghost"
          >
            <AntDesign color={theme.primary} name="reload" size={20} />
          </AppButton>
        </View>

        {/* Filter Tabs */}
        <View
          accessibilityLabel="Bộ lọc hồ sơ"
          accessibilityRole="tablist"
          style={[styles.filterBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        >
          {(['all', 'pending', 'completed'] as FilterTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.filterTab,
                  isActive && [styles.filterTabActive, { backgroundColor: theme.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {tab === 'all' ? 'Tất cả' : tab === 'pending' ? 'Đang xử lý' : 'Đã hoàn tất'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {filteredItems.length} hồ sơ {activeTab === 'pending' ? 'đang xử lý' : activeTab === 'completed' ? 'đã hoàn tất' : ''} · Nhấn vào bản ghi để xem chi tiết
        </Text>

        {error && data ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: theme.text }]}>
            Không thể làm mới lịch sử. Đang hiển thị bản ghi đã tải trước đó.
          </Text>
        ) : null}

        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredItems}
          keyExtractor={(item) => item.id}
          onRefresh={() => {
            void refetch();
          }}
          ref={listRef}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <SubmissionRow
              onPress={() => handleOpenSubmission(item.id)}
              submission={item}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              {isLoading ? (
                <ActivityIndicator accessibilityLabel="Đang tải lịch sử khảo sát" color={theme.primary} size="large" />
              ) : error ? (
                <>
                  <Text accessibilityRole="alert" style={[styles.message, { color: theme.text }]}>
                    Không thể tải lịch sử khảo sát của bạn.
                  </Text>
                  <AppButton
                    label="Thử lại"
                    onPress={() => {
                      void refetch();
                    }}
                  />
                </>
              ) : (
                <>
                  <AntDesign color={theme.primary} name="file-text" size={36} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    {activeTab === 'pending'
                      ? 'Không có hồ sơ đang xử lý'
                      : activeTab === 'completed'
                        ? 'Chưa có hồ sơ đã hoàn tất'
                        : 'Không tìm thấy hồ sơ nào'}
                  </Text>
                  <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {activeTab === 'pending'
                      ? 'Tất cả bản ghi khảo sát gửi lên đã hoàn tất xử lý AI.'
                      : 'Các khảo sát đã ghi và kết quả nhận diện của bạn sẽ xuất hiện tại đây.'}
                  </Text>
                </>
              )}
            </View>
          }
        />

        {page > 1 || (data?.totalPages ?? 0) > 1 ? (
          <View style={styles.pagination}>
            <AppButton
              disabled={page <= 1 || isFetching}
              label="Trước"
              onPress={() => changePage(page - 1)}
              variant="surface"
            />
            <Text style={[styles.detail, { color: theme.text }]}>
              {data ? `${page} / ${Math.max(page, data.totalPages)}` : `Trang ${page}`}
            </Text>
            <AppButton
              disabled={isFetching || !data || page >= data.totalPages}
              label="Sau"
              onPress={() => changePage(page + 1)}
              variant="surface"
              style={(isFetching || !data || page >= data.totalPages) && {
                borderColor: 'transparent',
              }}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.one,
    padding: 4,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.sm,
  },
  filterTabActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    paddingTop: Spacing.one,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    padding: Spacing.three,
    borderRadius: Rounded.md,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  rowTitle: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '700',
  },
  status: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
    borderRadius: Rounded.md,
  },
  statusText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
  },
  date: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: 2,
  },
  identifier: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  detail: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  failureText: {
    color: '#EF4444',
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    marginTop: Spacing.four,
  },
  emptyTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    gap: Spacing.one,
  },
});
