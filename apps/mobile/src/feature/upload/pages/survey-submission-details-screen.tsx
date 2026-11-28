import AntDesign from '@expo/vector-icons/AntDesign';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
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

import { resolveS3Url } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/button';
import { AppToast } from '@/components/toast';
import {
  SURVEY_RESUBMITTED_SUCCESS_MESSAGE,
  UNABLE_TO_RESUBMIT_MESSAGE,
} from '@/constants/message';
import { Spacing } from '@/constants/theme';
import {
  useGetSurveySubmissionStatus,
  useGetMySubmissions,
  useSubmitSurveySubmission,
} from '@/feature/upload/hooks/use-survey-submission';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/context/session-provider';
import { useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';
import { readDraftImage } from '@/feature/upload/hooks/use-save-survey-draft';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import { estimateEndPoint } from '@/feature/upload/utils/video-gps';
import type { MapCoordinate } from '@/types/navigationType';
import type {
  SubmissionStatus,
  SubmissionType,
  SurveySubmission,
  SurveyMediaType,
} from '@/types/surveySubmissionType';
import { styles } from '@/feature/upload/styles/survey-submission-details-screen.styles';

const submissionTypeLabels: Record<SubmissionType, string> = {
  SINGLE_IMAGE: 'Hình ảnh',
  VIDEO_GPX: 'Video & GPX',
};

const statusLabels: Record<SubmissionStatus, string> = {
  DRAFT: 'Bản nháp',
  QUEUED: 'Đang chờ xử lý',
  SYNCHRONIZING: 'Đang đồng bộ hóa video & GPX',
  DETECTING: 'Đang nhận diện biển báo bằng AI',
  TRACKING: 'Đang theo dõi biển báo trên tuyến',
  ESTIMATING: 'Đang ước tính tọa độ GPS',
  CLASSIFYING: 'Đang phân loại biển báo',
  COMPLETED: 'Đã hoàn tất',
  PARTIALLY_PROCESSED: 'Xử lý một phần',
  FAILED: 'Xử lý thất bại',
  PENDING_CORRECTION: 'Cần chỉnh sửa',
  NO_SIGN_DETECTED: 'Không phát hiện biển báo',
  REJECTED: 'Bị từ chối',
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
      return {
        bg: 'rgba(100, 116, 139, 0.12)',
        text: '#64748B',
        border: 'rgba(100, 116, 139, 0.3)',
      };
  }
}

function formatDate(value?: string | null): string {
  if (!value) return 'Không có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
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

export function SurveySubmissionDetailsScreen({
  submissionId,
}: SurveySubmissionDetailsScreenProps) {
  const router = useRouter();
  const theme = useTheme();

  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | undefined>();
  const [copiedTarget, setCopiedTarget] = useState<'submission' | 'surveyor' | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isRetryModalVisible, setIsRetryModalVisible] = useState(false);
  const [isSubmittingRetry, setIsSubmittingRetry] = useState(false);
  const [retryError, setRetryError] = useState<string>();
  const [successToast, setSuccessToast] = useState<string>();

  const { mutateAsync: submitSubmission } = useSubmitSurveySubmission();

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

  const locationQuery = useReverseGeocode(
    submission?.latitude != null && submission?.longitude != null
      ? { latitude: submission.latitude, longitude: submission.longitude }
      : null,
  );

  const { session } = useSession();
  const [localDraftUri, setLocalDraftUri] = useState<string>();

  useEffect(() => {
    if (!submissionId || !session?.account?.id) return;
    let active = true;
    void readDraftImage(session.account.id, submissionId).then((draft) => {
      if (active && draft?.uri) {
        setLocalDraftUri(draft.uri);
      }
    });
    return () => {
      active = false;
    };
  }, [submissionId, session?.account?.id]);

  // Determine media items with robust normalization for both camelCase and snake_case backend responses
  const normalizedMediaFiles = useMemo(() => {
    const list: {
      id?: string;
      mediaType: SurveyMediaType;
      fileUrl: string;
      fileName: string;
      fileSizeBytes?: string | number | null;
    }[] = [];

    // 1. From statusData.mediaFiles
    if (Array.isArray(statusData?.mediaFiles)) {
      for (const m of statusData.mediaFiles as any[]) {
        const rawType = (m.mediaType || m.media_type || '').toUpperCase();
        const rawUrl = m.fileUrl || m.file_url || m.storageKey || m.url || '';
        if (rawType && rawUrl) {
          list.push({
            id: m.id,
            mediaType: rawType as SurveyMediaType,
            fileUrl: rawUrl,
            fileName:
              m.originalFilename ||
              m.original_filename ||
              rawUrl.split('/').pop()?.split('?')[0] ||
              `Tệp ${rawType}`,
            fileSizeBytes: m.fileSizeBytes ?? m.file_size_bytes,
          });
        }
      }
    }

    // 2. Fallback to statusData.sessions if mediaFiles is missing any entries
    if (Array.isArray(statusData?.sessions)) {
      for (const s of statusData.sessions as any[]) {
        const rawType = (s.mediaType || s.media_type || '').toUpperCase();
        const rawUrl = s.storageKey || s.storage_key || s.fileUrl || s.file_url || s.url || '';
        if (rawType && rawUrl && !list.some((existing) => existing.mediaType === rawType)) {
          list.push({
            id: s.id,
            mediaType: rawType as SurveyMediaType,
            fileUrl: rawUrl,
            fileName:
              s.originalFilename ||
              s.original_filename ||
              rawUrl.split('/').pop()?.split('?')[0] ||
              `Tệp ${rawType}`,
            fileSizeBytes: s.totalSizeBytes ?? s.total_size_bytes,
          });
        }
      }
    }

    return list;
  }, [statusData]);

  const imageFiles = normalizedMediaFiles.filter((m) => m.mediaType === 'IMAGE');
  const videoFiles = normalizedMediaFiles.filter((m) => m.mediaType === 'VIDEO');
  const gpxFiles = normalizedMediaFiles.filter((m) => m.mediaType === 'GPX');

  const primaryVideo = videoFiles[0];
  const primaryImage = imageFiles[0];

  const primaryVideoUrl = primaryVideo?.fileUrl
    ? resolveS3Url(primaryVideo.fileUrl)
    : submission?.submissionType === 'VIDEO_GPX' && localDraftUri
      ? localDraftUri
      : undefined;

  const primaryImageUrl = primaryImage?.fileUrl
    ? resolveS3Url(primaryImage.fileUrl)
    : submission?.submissionType !== 'VIDEO_GPX' && localDraftUri
      ? localDraftUri
      : undefined;

  const isVideoSubmission = submission?.submissionType === 'VIDEO_GPX' || Boolean(primaryVideo);

  // If video submission has detected candidate frames, use bestFrameUrl as video thumbnail preview
  const candidateFrameUrl = useMemo(() => {
    if (!Array.isArray(statusData?.candidates) || statusData.candidates.length === 0)
      return undefined;
    for (const c of statusData.candidates as any[]) {
      const frame = c.bestFrameUrl || c.best_frame_url || c.signCropUrl || c.sign_crop_url;
      if (frame) return resolveS3Url(frame);
    }
    return undefined;
  }, [statusData?.candidates]);

  const hasCoordinates =
    submission?.latitude != null &&
    submission?.longitude != null &&
    Number.isFinite(submission.latitude) &&
    Number.isFinite(submission.longitude);

  const startCoord: MapCoordinate | undefined = hasCoordinates
    ? [submission!.longitude!, submission!.latitude!]
    : undefined;

  const endCoord: MapCoordinate | undefined =
    startCoord && isVideoSubmission ? estimateEndPoint(startCoord, 60) : undefined;

  const statusColor = getStatusColor(submission?.status || 'QUEUED');

  const isFailed = submission?.status === 'FAILED';
  const canRetry = isFailed || submission?.status === 'PENDING_CORRECTION';

  const handleDirectResubmit = async () => {
    if (!submission?.id || isSubmittingRetry) return;
    setIsSubmittingRetry(true);
    setRetryError(undefined);

    try {
      await submitSubmission({ submissionId: submission.id });
      setIsRetryModalVisible(false);
      setSuccessToast(SURVEY_RESUBMITTED_SUCCESS_MESSAGE);
      setTimeout(() => setSuccessToast(undefined), 4000);
      void refetch();
    } catch (err) {
      console.warn('[Surveyor] Direct resubmit error:', err);
      const msg = err instanceof Error ? err.message : UNABLE_TO_RESUBMIT_MESSAGE;
      setRetryError(msg);
    } finally {
      setIsSubmittingRetry(false);
    }
  };

  const handleEditAndResubmit = () => {
    if (!submission?.id) return;
    setIsRetryModalVisible(false);
    setRetryError(undefined);
    router.push({
      pathname: '/work/new-survey/details',
      params: {
        submissionId: submission.id,
        ...(submission.latitude != null ? { startLat: String(submission.latitude) } : {}),
        ...(submission.longitude != null ? { startLon: String(submission.longitude) } : {}),
      },
    });
  };

  const handleCopyText = async (text?: string, target?: 'submission' | 'surveyor') => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    if (target) {
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 2000);
    }
    setCopiedToast(true);
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
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
            hitSlop={Spacing.one}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AntDesign color={theme.text} name="arrow-left" size={22} />
          </Pressable>

          <View style={styles.headerTextGroup}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>
              Chi tiết hồ sơ khảo sát
            </Text>
            {submission ? (
              <Text numberOfLines={1} style={[styles.headerSubtitle, { color: theme.placeholder }]}>
                #{submission.id.slice(0, 10)}
              </Text>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            {canRetry ? (
              <Pressable
                accessibilityLabel="Thử lại gửi hồ sơ"
                accessibilityRole="button"
                hitSlop={Spacing.one}
                onPress={() => {
                  setRetryError(undefined);
                  setIsRetryModalVisible(true);
                }}
                disabled={isSubmittingRetry}
                style={[
                  styles.retryHeaderButton,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                  },
                ]}
              >
                {isSubmittingRetry ? (
                  <ActivityIndicator color="#EF4444" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons color="#EF4444" name="replay" size={16} />
                    <Text style={[styles.retryHeaderButtonText, { color: '#EF4444' }]}>
                      Thử lại
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null}

            <Pressable
              accessibilityLabel="Làm mới dữ liệu hồ sơ"
              accessibilityRole="button"
              hitSlop={Spacing.one}
              onPress={() => {
                void refetch();
              }}
              style={styles.refreshButton}
            >
              {isRefetching ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <AntDesign color={theme.text} name="reload" size={18} />
              )}
            </Pressable>
          </View>
        </View>

        {isStatusLoading && !submission ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Đang tải chi tiết hồ sơ…
            </Text>
          </View>
        ) : !submission ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              color={theme.placeholder}
              name="file-question-outline"
              size={48}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Không tìm thấy hồ sơ</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Không tìm thấy hồ sơ khảo sát yêu cầu hoặc đã hết hạn.
            </Text>
            <AppButton
              label="Đi tới Lịch sử khảo sát"
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

              {submission.failureReason || isFailed ? (
                <View
                  style={[
                    styles.failureAlert,
                    {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderColor: 'rgba(239, 68, 68, 0.25)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.failureAlertHeader}>
                    <MaterialCommunityIcons color="#EF4444" name="alert-circle-outline" size={20} />
                    <View style={styles.failureAlertTextWrap}>
                      <Text style={styles.failureAlertTitle}>Xử lý hồ sơ thất bại</Text>
                      <Text style={styles.failureText}>
                        {submission.failureReason ||
                          'Đã xảy ra lỗi trong quá trình xử lý AI. Bạn có thể gửi lại khảo sát này.'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.failureAlertActions}>
                    <Pressable
                      accessibilityLabel="Gửi lại khảo sát"
                      accessibilityRole="button"
                      onPress={() => {
                        setRetryError(undefined);
                        setIsRetryModalVisible(true);
                      }}
                      style={[styles.failureActionRetryBtn, { backgroundColor: '#EF4444' }]}
                    >
                      <MaterialCommunityIcons color="#FFFFFF" name="replay" size={15} />
                      <Text style={styles.failureActionRetryBtnText}>Gửi lại khảo sát</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {/* Progress Steps Overview */}
              <View style={styles.pipelineContainer}>
                <View style={styles.pipelineStep}>
                  <View style={[styles.pipelineDot, styles.pipelineDotActive]}>
                    <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
                  </View>
                  <Text style={[styles.pipelineLabel, { color: theme.text }]}>Đã tải lên</Text>
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
                      ['DETECTING', 'TRACKING', 'CLASSIFYING', 'ESTIMATING'].includes(
                        submission.status,
                      )
                        ? styles.pipelineDotActive
                        : { backgroundColor: theme.border },
                    ]}
                  >
                    {submission.status === 'COMPLETED' ||
                    submission.totalCandidatesExtracted > 0 ? (
                      <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
                    ) : (
                      <View style={styles.pipelineDotInner} />
                    )}
                  </View>
                  <Text style={[styles.pipelineLabel, { color: theme.text }]}>AI nhận diện</Text>
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
                  <Text style={[styles.pipelineLabel, { color: theme.text }]}>Hoàn tất</Text>
                </View>
              </View>
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
                  accessibilityLabel="Phóng to ảnh khảo sát"
                  accessibilityRole="button"
                  disabled={!primaryImageUrl}
                  onPress={() => setZoomedImageUrl(primaryImageUrl)}
                  style={styles.imagePressable}
                >
                  <View style={styles.imagePlaceholder}>
                    <ActivityIndicator color={theme.primary} size="small" />
                  </View>
                  {primaryImageUrl ? (
                    <Image
                      accessibilityLabel="Ảnh khảo sát gửi lên"
                      contentFit="cover"
                      source={{ uri: primaryImageUrl }}
                      style={styles.mediaImage}
                      transition={150}
                    />
                  ) : (
                    <View style={styles.emptyMediaBox}>
                      <MaterialCommunityIcons
                        color={theme.placeholder}
                        name="image-outline"
                        size={40}
                      />
                      <Text style={[styles.emptyMediaText, { color: theme.placeholder }]}>
                        {isStatusLoading ? 'Đang tải thông tin ảnh...' : 'Không có ảnh khảo sát'}
                      </Text>
                    </View>
                  )}
                  {primaryImageUrl ? (
                    <View style={styles.zoomButton}>
                      <MaterialCommunityIcons
                        color="#FFFFFF"
                        name="magnify-plus-outline"
                        size={18}
                      />
                      <Text style={styles.zoomButtonText}>Nhấn để phóng to</Text>
                    </View>
                  ) : null}
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
                  {candidateFrameUrl ? (
                    <Image
                      accessibilityLabel="Khung hình trích xuất từ video"
                      contentFit="cover"
                      source={{ uri: candidateFrameUrl }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      candidateFrameUrl ? { backgroundColor: 'rgba(15, 23, 42, 0.55)' } : undefined,
                    ]}
                  />
                  <MaterialCommunityIcons color="#FFFFFF" name="video" size={48} />
                  <Text style={styles.videoPromptText}>Bản ghi video khảo sát</Text>
                  {primaryVideo?.fileName ? (
                    <Text numberOfLines={1} style={styles.videoFilename}>
                      {primaryVideo.fileName}
                    </Text>
                  ) : null}

                  <Pressable
                    accessibilityLabel="Phát video khảo sát"
                    accessibilityRole="button"
                    disabled={!primaryVideoUrl}
                    onPress={() => handleOpenVideo(primaryVideoUrl)}
                    style={[styles.playButton, !primaryVideoUrl && { opacity: 0.6 }]}
                  >
                    <MaterialCommunityIcons color="#FFFFFF" name="play" size={26} />
                    <Text style={styles.playButtonText}>
                      {primaryVideoUrl ? 'Phát video' : 'Video đang chuẩn bị'}
                    </Text>
                  </Pressable>
                </View>

                {gpxFiles.length > 0 ? (
                  <View style={[styles.gpxRow, { borderTopColor: theme.border }]}>
                    <MaterialCommunityIcons color={theme.primary} name="crosshairs-gps" size={18} />
                    <Text style={[styles.gpxText, { color: theme.text }]}>
                      Nhật ký lộ trình GPX: {gpxFiles[0].fileName || 'Nhật ký tuyến'}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Extra Media Carousel Tabs if multiple files exist */}
            {normalizedMediaFiles.length > 1 ? (
              <View style={styles.mediaListGroup}>
                <Text style={[styles.groupLabel, { color: theme.placeholder }]}>
                  Các tệp phương tiện đính kèm
                </Text>
                {normalizedMediaFiles.map((file, idx) => {
                  const isVideo = file.mediaType === 'VIDEO';
                  const isImage = file.mediaType === 'IMAGE';
                  const url = resolveS3Url(file.fileUrl);

                  return (
                    <Pressable
                      key={file.id || idx}
                      onPress={() => {
                        if (isVideo) {
                          void handleOpenVideo(url);
                        } else if (isImage) {
                          setZoomedImageUrl(url);
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
                        name={
                          isVideo ? 'video-outline' : isImage ? 'image-outline' : 'map-marker-path'
                        }
                        size={22}
                      />
                      <View style={styles.mediaFileText}>
                        <Text
                          numberOfLines={1}
                          style={[styles.mediaFileName, { color: theme.text }]}
                        >
                          {file.fileName || `Tệp ${file.mediaType}`}
                        </Text>
                        <Text style={[styles.mediaFileType, { color: theme.placeholder }]}>
                          {file.mediaType} · Nhấn để xem
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        color={theme.placeholder}
                        name="chevron-right"
                        size={20}
                      />
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
                <Text style={[styles.cardTitle, { color: theme.text }]}>Kết quả nhận diện</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {submission.totalCandidatesExtracted}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Biển báo trích xuất
                  </Text>
                </View>

                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {submissionTypeLabels[submission.submissionType] ?? submission.submissionType}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Nguồn dữ liệu GPS
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
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Thông tin hồ sơ khảo sát
                </Text>
              </View>

              <View style={styles.metaList}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Mã hồ sơ</Text>
                  <View style={styles.metaValueContainer}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      selectable
                      style={[styles.metaValueMono, { color: theme.text }]}
                    >
                      {submission.id}
                    </Text>
                    <Pressable
                      accessibilityLabel="Sao chép mã hồ sơ"
                      hitSlop={Spacing.half}
                      onPress={() => handleCopyText(submission.id, 'submission')}
                      style={styles.copyButton}
                    >
                      <MaterialCommunityIcons
                        color={copiedTarget === 'submission' ? '#16A34A' : theme.placeholder}
                        name={copiedTarget === 'submission' ? 'check' : 'content-copy'}
                        size={16}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Loại</Text>
                  <View style={styles.metaValueContainer}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[styles.metaValue, { color: theme.text }]}
                    >
                      {submissionTypeLabels[submission.submissionType] ?? submission.submissionType}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                    Thời gian ghi nhận
                  </Text>
                  <View style={styles.metaValueContainer}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[styles.metaValue, { color: theme.text }]}
                    >
                      {formatDate(submission.capturedAt ?? submission.createdAt)}
                    </Text>
                  </View>
                </View>

                {submission.latitude != null && submission.longitude != null ? (
                  <>
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                        Địa chỉ
                      </Text>
                      <View style={styles.metaValueContainer}>
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={[styles.metaValue, { color: theme.text }]}
                        >
                          {locationQuery.isLoading
                            ? 'Đang tra cứu địa chỉ…'
                            : locationQuery.data?.displayAddress || 'Không có địa chỉ'}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}

                {submission.note ? (
                  <View style={styles.metaColumn}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                      Ghi chú khảo sát viên
                    </Text>
                    <Text
                      style={[
                        styles.noteText,
                        { color: theme.text, backgroundColor: theme.background },
                      ]}
                    >
                      {submission.note}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Route Map Preview */}
            {startCoord ? (
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
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Vị trí</Text>
                </View>
                <View
                  style={[
                    styles.submissionMapPlaceholder,
                    {
                      backgroundColor: theme.neutral,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={StyleSheet.absoluteFill}>
                    <NavigationMapView
                      focusCoordinate={startCoord}
                      locationPin={!isVideoSubmission && startCoord ? startCoord : undefined}
                      showFocusPin={!isVideoSubmission}
                      routeStart={isVideoSubmission ? startCoord : undefined}
                      isCustomStart={isVideoSubmission}
                      destination={
                        isVideoSubmission && endCoord
                          ? {
                              coordinate: endCoord,
                              id: 'survey-end',
                              title: 'Điểm kết thúc',
                              subtitle: 'Lộ trình khảo sát',
                              category: 'recent',
                            }
                          : undefined
                      }
                      routeCoordinates={
                        isVideoSubmission && startCoord && endCoord
                          ? [startCoord, endCoord]
                          : undefined
                      }
                      showCurrentLocation={false}
                    />
                    {isVideoSubmission || startCoord ? (
                      <Pressable
                        accessibilityLabel="Mở toàn màn hình xem lộ trình"
                        onPress={() => {
                          const gpx = normalizedMediaFiles.find(
                            (m) => m.mediaType === 'GPX',
                          )?.fileUrl;
                          router.push({
                            pathname: '/work/new-survey/route-map',
                            params: {
                              gpxUri: gpx ? resolveS3Url(gpx) : undefined,
                              startLat: startCoord ? String(startCoord[1]) : undefined,
                              startLon: startCoord ? String(startCoord[0]) : undefined,
                              endLat: endCoord ? String(endCoord[1]) : undefined,
                              endLon: endCoord ? String(endCoord[0]) : undefined,
                              title: isVideoSubmission
                                ? 'Lộ trình khảo sát đã gửi'
                                : 'Vị trí khảo sát đã gửi',
                            },
                          });
                        }}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : null}
                  </View>
                  {isVideoSubmission || startCoord ? (
                    <Pressable
                      accessibilityLabel="Phóng to bản đồ xem trước"
                      accessibilityRole="button"
                      onPress={() => {
                        const gpx = normalizedMediaFiles.find(
                          (m) => m.mediaType === 'GPX',
                        )?.fileUrl;
                        router.push({
                          pathname: '/work/new-survey/route-map',
                          params: {
                            gpxUri: gpx ? resolveS3Url(gpx) : undefined,
                            startLat: startCoord ? String(startCoord[1]) : undefined,
                            startLon: startCoord ? String(startCoord[0]) : undefined,
                            endLat: endCoord ? String(endCoord[1]) : undefined,
                            endLon: endCoord ? String(endCoord[0]) : undefined,
                            title: isVideoSubmission
                              ? 'Lộ trình khảo sát đã gửi'
                              : 'Vị trí khảo sát đã gửi',
                          },
                        });
                      }}
                      style={({ pressed }) => [
                        styles.mapZoomButton,
                        {
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons color={theme.primary} name="fullscreen" size={20} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Extracted Signs / Candidates Card */}
            {statusData?.candidates && statusData.candidates.length > 0 ? (
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
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Biển báo giao thông phát hiện ({statusData.candidates.length})
                  </Text>
                </View>

                <View style={styles.candidateList}>
                  {statusData.candidates.map((cand: any, idx: number) => {
                    const rawCrop =
                      cand.signCropUrl ||
                      cand.sign_crop_url ||
                      cand.cropUrl ||
                      cand.crop_url ||
                      cand.bestFrameUrl ||
                      cand.best_frame_url ||
                      cand.imageUrl ||
                      cand.image_url;
                    const resolvedImg = rawCrop ? resolveS3Url(rawCrop) : undefined;

                    const signType =
                      cand.predictedSignType ||
                      cand.predicted_sign_type ||
                      cand.signType ||
                      cand.sign_type;
                    const signCode =
                      signType?.signCode ||
                      signType?.sign_code ||
                      cand.signCode ||
                      cand.sign_code ||
                      cand.code;
                    const signName =
                      signType?.nameVi ||
                      signType?.name_vi ||
                      cand.nameVi ||
                      cand.name_vi ||
                      signType?.nameEn ||
                      signType?.name_en ||
                      cand.signName ||
                      cand.name ||
                      cand.label ||
                      (signCode ? `Biển ${signCode}` : `Biển #${idx + 1}`);

                    const rawScore =
                      cand.confidence ??
                      cand.confidenceScore ??
                      cand.confidence_score ??
                      cand.score;
                    const confidence =
                      typeof rawScore === 'number'
                        ? Math.round(rawScore <= 1 ? rawScore * 100 : rawScore)
                        : null;

                    const timestampSec =
                      cand.timestampSec ??
                      cand.timestamp_sec ??
                      (typeof cand.timestamp_ms === 'number'
                        ? Math.round(cand.timestamp_ms / 1000)
                        : null) ??
                      cand.cropFrameSec;

                    const rawStatus = String(cand.status || cand.reviewStatus || '').toUpperCase();
                    const statusLabel =
                      rawStatus === 'APPROVED'
                        ? 'Đã duyệt'
                        : rawStatus === 'REJECTED'
                          ? 'Từ chối'
                          : rawStatus === 'PENDING'
                            ? 'Chờ duyệt'
                            : undefined;
                    const statusColor =
                      rawStatus === 'APPROVED'
                        ? '#16A34A'
                        : rawStatus === 'REJECTED'
                          ? '#EF4444'
                          : '#F59E0B';

                    return (
                      <Pressable
                        key={cand.id || idx}
                        accessibilityLabel={`Biển báo ${signName}`}
                        accessibilityRole="button"
                        disabled={!resolvedImg}
                        onPress={() => {
                          if (resolvedImg) setZoomedImageUrl(resolvedImg);
                        }}
                        style={[
                          styles.candidateCard,
                          {
                            backgroundColor: theme.neutral,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        {resolvedImg ? (
                          <View style={styles.candidateThumbnailWrap}>
                            <Image
                              contentFit="cover"
                              source={{ uri: resolvedImg }}
                              style={styles.candidateThumbnail}
                              transition={150}
                            />
                            <View style={styles.candidateZoomBadge}>
                              <MaterialCommunityIcons
                                color="#FFFFFF"
                                name="magnify-plus-outline"
                                size={11}
                              />
                            </View>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.candidateThumbnailPlaceholder,
                              {
                                backgroundColor: theme.backgroundElement,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              color={theme.primary}
                              name="sign-direction"
                              size={24}
                            />
                          </View>
                        )}
                        <View style={styles.candidateInfo}>
                          <View style={styles.candidateTitleRow}>
                            {signCode ? (
                              <View
                                style={[
                                  styles.signCodeBadge,
                                  {
                                    backgroundColor: `${theme.primary}18`,
                                    borderColor: `${theme.primary}40`,
                                  },
                                ]}
                              >
                                <Text style={[styles.signCodeText, { color: theme.primary }]}>
                                  {signCode}
                                </Text>
                              </View>
                            ) : null}
                            <Text
                              numberOfLines={2}
                              style={[styles.candidateTitle, { color: theme.text }]}
                            >
                              {signName}
                            </Text>
                          </View>

                          <View style={styles.candidateMetaRow}>
                            {confidence != null ? (
                              <View style={styles.confidenceBadge}>
                                <MaterialCommunityIcons
                                  color="#16A34A"
                                  name="check-circle"
                                  size={13}
                                />
                                <Text style={styles.confidenceText}>Độ tin cậy: {confidence}%</Text>
                              </View>
                            ) : null}

                            {statusLabel ? (
                              <View
                                style={[
                                  styles.candidateStatusBadge,
                                  { backgroundColor: `${statusColor}18` },
                                ]}
                              >
                                <Text style={[styles.candidateStatusText, { color: statusColor }]}>
                                  {statusLabel}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {timestampSec != null ? (
                            <Text style={[styles.candidateMeta, { color: theme.placeholder }]}>
                              Thời điểm: {Math.floor(timestampSec / 60)}:
                              {String(timestampSec % 60).padStart(2, '0')} ({timestampSec}s)
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}

        {/* Full-Screen Image Zoom Modal */}
        <Modal
          animationType="fade"
          onRequestClose={() => setZoomedImageUrl(undefined)}
          transparent
          visible={Boolean(zoomedImageUrl)}
        >
          <View style={styles.zoomBackdrop}>
            <SafeAreaView style={styles.zoomSafeArea}>
              <Pressable
                accessibilityLabel="Đóng xem phóng to"
                accessibilityRole="button"
                onPress={() => setZoomedImageUrl(undefined)}
                style={styles.zoomCloseBtn}
              >
                <MaterialCommunityIcons color="#FFFFFF" name="close" size={24} />
              </Pressable>

              {zoomedImageUrl ? (
                <Image
                  contentFit="contain"
                  source={{ uri: zoomedImageUrl }}
                  style={styles.zoomedImage}
                />
              ) : null}
            </SafeAreaView>
          </View>
        </Modal>
        {/* Floating Success Toast */}
        {successToast ? (
          <View pointerEvents="none" style={styles.floatingToastContainer}>
            <View style={[styles.successToast, { backgroundColor: '#16A34A' }]}>
              <MaterialCommunityIcons color="#FFFFFF" name="check-circle" size={18} />
              <Text style={styles.successToastText}>{successToast}</Text>
            </View>
          </View>
        ) : null}

        {/* Retry / Resubmit Confirmation Modal */}
        <Modal
          animationType="fade"
          onRequestClose={() => {
            if (!isSubmittingRetry) {
              setIsRetryModalVisible(false);
              setRetryError(undefined);
            }
          }}
          transparent
          visible={isRetryModalVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (!isSubmittingRetry) {
                  setIsRetryModalVisible(false);
                  setRetryError(undefined);
                }
              }}
            />
            <View
              style={[
                styles.retryModalCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.retryModalHeader}>
                <View
                  style={[styles.retryModalIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                >
                  <MaterialCommunityIcons color="#EF4444" name="replay" size={26} />
                </View>
                <View style={styles.retryModalHeaderText}>
                  <Text style={[styles.retryModalTitle, { color: theme.text }]}>
                    Gửi lại khảo sát
                  </Text>
                  <Text style={[styles.retryModalSubtitle, { color: theme.placeholder }]}>
                    #{submission?.id.slice(0, 10)} ·{' '}
                    {submission ? submissionTypeLabels[submission.submissionType] : ''}
                  </Text>
                </View>
              </View>

              {/* Modal Description */}
              <Text style={[styles.retryModalBodyText, { color: theme.textSecondary }]}>
                Chọn phương thức bạn muốn gửi lại khảo sát này. Bạn có thể gửi trực tiếp để xử lý
                lại qua hệ thống AI, hoặc chỉnh sửa thông tin và tọa độ GPS trước.
              </Text>

              {submission?.failureReason ? (
                <View
                  style={[
                    styles.retryModalFailureBox,
                    { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
                  ]}
                >
                  <Text style={styles.retryModalFailureLabel}>Lý do thất bại:</Text>
                  <Text style={styles.retryModalFailureText}>{submission.failureReason}</Text>
                </View>
              ) : null}

              {retryError ? (
                <View
                  style={[
                    styles.retryModalErrorBox,
                    { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                  ]}
                >
                  <MaterialCommunityIcons color="#EF4444" name="alert-circle" size={16} />
                  <Text style={styles.retryModalErrorText}>{retryError}</Text>
                </View>
              ) : null}

              {/* Modal Actions */}
              <View style={styles.retryModalActions}>
                <AppButton
                  disabled={isSubmittingRetry}
                  label={isSubmittingRetry ? 'Đang gửi lại…' : 'Gửi lại ngay'}
                  onPress={handleDirectResubmit}
                  style={styles.retryModalActionBtn}
                  variant="primary"
                />

                <AppButton
                  disabled={isSubmittingRetry}
                  label="Chỉnh sửa chi tiết & Gửi lại"
                  onPress={handleEditAndResubmit}
                  style={styles.retryModalActionBtn}
                  variant="surface"
                />

                <AppButton
                  disabled={isSubmittingRetry}
                  label="Hủy"
                  onPress={() => {
                    setIsRetryModalVisible(false);
                    setRetryError(undefined);
                  }}
                  variant="ghost"
                />
              </View>
            </View>
          </View>
        </Modal>

        {copiedToast ? (
          <AppToast
            duration={1500}
            message="Đã sao chép!"
            onDismiss={() => setCopiedToast(false)}
            placement="bottom"
            tone="success"
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}
