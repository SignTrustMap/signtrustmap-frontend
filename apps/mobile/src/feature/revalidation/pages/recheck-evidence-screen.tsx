import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveS3Url } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/button';
import { Colors, Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  type CompletedRevalidationReview,
  type RevalidationReviewAction,
  useRevalidationWorkflow,
} from '../context/revalidation-workflow-provider';

const revalActionDetails: Record<
  RevalidationReviewAction,
  { color: string; label: string; summary: string; symbol: string }
> = {
  STILL_ACTIVE: {
    color: '#16A34A',
    label: 'Vẫn hoạt động',
    summary: 'Xác nhận biển báo vẫn tồn tại trên thực địa.',
    symbol: '✓',
  },
  REMOVED: {
    color: Colors.danger,
    label: 'Đã gỡ bỏ',
    summary: 'Xác nhận biển báo đã không còn trên thực địa.',
    symbol: '×',
  },
  CHANGED: {
    color: '#F97316',
    label: 'Đã thay đổi',
    summary: 'Loại biển báo hoặc thông tin đã thay đổi.',
    symbol: '⇄',
  },
  UNCLEAR: {
    color: '#2563EB',
    label: 'Không rõ ràng',
    summary: 'Không thể nhận diện biển báo / hình ảnh mờ.',
    symbol: '?',
  },
};

function RevalMetric({
  action,
  count,
}: {
  action: RevalidationReviewAction;
  count: number;
}) {
  const theme = useTheme();
  const details = revalActionDetails[action];

  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={[styles.metricSymbol, { borderColor: details.color }]}>
        <Text style={[styles.metricSymbolLabel, { color: details.color }]}>
          {details.symbol}
        </Text>
      </View>
      <Text style={[styles.metricCount, { color: theme.text }]}>{count}</Text>
      <Text style={[styles.metricLabel, { color: details.color }]}>
        {details.label.toUpperCase()}
      </Text>
    </View>
  );
}

function ReviewedEvidenceRow({
  onPress,
  record,
}: {
  onPress?: () => void;
  record: CompletedRevalidationReview;
}) {
  const theme = useTheme();
  const details = revalActionDetails[record.action];
  const item = record.item;
  const imageSource = resolveS3Url(item.evidence.mediaUrl || item.verifiedSign.signCropUrl);
  const signTitle = item.verifiedSign.signCode
    ? `${item.verifiedSign.signCode} - ${item.verifiedSign.nameVi ?? item.verifiedSign.nameEn ?? 'Biển báo'}`
    : item.verifiedSign.nameVi ?? item.verifiedSign.nameEn ?? 'Biển báo thực địa';
  const locationLabel = `${item.evidence.latitude.toFixed(4)}, ${item.evidence.longitude.toFixed(4)}`;

  return (
    <Pressable
      accessibilityHint="Chạm để đánh giá lại minh chứng này"
      accessibilityLabel={`Biển báo ${signTitle}, quyết định ${details.label}. Chạm để sửa lại lựa chọn.`}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.signRow,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {imageSource ? (
        <Image
          accessibilityLabel={signTitle}
          contentFit="cover"
          source={{ uri: imageSource }}
          style={styles.signImage}
        />
      ) : (
        <View
          style={[styles.signImage, { backgroundColor: theme.backgroundSelected, alignItems: 'center', justifyContent: 'center' }]}
        >
          <MaterialCommunityIcons color={theme.textSecondary} name="image-off-outline" size={24} />
        </View>
      )}

      <View style={styles.signCopy}>
        <Text numberOfLines={1} style={[styles.signName, { color: theme.text }]}>
          {signTitle}
        </Text>
        <Text numberOfLines={1} style={[styles.signLocation, { color: theme.textSecondary }]}>
          {locationLabel}
        </Text>
        <Text numberOfLines={1} style={[styles.signSummary, { color: theme.placeholder }]}>
          {record.note ? `Ghi chú: ${record.note}` : details.summary}
        </Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: `${details.color}18` }]}>
        <Text style={[styles.statusLabel, { color: details.color }]}>
          {details.label}
        </Text>
      </View>
    </Pressable>
  );
}

export function RecheckEvidenceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    beginEvidenceCheck,
    counts,
    finishReviews,
    reviewHistory,
  } = useRevalidationWorkflow();

  const handleBackToReview = () => {
    router.replace('/work/revalidation-review');
  };

  const handleConfirmFinish = () => {
    const reviewedCount = finishReviews();
    router.replace({
      pathname: '/work/submission-complete',
      params: {
        type: 'review_revalidation',
        count: String(reviewedCount),
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Bar with back arrow */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Quay lại đánh giá minh chứng"
              hitSlop={Spacing.one}
              onPress={handleBackToReview}
              style={styles.backButton}
              testID="recheck-evidence-back-button"
            >
              <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
            </Pressable>
          </View>

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.text }]}>
              Tổng kết tái thẩm định
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Hôm nay • Đã đánh giá {reviewHistory.length} minh chứng thực địa
            </Text>
          </View>

          {/* Metric Cards */}
          <View style={styles.metrics}>
            <RevalMetric action="STILL_ACTIVE" count={counts.STILL_ACTIVE} />
            <RevalMetric action="REMOVED" count={counts.REMOVED} />
            <RevalMetric action="CHANGED" count={counts.CHANGED} />
            <RevalMetric action="UNCLEAR" count={counts.UNCLEAR} />
          </View>

          {/* List of Voted Evidence Items */}
          {reviewHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name="clipboard-check-outline"
                size={48}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Chưa có minh chứng nào được đánh giá trong phiên này.
              </Text>
              <AppButton
                label="Bắt đầu đánh giá"
                onPress={() => router.replace('/work/revalidation-review')}
                style={styles.emptyButton}
                variant="surface"
              />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.reviewListContent}
              showsVerticalScrollIndicator={false}
              style={styles.reviewList}
            >
              {reviewHistory.map((record, index) => (
                <ReviewedEvidenceRow
                  key={`${record.item.evidenceId}-${index}`}
                  onPress={() => {
                    beginEvidenceCheck(index);
                    router.replace('/work/revalidation-review');
                  }}
                  record={record}
                />
              ))}
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View style={styles.footerActions}>
            <AppButton
              disabled={reviewHistory.length === 0}
              label="Kiểm tra lại minh chứng"
              onPress={() => {
                beginEvidenceCheck();
                router.replace('/work/revalidation-review');
              }}
              style={[
                styles.checkButton,
                { borderColor: reviewHistory.length > 0 ? theme.primary : theme.border },
              ]}
              textStyle={{
                color: reviewHistory.length > 0 ? theme.primary : theme.placeholder,
              }}
              variant="surface"
            />
            <AppButton
              disabled={reviewHistory.length === 0}
              label="Hoàn tất"
              onPress={handleConfirmFinish}
              style={styles.submitButton}
              variant="primary"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flex: 1,
    alignSelf: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -Spacing.one,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.md,
  },
  heading: { gap: 2 },
  title: {
    fontFamily: Fonts.body,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 31,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  metric: {
    flex: 1,
    minHeight: 88,
    borderRadius: Rounded.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: 2,
    gap: 3,
  },
  metricSymbol: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricSymbolLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
  },
  metricCount: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  metricLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  reviewList: {
    flex: 1,
  },
  reviewListContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  signRow: {
    minHeight: 76,
    borderRadius: Rounded.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    gap: Spacing.two,
  },
  signImage: {
    width: 56,
    height: 56,
    borderRadius: Rounded.sm,
  },
  signCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  signName: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  signLocation: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  signSummary: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  statusBadge: {
    borderRadius: Rounded.round,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  statusLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '800',
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  checkButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: Rounded.md,
  },
  submitButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: Rounded.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 160,
    marginTop: Spacing.two,
  },
});
