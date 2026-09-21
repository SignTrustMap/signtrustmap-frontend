import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { AppToast } from '@/components/ui/toast';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  type ReviewActionType,
  useReviewWorkflow,
} from '@/feature/review/context/review-workflow-provider';
import { useTheme } from '@/hooks/use-theme';

export type SubmissionReviewState = 'loading' | 'ready' | 'reviewed';

type SubmissionReviewScreenProps = {
  state?: SubmissionReviewState;
};

type ReviewSheet = 'decline' | 'report';

const declineReasons = [
  'Incorrect Sign Type',
  'Sign Not Found',
  'Too Poor Image Quality',
  'Duplicate Submission',
  'Other',
] as const;

type DeclineReason = (typeof declineReasons)[number];

function SubmissionReviewSkeleton() {
  return (
    <View accessibilityLabel="Loading submissions" style={styles.skeletonContainer}>
      <View style={[styles.skeletonBlock, { width: '100%', height: 4, marginVertical: 8 }]} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonInfoBox} />
      <View style={styles.skeletonDiamond}>
        <View style={[styles.skeletonCircleButton, styles.diamondTop]} />
        <View style={[styles.skeletonCircleButton, styles.diamondLeft]} />
        <View style={[styles.skeletonCircleButton, styles.diamondRight]} />
        <View style={[styles.skeletonCircleButton, styles.diamondBottom]} />
      </View>
    </View>
  );
}

type ReviewBottomSheetProps = {
  declineReason?: DeclineReason;
  declineReasonDetail: string;
  onChangeDeclineReason: (reason: DeclineReason) => void;
  onChangeDeclineReasonDetail: (value: string) => void;
  onChangeReportNote: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  reportNote: string;
  type?: ReviewSheet;
};

function ReviewBottomSheet({
  declineReason,
  declineReasonDetail,
  onChangeDeclineReason,
  onChangeDeclineReasonDetail,
  onChangeReportNote,
  onClose,
  onConfirm,
  reportNote,
  type,
}: ReviewBottomSheetProps) {
  const theme = useTheme();
  const isDecline = type === 'decline';
  const isOther = declineReason === 'Other';
  const canConfirm = isDecline
    ? Boolean(declineReason && (!isOther || declineReasonDetail.trim()))
    : Boolean(reportNote.trim());

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={Boolean(type)}
    >
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close review options" onPress={onClose} style={styles.backdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          enabled={Platform.OS !== 'web'}
          pointerEvents="box-none"
          style={styles.sheetPositioner}
        >
          <SafeAreaView
            edges={['bottom']}
            style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {isDecline ? 'Decline Reason' : 'Report Submission'}
              </Text>
              <AppButton
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.sheetCloseButton}
                variant="ghost"
              >
                <MaterialCommunityIcons color={theme.text} name="close" size={22} />
              </AppButton>
            </View>

            {isDecline ? (
              <ScrollView
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                style={styles.sheetBodyScroll}
              >
                <Text style={[styles.sheetHelper, { color: theme.textSecondary }]}>
                  Please select a reason for declining this sign submission:
                </Text>
                <View style={styles.reasonList}>
                  {declineReasons.map((reason) => {
                    const selected = declineReason === reason;

                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        key={reason}
                        onPress={() => onChangeDeclineReason(reason)}
                        style={[
                          styles.reasonOption,
                          {
                            backgroundColor: selected ? theme.backgroundSelected : theme.surface,
                            borderColor: selected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.reasonLabel, { color: theme.text }]}>{reason}</Text>
                        <View
                          style={[
                            styles.radio,
                            { borderColor: selected ? theme.primary : theme.placeholder },
                          ]}
                        >
                          {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {isOther ? (
                  <View style={styles.reasonInputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>
                      Reason <Text style={{ color: Colors.danger }}>*</Text>
                    </Text>
                    <TextInput
                      accessibilityLabel="Reason, required"
                      multiline
                      onChangeText={onChangeDeclineReasonDetail}
                      placeholder="Please specify the reason"
                      placeholderTextColor={theme.placeholder}
                      style={[
                        styles.reasonInput,
                        { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                      ]}
                      textAlignVertical="top"
                      value={declineReasonDetail}
                    />
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <ScrollView
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                style={styles.sheetBodyScroll}
              >
                <View style={styles.reasonInputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Report Note <Text style={{ color: Colors.danger }}>*</Text>
                  </Text>
                  <TextInput
                    accessibilityLabel="Report Note, required"
                    multiline
                    onChangeText={onChangeReportNote}
                    placeholder="Describe the issue with this submission"
                    placeholderTextColor={theme.placeholder}
                    style={[
                      styles.reasonInput,
                      { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                    ]}
                    textAlignVertical="top"
                    value={reportNote}
                  />
                </View>
                <Text style={[styles.reportHelper, { color: theme.placeholder }]}>
                  Your report will be reviewed by the system administrators.
                </Text>
              </ScrollView>
            )}

            <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
              <AppButton
                label="Cancel"
                onPress={onClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                disabled={!canConfirm}
                label={isDecline ? 'Confirm Decline' : 'Submit Report'}
                onPress={onConfirm}
                style={[
                  styles.sheetFooterButton,
                  { backgroundColor: isDecline ? Colors.danger : theme.primary },
                ]}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function SubmissionReviewScreen({ state = 'ready' }: SubmissionReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const {
    completeCurrentReview,
    pendingSubmissions,
    recheckingPreviousAction,
    recheckingSubmission,
    reviewHistory,
    totalSubmissions,
    undoLastReview,
  } = useReviewWorkflow();

  const [activeSheet, setActiveSheet] = useState<ReviewSheet>();
  const [declineReason, setDeclineReason] = useState<DeclineReason>();
  const [declineReasonDetail, setDeclineReasonDetail] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'default' | 'success';
  }>();

  const displayedReviewAction = recheckingPreviousAction;
  const submission = pendingSubmissions[0];
  const nextSubmission = pendingSubmissions[1];
  const totalInQueue = Math.max(
    totalSubmissions,
    reviewHistory.length + pendingSubmissions.length,
    1,
  );
  console.log(nextSubmission)
  const reviewPosition = Math.min(
    reviewHistory.length + (submission ? 1 : 0),
    totalInQueue,
  );

  const completeReview = useCallback(
    (
      action: ReviewActionType,
      details?: { declineReason?: string; declineNote?: string },
    ) => {
      if (!submission) return;
      const completesReviewQueue = pendingSubmissions.length === 1;

      completeCurrentReview(action, details);

      const toastMessages: Record<ReviewActionType, string> = {
        approved: 'Sign approved',
        declined: 'Sign declined',
        reported: 'Sign reported',
        skipped: 'Sign skipped (cannot identify)',
      };

      setToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message: toastMessages[action],
        tone: action === 'approved' ? 'success' : 'default',
      }));

      if (completesReviewQueue) {
        router.replace('/work/submission-summary');
      }
    },
    [completeCurrentReview, pendingSubmissions.length, router, submission],
  );

  const closeSheet = () => setActiveSheet(undefined);

  const confirmDecline = () => {
    const canDecline = declineReason && (declineReason !== 'Other' || declineReasonDetail.trim());
    if (!canDecline) return;

    completeReview('declined', { declineReason, declineNote: declineReasonDetail });
    setDeclineReason(undefined);
    setDeclineReasonDetail('');
    closeSheet();
  };

  const confirmReport = () => {
    if (!reportNote.trim()) return;

    completeReview('reported', { declineNote: reportNote });
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
            // Vertical swipe: Up -> Skip, Down -> Report
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
    [completeReview, pan],
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
              onPress={() => router.back()}
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
              {submission ? 'REVIEWING' : 'REVIEWED'}{' '}
              {reviewPosition} OF {totalInQueue}
            </Text>
          </View>
        </View>

        {state === 'loading' ? (
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
                  Boolean(nextSubmission) && styles.mainCardOffset,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { rotate },
                    ],
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="Sign submission image. Tap to enlarge."
                  onPress={() => setIsImageZoomed(true)}
                  style={styles.cardInnerPressable}
                >
                  <Image
                    accessibilityLabel={submission.title}
                    contentFit="cover"
                    source={submission.image}
                    style={styles.cardImage}
                    transition={180}
                  />

                  {/* Directional Swipe Badges */}
                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.approveBadge,
                      { opacity: approveBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>APPROVE</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.declineBadge,
                      { opacity: declineBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>DECLINE</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.skipBadge,
                      { opacity: skipBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>SKIP</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.reportBadge,
                      { opacity: reportBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>REPORT</Text>
                  </Animated.View>

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
                                : displayedReviewAction === 'reported'
                                  ? 'rgba(249, 115, 22, 0.9)'
                                  : 'rgba(100, 116, 139, 0.9)',
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeLabel}>
                        {displayedReviewAction.toUpperCase()}
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
              <Text numberOfLines={1} style={[styles.infoBoxSubtitle, { color: theme.placeholder }]}>
                {submission.captured}
                {submission.location && submission.location !== 'Estimated GPS coordinates available'
                  ? ` • ${submission.location}`
                  : ''}
              </Text>
            </View>

            {/* Bottom Section: Approve (Heart) & Reject (X) Buttons */}
            <View style={styles.actionsFooter}>
              <View style={styles.diamondContainer}>
                {/* Top Button: Arrow pointing up -> Skip (Cannot Identify) */}
                <Pressable
                  accessibilityLabel="Skip submission (cannot identify)"
                  accessibilityRole="button"
                  onPress={() => completeReview('skipped')}
                  style={({ pressed }) => [
                    styles.diamondButton,
                    styles.diamondTop,
                    styles.neutralDiamondButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    pressed && styles.circleButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons color={theme.text} name="arrow-up" size={24} />
                </Pressable>

                {/* Left Button: Decline (X) */}
                <Pressable
                  accessibilityLabel="Decline submission"
                  accessibilityRole="button"
                  onPress={() => setActiveSheet('decline')}
                  style={({ pressed }) => [
                    styles.diamondButton,
                    styles.diamondLeft,
                    styles.declineButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    pressed && styles.circleButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons color={Colors.danger} name="close" size={28} />
                </Pressable>

                {/* Right Button: Approve (Heart) */}
                <Pressable
                  accessibilityLabel="Approve submission"
                  accessibilityRole="button"
                  onPress={() => completeReview('approved')}
                  style={({ pressed }) => [
                    styles.diamondButton,
                    styles.diamondRight,
                    styles.approveButton,
                    pressed && styles.circleButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons color="#FFFFFF" name="heart" size={28} />
                </Pressable>

                {/* Bottom Button: Report */}
                <Pressable
                  accessibilityLabel="Report submission"
                  accessibilityRole="button"
                  onPress={() => setActiveSheet('report')}
                  style={({ pressed }) => [
                    styles.diamondButton,
                    styles.diamondBottom,
                    styles.neutralDiamondButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    pressed && styles.circleButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons color={theme.textSecondary} name="flag-outline" size={22} />
                </Pressable>
              </View>

              {/* Undo Action (Subtle under the buttons) */}
              {reviewHistory.length > 0 && !recheckingSubmission ? (
                <Pressable
                  accessibilityLabel="Undo last review action"
                  onPress={undoLastAction}
                  style={styles.undoRow}
                >
                  <MaterialCommunityIcons color={theme.placeholder} name="undo-variant" size={14} />
                  <Text style={[styles.undoText, { color: theme.placeholder }]}>
                    Undo last action
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.undoSpacer} />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.completeState}>
            <View style={[styles.completeIcon, { backgroundColor: '#E8F7ED' }]}>
              <MaterialCommunityIcons color="#16803A" name="check" size={36} />
            </View>
            <Text style={[styles.completeTitle, { color: theme.text }]}>All reviews completed</Text>
            <Text style={[styles.completeCopy, { color: theme.textSecondary }]}>
              You have reviewed all available sign submissions.
            </Text>
            {reviewHistory.length > 0 ? (
              <AppButton
                label="View Summary"
                onPress={() => router.replace('/work/submission-summary')}
                style={styles.completeSummaryButton}
              />
            ) : null}
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
          accessibilityLabel="Close enlarged view"
          onPress={() => setIsImageZoomed(false)}
          style={styles.zoomBackdrop}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.zoomSafeArea}>
            <Pressable
              accessibilityLabel="Close enlarged view"
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => setIsImageZoomed(false)}
              style={[
                styles.zoomCloseBtn,
                { top: Math.max(insets.top, 16) + 12 },
              ]}
            >
              <MaterialCommunityIcons color="#FFFFFF" name="close" size={26} />
            </Pressable>
            {submission ? (
              <Image
                contentFit="contain"
                source={submission.image}
                style={styles.zoomedImage}
              />
            ) : null}
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
          placement="center"
          tone={toast.tone}
        />
      ) : null}

      {/* Decline / Report Bottom Sheet */}
      <ReviewBottomSheet
        declineReason={declineReason}
        declineReasonDetail={declineReasonDetail}
        onChangeDeclineReason={(reason) => {
          setDeclineReason(reason);
          if (reason !== 'Other') setDeclineReasonDetail('');
        }}
        onChangeDeclineReasonDetail={setDeclineReasonDetail}
        onChangeReportNote={setReportNote}
        onClose={closeSheet}
        onConfirm={activeSheet === 'decline' ? confirmDecline : confirmReport}
        reportNote={reportNote}
        type={activeSheet}
      />
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
  progressSection: {
    paddingHorizontal: Spacing.two,
    paddingTop: 4,
    paddingBottom: 4,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  topBarSpacer: {
    width: 36,
    height: 36,
  },
  progressTrackWrapper: {
    flex: 1,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressCounterRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  progressCounterText: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.one,
    position: 'relative',
  },
  mainCard: {
    width: '88%',
    maxWidth: 324,
    height: '100%',
    maxHeight: 380,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  mainCardOffset: {
    transform: [{ translateX: -12 }],
  },
  peekCard: {
    position: 'absolute',
    width: '88%',
    maxWidth: 324,
    height: '100%',
    maxHeight: 380,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
    transform: [{ translateX: 22 }, { scale: 0.94 }],
    opacity: 0.82,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  peekDimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInnerPressable: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  swipeBadge: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  swipeBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  approveBadge: {
    top: 24,
    left: 20,
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    transform: [{ rotate: '-14deg' }],
  },
  declineBadge: {
    top: 24,
    right: 20,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    transform: [{ rotate: '14deg' }],
  },
  skipBadge: {
    bottom: 24,
    alignSelf: 'center',
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
  },
  reportBadge: {
    top: 24,
    alignSelf: 'center',
    borderColor: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusBadgeLabel: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signInfoBox: {
    width: '88%',
    maxWidth: 324,
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoBoxTitle: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  infoBoxSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 2,
  },
  zoomButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  diamondContainer: {
    width: 168,
    height: 168,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  diamondButton: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondTop: {
    top: 0,
    left: 57,
  },
  diamondBottom: {
    bottom: 0,
    left: 57,
  },
  diamondLeft: {
    left: 0,
    top: 57,
  },
  diamondRight: {
    right: 0,
    top: 57,
  },
  circleButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.88,
  },
  neutralDiamondButton: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  declineButton: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  approveButton: {
    backgroundColor: Colors.primary,
    shadowColor: '#FF4767',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 7,
  },
  undoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  undoText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  undoSpacer: {
    height: 30,
  },
  checkedReviewFooter: {
    gap: 10,
    paddingVertical: Spacing.one,
  },
  reviewedStatusBanner: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  reviewedStatusLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '800',
  },
  checkNavRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkNavBtn: {
    flex: 1,
    minHeight: 44,
  },
  completeState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  completeIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    marginBottom: Spacing.one,
  },
  completeTitle: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  completeCopy: {
    maxWidth: 320,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  completeSummaryButton: {
    minWidth: 200,
    marginTop: Spacing.two,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheetPositioner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: Rounded.lg,
    borderTopRightRadius: Rounded.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 34,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    marginTop: Spacing.one,
  },
  sheetHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.half,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  sheetCloseButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sheetBody: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  sheetBodyScroll: {
    flexShrink: 1,
  },
  sheetHelper: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  reasonList: {
    gap: 6,
  },
  reasonOption: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
  },
  reasonLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  radio: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonInputGroup: {
    gap: Spacing.half,
  },
  inputLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  reasonInput: {
    height: 88,
    minHeight: 88,
    maxHeight: 88,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  reportHelper: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: Spacing.one,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
  sheetFooterButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
  },
  skeletonContainer: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  skeletonBlock: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonCard: {
    width: '88%',
    maxWidth: 324,
    height: 300,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  skeletonInfoBox: {
    height: 48,
    width: '88%',
    maxWidth: 324,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginVertical: 6,
  },
  skeletonDiamond: {
    width: 168,
    height: 168,
    position: 'relative',
    alignSelf: 'center',
    marginVertical: Spacing.two,
  },
  skeletonCircleButton: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E2E8F0',
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  zoomSafeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 999,
    elevation: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomedImage: {
    width: '100%',
    height: '85%',
  },
});