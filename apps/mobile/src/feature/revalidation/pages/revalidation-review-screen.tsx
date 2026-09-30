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
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format-date';
import type {
  EvidenceVoteDto,
  RevalDecision,
  RevalidationQueueEvidenceItem,
} from '@/types/revalidationType';
import {
  useGetRevalidationEvidenceQueue,
  useVoteOnRevalidationEvidence,
} from '../hooks/use-revalidation';
import { resolveS3Url } from '@/api/reviews/review-workflow';

export type RevalidationReviewAction = 'STILL_ACTIVE' | 'REMOVED' | 'CHANGED' | 'UNCLEAR';

type SheetType = 'changed' | 'removed' | 'unclear';

function RevalidationReviewSkeleton() {
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

type RevalidationBottomSheetProps = {
  type?: SheetType;
  onClose: () => void;
  onConfirm: (note: string) => void;
};

function RevalidationBottomSheet({ type, onClose, onConfirm }: RevalidationBottomSheetProps) {
  const theme = useTheme();
  const [note, setNote] = useState('');

  const title =
    type === 'changed'
      ? 'Sign Type Changed'
      : type === 'removed'
        ? 'Confirm Sign Removed'
        : 'Mark Unclear / Invalid';

  const helperText =
    type === 'changed'
      ? 'Explain how the physical sign differs from the baseline catalog sign:'
      : type === 'removed'
        ? 'Confirm that the traffic sign is no longer present on the pole or road shoulder:'
        : 'Specify why this evidence is unclear (e.g. blurry, obstructed, night glare, incorrect location):';

  const confirmColor =
    type === 'removed' ? Colors.danger : type === 'changed' ? '#D97706' : theme.primary;

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
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
              <AppButton
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.sheetCloseButton}
                variant="ghost"
              >
                <MaterialCommunityIcons color={theme.text} name="close" size={22} />
              </AppButton>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
              style={styles.sheetBodyScroll}
            >
              <Text style={[styles.sheetHelper, { color: theme.textSecondary }]}>{helperText}</Text>
              <View style={styles.reasonInputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Reviewer Note {type === 'changed' ? <Text style={{ color: Colors.danger }}>*</Text> : '(optional)'}
                </Text>
                <TextInput
                  accessibilityLabel="Reviewer observation note"
                  multiline
                  onChangeText={setNote}
                  placeholder="Enter observation details..."
                  placeholderTextColor={theme.placeholder}
                  style={[
                    styles.reasonInput,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  textAlignVertical="top"
                  value={note}
                />
              </View>
            </ScrollView>

            <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
              <AppButton
                label="Cancel"
                onPress={onClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                label="Confirm Vote"
                onPress={() => onConfirm(note)}
                style={[
                  styles.sheetFooterButton,
                  { backgroundColor: confirmColor },
                ]}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function RevalidationReviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { data: queueResponse, isLoading } = useGetRevalidationEvidenceQueue({ page: 1, pageSize: 30 });
  const voteMutation = useVoteOnRevalidationEvidence();

  // Local state for queue manipulation and review progress
  const [items, setItems] = useState<RevalidationQueueEvidenceItem[]>([]);
  const [history, setHistory] = useState<Array<{ item: RevalidationQueueEvidenceItem; action: RevalidationReviewAction }>>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Active view toggle between surveyor evidence photo and baseline catalog sign
  const [viewMode, setViewMode] = useState<'evidence' | 'baseline'>('evidence');

  // Modal and toast states
  const [activeSheet, setActiveSheet] = useState<SheetType>();
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string; tone: 'default' | 'success' }>();

  // Synchronize incoming queue items
  useEffect(() => {
    if (queueResponse?.items && items.length === 0 && history.length === 0) {
      setItems(queueResponse.items);
      setTotalCount(queueResponse.total || queueResponse.items.length);
    }
  }, [queueResponse, items.length, history.length]);

  const currentItem = items[0];
  const nextItem = items[1];

  const reviewPosition = Math.min(history.length + (currentItem ? 1 : 0), Math.max(totalCount, 1));
  const progressPercent = Math.min(100, (reviewPosition / Math.max(totalCount, 1)) * 100);

  // ---------------------------------------------------------------------------
  // Action Handler
  // ---------------------------------------------------------------------------
  const handleVote = useCallback(
    (action: RevalidationReviewAction, note?: string) => {
      if (!currentItem) return;

      const evidenceId = currentItem.evidenceId;
      const decisionMap: Record<RevalidationReviewAction, RevalDecision> = {
        STILL_ACTIVE: 'STILL_ACTIVE',
        REMOVED: 'REMOVED',
        CHANGED: 'CHANGED',
        UNCLEAR: 'UNCLEAR',
      };

      const dto: EvidenceVoteDto = {
        decision: decisionMap[action],
        note: note || undefined,
      };

      // Optimistically advance queue
      setItems((prev) => prev.slice(1));
      setHistory((prev) => [...prev, { item: currentItem, action }]);
      setViewMode('evidence');

      // Submit vote to backend
      voteMutation.mutate({ evidenceId, dto });

      const messages: Record<RevalidationReviewAction, string> = {
        STILL_ACTIVE: 'Confirmed: Sign Still Active',
        REMOVED: 'Confirmed: Sign Removed',
        CHANGED: 'Voted: Sign Type Changed',
        UNCLEAR: 'Marked as Unclear / Invalid Evidence',
      };

      setToast((cur) => ({
        id: (cur?.id ?? 0) + 1,
        message: messages[action],
        tone: action === 'STILL_ACTIVE' ? 'success' : 'default',
      }));
    },
    [currentItem, voteMutation],
  );

  const handleUndo = () => {
    const last = history[history.length - 1];
    if (!last) return;

    setHistory((prev) => prev.slice(0, -1));
    setItems((prev) => [last.item, ...prev]);
    setToast(undefined);
  };

  // ---------------------------------------------------------------------------
  // Swipe Gestures: Right -> STILL_ACTIVE, Left -> REMOVED, Up -> CHANGED, Down -> UNCLEAR
  // ---------------------------------------------------------------------------
  const [pan] = useState(() => new Animated.ValueXY());

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [currentItem?.evidenceId, pan]);

  const rotate = pan.x.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ['-14deg', '0deg', '14deg'],
    extrapolate: 'clamp',
  });

  const activeBadgeOpacity = pan.x.interpolate({
    inputRange: [15, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const removedBadgeOpacity = pan.x.interpolate({
    inputRange: [-80, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const changedBadgeOpacity = pan.y.interpolate({
    inputRange: [-80, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const unclearBadgeOpacity = pan.y.interpolate({
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
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, { dx, dy, vx, vy }) => {
          const SWIPE_THRESHOLD = 90;
          const isHorizontal = Math.abs(dx) > Math.abs(dy);

          if (isHorizontal) {
            // Horizontal swipe: Right -> STILL_ACTIVE, Left -> REMOVED
            if (dx > SWIPE_THRESHOLD || (dx > 35 && vx > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: 500, y: dy },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                handleVote('STILL_ACTIVE');
              });
              return;
            } else if (dx < -SWIPE_THRESHOLD || (dx < -35 && vx < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: -500, y: dy },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('removed');
              });
              return;
            }
          } else {
            // Vertical swipe: Up -> CHANGED, Down -> UNCLEAR
            if (dy < -SWIPE_THRESHOLD || (dy < -35 && vy < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: dx, y: -500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('changed');
              });
              return;
            } else if (dy > SWIPE_THRESHOLD || (dy > 35 && vy > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: dx, y: 500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('unclear');
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
    [handleVote, pan],
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
        {/* Top Progress Bar & Navigation Controls */}
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
              {currentItem ? 'EVALUATING EVIDENCE' : 'EVALUATION COMPLETED'}{' '}
              {reviewPosition} OF {Math.max(totalCount, 1)}
            </Text>
          </View>
        </View>

        {isLoading && items.length === 0 ? (
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
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Image
                    contentFit="cover"
                    source={{ uri: resolveS3Url(nextItem.evidence.mediaUrl || nextItem.verifiedSign.signCropUrl) }}
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
                  Boolean(nextItem) && styles.mainCardOffset,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="Evidence image. Tap to enlarge."
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
                  <Animated.View
                    style={[styles.swipeBadge, styles.activeBadge, { opacity: activeBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>STILL ACTIVE</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.swipeBadge, styles.removedBadge, { opacity: removedBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>REMOVED</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.swipeBadge, styles.changedBadge, { opacity: changedBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>CHANGED</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.swipeBadge, styles.unclearBadge, { opacity: unclearBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>UNCLEAR</Text>
                  </Animated.View>

                  {/* Zoom button */}
                  <View style={styles.zoomButton}>
                    <MaterialCommunityIcons color="#FFFFFF" name="magnify-plus-outline" size={18} />
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            {/* Additional Information Box Displayed Below The Corresponding Images */}
            <View
              style={[
                styles.signInfoBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Row 1: Sign Code & Name with Surveyor Stated Status */}
              <View style={styles.infoTopRow}>
                <View style={styles.infoCodeContainer}>
                  <Text numberOfLines={1} style={[styles.infoSignCode, { color: theme.text }]}>
                    {currentItem.verifiedSign.signCode}
                  </Text>
                  <Text numberOfLines={1} style={[styles.infoSignName, { color: theme.textSecondary }]}>
                    {currentItem.verifiedSign.nameVi || currentItem.verifiedSign.nameEn || 'Traffic Sign'}
                  </Text>
                </View>

                {/* Surveyor Stated Evidence Type Badge */}
                <View
                  style={[
                    styles.surveyorStatusBadge,
                    currentItem.evidence.evidenceType === 'REMOVED'
                      ? styles.surveyorStatusRemoved
                      : styles.surveyorStatusActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    color={currentItem.evidence.evidenceType === 'REMOVED' ? '#DC2626' : '#16A34A'}
                    name={currentItem.evidence.evidenceType === 'REMOVED' ? 'alert-circle-outline' : 'check-circle-outline'}
                    size={13}
                  />
                  <Text
                    style={[
                      styles.surveyorStatusText,
                      { color: currentItem.evidence.evidenceType === 'REMOVED' ? '#DC2626' : '#16A34A' },
                    ]}
                  >
                    {currentItem.evidence.evidenceType === 'REMOVED' ? 'REPORTED REMOVED' : 'REPORTED ACTIVE'}
                  </Text>
                </View>
              </View>

              {/* Row 2: GPS Distance & Capture Time Telemetry */}
              <View style={styles.telemetryRow}>
                <View style={styles.telemetryItem}>
                  <MaterialCommunityIcons color={theme.placeholder} name="map-marker-distance" size={15} />
                  <Text style={[styles.telemetryText, { color: theme.placeholder }]}>
                    {currentItem.evidence.distanceMeters != null
                      ? `${currentItem.evidence.distanceMeters}m from pole`
                      : 'Proximity verified'}
                  </Text>
                </View>

                <View style={styles.telemetryItem}>
                  <MaterialCommunityIcons color={theme.placeholder} name="clock-outline" size={14} />
                  <Text style={[styles.telemetryText, { color: theme.placeholder }]}>
                    {formatDate(currentItem.evidence.submittedAt)}
                  </Text>
                </View>
              </View>

              {/* Row 3: Consensus Progress, Reward Credits & Baseline Freshness */}
              <View style={[styles.metricsDivider, { backgroundColor: theme.border }]} />
              <View style={styles.metricsRow}>
                <View style={[styles.metricPill, { backgroundColor: `${theme.primary}12` }]}>
                  <MaterialCommunityIcons color={theme.primary} name="vote-outline" size={14} />
                  <Text style={[styles.metricPillText, { color: theme.primary }]}>
                    {currentItem.currentVoteCount} / 3 votes
                  </Text>
                </View>

                <View style={[styles.metricPill, { backgroundColor: '#F0FDF4' }]}>
                  <MaterialCommunityIcons color="#16A34A" name="gift-outline" size={14} />
                  <Text style={[styles.metricPillText, { color: '#16A34A' }]}>
                    +{currentItem.rewardCredits} credits
                  </Text>
                </View>

                <View style={[styles.metricPill, { backgroundColor: '#FFF7ED' }]}>
                  <MaterialCommunityIcons color="#C2410C" name="speedometer" size={14} />
                  <Text style={[styles.metricPillText, { color: '#C2410C' }]}>
                    Score: {scorePercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions: 4-Way Diamond Decision Buttons */}
            <View style={styles.actionsFooter}>
              <View style={styles.diamondContainer}>
                {/* Top Button: CHANGED Sign Type */}
                <Pressable
                  accessibilityLabel="Sign type changed"
                  accessibilityRole="button"
                  onPress={() => setActiveSheet('changed')}
                  style={({ pressed }) => [
                    styles.diamondButton,
                    styles.diamondTop,
                    styles.neutralDiamondButton,
                    { backgroundColor: theme.backgroundElement, borderColor: '#F59E0B' },
                    pressed && styles.circleButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons color="#D97706" name="swap-horizontal" size={26} />
                </Pressable>

                {/* Left Button: CONFIRM REMOVED (X) */}
                <Pressable
                  accessibilityLabel="Confirm sign is removed"
                  accessibilityRole="button"
                  onPress={() => setActiveSheet('removed')}
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

                {/* Right Button: CONFIRM ACTIVE (Check) */}
                <Pressable
                  accessibilityLabel="Confirm sign is still active"
                  accessibilityRole="button"
                  onPress={() => handleVote('STILL_ACTIVE')}
                  style={({ pressed }) => [
                    styles.diamondButton,
                    styles.diamondRight,
                    styles.approveButton,
                    pressed && styles.circleButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons color="#FFFFFF" name="check-bold" size={26} />
                </Pressable>

                {/* Bottom Button: UNCLEAR / INVALID */}
                <Pressable
                  accessibilityLabel="Mark unclear or invalid"
                  accessibilityRole="button"
                  onPress={() => setActiveSheet('unclear')}
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

              {/* Undo Action */}
              {history.length > 0 ? (
                <Pressable accessibilityLabel="Undo last review vote" onPress={handleUndo} style={styles.undoRow}>
                  <MaterialCommunityIcons color={theme.placeholder} name="undo-variant" size={14} />
                  <Text style={[styles.undoText, { color: theme.placeholder }]}>Undo last vote</Text>
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
            <Text style={[styles.completeTitle, { color: theme.text }]}>All evidence evaluated</Text>
            <Text style={[styles.completeCopy, { color: theme.textSecondary }]}>
              You have reviewed all available on-site revalidation submissions in this queue.
            </Text>
            <AppButton
              label="Back to Work"
              onPress={() => router.back()}
              style={styles.completeSummaryButton}
            />
          </View>
        )}
      </SafeAreaView>

      {/* Decision Note Bottom Sheet */}
      <RevalidationBottomSheet
        onClose={() => setActiveSheet(undefined)}
        onConfirm={(note) => {
          if (activeSheet === 'changed') handleVote('CHANGED', note);
          else if (activeSheet === 'removed') handleVote('REMOVED', note);
          else if (activeSheet === 'unclear') handleVote('UNCLEAR', note);
          setActiveSheet(undefined);
        }}
        type={activeSheet}
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
  imageSourceToggleContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 3,
    gap: 4,
    zIndex: 10,
  },
  imageSourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageSourcePillActive: {
    backgroundColor: '#0671EB',
  },
  imageSourcePillText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  imageSourcePillTextActive: {
    color: '#FFFFFF',
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
  activeBadge: {
    top: 24,
    left: 20,
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    transform: [{ rotate: '-14deg' }],
  },
  removedBadge: {
    top: 24,
    right: 20,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    transform: [{ rotate: '14deg' }],
  },
  changedBadge: {
    top: 24,
    alignSelf: 'center',
    borderColor: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
  },
  unclearBadge: {
    bottom: 24,
    alignSelf: 'center',
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
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
  signInfoBox: {
    width: '88%',
    maxWidth: 324,
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    width: '100%',
  },
  infoCodeContainer: {
    flex: 1,
  },
  infoSignCode: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  infoSignName: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  surveyorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  surveyorStatusActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  surveyorStatusRemoved: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  surveyorStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.three,
    width: '100%',
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricsDivider: {
    height: 1,
    width: '100%',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricPillText: {
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
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
