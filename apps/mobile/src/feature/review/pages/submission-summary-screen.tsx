import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  type CompletedReview,
  type ReviewActionType,
  useReviewWorkflow,
} from '@/feature/review/context/review-workflow-provider';
import { useTheme } from '@/hooks/use-theme';

const actionDetails: Record<
  ReviewActionType,
  { color: string; label: string; summary: string; symbol: string }
> = {
  approved: {
    color: Colors.primary,
    label: 'Approved',
    summary: 'Ready for the trusted sign map.',
    symbol: '✓',
  },
  declined: {
    color: Colors.danger,
    label: 'Declined',
    summary: 'Declined during quality review.',
    symbol: '×',
  },
  reported: {
    color: Colors.placeholder,
    label: 'Reported',
    summary: 'Reported to system staff.',
    symbol: '!',
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

function ReviewedSignRow({ review }: { review: CompletedReview }) {
  const theme = useTheme();
  const details = actionDetails[review.action];

  return (
    <View
      style={[
        styles.signRow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
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
    </View>
  );
}

export function SubmissionSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { beginSubmissionCheck, resetReviewWorkflow, reviewHistory } = useReviewWorkflow();
  const counts = reviewHistory.reduce<Record<ReviewActionType, number>>(
    (result, review) => ({ ...result, [review.action]: result[review.action] + 1 }),
    { approved: 0, declined: 0, reported: 0 },
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.text }]}>Submission Summary</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Today • {reviewHistory.length} signs reviewed
            </Text>
          </View>

          <View style={styles.metrics}>
            <SummaryMetric action="approved" count={counts.approved} />
            <SummaryMetric action="declined" count={counts.declined} />
            <SummaryMetric action="reported" count={counts.reported} />
          </View>

          <ScrollView
            contentContainerStyle={styles.reviewListContent}
            showsVerticalScrollIndicator={false}
            style={styles.reviewList}
          >
            {reviewHistory.map((review) => (
              <ReviewedSignRow key={review.submission.id} review={review} />
            ))}
          </ScrollView>

          <View style={styles.footerActions}>
            <AppButton
              label="Check submission"
              onPress={() => {
                beginSubmissionCheck();
                router.replace('/work/submission-review');
              }}
              style={[styles.checkButton, { borderColor: theme.primary }]}
              textStyle={{ color: theme.primary }}
              variant="surface"
            />
            <AppButton
              label="Submit"
              onPress={() => {
                const reviewedCount = reviewHistory.length;
                resetReviewWorkflow();
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
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
