import AntDesign from '@expo/vector-icons/AntDesign';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveCdnUrl } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/ui/button';
import { Colors, Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useGetSurveySubmissionStatus, useGetMySubmissions } from '@/feature/upload/hooks/use-survey-submission';
import { useTheme } from '@/hooks/use-theme';
import type {
  SubmissionStatus,
  SubmissionType,
  SurveySubmission,
} from '@/types/survey-submission/surveySubmissionType';

const fallbackImage = require('@/assets/images/smaple_signs/stop_sign.webp');

const submissionTypeLabels: Record<SubmissionType, string> = {
  SINGLE_IMAGE: 'Single Image Survey',
  VIDEO_GPX: 'Video & GPX Survey',
  LIVE_TRIP: 'Live Trip Recording',
};

const statusLabels: Record<SubmissionStatus, string> = {
  DRAFT: 'Draft',
  QUEUED: 'Queued for processing',
  SYNCHRONIZING: 'Synchronizing video & GPX',
  DETECTING: 'Detecting signs with AI',
  TRACKING: 'Tracking signs along route',
  ESTIMATING: 'Estimating GPS coordinates',
  CLASSIFYING: 'Classifying sign types',
  COMPLETED: 'Completed',
  PARTIALLY_PROCESSED: 'Partially processed',
  FAILED: 'Processing failed',
  PENDING_CORRECTION: 'Needs correction',
  NO_SIGN_DETECTED: 'No signs detected',
  REJECTED: 'Rejected',
};

function getStatusColor(status: SubmissionStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'COMPLETED':
      return { bg: 'rgba(22, 163, 74, 0.12)', text: '#16A34A', border: 'rgba(22, 163, 74, 0.3)' };
    case 'QUEUED':
    case 'SYNCHRONIZING':
    case 'DETECTING':
    case 'TRACKING':
    case 'ESTIMATING':
    case 'CLASSIFYING':
      return { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563EB', border: 'rgba(37, 99, 235, 0.3)' };
    case 'PARTIALLY_PROCESSED':
    case 'PENDING_CORRECTION':
      return { bg: 'rgba(217, 119, 6, 0.12)', text: '#D97706', border: 'rgba(217, 119, 6, 0.3)' };
    case 'FAILED':
    case 'REJECTED':
      return { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
    case 'DRAFT':
    case 'NO_SIGN_DETECTED':
    default:
      return { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748B', border: 'rgba(100, 116, 139, 0.3)' };
  }
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type SurveySubmissionDetailsScreenProps = {
  submissionId?: string;
};

export function SurveySubmissionDetailsScreen({ submissionId }: SurveySubmissionDetailsScreenProps) {
  const router = useRouter();
  const theme = useTheme();

  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // 1. Fetch detailed submission status including attached mediaFiles & candidates
  const {
    data: statusData,
    isLoading: isStatusLoading,
    isRefetching,
    refetch,
  } = useGetSurveySubmissionStatus(submissionId, Boolean(submissionId));

  // 2. Also check list query as fallback for basic metadata
  const { data: listData } = useGetMySubmissions({ page: '1', pageSize: '50' }, !statusData);

  const submission: SurveySubmission | undefined = useMemo(() => {
    if (statusData?.submission) return statusData.submission;
    if (listData?.items && submissionId) {
      return listData.items.find((item) => item.id === submissionId);
    }
    return undefined;
  }, [statusData, listData, submissionId]);

  const mediaFiles = statusData?.mediaFiles || [];

  // Determine media items
  const imageFiles = mediaFiles.filter((m) => m.media_type === 'IMAGE');
  const videoFiles = mediaFiles.filter((m) => m.media_type === 'VIDEO');
  const gpxFiles = mediaFiles.filter((m) => m.media_type === 'GPX');

  const primaryVideo = videoFiles[0];
  const primaryImage = imageFiles[0];

  const primaryVideoUrl = primaryVideo?.file_url ? resolveCdnUrl(primaryVideo.file_url) : undefined;
  const primaryImageUrl = primaryImage?.file_url ? resolveCdnUrl(primaryImage.file_url) : undefined;

  const isVideoSubmission = submission?.submissionType === 'VIDEO_GPX' || Boolean(primaryVideo);

  const statusColor = getStatusColor(submission?.status || 'QUEUED');

  const handleCopyId = async () => {
    if (!submission?.id) return;
    await Clipboard.setStringAsync(submission.id);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleOpenVideo = async (url?: string) => {
    if (!url) return;
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          toolbarColor: '#0F172A',
        });
      }
    } catch {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Top App Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={Spacing.one}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AntDesign color={theme.text} name="arrow-left" size={22} />
          </Pressable>

          <View style={styles.headerTextGroup}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>
              Submission Details
            </Text>
            {submission ? (
              <Text numberOfLines={1} style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                #{submission.id.slice(0, 10)}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel="Refresh submission data"
            accessibilityRole="button"
            hitSlop={Spacing.one}
            onPress={() => { void refetch(); }}
            style={styles.refreshButton}
          >
            {isRefetching ? (
              <ActivityIndicator color={theme.primary} size="small" />
            ) : (
              <AntDesign color={theme.text} name="reload" size={18} />
            )}
          </Pressable>
        </View>

        {isStatusLoading && !submission ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading submission details…
            </Text>
          </View>
        ) : !submission ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons color={theme.placeholder} name="file-question-outline" size={48} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Submission Not Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              The requested survey submission could not be located or has expired.
            </Text>
            <AppButton
              label="Go to Survey History"
              onPress={() => router.replace('/work/survey-history')}
              style={styles.emptyAction}
              variant="primary"
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Status Hero Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: statusColor.border,
                },
              ]}
            >
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusColor.bg, borderColor: statusColor.border },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: statusColor.text }]} />
                  <Text style={[styles.statusPillText, { color: statusColor.text }]}>
                    {statusLabels[submission.status] ?? submission.status}
                  </Text>
                </View>

                <Text style={[styles.submissionDate, { color: theme.placeholder }]}>
                  {formatDate(submission.createdAt)}
                </Text>
              </View>

              {submission.failureReason ? (
                <View style={[styles.failureAlert, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                  <MaterialCommunityIcons color="#EF4444" name="alert-circle-outline" size={18} />
                  <Text style={styles.failureText}>{submission.failureReason}</Text>
                </View>
              ) : null}

              {/* Progress Steps Overview */}
              <View style={styles.pipelineContainer}>
                <View style={styles.pipelineStep}>
                  <View style={[styles.pipelineDot, styles.pipelineDotActive]}>
                    <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
                  </View>
                  <Text style={[styles.pipelineLabel, { color: theme.text }]}>Uploaded</Text>
                </View>

                <View
                  style={[
                    styles.pipelineLine,
                    submission.status !== 'QUEUED' && submission.status !== 'DRAFT'
                      ? styles.pipelineLineActive
                      : { backgroundColor: theme.border },
                  ]}
                />

                <View style={styles.pipelineStep}>
                  <View
                    style={[
                      styles.pipelineDot,
                      submission.status === 'COMPLETED' ||
                      submission.totalCandidatesExtracted > 0 ||
                      ['DETECTING', 'TRACKING', 'CLASSIFYING', 'ESTIMATING'].includes(submission.status)
                        ? styles.pipelineDotActive
                        : { backgroundColor: theme.border },
                    ]}
                  >
                    {submission.status === 'COMPLETED' || submission.totalCandidatesExtracted > 0 ? (
                      <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
                    ) : (
                      <View style={styles.pipelineDotInner} />
                    )}
                  </View>
                  <Text style={[styles.pipelineLabel, { color: theme.text }]}>AI Detection</Text>
                </View>

                <View
                  style={[
                    styles.pipelineLine,
                    submission.status === 'COMPLETED'
                      ? styles.pipelineLineActive
                      : { backgroundColor: theme.border },
                  ]}
                />

                <View style={styles.pipelineStep}>
                  <View
                    style={[
                      styles.pipelineDot,
                      submission.status === 'COMPLETED'
                        ? styles.pipelineDotActive
                        : { backgroundColor: theme.border },
                    ]}
                  >
                    {submission.status === 'COMPLETED' ? (
                      <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
                    ) : null}
                  </View>
                  <Text style={[styles.pipelineLabel, { color: theme.text }]}>Completed</Text>
                </View>
              </View>
            </View>

            {/* Media Section: Review the image or video again */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Survey Recording Media</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {isVideoSubmission ? 'Video recording & telemetry data' : 'High-resolution survey photo'}
              </Text>
            </View>

            {/* If Single Image: Display image with full-screen zoom */}
            {!isVideoSubmission ? (
              <View
                style={[
                  styles.mediaCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="Enlarge survey image"
                  accessibilityRole="button"
                  onPress={() => setIsImageZoomed(true)}
                  style={styles.imagePressable}
                >
                  <Image
                    accessibilityLabel="Survey photo submission"
                    contentFit="cover"
                    source={primaryImageUrl ? { uri: primaryImageUrl } : fallbackImage}
                    style={styles.mediaImage}
                    transition={150}
                  />
                  <View style={styles.zoomButton}>
                    <MaterialCommunityIcons color="#FFFFFF" name="magnify-plus-outline" size={18} />
                    <Text style={styles.zoomButtonText}>Tap to enlarge</Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              /* If Video: Display video playback card */
              <View
                style={[
                  styles.videoCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.videoThumbnailArea}>
                  <MaterialCommunityIcons color="#FFFFFF" name="video" size={48} />
                  <Text style={styles.videoPromptText}>Survey Video Recording</Text>
                  {primaryVideo?.file_url ? (
                    <Text numberOfLines={1} style={styles.videoFilename}>
                      {primaryVideo.file_url.split('/').pop()}
                    </Text>
                  ) : null}

                  <Pressable
                    accessibilityLabel="Play survey video"
                    accessibilityRole="button"
                    onPress={() => handleOpenVideo(primaryVideoUrl)}
                    style={styles.playButton}
                  >
                    <MaterialCommunityIcons color="#FFFFFF" name="play" size={26} />
                    <Text style={styles.playButtonText}>Play Video</Text>
                  </Pressable>
                </View>

                {gpxFiles.length > 0 ? (
                  <View style={[styles.gpxRow, { borderTopColor: theme.border }]}>
                    <MaterialCommunityIcons color={theme.primary} name="crosshairs-gps" size={18} />
                    <Text style={[styles.gpxText, { color: theme.text }]}>
                      Attached GPX Route Log: {gpxFiles[0].file_url.split('/').pop() || 'Track log'}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Extra Media Carousel Tabs if multiple files exist */}
            {mediaFiles.length > 1 ? (
              <View style={styles.mediaListGroup}>
                <Text style={[styles.groupLabel, { color: theme.placeholder }]}>Attached Media Files</Text>
                {mediaFiles.map((file, idx) => {
                  const isVideo = file.media_type === 'VIDEO';
                  const isImage = file.media_type === 'IMAGE';
                  const url = resolveCdnUrl(file.file_url);

                  return (
                    <Pressable
                      key={file.id || idx}
                      onPress={() => {
                        if (isVideo) {
                          void handleOpenVideo(url);
                        } else if (isImage) {
                          setIsImageZoomed(true);
                        }
                      }}
                      style={[
                        styles.mediaFileItem,
                        {
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        color={isVideo ? '#EF4444' : isImage ? theme.primary : '#10B981'}
                        name={isVideo ? 'video-outline' : isImage ? 'image-outline' : 'map-marker-path'}
                        size={22}
                      />
                      <View style={styles.mediaFileText}>
                        <Text numberOfLines={1} style={[styles.mediaFileName, { color: theme.text }]}>
                          {file.file_url.split('/').pop() || `${file.media_type} file`}
                        </Text>
                        <Text style={[styles.mediaFileType, { color: theme.placeholder }]}>
                          {file.media_type} · Tap to {isVideo ? 'watch' : isImage ? 'preview' : 'view'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={20} />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* Extraction & Detection Summary */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons color={theme.primary} name="chart-box-outline" size={20} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Detection Results</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {submission.totalCandidatesExtracted}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Signs Extracted
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {submission.coordinateSource || 'GPS'}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Telemetry Source
                  </Text>
                </View>
              </View>
            </View>

            {/* Submission Metadata Details */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons color={theme.primary} name="information-outline" size={20} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Submission Metadata</Text>
              </View>

              <View style={styles.metaList}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Submission ID</Text>
                  <Pressable hitSlop={Spacing.half} onPress={handleCopyId} style={styles.copyRow}>
                    <Text selectable style={[styles.metaValueMono, { color: theme.text }]}>
                      {submission.id}
                    </Text>
                    <MaterialCommunityIcons
                      color={copiedToast ? '#16A34A' : theme.placeholder}
                      name={copiedToast ? 'check' : 'content-copy'}
                      size={15}
                    />
                  </Pressable>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Type</Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>
                    {submissionTypeLabels[submission.submissionType] ?? submission.submissionType}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Surveyor ID</Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>{submission.surveyorId}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Captured At</Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>
                    {formatDate(submission.capturedAt ?? submission.createdAt)}
                  </Text>
                </View>

                {submission.latitude != null && submission.longitude != null ? (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Coordinates</Text>
                    <Text style={[styles.metaValueMono, { color: theme.text }]}>
                      {submission.latitude.toFixed(6)}, {submission.longitude.toFixed(6)}
                    </Text>
                  </View>
                ) : null}

                {submission.note ? (
                  <View style={styles.metaColumn}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Surveyor Note</Text>
                    <Text style={[styles.noteText, { color: theme.text, backgroundColor: theme.background }]}>
                      {submission.note}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Full-Screen Image Zoom Modal */}
        <Modal
          animationType="fade"
          onRequestClose={() => setIsImageZoomed(false)}
          transparent
          visible={isImageZoomed}
        >
          <View style={styles.zoomBackdrop}>
            <SafeAreaView style={styles.zoomSafeArea}>
              <Pressable
                accessibilityLabel="Close enlarged view"
                accessibilityRole="button"
                onPress={() => setIsImageZoomed(false)}
                style={styles.zoomCloseBtn}
              >
                <MaterialCommunityIcons color="#FFFFFF" name="close" size={24} />
              </Pressable>

              <Image
                contentFit="contain"
                source={primaryImageUrl ? { uri: primaryImageUrl } : fallbackImage}
                style={styles.zoomedImage}
              />
            </SafeAreaView>
          </View>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTextGroup: {
    flex: 1,
    paddingHorizontal: Spacing.one,
  },
  headerTitle: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginTop: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.one,
    maxWidth: 280,
  },
  emptyAction: {
    marginTop: Spacing.four,
    minWidth: 180,
  },
  scrollContent: {
    padding: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.two,
  },
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  submissionDate: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  failureAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: Rounded.md,
  },
  failureText: {
    flex: 1,
    color: '#EF4444',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  pipelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  pipelineStep: {
    alignItems: 'center',
    gap: 4,
  },
  pipelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineDotActive: {
    backgroundColor: '#16A34A',
  },
  pipelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pipelineLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  pipelineLineActive: {
    backgroundColor: '#16A34A',
  },
  pipelineLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: Spacing.two,
    marginBottom: Spacing.half,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  mediaCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePressable: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  zoomButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zoomButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  videoCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  videoThumbnailArea: {
    height: 240,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    gap: 8,
  },
  videoPromptText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  videoFilename: {
    color: '#94A3B8',
    fontFamily: Fonts.mono,
    fontSize: 11,
    maxWidth: '85%',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 8,
    shadowColor: '#FF4767',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  gpxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
    borderTopWidth: 1,
  },
  gpxText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  mediaListGroup: {
    gap: 8,
    marginTop: Spacing.one,
  },
  groupLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediaFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  mediaFileText: {
    flex: 1,
  },
  mediaFileName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  mediaFileType: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.one,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: Fonts.body,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  metaList: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  metaColumn: {
    gap: 6,
  },
  metaLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  metaValueMono: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
    borderRadius: Rounded.sm,
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  zoomSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomedImage: {
    width: '100%',
    height: '85%',
  },
});
