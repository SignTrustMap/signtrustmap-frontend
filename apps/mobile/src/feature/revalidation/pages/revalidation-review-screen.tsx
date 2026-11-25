import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/button';
import { AppToast } from '@/components/toast';
import { CANNOT_RECORD_VOTE_MESSAGE } from '@/constants/message';
import { Colors, Spacing } from '@/constants/theme';
import { useBackButton } from '@/hooks/use-back-button';
import { useTheme } from '@/hooks/use-theme';
import { useWorkRoute } from '@/hooks/use-work-route';
import { formatDate } from '@/utils/format-date';
import type { RevalDecision, RevalidationQueueEvidenceItem } from '@/types/revalidationType';
import {
  useGetRevalidationEvidenceQueue,
  useRequestEvidenceRecapture,
  useVoteOnRevalidationEvidence,
} from '../hooks/use-revalidation';
import { useSession } from '@/context/session-provider';
import { extractCoordinateFromCandidate, resolveS3Url } from '@/api/reviews/review-workflow';
import { useInvalidateWalletAndStats } from '@/feature/credits/hooks/use-wallet';
import type { CatalogSign } from '@/api/reviews/catalog';
import { RevalidationSignPickerModal } from '../components/revalidation-sign-picker-modal';
import { checkAndRequireLocationPermission } from '@/services/location-permission';
import {
  RevalidationDecisionBadge,
  RevalidationSwipeBadges,
} from '../components/revalidation-decision-badge';
import {
  RevalidationVotedResultCard,
  RevalidationEditingBanner,
} from '../components/revalidation-voted-result-card';
import {
  type CompletedRevalidationReview,
  useRevalidationWorkflow,
} from '../context/revalidation-workflow-provider';
import { useResponsive } from '@/utils/responsive';
import { useReviewerSignNavigation } from '@/feature/review/hooks/use-reviewer-sign-navigation';
import { styles } from '@/feature/revalidation/styles/revalidation-review-screen.styles';
import {
  RevalReviewedSignRow,
  RevalSummaryMetric,
  RevalidationBottomSheet,
  RevalidationReviewSkeleton,
  revalActionDetails,
  type RevalidationReviewAction,
  type RevalidationSheetType,
} from '../components/revalidation-review-sheets';

export { revalActionDetails, type RevalidationReviewAction };

type SheetType = RevalidationSheetType;

export function RevalidationReviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reviewerWorkRoute = useWorkRoute('/work', { currentRole: 'reviewer' });
  useBackButton(reviewerWorkRoute);
  const { isSmallDevice, height: windowHeight } = useResponsive();

  const { isNavigatingToSign, navigateToSign } = useReviewerSignNavigation();
  const searchParams = useLocalSearchParams<{ targetSubmissionId?: string }>();
  const targetId = searchParams?.targetSubmissionId;

  const workflow = useRevalidationWorkflow();
  const {
    queueItems: items,
    reviewHistory: history,
    currentItem,
    nextItem,
    totalCount,
    reviewPosition,
    progressPercent,
    counts,
    handleVote: workflowVote,
    handleSkip: workflowSkip,
    finishReviews: workflowFinish,
    isLoading,
    isCheckingEvidence,
    isSubmittingVote = false,
    jumpToEvidenceById,
    keepCurrentEvidenceAndNext,
    recheckingPreviousReview,
    cancelEvidenceCheck,
  } = workflow;

  const displayedPreviousReview =
    (
      currentItem as RevalidationQueueEvidenceItem & {
        previousReview?: CompletedRevalidationReview;
      }
    )?.previousReview ?? recheckingPreviousReview;
  const isRecheckMode = Boolean(isCheckingEvidence && displayedPreviousReview);
  const [isEditingVote, setIsEditingVote] = useState(false);
  const handledTargetIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsEditingVote(false);
  }, [currentItem?.evidenceId, isCheckingEvidence]);

  useEffect(() => {
    if (targetId) {
      if (handledTargetIdRef.current !== targetId) {
        handledTargetIdRef.current = targetId;
        jumpToEvidenceById?.(targetId);
        router.setParams({ targetSubmissionId: undefined });
      }
    } else {
      handledTargetIdRef.current = null;
    }
  }, [targetId, jumpToEvidenceById, router]);

  useEffect(() => {
    checkAndRequireLocationPermission().catch(() => {});
  }, []);

  const handleKeepPreviousReview = useCallback(() => {
    keepCurrentEvidenceAndNext?.();
  }, [keepCurrentEvidenceAndNext]);

  const { session } = useSession();
  const requestRecaptureMutation = useRequestEvidenceRecapture();
  const currentUserId = session?.account?.id || (session as any)?.userId;
  const isSelfEvidence = Boolean(
    currentUserId &&
    currentItem &&
    (currentItem.evidence.userId === currentUserId ||
      currentItem.evidence.surveyorId === currentUserId),
  );

  // Active view toggle between surveyor evidence photo and baseline catalog sign
  const [viewMode, setViewMode] = useState<'evidence' | 'baseline'>('evidence');

  // Modal, picker, and toast states
  const [activeSheet, setActiveSheet] = useState<SheetType>();
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [isCatalogBrowserOpen, setIsCatalogBrowserOpen] = useState(false);
  const [selectedCatalogSign, setSelectedCatalogSign] = useState<CatalogSign | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'default' | 'success' | 'danger';
  }>();

  const handleConfirmRecapture = useCallback(
    async (reason: string, note?: string) => {
      if (!currentItem) return;
      try {
        await requestRecaptureMutation.mutateAsync({
          evidenceId: currentItem.evidenceId,
          dto: { reason, note },
          accessToken: session?.accessToken,
        });
        setToast({
          id: Date.now(),
          message: 'Đã gửi yêu cầu chụp lại ảnh cho điều tra viên',
          tone: 'success',
        });
        workflowSkip();
      } catch (err: any) {
        console.warn('[RevalidationReview] Request recapture error:', err);
        setToast({
          id: Date.now(),
          message: err?.message || 'Không thể gửi yêu cầu chụp lại',
          tone: 'default',
        });
      }
      setActiveSheet(undefined);
    },
    [currentItem, requestRecaptureMutation, session?.accessToken, workflowSkip],
  );

  // ---------------------------------------------------------------------------
  // Action Handler: calls workflow vote API upon swipe or action confirmation
  // ---------------------------------------------------------------------------
  const handleVote = useCallback(
    async (
      action: RevalidationReviewAction,
      note?: string,
      suggestedSignTypeId?: number,
      verdict?: 'AGREE' | 'DECLINE' | 'SKIP' | 'REPORT',
    ) => {
      if (!currentItem || isSubmittingVote) return;

      const messages: Record<RevalidationReviewAction, string> = {
        STILL_ACTIVE: 'Đã xác nhận: Biển báo vẫn hoạt động',
        REMOVED: 'Đã xác nhận: Biển báo đã gỡ bỏ',
        CHANGED: 'Đã bình chọn: Biển báo đã thay đổi',
        UNCLEAR: 'Đã đánh dấu: Minh chứng không rõ ràng / Không hợp lệ',
        INVALID: 'Đã báo cáo minh chứng không hợp lệ',
      };

      try {
        await workflowVote(action, note, suggestedSignTypeId, verdict);
        setToast({
          id: Date.now(),
          message: messages[action],
          tone: action === 'STILL_ACTIVE' ? 'success' : 'default',
        });
        setViewMode('evidence');
      } catch (err) {
        setToast({
          id: Date.now(),
          message: 'Đã xảy ra lỗi, vui lòng thử lại',
          tone: 'danger',
        });
      }
    },
    [currentItem, isSubmittingVote, workflowVote],
  );

  // Reviewer agrees with surveyor conclusion
  const handleAgree = useCallback(async () => {
    if (!currentItem || isSubmittingVote) return;

    // Follow surveyor's concluded evidenceType directly
    const rawVerdict = currentItem.evidence.evidenceType;
    const decision: RevalidationReviewAction =
      rawVerdict === 'REMOVED' ? 'REMOVED' : rawVerdict === 'CHANGED' ? 'CHANGED' : 'STILL_ACTIVE';

    try {
      await workflowVote(
        decision,
        undefined,
        currentItem.evidence.suggestedSignTypeId ?? undefined,
        'AGREE',
      );
      setToast({
        id: Date.now(),
        message: 'Đồng ý',
        tone: 'success',
      });
      setViewMode('evidence');
    } catch (err) {
      setToast({
        id: Date.now(),
        message: 'Đã xảy ra lỗi, vui lòng thử lại',
        tone: 'danger',
      });
    }
  }, [currentItem, isSubmittingVote, workflowVote]);

  // Reviewer disagrees with surveyor conclusion
  const handleDecline = useCallback(() => {
    setActiveSheet('decline');
  }, []);

  // Reviewer skips this evidence
  const handleSkip = useCallback(() => {
    if (!currentItem) return;

    setToast({
      id: Date.now(),
      message: 'Đã bỏ qua',
      tone: 'default',
    });

    workflowSkip();
    setViewMode('evidence');
  }, [currentItem, workflowSkip]);

  // Reviewer reports invalid / bad evidence
  const handleReport = useCallback(() => {
    setActiveSheet('report');
  }, []);

  const handleFinishReviews = () => {
    const reviewedCount = workflowFinish();
    router.replace({
      pathname: '/work/submission-complete',
      params: { type: 'review_revalidation', count: String(reviewedCount) },
    });
  };

  // ---------------------------------------------------------------------------
  // Swipe Gestures: Right -> Agree, Left -> Decline, Up -> Skip, Down -> Report
  // ---------------------------------------------------------------------------
  const [pan] = useState(() => new Animated.ValueXY());
  const gestureAxis = useRef<'none' | 'horizontal' | 'vertical'>('none');

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    setViewMode('evidence');
  }, [currentItem?.evidenceId, pan]);

  const rotate = pan.x.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ['-14deg', '0deg', '14deg'],
    extrapolate: 'clamp',
  });

  const agreeBadgeOpacity = pan.x.interpolate({
    inputRange: [15, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const declineBadgeOpacity = pan.x.interpolate({
    inputRange: [-80, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const skipBadgeOpacity = pan.y.interpolate({
    inputRange: [-80, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const reportBadgeOpacity = pan.y.interpolate({
    inputRange: [15, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10,
        onPanResponderGrant: () => {
          gestureAxis.current = 'none';
        },
        onPanResponderMove: (_, gestureState) => {
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          // Khóa trục chuyển động (Axis lock): chỉ cho phép trượt ngang hoặc trượt dọc
          if (gestureAxis.current === 'none') {
            if (absDx >= 10 || absDy >= 10) {
              gestureAxis.current = absDx >= absDy ? 'horizontal' : 'vertical';
            }
          }

          if (gestureAxis.current === 'horizontal') {
            pan.x.setValue(dx);
            pan.y.setValue(0);
          } else if (gestureAxis.current === 'vertical') {
            pan.x.setValue(0);
            pan.y.setValue(dy);
          }
        },
        onPanResponderRelease: (_, { dx, dy, vx, vy }) => {
          if ((isRecheckMode && !isEditingVote) || isSubmittingVote) {
            gestureAxis.current = 'none';
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              tension: 50,
              useNativeDriver: false,
            }).start();
            return;
          }

          const SWIPE_THRESHOLD = 90;
          const currentAxis = gestureAxis.current;
          gestureAxis.current = 'none';

          if (currentAxis === 'horizontal') {
            // Vuốt sang PHẢI: Đồng ý với điều tra viên
            if (dx > SWIPE_THRESHOLD || (dx > 35 && vx > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: 500, y: 0 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                handleAgree();
              });
              return;
            } else if (dx < -SWIPE_THRESHOLD || (dx < -35 && vx < -0.4)) {
              // Vuốt sang TRÁI: Từ chối kết luận
              Animated.timing(pan, {
                toValue: { x: -500, y: 0 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                handleDecline();
              });
              return;
            }
          } else if (currentAxis === 'vertical') {
            // Vuốt LÊN TRÊN: Bỏ qua
            if (dy < -SWIPE_THRESHOLD || (dy < -35 && vy < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: 0, y: -500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                handleSkip();
              });
              return;
            } else if (dy > SWIPE_THRESHOLD || (dy > 35 && vy > 0.4)) {
              // Vuốt XUỐNG DƯỚI: Báo cáo sự cố minh chứng
              Animated.timing(pan, {
                toValue: { x: 0, y: 500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                handleReport();
              });
              return;
            }
          }

          // Bật đàn hồi về vị trí tâm nếu chưa đủ ngưỡng
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 50,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderTerminate: () => {
          gestureAxis.current = 'none';
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 50,
            useNativeDriver: false,
          }).start();
        },
      }),
    [handleAgree, handleDecline, handleReport, handleSkip, isEditingVote, isRecheckMode, isSubmittingVote, pan],
  );

  // Active displayed image URI
  const rawImageUri =
    viewMode === 'evidence'
      ? currentItem?.evidence.mediaUrl || currentItem?.verifiedSign.signCropUrl
      : currentItem?.verifiedSign.signCropUrl || currentItem?.evidence.mediaUrl;
  const displayImageUri = resolveS3Url(rawImageUri);

  const scorePercent =
    currentItem?.verifiedSign.freshnessScore !== undefined
      ? currentItem.verifiedSign.freshnessScore <= 1
        ? Math.round(currentItem.verifiedSign.freshnessScore * 100)
        : Math.round(currentItem.verifiedSign.freshnessScore)
      : 75;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Top Progress Bar & Navigation Controls (Active Evaluation Mode Only) */}
        {currentItem ? (
          <View style={styles.progressSection}>
            <View style={styles.progressTopRow}>
              <Pressable
                accessibilityLabel="Quay lại"
                hitSlop={Spacing.one}
                onPress={() => {
                  if (isRecheckMode) {
                    cancelEvidenceCheck?.();
                  }
                  router.replace(reviewerWorkRoute);
                }}
                style={styles.backButton}
              >
                <MaterialCommunityIcons color={theme.text} name="arrow-left" size={22} />
              </Pressable>

              <View style={styles.progressTrackWrapper}>
                <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${progressPercent}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.topBarSpacer} />
            </View>
            <View style={styles.progressCounterRow}>
              <Text style={[styles.progressCounterText, { color: theme.textSecondary }]}>
                ĐANG ĐÁNH GIÁ MINH CHỨNG {reviewPosition} / {Math.max(totalCount, 1)}
              </Text>
            </View>
          </View>
        ) : null}

        {isLoading && items.length === 0 && history.length === 0 ? (
          <RevalidationReviewSkeleton />
        ) : currentItem ? (
          <View style={styles.mainContainer}>
            {/* Card & Image Container */}
            <View style={styles.cardArea}>
              {/* Upcoming card preview peeking on right */}
              {nextItem ? (
                <View
                  style={[
                    styles.peekCard,
                    isSmallDevice && { maxHeight: Math.min(320, windowHeight * 0.36) },
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Image
                    contentFit="cover"
                    source={{
                      uri: resolveS3Url(
                        nextItem.evidence.mediaUrl || nextItem.verifiedSign.signCropUrl,
                      ),
                    }}
                    style={styles.cardImage}
                    transition={180}
                  />
                  <View style={styles.peekDimOverlay} />
                </View>
              ) : null}

              {/* Active Main Card with 4-Way Swipe */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.mainCard,
                  isSmallDevice && { maxHeight: Math.min(320, windowHeight * 0.36) },
                  Boolean(nextItem) && styles.mainCardOffset,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="Ảnh minh chứng. Nhấn để phóng to."
                  onPress={() => setIsImageZoomed(true)}
                  style={styles.cardInnerPressable}
                >
                  <Image
                    accessibilityLabel={currentItem.verifiedSign.signCode}
                    contentFit="cover"
                    source={{ uri: displayImageUri }}
                    style={styles.cardImage}
                    transition={180}
                  />

                  {/* Directional Swipe Badges */}
                  {!isRecheckMode || isEditingVote ? (
                    <RevalidationSwipeBadges
                      agreeOpacity={agreeBadgeOpacity}
                      declineOpacity={declineBadgeOpacity}
                      reportOpacity={reportBadgeOpacity}
                      skipOpacity={skipBadgeOpacity}
                    />
                  ) : null}

                  {/* Status badge when rechecking */}
                  {displayedPreviousReview ? (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            revalActionDetails[displayedPreviousReview.action]?.color ??
                            Colors.placeholder,
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeLabel}>
                        {revalActionDetails[displayedPreviousReview.action]?.title ??
                          'ĐÃ THẨM ĐỊNH'}
                      </Text>
                    </View>
                  ) : null}

                  {/* Zoom button */}
                  <View style={styles.zoomButton}>
                    <MaterialCommunityIcons color="#FFFFFF" name="magnify-plus-outline" size={18} />
                  </View>
                </Pressable>

                {/* Floating Top-Left Tab: Switch between Evidence and Baseline Original Sign */}
                <View style={styles.imageSourceToggleContainer}>
                  <Pressable
                    accessibilityLabel="Xem ảnh mới"
                    accessibilityRole="tab"
                    onPress={() => setViewMode('evidence')}
                    style={[
                      styles.imageSourcePill,
                      viewMode === 'evidence' && [
                        styles.imageSourcePillActive,
                        { backgroundColor: theme.primary },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.imageSourcePillText,
                        viewMode === 'evidence' && styles.imageSourcePillTextActive,
                      ]}
                    >
                      Ảnh mới
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Xem ảnh gốc"
                    accessibilityRole="tab"
                    onPress={() => setViewMode('baseline')}
                    style={[
                      styles.imageSourcePill,
                      viewMode === 'baseline' && [
                        styles.imageSourcePillActive,
                        { backgroundColor: theme.primary },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.imageSourcePillText,
                        viewMode === 'baseline' && styles.imageSourcePillTextActive,
                      ]}
                    >
                      Ảnh cũ
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>

            {/* Comparison Section (Option 1: Target Sign + Surveyor Verdict + Timestamps) */}
            <View
              style={[
                styles.comparisonBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Row 1: Target Sign Name & Code Badge */}
              <View style={styles.comparisonHeaderRow}>
                {currentItem.verifiedSign.signCode ? (
                  <View
                    style={[
                      styles.signCodeBadge,
                      {
                        backgroundColor: `${theme.primary}15`,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.signCodeText, { color: theme.primary }]}>
                      {currentItem.verifiedSign.signCode}
                    </Text>
                  </View>
                ) : null}
                <Text numberOfLines={1} style={[styles.comparisonSignName, { color: theme.text }]}>
                  {currentItem.verifiedSign.nameVi ||
                    currentItem.verifiedSign.nameEn ||
                    currentItem.verifiedSign.signCode ||
                    'Biển báo gốc'}
                </Text>
              </View>

              {/* Row 2: Surveyor Verdict Chip */}
              <View style={styles.surveyorVerdictRow}>
                <Text style={[styles.surveyorVerdictLabel, { color: theme.textSecondary }]}>
                  Báo cáo thực địa:
                </Text>
                <View
                  style={[
                    styles.surveyorVerdictBadge,
                    currentItem.evidence.evidenceType === 'REMOVED'
                      ? styles.surveyorStatusRemoved
                      : currentItem.evidence.evidenceType === 'CHANGED'
                        ? styles.surveyorStatusChanged
                        : styles.surveyorStatusActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.surveyorVerdictText,
                      {
                        color:
                          currentItem.evidence.evidenceType === 'REMOVED'
                            ? '#DC2626'
                            : currentItem.evidence.evidenceType === 'CHANGED'
                              ? '#D97706'
                              : '#16A34A',
                      },
                    ]}
                  >
                    {currentItem.evidence.evidenceType === 'REMOVED'
                      ? 'Biển báo đã gỡ bỏ'
                      : currentItem.evidence.evidenceType === 'CHANGED'
                        ? 'Biển báo đã thay đổi'
                        : 'Biển báo vẫn còn hoạt động'}
                  </Text>
                </View>
              </View>

              {/* Row 3: Timestamps Comparison (Old vs New, without distance) */}
              <View style={styles.timestampsRow}>
                <View style={styles.timestampItem}>
                  <MaterialCommunityIcons
                    color={theme.placeholder}
                    name="camera-outline"
                    size={13}
                  />
                  <Text style={[styles.timestampText, { color: theme.placeholder }]}>
                    Chụp mới: {formatDate(currentItem.evidence.submittedAt)}
                  </Text>
                </View>
                <Text style={[styles.timestampDivider, { color: theme.placeholder }]}>•</Text>
                <View style={styles.timestampItem}>
                  <MaterialCommunityIcons color={theme.placeholder} name="history" size={13} />
                  <Text style={[styles.timestampText, { color: theme.placeholder }]}>
                    Lần cuối:{' '}
                    {currentItem.verifiedSign.lastVerifiedAt
                      ? formatDate(currentItem.verifiedSign.lastVerifiedAt)
                      : 'Chưa có dữ liệu'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action button right below comparison box: Location button */}
            <View style={styles.skipToSummaryRow}>
              <AppButton
                accessibilityHint="Di chuyển đến vị trí biển báo trên bản đồ"
                accessibilityLabel="Di chuyển đến vị trí biển báo"
                disabled={isNavigatingToSign}
                onPress={() => {
                  const coord =
                    (currentItem.evidence as any)?.location ??
                    (currentItem.verifiedSign as any)?.location ??
                    {};
                  const lat =
                    coord.latitude ??
                    currentItem.evidence?.latitude ??
                    (currentItem.verifiedSign as any)?.latitude ??
                    (currentItem as any)?.latitude;
                  const lng =
                    coord.longitude ??
                    currentItem.evidence?.longitude ??
                    (currentItem.verifiedSign as any)?.longitude ??
                    (currentItem as any)?.longitude;

                  void navigateToSign({
                    latitude: lat,
                    longitude: lng,
                    title:
                      currentItem.verifiedSign?.nameVi ||
                      currentItem.verifiedSign?.signCode ||
                      'Biển báo tái xác thực',
                    subtitle: currentItem.verifiedSign?.signCode,
                    signId: currentItem.evidenceId || currentItem.taskId,
                    returnPath: '/work/revalidation-review',
                  });
                }}
                style={[
                  styles.summaryShortcutButton,
                  {
                    borderColor: theme.border,
                  },
                ]}
                testID="reval-move-to-sign-location-button"
                variant="surface"
              >
                <View style={styles.locationButtonContent}>
                  <MaterialCommunityIcons
                    color={theme.primary}
                    name="map-marker-outline"
                    size={15}
                  />
                  <Text style={[styles.summaryShortcutButtonText, { color: theme.text }]}>
                    {isNavigatingToSign ? 'Đang định vị...' : 'Vị trí biển báo'}
                  </Text>
                </View>
              </AppButton>

              <AppButton
                accessibilityLabel="Yêu cầu chụp lại ảnh"
                disabled={Boolean(isSelfEvidence || isLoading)}
                onPress={() => setActiveSheet('recapture')}
                style={[
                  styles.summaryShortcutButton,
                  {
                    borderColor: '#D97706',
                    marginLeft: 8,
                  },
                ]}
                variant="surface"
              >
                <View style={styles.locationButtonContent}>
                  <MaterialCommunityIcons color="#D97706" name="camera-retake-outline" size={15} />
                  <Text style={[styles.summaryShortcutButtonText, { color: '#D97706' }]}>
                    Chụp lại
                  </Text>
                </View>
              </AppButton>
            </View>

            {/* Bottom Actions: Separate Revalidation Decision Badge Component */}
            {isRecheckMode && !isEditingVote ? (
              <RevalidationVotedResultCard
                onFixResult={() => setIsEditingVote(true)}
                onKeepResult={handleKeepPreviousReview}
                review={displayedPreviousReview}
              />
            ) : (
              <>
                {isRecheckMode && isEditingVote ? (
                  <RevalidationEditingBanner onCancel={() => setIsEditingVote(false)} />
                ) : null}

                {isSelfEvidence ? (
                  <View
                    style={{
                      padding: 14,
                      marginHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: 'rgba(217, 119, 6, 0.08)',
                      borderColor: '#D97706',
                      borderWidth: 1,
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons
                        color="#D97706"
                        name="shield-alert-outline"
                        size={20}
                      />
                      <Text style={{ fontWeight: '700', fontSize: 14, color: '#D97706' }}>
                        Tự thẩm định bị chặn
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center' }}>
                      Bạn là người nộp minh chứng này. Theo quy chế tự thẩm định (Self-review), bạn
                      không thể bỏ phiếu hoặc yêu cầu chụp lại bài nộp của chính mình.
                    </Text>
                    <AppButton label="Bỏ qua minh chứng này" onPress={handleSkip} variant="ghost" />
                  </View>
                ) : (
                  <RevalidationDecisionBadge
                    disabled={isLoading}
                    handleAgree={handleAgree}
                    handleDecline={handleDecline}
                    handleReport={handleReport}
                    handleSkip={handleSkip}
                    onOpenCatalog={() => setIsCatalogBrowserOpen(true)}
                    onOpenHelp={() => setIsHelpModalVisible(true)}
                  />
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.completeState}>
            <View style={[styles.completeIcon, { backgroundColor: '#E8F7ED' }]}>
              <MaterialCommunityIcons color="#16803A" name="check" size={36} />
            </View>
            <Text style={[styles.completeTitle, { color: theme.text }]}>
              Đã đánh giá tất cả minh chứng
            </Text>
            <Text style={[styles.completeCopy, { color: theme.textSecondary }]}>
              Bạn đã xem xét tất cả các minh chứng tái thẩm định thực địa trong hàng đợi.
            </Text>
            <AppButton
              label="Quay lại công việc"
              onPress={() => router.replace(reviewerWorkRoute)}
              style={styles.completeSummaryButton}
            />
          </View>
        )}
      </SafeAreaView>

      {/* Decline / Report Bottom Sheet */}
      <RevalidationBottomSheet
        onClearCatalogSign={() => setSelectedCatalogSign(null)}
        onClose={() => setActiveSheet(undefined)}
        onConfirmDecline={(decision, note, suggestedSignTypeId) => {
          handleVote(decision as RevalidationReviewAction, note, suggestedSignTypeId, 'DECLINE');
          setActiveSheet(undefined);
        }}
        onConfirmReport={(reason, note) => {
          const fullNote = [reason, note].filter(Boolean).join(': ');
          handleVote('UNCLEAR', fullNote, undefined, 'REPORT');
          setActiveSheet(undefined);
        }}
        onConfirmRecapture={handleConfirmRecapture}
        onOpenCatalog={() => setIsCatalogBrowserOpen(true)}
        selectedCatalogSign={selectedCatalogSign}
        surveyorVerdict={
          currentItem?.evidence.evidenceType === 'REMOVED'
            ? 'Đã gỡ bỏ'
            : currentItem?.evidence.evidenceType === 'CHANGED'
              ? 'Đã thay đổi'
              : 'Vẫn còn hoạt động'
        }
        type={activeSheet}
      />

      {/* Catalog Sign Picker Modal */}
      <RevalidationSignPickerModal
        onClose={() => setIsCatalogBrowserOpen(false)}
        onSelectSign={(sign) => {
          setSelectedCatalogSign(sign);
          setIsCatalogBrowserOpen(false);
        }}
        visible={isCatalogBrowserOpen}
      />

      {/* Full-Screen Image Zoom Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setIsImageZoomed(false)}
        statusBarTranslucent
        transparent
        visible={isImageZoomed}
      >
        <Pressable
          accessibilityLabel="Đóng xem phóng to"
          onPress={() => setIsImageZoomed(false)}
          style={styles.zoomBackdrop}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.zoomSafeArea}>
            <Pressable
              accessibilityLabel="Đóng xem phóng to"
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => setIsImageZoomed(false)}
              style={[styles.zoomCloseBtn, { top: Math.max(insets.top, 16) + 12 }]}
            >
              <MaterialCommunityIcons color="#FFFFFF" name="close" size={26} />
            </Pressable>
            {displayImageUri ? (
              <Image
                contentFit="contain"
                source={{ uri: displayImageUri }}
                style={styles.zoomedImage}
              />
            ) : null}
          </SafeAreaView>
        </Pressable>
      </Modal>

      {/* =============================================================== */}
      {/* SWIPE GESTURE GUIDE MODAL / OVERLAY                             */}
      {/* =============================================================== */}
      <Modal
        animationType="fade"
        onRequestClose={() => setIsHelpModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isHelpModalVisible}
      >
        <Pressable
          accessibilityLabel="Đóng hướng dẫn"
          onPress={() => setIsHelpModalVisible(false)}
          style={styles.helpModalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.helpDialogCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            {/* Header */}
            <View style={styles.helpDialogHeader}>
              <View
                style={[styles.helpHeaderIconContainer, { backgroundColor: `${theme.primary}15` }]}
              >
                <MaterialCommunityIcons color={theme.primary} name="gesture-swipe" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpDialogTitle, { color: theme.text }]}>
                  Hướng dẫn quẹt thẻ
                </Text>
                <Text style={[styles.helpDialogSubtitle, { color: theme.textSecondary }]}>
                  Thao tác nhanh trên ảnh minh chứng
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Đóng"
                hitSlop={8}
                onPress={() => setIsHelpModalVisible(false)}
                style={styles.helpCloseBtn}
              >
                <MaterialCommunityIcons color={theme.textSecondary} name="close" size={20} />
              </Pressable>
            </View>

            {/* Directions List */}
            <View style={styles.helpGuideList}>
              {/* Right: Agree */}
              <View
                style={[
                  styles.helpGuideItem,
                  { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
                ]}
              >
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#16A34A' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-right-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#16A34A' }]}>
                    Quẹt sang PHẢI: Đồng ý
                  </Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Xác nhận đồng ý với kết luận thực địa của điều tra viên.
                  </Text>
                </View>
              </View>

              {/* Left: Decline */}
              <View
                style={[
                  styles.helpGuideItem,
                  { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
                ]}
              >
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#DC2626' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-left-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#DC2626' }]}>
                    Quẹt sang TRÁI: Từ chối
                  </Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Không đồng ý với kết luận, đưa ra tình trạng quan sát thực tế.
                  </Text>
                </View>
              </View>

              {/* Up: Skip */}
              <View
                style={[
                  styles.helpGuideItem,
                  { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                ]}
              >
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#64748B' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-up-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#475569' }]}>
                    Quẹt LÊN TRÊN: Bỏ qua
                  </Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Chưa chắc chắn hoặc hình ảnh khó xác định, chuyển thẻ tiếp theo.
                  </Text>
                </View>
              </View>

              {/* Down: Report */}
              <View
                style={[
                  styles.helpGuideItem,
                  { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' },
                ]}
              >
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#EA580C' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-down-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#EA580C' }]}>
                    Quẹt XUỐNG DƯỚI: Báo cáo
                  </Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Báo cáo ảnh mờ, chói sáng, sai vị trí hoặc vi phạm quy tắc.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.helpTipBox}>
              <MaterialCommunityIcons
                color={theme.placeholder}
                name="information-outline"
                size={14}
              />
              <Text style={[styles.helpTipText, { color: theme.textSecondary }]}>
                Bạn cũng có thể bấm trực tiếp vào 4 nút hành động ở dưới để đưa ra quyết định.
              </Text>
            </View>

            {/* Confirm button */}
            <AppButton
              label="Đã hiểu"
              onPress={() => setIsHelpModalVisible(false)}
              style={styles.helpConfirmBtn}
              variant="primary"
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast */}
      {toast ? (
        <AppToast
          duration={1300}
          key={toast.id}
          message={toast.message}
          onDismiss={() => setToast(undefined)}
          placement="bottom"
          tone={toast.tone}
        />
      ) : null}
    </View>
  );
}
