import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  type CompletedReview,
  type ReviewActionType,
  useReviewWorkflow,
} from '@/feature/review/context/review-workflow-provider';
import { useTheme } from '@/hooks/use-theme';
import { useInvalidateWalletAndStats } from '@/feature/credits/hooks/use-wallet';

const actionDetails: Record<
  ReviewActionType,
  { color: string; label: string; summary: string; symbol: string }
> = {
  approved: {
    color: Colors.primary,
    label: 'Phê duyệt',
    summary: 'Sẵn sàng đưa vào bản đồ biển báo tin cậy.',
    symbol: '✓',
  },
  declined: {
    color: Colors.danger,
    label: 'Từ chối',
    summary: 'Từ chối trong quá trình kiểm tra chất lượng.',
    symbol: '×',
  },
  reported: {
    color: Colors.placeholder,
    label: 'Báo cáo',
    summary: 'Đã báo cáo cho ban quản trị hệ thống.',
    symbol: '!',
  },
  skipped: {
    color: Colors.grey,
    label: 'Bỏ qua',
    summary: 'Không thể nhận diện biển báo.',
    symbol: '↷',
  },
  reported_new_sign: {
    color: Colors.warning,
    label: 'New Sign Type',
    summary: 'Reported new sign type for catalog review.',
    symbol: '★',
  },
};

function SummaryMetric({ action, count }: { action: ReviewActionType; count: number }) {
  const theme = useTheme();
  const details = actionDetails[action];

  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={[styles.metricSymbol, { borderColor: details.color }]}>
        <Text style={[styles.metricSymbolLabel, { color: details.color }]}>{details.symbol}</Text>
      </View>
      <Text style={[styles.metricCount, { color: theme.text }]}>{count}</Text>
      <Text style={[styles.metricLabel, { color: details.color }]}>
        {details.label.toUpperCase()}
      </Text>
    </View>
  );
}

function ReviewedSignRow({
  onPress,
  review,
}: {
  onPress?: () => void;
  review: CompletedReview;
}) {
  const theme = useTheme();
  const details = actionDetails[review.action];

  return (
    <Pressable
      accessibilityHint="Chạm để thẩm định lại biển báo này"
      accessibilityLabel={`Biển báo ${review.submission.title}, trạng thái ${details.label}. Chạm để sửa lại lựa chọn.`}
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
      <Image
        accessibilityLabel={review.submission.title}
        contentFit="cover"
        source={review.submission.image}
        style={styles.signImage}
      />
      <View style={styles.signCopy}>
        <Text numberOfLines={1} style={[styles.signName, { color: theme.text }]}>
          {review.submission.title}
        </Text>
        <Text numberOfLines={2} style={[styles.signLocation, { color: theme.textSecondary }]}>
          {review.submission.location}
        </Text>
        <Text numberOfLines={1} style={[styles.signSummary, { color: theme.placeholder }]}>
          {details.summary}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: `${details.color}18` }]}>
        <Text style={[styles.statusLabel, { color: details.color }]}>{details.label}</Text>
      </View>
    </Pressable>
  );
}

export function SubmissionSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ resumeIndex?: string }>();
  const resumeIndex = params?.resumeIndex;
  const { beginSubmissionCheck, resetReviewWorkflow, reviewHistory } = useReviewWorkflow();
  const invalidateWalletAndStats = useInvalidateWalletAndStats();
  const counts = reviewHistory.reduce<Record<ReviewActionType, number>>(
    (result, review) => ({ ...result, [review.action]: (result[review.action] || 0) + 1 }),
    { approved: 0, declined: 0, reported: 0, skipped: 0, reported_new_sign: 0 },
  );

  const handleBackToReview = () => {
    if (resumeIndex !== undefined && resumeIndex !== '') {
      router.replace({
        pathname: '/work/submission-review',
        params: { resumeIndex: String(resumeIndex) },
      });
    } else {
      router.replace('/work/submission-review');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Quay lại thẩm định"
              hitSlop={Spacing.one}
              onPress={handleBackToReview}
              style={styles.backButton}
              testID="summary-back-button"
            >
              <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
            </Pressable>
          </View>

          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.text }]}>Tổng kết thẩm định</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Hôm nay • Đã thẩm định {reviewHistory.length} biển báo
            </Text>
          </View>

          <View style={styles.metrics}>
            <SummaryMetric action="approved" count={counts.approved} />
            <SummaryMetric action="declined" count={counts.declined} />
            <SummaryMetric action="reported" count={counts.reported + counts.reported_new_sign} />
            <SummaryMetric action="skipped" count={counts.skipped} />
          </View>

          <ScrollView
            contentContainerStyle={styles.reviewListContent}
            showsVerticalScrollIndicator={false}
            style={styles.reviewList}
          >
            {reviewHistory.map((review, index) => (
              <ReviewedSignRow
                key={review.submission.id}
                onPress={() => {
                  beginSubmissionCheck(index);
                  router.replace('/work/submission-review');
                }}
                review={review}
              />
            ))}
          </ScrollView>

          <View style={styles.footerActions}>
            <AppButton
              disabled={reviewHistory.length === 0}
              label="Kiểm tra lại hồ sơ"
              onPress={() => {
                beginSubmissionCheck();
                router.replace('/work/submission-review');
              }}
              style={[
                styles.checkButton,
                { borderColor: reviewHistory.length > 0 ? theme.primary : theme.border },
              ]}
              textStyle={{ color: reviewHistory.length > 0 ? theme.primary : theme.placeholder }}
              variant="surface"
            />
            <AppButton
              label="Hoàn tất"
              onPress={() => {
                const reviewedCount = reviewHistory.length;
                resetReviewWorkflow();
                // Invalidate wallet balance + reviewer credit score so the
                // home screen and nav bar show fresh data after submission.
                invalidateWalletAndStats();
                router.replace({
                  pathname: '/work/submission-finish',
                  params: { count: String(reviewedCount) },
                });
              }}
              style={styles.submitButton}
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
    maxWidth: 600,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: 2 },
  title: { fontFamily: Fonts.body, fontSize: 24, fontWeight: 900, lineHeight: 31 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, fontWeight: 500, lineHeight: 18 },
  metrics: { flexDirection: 'row', gap: Spacing.one },
  metric: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.half,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
  },
  metricSymbol: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  metricSymbolLabel: { fontFamily: Fonts.body, fontSize: 13, fontWeight: 900, lineHeight: 15 },
  metricCount: { fontFamily: Fonts.body, fontSize: 23, fontWeight: 900, lineHeight: 28 },
  metricLabel: { fontFamily: Fonts.body, fontSize: 8, fontWeight: 900, letterSpacing: 0.5 },
  reviewList: { flex: 1 },
  reviewListContent: { gap: Spacing.one },
  signRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.one,
  },
  signImage: { width: 66, height: 66, flexShrink: 0, borderRadius: Rounded.md },
  signCopy: { minWidth: 0, flex: 1, gap: 2 },
  signName: { fontFamily: Fonts.body, fontSize: 15, fontWeight: 800, lineHeight: 20 },
  signLocation: { fontFamily: Fonts.body, fontSize: 11, fontWeight: 500, lineHeight: 15 },
  signSummary: { fontFamily: Fonts.body, fontSize: 10, fontWeight: 500, lineHeight: 14 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusLabel: { fontFamily: Fonts.body, fontSize: 9, fontWeight: 800 },
  footerActions: { gap: Spacing.one, marginTop: 'auto' },
  checkButton: { minHeight: 48, borderWidth: 1 },
  submitButton: { minHeight: 50 },
});
