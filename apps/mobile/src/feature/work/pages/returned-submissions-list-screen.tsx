import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { DateFilterSortList } from '@/components/date-filter-sort-list';
import { VirtualList } from '@/components/virtual-list';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useGetMySubmissions } from '@/feature/upload/hooks/use-survey-submission';
import { useTheme } from '@/hooks/use-theme';
import type {
  SubmissionStatus,
  SubmissionType,
  SurveySubmission,
} from '@/types/surveySubmissionType';

const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  SINGLE_IMAGE: 'Khảo sát hình ảnh',
  VIDEO_GPX: 'Khảo sát Video & GPX',
};

const RETURNED_STATUS_LABELS: Partial<
  Record<SubmissionStatus, { label: string; color: string; bg: string }>
> = {
  PENDING_CORRECTION: {
    label: 'Cần chỉnh sửa',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
  },
  REJECTED: {
    label: 'Bị từ chối',
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.12)',
  },
  FAILED: {
    label: 'Thất bại',
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.12)',
  },
  NO_SIGN_DETECTED: {
    label: 'Không có biển báo',
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.12)',
  },
};

const RETURNED_STATUSES: SubmissionStatus[] = [
  'PENDING_CORRECTION',
  'REJECTED',
  'FAILED',
  'NO_SIGN_DETECTED',
];

export const MOCK_RETURNED_SUBMISSION: SurveySubmission = {
  id: 'mock-returned-sub-001',
  surveyorId: 'mock-surveyor',
  submissionType: 'SINGLE_IMAGE',
  status: 'PENDING_CORRECTION',
  failureReason:
    'AI không phát hiện được biển báo trong ảnh. Vui lòng khoanh vùng vị trí biển báo nếu bạn chắc chắn ảnh có biển báo hợp lệ.',
  note: 'Ảnh bị trả về do nghi ngờ không có biển báo',
  totalCandidatesExtracted: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export function ReturnedSubmissionsListScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { data, isLoading, refetch, isRefetching } = useGetMySubmissions({
    page: '1',
    pageSize: '50',
  });

  const allReturnedItems = useMemo(() => {
    const rawItems = data?.items ?? [];
    const backendReturned = rawItems.filter((item) => RETURNED_STATUSES.includes(item.status));

    // Ensure at least one mock item exists in the list
    const hasMock = backendReturned.some((i) => i.id === MOCK_RETURNED_SUBMISSION.id);
    if (!hasMock) {
      return [MOCK_RETURNED_SUBMISSION, ...backendReturned];
    }
    return backendReturned;
  }, [data?.items]);

  const handleOpenItem = useCallback(
    (submissionId: string) => {
      router.push({
        pathname: '/work/returned-submission-item',
        params: { id: submissionId },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: SurveySubmission }) => {
      const statusMeta = RETURNED_STATUS_LABELS[item.status] ?? {
        label: item.status,
        color: theme.grey,
        bg: 'rgba(107, 114, 128, 0.1)',
      };

      const isVideo = item.submissionType === 'VIDEO_GPX';

      return (
        <Pressable
          accessibilityHint="Chạm để xem chi tiết lý do và xử lý bản ghi khảo sát"
          accessibilityLabel={`Bản ghi ${SUBMISSION_TYPE_LABELS[item.submissionType] ?? 'Khảo sát'}, trạng thái ${statusMeta.label}`}
          accessibilityRole="button"
          onPress={() => handleOpenItem(item.id)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
            pressed && styles.cardPressed,
          ]}
          testID={`returned-submission-card-${item.id}`}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: statusMeta.bg }]}>
              <MaterialCommunityIcons
                color={statusMeta.color}
                name={isVideo ? 'video-off-outline' : 'camera-off-outline'}
                size={24}
              />
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.badgeRow}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {SUBMISSION_TYPE_LABELS[item.submissionType] ?? 'Khảo sát'}
                </Text>

                <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                    {statusMeta.label}
                  </Text>
                </View>
              </View>

              <Text style={[styles.dateText, { color: theme.grey }]}>
                {formatDate(item.createdAt || item.updatedAt)}
              </Text>
            </View>
          </View>

          {/* Reason or note */}
          {item.failureReason || item.note ? (
            <View
              style={[
                styles.reasonBox,
                { backgroundColor: `${statusMeta.color}0D`, borderColor: `${statusMeta.color}30` },
              ]}
            >
              <Text style={[styles.reasonLabel, { color: statusMeta.color }]}>Lý do:</Text>
              <Text numberOfLines={3} style={[styles.reasonText, { color: theme.text }]}>
                {item.failureReason || item.note}
              </Text>
            </View>
          ) : null}

          {/* Action button using AppButton */}
          <View style={styles.cardFooter}>
            <AppButton
              accessibilityLabel="Xem và khoanh vùng biển báo"
              onPress={() => handleOpenItem(item.id)}
              style={styles.cardActionBtn}
              variant="primary"
            >
              <Text style={styles.cardActionBtnText}>Xem & Khoanh vùng</Text>
              <MaterialCommunityIcons color="#FFFFFF" name="chevron-right" size={16} />
            </AppButton>
          </View>
        </Pressable>
      );
    },
    [theme, handleOpenItem],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Top Header */}
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: theme.backgroundElement,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <AppButton
            accessibilityLabel="Quay lại công việc"
            onPress={() => router.back()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>

          <View style={styles.topBarTitle}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Ảnh bị trả về</Text>
            <Text style={[styles.screenSubtitle, { color: theme.grey }]}>
              {allReturnedItems.length} hồ sơ cần cập nhật hoặc khoanh vùng lại
            </Text>
          </View>

          <AppButton
            accessibilityLabel="Làm mới danh sách"
            disabled={isRefetching}
            onPress={() => void refetch()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons
              color={theme.primary}
              name="reload"
              size={22}
              style={isRefetching ? styles.spinning : undefined}
            />
          </AppButton>
        </View>

        {/* Helpful Guideline Banner */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              borderLeftColor: theme.primary,
            },
          ]}
        >
          <MaterialCommunityIcons
            color={theme.primary}
            name="information-outline"
            size={20}
            style={styles.bannerIcon}
          />
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Ảnh bị trả về do AI không nhận diện được biển báo. Chọn ảnh để khoanh vùng xác nhận nếu
            ảnh có biển báo hợp lệ.
          </Text>
        </View>

        {/* Date Filter & Virtual List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.grey }]}>
              Đang tải danh sách ảnh bị trả về...
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <DateFilterSortList<SurveySubmission>
              controlsCardStyle={styles.filterCard}
              endDateLabel="Đến ngày"
              getDate={(item) => item.createdAt || item.updatedAt}
              headerTitle="Lọc theo ngày"
              items={allReturnedItems}
              showPresets
              showSortToggle
              startDateLabel="Từ ngày"
            >
              {({ items: dateFilteredItems }) => (
                <VirtualList<SurveySubmission>
                  contentContainerStyle={styles.listContent}
                  data={dateFilteredItems}
                  estimatedItemSize={170}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={
                    <View style={styles.centerContainer}>
                      <MaterialCommunityIcons
                        color="#10B981"
                        name="check-decagram-outline"
                        size={56}
                      />
                      <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        Không tìm thấy ảnh bị trả về
                      </Text>
                      <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                        Không có bản ghi nào phù hợp với bộ lọc ngày đã chọn.
                      </Text>
                    </View>
                  }
                  refreshControl={
                    <RefreshControl
                      colors={[theme.primary]}
                      onRefresh={() => void refetch()}
                      refreshing={isRefetching}
                      tintColor={theme.primary}
                    />
                  }
                  renderItem={renderItem}
                />
              )}
            </DateFilterSortList>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontFamily: Fonts.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  spinning: {
    transform: [{ rotate: '45deg' }],
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bannerIcon: {
    marginRight: Spacing.two,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  filterCard: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  reasonBox: {
    padding: Spacing.two,
    borderRadius: Rounded.sm,
    borderWidth: 1,
    gap: 2,
  },
  reasonLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  reasonText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: Spacing.one,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    minHeight: 36,
    borderRadius: Rounded.md,
  },
  cardActionBtnText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.title,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
