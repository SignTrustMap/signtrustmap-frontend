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

import { AppButton } from '@/components/button';
import { AppToast } from '@/components/toast';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import {
  type ReviewActionType,
  useReviewWorkflow,
} from '@/feature/review/context/review-workflow-provider';
import { ReportNewSignTypeModal } from '../components/report-new-sign-type-modal';
import type { CreateMissingTypeReportDto } from '@/types/reviewsType';
import { useGetCatalog, useGetCandidateSignDetails } from '@/feature/review/hooks/use-review';
import { getCandidateSignDetails } from '@/api/reviews/review';
import { useReviewerSignNavigation } from '@/feature/review/hooks/use-reviewer-sign-navigation';
import {
  extractCoordinateFromCandidate,
  resolveS3Url,
  type RemedySign,
  type ReviewSubmission,
} from '@/api/reviews/review-workflow';
import { resolveLocation, formatResolvedLocationTitle } from '@/api/spatial/spatial';
import { useOptionalSession } from '@/context/session-provider';
import { ReviewInstructionModal } from '@/feature/review/components/review-instruction-modal';
import { checkAndRequireLocationPermission } from '@/services/location-permission';
import {
  SubmissionVotedResultCard,
  SubmissionEditingBanner,
} from '@/feature/review/components/submission-voted-result-card';
import { RevalidationSignPickerModal } from '@/feature/revalidation/components/revalidation-sign-picker-modal';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/utils/responsive';
import { useBackButton } from '@/hooks/use-back-button';
import { styles } from '@/feature/review/styles/submission-review-screen.styles';
import {
  DEFAULT_REMEDY_SIGNS,
  REPORT_ISSUE_OPTIONS,
  ReviewBottomSheet,
  SubmissionReviewSkeleton,
  type DeclineReason,
  type ReportIssueType,
  type ReviewSheet,
} from '../components/submission-review-sheets';

export { DEFAULT_REMEDY_SIGNS, REPORT_ISSUE_OPTIONS, type ReportIssueType };

export type SubmissionReviewState = 'loading' | 'ready' | 'reviewed';

type SubmissionReviewScreenProps = {
  state?: SubmissionReviewState;
};

export function SubmissionReviewScreen({ state = 'ready' }: SubmissionReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    resumeIndex?: string;
    targetSubmissionId?: string;
    candidateId?: string;
    questClaimId?: string;
  }>();
  const resumeIndexParam = params?.resumeIndex;
  const targetSubmissionIdParam = params?.targetSubmissionId || params?.candidateId;
  const claimedCandidateId = params?.candidateId;
  const questClaimId = params?.questClaimId;
  const theme = useTheme();
  const { isSmallDevice, height: windowHeight } = useResponsive();
  const {
    cancelSubmissionCheck,
    completeCurrentReview,
    ensureCandidateInQueue,
    isLoading,
    isSubmittingReview = false,
    jumpToSubmissionIndex,
    jumpToSubmissionById,
    keepCurrentReviewAndNext,
    pendingSubmissions,
    queueLoadVersion,
    recheckingPreviousAction,
    recheckingSubmission,
    reviewHistory,
    totalSubmissions,
    undoLastReview,
  } = useReviewWorkflow();

  const { isNavigatingToSign, navigateToSign } = useReviewerSignNavigation();
  const handledTargetSubmissionIdRef = useRef<string | null>(null);
  const [isResolvingClaimedCandidate, setIsResolvingClaimedCandidate] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'default' | 'success' | 'danger';
  }>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (resumeIndexParam !== undefined && resumeIndexParam !== '') {
      const idx = parseInt(resumeIndexParam, 10);
      if (!isNaN(idx)) {
        jumpToSubmissionIndex?.(idx);
      }
    }
  }, [resumeIndexParam, jumpToSubmissionIndex]);

  useEffect(() => {
    if (!targetSubmissionIdParam) {
      handledTargetSubmissionIdRef.current = null;
      setIsResolvingClaimedCandidate(false);
      return;
    }

    const hasMatch =
      pendingSubmissions.some((s) => s.id === targetSubmissionIdParam) ||
      reviewHistory.some((h) => h.submission.id === targetSubmissionIdParam);

    if (hasMatch) {
      if (handledTargetSubmissionIdRef.current !== targetSubmissionIdParam) {
        handledTargetSubmissionIdRef.current = targetSubmissionIdParam;
        jumpToSubmissionById?.(targetSubmissionIdParam);
        if (params?.targetSubmissionId) {
          router.setParams?.({ targetSubmissionId: undefined });
        }
      }
      setIsResolvingClaimedCandidate(false);
      return;
    }

    if (handledTargetSubmissionIdRef.current === targetSubmissionIdParam) return;
    if (queueLoadVersion === 0) return;

    if (!isLoading && claimedCandidateId && ensureCandidateInQueue) {
      handledTargetSubmissionIdRef.current = targetSubmissionIdParam;
      setIsResolvingClaimedCandidate(true);
      void ensureCandidateInQueue(claimedCandidateId)
        .then((found) => {
          if (!isMountedRef.current) return;
          if (!found) {
            setToast((current) => ({
              id: (current?.id ?? 0) + 1,
              message: 'Nhiệm vụ này đã được xử lý hoặc không còn trong hàng đợi',
              tone: 'default',
            }));
          }
        })
        .catch(() => {
          if (!isMountedRef.current) return;
          setToast((current) => ({
            id: (current?.id ?? 0) + 1,
            message: 'Không thể tải thông tin nhiệm vụ',
            tone: 'default',
          }));
        })
        .finally(() => {
          if (isMountedRef.current) setIsResolvingClaimedCandidate(false);
        });
    }
  }, [
    targetSubmissionIdParam,
    claimedCandidateId,
    isLoading,
    pendingSubmissions,
    queueLoadVersion,
    reviewHistory,
    jumpToSubmissionById,
    ensureCandidateInQueue,
    router,
    params?.targetSubmissionId,
  ]);

  useEffect(() => {
    checkAndRequireLocationPermission().catch(() => {});
  }, []);

  const handleKeepCurrentReview = useCallback(() => {
    const completes = keepCurrentReviewAndNext?.() ?? true;
    if (completes) {
      router.replace('/work/reviewer-history');
    }
  }, [keepCurrentReviewAndNext, router]);

  const [activeSheet, setActiveSheet] = useState<ReviewSheet>();
  const [selectedRemedySign, setSelectedRemedySign] = useState<RemedySign>();
  const [declineReason, setDeclineReason] = useState<DeclineReason>();
  const [declineReasonDetail, setDeclineReasonDetail] = useState('');
  const [reportIssueType, setReportIssueType] = useState<ReportIssueType>('other');
  const [reportNote, setReportNote] = useState('');
  const [isNewSignTypeModalOpen, setIsNewSignTypeModalOpen] = useState(false);
  const [isCatalogPickerVisible, setIsCatalogPickerVisible] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isSignFocused, setIsSignFocused] = useState(true);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  const { data: catalog } = useGetCatalog();
  const catalogSigns = useMemo(() => catalog?.signs ?? [], [catalog]);

  const submission = pendingSubmissions[0];
  const nextSubmission = pendingSubmissions[1];
  const optionalSession = useOptionalSession();
  const session = optionalSession?.session;
  const [resolvedAddress, setResolvedAddress] = useState<string>();

  const candidateDetailsResult = useGetCandidateSignDetails(
    submission?.id ? { candidateId: submission.id } : undefined,
    Boolean(submission?.id),
  );
  const candidateDetails = candidateDetailsResult?.data;

  const currentCoordinate = useMemo(() => {
    if (!submission) return { latitude: null, longitude: null };
    const fromSubmission = extractCoordinateFromCandidate(submission);
    if (fromSubmission.latitude != null && fromSubmission.longitude != null) {
      return fromSubmission;
    }
    const fromDetails = extractCoordinateFromCandidate(candidateDetails);
    if (fromDetails.latitude != null && fromDetails.longitude != null) {
      return fromDetails;
    }
    return { latitude: null, longitude: null };
  }, [submission, candidateDetails]);

  const displayedReviewAction =
    (submission as ReviewSubmission & { previousAction?: ReviewActionType })?.previousAction ??
    recheckingPreviousAction;
  const isRecheckMode = Boolean(recheckingSubmission && displayedReviewAction);
  const [isEditingVote, setIsEditingVote] = useState(false);

  useBackButton({
    pathname: '/work',
    params: { currentRole: 'reviewer' },
  });

  useEffect(() => {
    setIsEditingVote(false);
  }, [submission?.id, recheckingSubmission]);

  useEffect(() => {
    if (!submission) {
      setResolvedAddress(undefined);
      return;
    }

    if (submission.location && submission.location !== 'Estimated GPS coordinates available') {
      setResolvedAddress(submission.location.replace(/^[•\s,.-]+/, '').trim());
      return;
    }

    const detailsLocation = (candidateDetails as any)?.locationContext?.displayLocation;
    if (detailsLocation && detailsLocation !== 'Estimated GPS coordinates available') {
      setResolvedAddress(detailsLocation.replace(/^[•\s,.-]+/, '').trim());
      return;
    }

    const lat = currentCoordinate.latitude;
    const lon = currentCoordinate.longitude;
    if (lat == null || lon == null) {
      setResolvedAddress(undefined);
      return;
    }

    let isMounted = true;
    void (async () => {
      try {
        const resolved = await resolveLocation(lat, lon, session?.accessToken);
        if (isMounted && resolved) {
          const formatted = (resolved.displayAddress || formatResolvedLocationTitle(resolved) || '')
            .replace(/^[•\s,.-]+/, '')
            .trim();
          if (formatted) {
            setResolvedAddress(formatted);
          }
        }
      } catch {
        // keep undefined
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [
    submission?.id,
    submission?.location,
    candidateDetails,
    currentCoordinate.latitude,
    currentCoordinate.longitude,
    session?.accessToken,
  ]);

  const displayLocation = useMemo(() => {
    if (resolvedAddress) return resolvedAddress;
    const detailsLoc = (candidateDetails as any)?.locationContext?.displayLocation;
    if (detailsLoc && detailsLoc !== 'Estimated GPS coordinates available') {
      return detailsLoc;
    }
    if (submission?.location && submission.location !== 'Estimated GPS coordinates available') {
      return submission.location;
    }
    if (currentCoordinate.latitude != null && currentCoordinate.longitude != null) {
      return `${currentCoordinate.latitude.toFixed(4)}, ${currentCoordinate.longitude.toFixed(4)}`;
    }
    return '';
  }, [
    resolvedAddress,
    candidateDetails,
    submission?.location,
    currentCoordinate.latitude,
    currentCoordinate.longitude,
  ]);

  const handleNavigateToSignLocation = useCallback(async () => {
    if (!submission) return;

    let lat = currentCoordinate.latitude;
    let lon = currentCoordinate.longitude;

    if ((lat == null || lon == null) && session?.accessToken && submission.id) {
      try {
        const freshDetails = await getCandidateSignDetails(
          { candidateId: submission.id },
          session.accessToken,
        );
        const fromFresh = extractCoordinateFromCandidate(freshDetails);
        if (fromFresh.latitude != null && fromFresh.longitude != null) {
          lat = fromFresh.latitude;
          lon = fromFresh.longitude;
        }
      } catch {
        // ignore and fallback to Alert
      }
    }

    void navigateToSign({
      latitude: lat,
      longitude: lon,
      title: submission.title,
      subtitle: displayLocation,
      signId: submission.id,
      returnPath: '/work/submission-review',
    });
  }, [
    submission,
    currentCoordinate.latitude,
    currentCoordinate.longitude,
    session?.accessToken,
    displayLocation,
    navigateToSign,
  ]);

  const totalInQueue = Math.max(
    totalSubmissions,
    reviewHistory.length + pendingSubmissions.length,
    1,
  );
  const reviewPosition = Math.min(reviewHistory.length + (submission ? 1 : 0), totalInQueue);

  const activeRemedySigns: RemedySign[] = useMemo(() => {
    const candidateSignId = (submission as any)?.predictedSignTypeId;
    const candidateTitle = (submission?.title || '').toLowerCase();
    const candidateCode = submission?.title?.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';

    const isCandidateSign = (sign: { id?: number; signCode?: string }) => {
      if (candidateSignId != null && sign.id === candidateSignId) return true;
      if (sign.signCode) {
        const lowerCode = sign.signCode.toLowerCase();
        if (candidateCode && lowerCode === candidateCode) return true;
        if (candidateTitle.includes(lowerCode)) return true;
      }
      return false;
    };

    // 1. From embedded remedySigns if provided on submission
    if (submission?.remedySigns && submission.remedySigns.length > 0) {
      // Exclude any sign matching the candidate's prediction
      let remedies = submission.remedySigns.filter((s) => !isCandidateSign(s));

      // If the duplicate was not filtered by id/title, drop the first one as it is the prediction
      if (remedies.length === submission.remedySigns.length && submission.remedySigns.length > 1) {
        remedies = submission.remedySigns.slice(1);
      }

      // If we have 4 or more other signs, take the 4 other signs
      if (remedies.length >= 4) {
        return remedies.slice(0, 4);
      }

      // If fewer than 4 non-duplicate signs remain, supplement with catalog signs to always display 4
      const needed = 4 - remedies.length;
      const additionalFromCatalog = catalogSigns
        .filter(
          (s) =>
            !isCandidateSign(s) &&
            !remedies.some(
              (r) => r.id === s.id || r.signCode.toLowerCase() === s.signCode.toLowerCase(),
            ),
        )
        .slice(0, needed)
        .map((s) => ({
          id: s.id,
          signCode: s.signCode,
          nameVi: s.nameVi,
          nameEn: s.nameEn,
          imageUrl: s.representativeImageKey,
        }));

      return [...remedies, ...additionalFromCatalog].slice(0, 4);
    }

    // 2. Fallback from catalog
    const fromCatalog = catalogSigns.filter((s) => !isCandidateSign(s));

    if (fromCatalog.length >= 4) {
      return fromCatalog.slice(0, 4).map((s) => ({
        id: s.id,
        signCode: s.signCode,
        nameVi: s.nameVi,
        nameEn: s.nameEn,
        imageUrl: s.representativeImageKey,
      }));
    }

    return DEFAULT_REMEDY_SIGNS.filter((s) => !isCandidateSign(s)).slice(0, 4);
  }, [catalogSigns, submission]);

  const activeQuestClaimId =
    questClaimId &&
    submission &&
    (!claimedCandidateId || submission.id === claimedCandidateId)
      ? questClaimId
      : undefined;

  const completeReview = useCallback(
    async (
      action: ReviewActionType,
      details?: {
        declineReason?: string;
        declineNote?: string;
        suggestedSignTypeId?: number;
        newSignReport?: CreateMissingTypeReportDto;
      },
    ) => {
      if (!submission || isSubmittingReview) return;

      const mergedDetails = activeQuestClaimId
        ? { ...details, questClaimId: activeQuestClaimId }
        : details;
      const success = await completeCurrentReview(action, mergedDetails);

      if (!success) {
        setToast((current) => ({
          id: (current?.id ?? 0) + 1,
          message: 'Đã xảy ra lỗi, vui lòng thử lại',
          tone: 'danger',
        }));
        return;
      }

      const toastMessages: Record<ReviewActionType, string> = {
        approved: 'Đã phê duyệt biển báo',
        declined: 'Đã từ chối biển báo',
        reported: 'Đã báo cáo biển báo',
        skipped: 'Đã bỏ qua biển báo',
        reported_new_sign: 'Đã gửi báo cáo biển mới thành công!',
      };

      setToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message: toastMessages[action],
        tone: action === 'approved' || action === 'reported_new_sign' ? 'success' : 'default',
      }));

      if (isRecheckMode) {
        router.replace('/work/reviewer-history');
      }
    },
    [
      activeQuestClaimId,
      completeCurrentReview,
      isRecheckMode,
      isSubmittingReview,
      router,
      submission,
    ],
  );

  const handleConfirmNewSignType = (reportDto: CreateMissingTypeReportDto) => {
    completeReview('reported_new_sign', { newSignReport: reportDto });
  };

  const closeSheet = () => {
    setActiveSheet(undefined);
    setSelectedRemedySign(undefined);
    setDeclineReason(undefined);
    setDeclineReasonDetail('');
  };

  const confirmDecline = () => {
    if (selectedRemedySign) {
      completeReview('declined', {
        suggestedSignTypeId: selectedRemedySign.id,
        declineReason: `Corrected to ${selectedRemedySign.signCode}`,
        declineNote: selectedRemedySign.nameVi || selectedRemedySign.nameEn,
      });
    } else if (declineReason) {
      completeReview('declined', {
        declineReason,
        declineNote: declineReasonDetail.trim() || declineReason,
      });
    } else {
      return;
    }

    setSelectedRemedySign(undefined);
    setDeclineReason(undefined);
    setDeclineReasonDetail('');
    closeSheet();
  };

  const confirmReport = () => {
    if (reportIssueType === 'missing_type') {
      if (submission?.id) {
        const autoProposedName =
          reportNote.trim() || submission.title || `Biển lạ tại ${resolvedAddress || 'thực địa'}`;

        completeReview('reported_new_sign', {
          newSignReport: {
            candidateId: submission.id,
            proposedName: autoProposedName,
            description:
              reportNote.trim() ||
              'Báo cáo biển báo thực tế chưa có trong danh mục chuẩn QCVN 41:2019',
          },
        });
      }
      setReportNote('');
      closeSheet();
      return;
    }

    const selectedOption = REPORT_ISSUE_OPTIONS.find((opt) => opt.id === reportIssueType);
    const reasonTitle = selectedOption?.label || 'Reported Issue';
    const note = reportNote.trim();
    const fullReason = note || reasonTitle;

    completeReview('reported', { declineReason: reasonTitle, declineNote: fullReason });
    setReportNote('');
    closeSheet();
  };

  const undoLastAction = () => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return;

    undoLastReview();
    setToast(undefined);
  };

  // ---------------------------------------------------------------------------
  // Swipe Gestures: Right -> Approve, Left -> Reject, Up -> Skip, Down -> Report
  // ---------------------------------------------------------------------------
  const [pan] = useState(() => new Animated.ValueXY());

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [submission?.id, pan]);

  const rotate = pan.x.interpolate({
    inputRange: [-240, 0, 240],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const approveBadgeOpacity = pan.x.interpolate({
    inputRange: [25, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const declineBadgeOpacity = pan.x.interpolate({
    inputRange: [-90, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const skipBadgeOpacity = pan.y.interpolate({
    inputRange: [-90, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const reportBadgeOpacity = pan.y.interpolate({
    inputRange: [25, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy, vx, vy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const SWIPE_THRESHOLD = 85;

          if ((isRecheckMode && !isEditingVote) || isSubmittingReview) {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              tension: 50,
              useNativeDriver: false,
            }).start();
            return;
          }

          if (absDx > absDy) {
            // Horizontal swipe: Right -> Approve, Left -> Reject
            if (dx > SWIPE_THRESHOLD || (dx > 35 && vx > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: 500, y: dy },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                completeReview('approved');
              });
              return;
            } else if (dx < -SWIPE_THRESHOLD || (dx < -35 && vx < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: -500, y: dy },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('decline');
              });
              return;
            }
          } else {
            // Vertical swipe: Up -> Skip, Down -> Report Issue
            if (dy < -SWIPE_THRESHOLD || (dy < -35 && vy < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: dx, y: -500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                completeReview('skipped');
              });
              return;
            } else if (dy > SWIPE_THRESHOLD || (dy > 35 && vy > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: dx, y: 500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('report');
              });
              return;
            }
          }

          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 50,
            useNativeDriver: false,
          }).start();
        },
      }),
    [completeReview, pan, isRecheckMode, isEditingVote, isSubmittingReview],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Reviewer Progress Bar & Navigation Controls */}
        <View style={styles.progressSection}>
          <View style={styles.progressTopRow}>
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={Spacing.one}
              onPress={() => {
                if (isRecheckMode) cancelSubmissionCheck?.();
                router.navigate({
                  pathname: '/work',
                  params: { currentRole: 'reviewer' },
                });
              }}
              style={styles.backButton}
              testID="submission-review-back-button"
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
                      width: `${Math.min(100, (reviewPosition / totalInQueue) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.topBarSpacer} />
          </View>
          <View style={styles.progressCounterRow}>
            <Text style={[styles.progressCounterText, { color: theme.textSecondary }]}>
              {submission ? 'REVIEWING' : 'REVIEWED'} {reviewPosition} OF {totalInQueue}
            </Text>
          </View>
        </View>

        {state === 'loading' ||
        (isLoading && pendingSubmissions.length === 0) ||
        isResolvingClaimedCandidate ||
        (Boolean(claimedCandidateId) && queueLoadVersion === 0 && !submission) ? (
          <SubmissionReviewSkeleton />
        ) : submission ? (
          <View style={styles.mainContainer}>
            {/* Card & Image with White Info Box */}
            <View style={styles.cardArea}>
              {/* Upcoming card peeking subtly on the right (like Tinder) */}
              {nextSubmission ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
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
                    source={nextSubmission.image}
                    style={styles.cardImage}
                    transition={180}
                  />
                  <View style={styles.peekDimOverlay} />
                </View>
              ) : null}

              {/* Active Main Card with 4-Way Swipe Gesture */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.mainCard,
                  isSmallDevice && { maxHeight: Math.min(320, windowHeight * 0.36) },
                  Boolean(nextSubmission) && styles.mainCardOffset,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="Ảnh biển báo. Chạm để phóng to."
                  onPress={() => setIsImageZoomed(true)}
                  style={styles.cardInnerPressable}
                >
                  <Image
                    accessibilityLabel={submission.title}
                    contentFit={isSignFocused ? 'contain' : 'cover'}
                    source={submission.image}
                    style={[styles.cardImage, isSignFocused && { transform: [{ scale: 1.15 }] }]}
                    transition={180}
                  />

                  {/* Focus Toggle Pill */}
                  <Pressable
                    accessibilityLabel="Toggle sign focus"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      setIsSignFocused((prev) => !prev);
                    }}
                    style={styles.focusToggleBadge}
                  >
                    <MaterialCommunityIcons
                      color="#FFFFFF"
                      name={isSignFocused ? 'target' : 'image-filter-center-focus'}
                      size={13}
                    />
                    <Text style={styles.focusToggleText}>
                      {isSignFocused ? 'Focus Biển báo' : 'Toàn cảnh'}
                    </Text>
                  </Pressable>

                  {/* Directional Swipe Badges */}
                  {!isRecheckMode || isEditingVote ? (
                    <>
                      <Animated.View
                        style={[
                          styles.swipeBadge,
                          styles.approveBadge,
                          { opacity: approveBadgeOpacity },
                        ]}
                      >
                        <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>PHÊ DUYỆT</Text>
                      </Animated.View>

                      <Animated.View
                        style={[
                          styles.swipeBadge,
                          styles.declineBadge,
                          { opacity: declineBadgeOpacity },
                        ]}
                      >
                        <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>TỪ CHỐI</Text>
                      </Animated.View>

                      <Animated.View
                        style={[styles.swipeBadge, styles.skipBadge, { opacity: skipBadgeOpacity }]}
                      >
                        <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>BỎ QUA</Text>
                      </Animated.View>

                      <Animated.View
                        style={[
                          styles.swipeBadge,
                          styles.reportBadge,
                          { opacity: reportBadgeOpacity },
                        ]}
                      >
                        <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>BÁO CÁO</Text>
                      </Animated.View>
                    </>
                  ) : null}

                  {displayedReviewAction ? (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            displayedReviewAction === 'approved'
                              ? 'rgba(22, 128, 58, 0.9)'
                              : displayedReviewAction === 'declined'
                                ? 'rgba(239, 68, 68, 0.9)'
                                : displayedReviewAction === 'reported' ||
                                    displayedReviewAction === 'reported_new_sign'
                                  ? 'rgba(249, 115, 22, 0.9)'
                                  : 'rgba(100, 116, 139, 0.9)',
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeLabel}>
                        {displayedReviewAction === 'approved'
                          ? 'ĐÃ PHÊ DUYỆT'
                          : displayedReviewAction === 'declined'
                            ? 'ĐÃ TỪ CHỐI'
                            : displayedReviewAction === 'reported' ||
                                displayedReviewAction === 'reported_new_sign'
                              ? 'ĐÃ BÁO CÁO'
                              : 'ĐÃ BỎ QUA'}
                      </Text>
                    </View>
                  ) : null}

                  {/* Subtle zoom button */}
                  <View style={styles.zoomButton}>
                    <MaterialCommunityIcons color="#FFFFFF" name="magnify-plus-outline" size={18} />
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            {/* Sign name textbox out of image container, between image and buttons */}
            <View
              style={[
                styles.signInfoBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text numberOfLines={2} style={[styles.infoBoxTitle, { color: theme.text }]}>
                {submission.title}
              </Text>
              <Text style={styles.srOnlyText}>Sign detected</Text>
              <Text
                numberOfLines={1}
                style={[styles.infoBoxSubtitle, { color: theme.placeholder }]}
              >
                {[submission.captured, displayLocation].filter(Boolean).join(', ')}
              </Text>
            </View>

            {/* Action button right below the name: location button */}
            <View style={styles.skipToSummaryRow}>
              <AppButton
                accessibilityHint="Di chuyển đến vị trí biển báo trên bản đồ"
                accessibilityLabel="Di chuyển đến vị trí biển báo"
                disabled={isNavigatingToSign}
                onPress={handleNavigateToSignLocation}
                style={[
                  styles.summaryShortcutButton,
                  {
                    borderColor: theme.border,
                  },
                ]}
                testID="move-to-sign-location-button"
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
            </View>

            {/* Bottom Section: Approve (Heart) & Reject (X) Buttons */}
            <View style={styles.actionsFooter}>
              {isRecheckMode && !isEditingVote ? (
                <SubmissionVotedResultCard
                  displayedReviewAction={displayedReviewAction}
                  onFixResult={() => setIsEditingVote(true)}
                  onKeepResult={handleKeepCurrentReview}
                />
              ) : (
                <>
                  {isRecheckMode && isEditingVote ? (
                    <SubmissionEditingBanner onCancel={() => setIsEditingVote(false)} />
                  ) : null}

                  <View
                    style={[styles.diamondContainer, isSmallDevice && styles.diamondContainerSmall]}
                  >
                    {/* Top Button: Arrow pointing up -> Skip (Cannot Identify) */}
                    <View
                      style={[
                        styles.diamondItem,
                        isSmallDevice ? styles.diamondItemSmall : null,
                        isSmallDevice ? styles.diamondTopSmall : styles.diamondTop,
                      ]}
                    >
                      <Pressable
                        accessibilityLabel="Skip submission (cannot identify)"
                        accessibilityRole="button"
                        disabled={isSubmittingReview}
                        onPress={() => completeReview('skipped')}
                        style={({ pressed }) => [
                          styles.diamondButton,
                          isSmallDevice && styles.diamondButtonSmall,
                          styles.neutralDiamondButton,
                          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                          pressed && styles.circleButtonPressed,
                          isSubmittingReview && { opacity: 0.5 },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color={theme.text}
                          name="arrow-up"
                          size={isSmallDevice ? 20 : 24}
                        />
                      </Pressable>
                      <Text
                        style={[
                          styles.diamondLabel,
                          isSmallDevice && styles.diamondLabelSmall,
                          { color: theme.text },
                        ]}
                      >
                        Bỏ qua
                      </Text>
                    </View>

                    {/* Left Button: Decline (X) */}
                    <View
                      style={[
                        styles.diamondItem,
                        isSmallDevice ? styles.diamondItemSmall : null,
                        isSmallDevice ? styles.diamondLeftSmall : styles.diamondLeft,
                      ]}
                    >
                      <Pressable
                        accessibilityLabel="Decline submission"
                        accessibilityRole="button"
                        disabled={isSubmittingReview}
                        onPress={() => setActiveSheet('decline')}
                        style={({ pressed }) => [
                          styles.diamondButton,
                          isSmallDevice && styles.diamondButtonSmall,
                          styles.declineButton,
                          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                          pressed && styles.circleButtonPressed,
                          isSubmittingReview && { opacity: 0.5 },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color={Colors.danger}
                          name="close"
                          size={isSmallDevice ? 22 : 28}
                        />
                      </Pressable>
                      <Text
                        style={[
                          styles.diamondLabel,
                          isSmallDevice && styles.diamondLabelSmall,
                          { color: theme.text },
                        ]}
                      >
                        Từ chối
                      </Text>
                    </View>

                    {/* Right Button: Approve (Heart) */}
                    <View
                      style={[
                        styles.diamondItem,
                        isSmallDevice ? styles.diamondItemSmall : null,
                        isSmallDevice ? styles.diamondRightSmall : styles.diamondRight,
                      ]}
                    >
                      <Pressable
                        accessibilityLabel="Approve submission"
                        accessibilityRole="button"
                        disabled={isSubmittingReview}
                        onPress={() => completeReview('approved')}
                        style={({ pressed }) => [
                          styles.diamondButton,
                          isSmallDevice && styles.diamondButtonSmall,
                          styles.approveButton,
                          pressed && styles.circleButtonPressed,
                          isSubmittingReview && { opacity: 0.5 },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color="#FFFFFF"
                          name="heart"
                          size={isSmallDevice ? 22 : 28}
                        />
                      </Pressable>
                      <Text
                        style={[
                          styles.diamondLabel,
                          isSmallDevice && styles.diamondLabelSmall,
                          { color: theme.text },
                        ]}
                      >
                        Đồng ý
                      </Text>
                    </View>

                    {/* Bottom Button: Report */}
                    <View
                      style={[
                        styles.diamondItem,
                        isSmallDevice ? styles.diamondItemSmall : null,
                        isSmallDevice ? styles.diamondBottomSmall : styles.diamondBottom,
                      ]}
                    >
                      <Pressable
                        accessibilityLabel="Report submission"
                        accessibilityRole="button"
                        disabled={isSubmittingReview}
                        onPress={() => setActiveSheet('report')}
                        style={({ pressed }) => [
                          styles.diamondButton,
                          isSmallDevice && styles.diamondButtonSmall,
                          styles.neutralDiamondButton,
                          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                          pressed && styles.circleButtonPressed,
                          isSubmittingReview && { opacity: 0.5 },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color={theme.textSecondary}
                          name="flag-outline"
                          size={isSmallDevice ? 18 : 22}
                        />
                      </Pressable>
                      <Text
                        style={[
                          styles.diamondLabel,
                          isSmallDevice && styles.diamondLabelSmall,
                          { color: theme.text },
                        ]}
                      >
                        Báo cáo
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* Undo Action (Subtle under the buttons) */}
              {reviewHistory.length > 0 && !recheckingSubmission ? (
                <Pressable
                  accessibilityLabel="Undo last review action"
                  onPress={undoLastAction}
                  style={styles.undoRow}
                >
                  <MaterialCommunityIcons color={theme.placeholder} name="undo-variant" size={14} />
                  <Text style={[styles.undoText, { color: theme.placeholder }]}>Hoàn tác</Text>
                </Pressable>
              ) : (
                <View style={styles.undoSpacer} />
              )}

              {/* Floating Action Button: Question Mark Help Guide */}
              <Pressable
                accessibilityLabel="Hướng dẫn thao tác thẩm định"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsHelpModalVisible(true)}
                style={({ pressed }) => [
                  styles.helpFab,
                  { backgroundColor: theme.primary },
                  pressed && styles.helpFabPressed,
                ]}
              >
                <MaterialCommunityIcons color="#FFFFFF" name="help" size={24} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.completeState}>
            <View style={[styles.completeIcon, { backgroundColor: '#E8F7ED' }]}>
              <MaterialCommunityIcons color="#16803A" name="check" size={36} />
            </View>
            <Text
              accessibilityLabel="Không còn biển báo nào để thẩm định"
              style={[styles.completeTitle, { color: theme.text }]}
            >
              Hoàn tất thẩm định
            </Text>
            <Text style={[styles.completeCopy, { color: theme.textSecondary }]}>
              Bạn đã xem xét toàn bộ các biển báo trong hàng đợi.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <AppButton
                label="Lịch sử thẩm định"
                onPress={() => router.replace('/work/reviewer-history')}
                variant="primary"
              />
              <AppButton
                label="Trang làm việc"
                onPress={() =>
                  router.replace({
                    pathname: '/work',
                    params: { currentRole: 'reviewer' },
                  })
                }
                variant="surface"
              />
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Image Zoom Modal */}
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
            {submission ? (
              <Image
                contentFit={isSignFocused ? 'contain' : 'cover'}
                source={submission.image}
                style={[styles.zoomedImage, isSignFocused && { transform: [{ scale: 1.25 }] }]}
              />
            ) : null}
            <Pressable
              accessibilityLabel="Toggle sign focus in fullscreen"
              accessibilityRole="button"
              hitSlop={12}
              onPress={(e) => {
                e.stopPropagation();
                setIsSignFocused((prev) => !prev);
              }}
              style={styles.zoomFocusToggle}
            >
              <MaterialCommunityIcons
                color="#FFFFFF"
                name={isSignFocused ? 'target' : 'image-filter-center-focus'}
                size={16}
              />
              <Text style={styles.zoomFocusToggleText}>
                {isSignFocused ? 'Chế độ: Focus Biển báo' : 'Chế độ: Toàn cảnh'}
              </Text>
            </Pressable>
          </SafeAreaView>
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

      {/* Decline / Report Bottom Sheet */}
      <ReviewBottomSheet
        declineReason={declineReason}
        declineReasonDetail={declineReasonDetail}
        isSubmitting={isSubmittingReview}
        onChangeDeclineReason={setDeclineReason}
        onChangeDeclineReasonDetail={setDeclineReasonDetail}
        onChangeReportIssueType={setReportIssueType}
        onChangeReportNote={setReportNote}
        onClose={closeSheet}
        onConfirm={activeSheet === 'decline' ? confirmDecline : confirmReport}
        onOpenCatalog={() => setIsCatalogPickerVisible(true)}
        onOpenReport={() => {
          setSelectedRemedySign(undefined);
          setDeclineReason(undefined);
          setDeclineReasonDetail('');
          setActiveSheet('report');
        }}
        onSelectRemedySign={setSelectedRemedySign}
        remedySigns={activeRemedySigns}
        reportIssueType={reportIssueType}
        reportNote={reportNote}
        selectedRemedySign={selectedRemedySign}
        type={activeSheet}
      />

      {/* Report New Sign Type Modal */}
      {submission ? (
        <ReportNewSignTypeModal
          candidateId={submission.id}
          isOpen={isNewSignTypeModalOpen}
          onClose={() => setIsNewSignTypeModalOpen(false)}
          onSubmit={handleConfirmNewSignType}
        />
      ) : null}

      {/* Catalog Sign Picker Modal */}
      <RevalidationSignPickerModal
        onClose={() => setIsCatalogPickerVisible(false)}
        onSelectSign={(sign) => {
          setSelectedRemedySign({
            id: sign.id,
            signCode: sign.signCode,
            nameVi: sign.nameVi,
            nameEn: sign.nameEn,
            imageUrl: sign.representativeImageKey,
          });
          setDeclineReason(undefined);
          setDeclineReasonDetail('');
          setIsCatalogPickerVisible(false);
        }}
        selectedSignId={selectedRemedySign?.id}
        title="Chọn biển báo thay thế từ danh mục"
        visible={isCatalogPickerVisible}
      />

      {/* Review Instruction Modal */}
      <ReviewInstructionModal
        isHelpModalVisible={isHelpModalVisible}
        setIsHelpModalVisible={setIsHelpModalVisible}
      />
    </View>
  );
}
