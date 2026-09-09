import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useGetMySubmissions } from '@/feature/upload/hooks/use-survey-submission';
import { useTheme } from '@/hooks/use-theme';
import type { SubmissionStatus, SubmissionType, SurveySubmission } from '@/types/survey-submission/surveySubmissionType';

const submissionLabels: Record<SubmissionType, string> = {
  SINGLE_IMAGE: 'Image survey', VIDEO_GPX: 'Video survey', LIVE_TRIP: 'Live trip',
};
const statusLabels: Record<SubmissionStatus, string> = {
  DRAFT: 'Draft', QUEUED: 'Queued', SYNCHRONIZING: 'Synchronizing', DETECTING: 'Detecting signs',
  TRACKING: 'Tracking signs', ESTIMATING: 'Estimating location', CLASSIFYING: 'Classifying signs',
  COMPLETED: 'Completed', PARTIALLY_PROCESSED: 'Partially processed', FAILED: 'Failed',
  PENDING_CORRECTION: 'Needs correction', NO_SIGN_DETECTED: 'No signs detected', REJECTED: 'Rejected',
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function SubmissionRow({ submission }: { submission: SurveySubmission }) {
  const theme = useTheme();
  const needsAttention = ['FAILED', 'REJECTED', 'PENDING_CORRECTION'].includes(submission.status);
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.rowHeader}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>
          {submissionLabels[submission.submissionType] ?? 'Survey'}
        </Text>
        <View style={[styles.status, { backgroundColor: theme.backgroundSelected }]}>
          <Text style={[styles.statusText, { color: needsAttention ? theme.text : theme.primary }]}>
            {statusLabels[submission.status] ?? submission.status}
          </Text>
        </View>
      </View>
      <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(submission.createdAt)}</Text>
      <View style={styles.rowFooter}>
        <Text selectable style={[styles.identifier, { color: theme.placeholder }]}>
          #{submission.id.slice(0, 8)}
        </Text>
        <Text style={[styles.detail, { color: theme.text }]}>
          {submission.totalCandidatesExtracted} sign candidates
        </Text>
      </View>
      {submission.failureReason ? (
        <Text style={[styles.detail, { color: theme.text }]}>{submission.failureReason}</Text>
      ) : null}
    </View>
  );
}

export function SurveyHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList<SurveySubmission>>(null);
  const { data, isLoading, isFetching, isRefetching, error, refetch } = useGetMySubmissions({
    page: String(page), pageSize: '20',
  });
  console.log('SurveyHistoryScreen', { data, isLoading, isFetching, isRefetching, error });

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppButton
            accessibilityLabel="Back to surveyor work"
            onPress={() => router.replace({ pathname: '/work', params: { currentRole: 'surveyor' } })}
            style={styles.iconButton}
            variant="ghost"
          >
            <AntDesign name="arrow-left" size={22} color={theme.text} />
          </AppButton>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Survey history</Text>
          <AppButton
            accessibilityLabel="Refresh survey history"
            disabled={isFetching}
            onPress={() => { void refetch(); }}
            style={styles.iconButton}
            variant="ghost"
          >
            <AntDesign name="reload" size={20} color={theme.primary} />
          </AppButton>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {data ? `${data.total} submissions · Newest first` : 'Your survey submissions'}
        </Text>
        {error && data ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: theme.text }]}>
            Could not refresh your history. Showing previously loaded records.
          </Text>
        ) : null}
        <FlatList
          ref={listRef}
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SubmissionRow submission={item} />}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={() => { void refetch(); }}
          ListEmptyComponent={
            <View style={styles.empty}>
              {isLoading ? (
                <ActivityIndicator accessibilityLabel="Loading survey history" color={theme.primary} />
              ) : error ? (
                <>
                  <Text accessibilityRole="alert" style={[styles.message, { color: theme.text }]}>
                    Unable to load your survey history.
                  </Text>
                  <AppButton label="Try again" onPress={() => { void refetch(); }} />
                </>
              ) : (
                <>
                  <AntDesign name="file-text" size={32} color={theme.primary} />
                  <Text style={[styles.rowTitle, { color: theme.text }]}>
                    {page === 1 ? 'No submissions yet' : 'No submissions on this page'}
                  </Text>
                  <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {page === 1 ? 'Your survey drafts and submission history will appear here.' : 'Go back to the previous page to see more records.'}
                  </Text>
                </>
              )}
            </View>
          }
        />
        {(page > 1 || (data?.totalPages ?? 0) > 1) ? (
          <View style={styles.pagination}>
            <AppButton label="Previous" disabled={page <= 1 || isFetching} onPress={() => changePage(page - 1)} variant="surface" />
            <Text style={[styles.detail, { color: theme.text }]}>
              {data ? `${page} / ${Math.max(page, data.totalPages)}` : `Page ${page}`}
            </Text>
            <AppButton label="Next" disabled={isFetching || !data || page >= data.totalPages} onPress={() => changePage(page + 1)} variant="surface" />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  iconButton: { width: 44, minHeight: 44, paddingHorizontal: 0, paddingVertical: 0 },
  title: { flex: 1, fontFamily: Fonts.body, fontSize: 22, fontWeight: '700' },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  listContent: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },
  row: { paddingVertical: Spacing.four, borderBottomWidth: 1, gap: Spacing.one },
  rowHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.one },
  rowTitle: { flexGrow: 1, fontFamily: Fonts.body, fontSize: 16, fontWeight: '700' },
  status: { paddingHorizontal: Spacing.one, paddingVertical: Spacing.half, borderRadius: Rounded.md },
  statusText: { fontFamily: Fonts.body, fontSize: 12, fontWeight: '700' },
  date: { fontFamily: Fonts.body, fontSize: 13 },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.one },
  identifier: { fontFamily: Fonts.mono, fontSize: 12 },
  detail: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  message: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center', padding: Spacing.one },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.four, gap: Spacing.one },
});
