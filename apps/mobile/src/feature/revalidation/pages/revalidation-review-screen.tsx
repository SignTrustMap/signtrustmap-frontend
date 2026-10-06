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

import { useQueryClient } from '@tanstack/react-query';

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
import { useInvalidateWalletAndStats } from '@/feature/credits/hooks/use-wallet';

export type RevalidationReviewAction = 'STILL_ACTIVE' | 'REMOVED' | 'CHANGED' | 'UNCLEAR';

type SheetType = 'changed' | 'removed' | 'unclear';

const revalSummaryActionDetails: Record<
  RevalidationReviewAction,
  { color: string; label: string; summary: string; symbol: string }
> = {
  STILL_ACTIVE: {
    color: '#16A34A',
    label: 'Still Active',
    summary: 'Confirmed still active on-site.',
    symbol: '✓',
  },
  REMOVED: {
    color: Colors.danger,
    label: 'Removed',
    summary: 'Confirmed removed from site.',
    symbol: '×',
  },
  CHANGED: {
    color: '#F97316',
    label: 'Changed',
    summary: 'Sign type or details changed.',
    symbol: '⇄',
  },
  UNCLEAR: {
    color: '#2563EB',
    label: 'Unclear',
    summary: 'Cannot identify sign / unclear.',
    symbol: '?',
  },
};

function RevalSummaryMetric({ action, count }: { action: RevalidationReviewAction; count: number }) {
  const theme = useTheme();
  const details = revalSummaryActionDetails[action];

  return (
    <View
      style={[
        styles.summaryMetric,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={[styles.summaryMetricSymbol, { borderColor: details.color }]}>
        <Text style={[styles.summaryMetricSymbolLabel, { color: details.color }]}>{details.symbol}</Text>
      </View>
      <Text style={[styles.summaryMetricCount, { color: theme.text }]}>{count}</Text>
      <Text style={[styles.summaryMetricLabel, { color: details.color }]}>
        {details.label.toUpperCase()}
      </Text>
    </View>
  );
}

function RevalReviewedSignRow({
  record,
}: {
  record: {
    item: RevalidationQueueEvidenceItem;
    action: RevalidationReviewAction;
    note?: string;
  };
}) {
  const theme = useTheme();
  const details = revalSummaryActionDetails[record.action];
  const imageUri = record.item.evidence.mediaUrl || record.item.verifiedSign.signCropUrl;

  return (
    <View
      style={[
        styles.summarySignRow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      {imageUri ? (
        <Image
          accessibilityLabel={record.item.verifiedSign.signCode}
          contentFit="cover"
          source={{ uri: resolveS3Url(imageUri) }}
          style={styles.summarySignImage}
        />
      ) : (
        <View
          style={[
            styles.summarySignImage,
            { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <MaterialCommunityIcons color={theme.placeholder} name="traffic-light" size={24} />
        </View>
      )}
      <View style={styles.summarySignCopy}>
        <Text numberOfLines={1} style={[styles.summarySignName, { color: theme.text }]}>
          {record.item.verifiedSign.nameVi ||
            record.item.verifiedSign.nameEn ||
            record.item.verifiedSign.signCode ||
            'Traffic Sign'}
        </Text>
        <Text numberOfLines={1} style={[styles.summarySignLocation, { color: theme.textSecondary }]}>
          {record.item.verifiedSign.signCode}
          {record.item.evidence.distanceMeters != null
            ? ` • ${record.item.evidence.distanceMeters}m from original location`
            : ' • Proximity verified'}
        </Text>
        <Text numberOfLines={1} style={[styles.summarySignSummary, { color: theme.placeholder }]}>
          {record.note ? `Note: ${record.note}` : details.summary}
        </Text>
      </View>
      <View style={[styles.summaryStatusBadge, { backgroundColor: `${details.color}18` }]}>
        <Text style={[styles.summaryStatusLabel, { color: details.color }]}>{details.label}</Text>
      </View>
    </View>
  );
}

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
  onConfirm: (note: string, suggestedSignTypeId?: number) => void;
};

function RevalidationBottomSheet({ type, onClose, onConfirm }: RevalidationBottomSheetProps) {
  const theme = useTheme();
  const [note, setNote] = useState('');
  const [suggestedTypeId, setSuggestedTypeId] = useState('');

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

  const handleConfirm = () => {
    const parsedId = suggestedTypeId.trim() ? parseInt(suggestedTypeId.trim(), 10) : undefined;
    onConfirm(note, Number.isFinite(parsedId) ? parsedId : undefined);
    setNote('');
    setSuggestedTypeId('');
  };

  const handleClose = () => {
    setNote('');
    setSuggestedTypeId('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={Boolean(type)}
    >
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close review options" onPress={handleClose} style={styles.backdrop} />
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
                onPress={handleClose}
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
              {type === 'changed' ? (
                <View style={styles.reasonInputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Suggested Sign Type ID (optional)
                  </Text>
                  <TextInput
                    accessibilityLabel="Suggested sign type id"
                    keyboardType="number-pad"
                    onChangeText={setSuggestedTypeId}
                    placeholder="e.g. 42"
                    placeholderTextColor={theme.placeholder}
                    style={[
                      styles.singleLineInput,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={suggestedTypeId}
                  />
                </View>
              ) : null}
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
                onPress={handleClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                label="Confirm Vote"
                onPress={handleConfirm}
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

  const queryClient = useQueryClient();
  const invalidateWalletAndStats = useInvalidateWalletAndStats();

  // Local state for queue manipulation and review progress
  const [items, setItems] = useState<RevalidationQueueEvidenceItem[]>([]);
  const [history, setHistory] = useState<
    Array<{ item: RevalidationQueueEvidenceItem; action: RevalidationReviewAction; note?: string }>
  >([]);
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

  const counts = useMemo(() => {
    return history.reduce<Record<RevalidationReviewAction, number>>(
      (res, rev) => ({ ...res, [rev.action]: (res[rev.action] || 0) + 1 }),
      { STILL_ACTIVE: 0, REMOVED: 0, CHANGED: 0, UNCLEAR: 0 },
    );
  }, [history]);

  // ---------------------------------------------------------------------------
  // Action Handler: immediately calls vote API upon swipe or action confirmation
  // ---------------------------------------------------------------------------
  const handleVote = useCallback(
    (action: RevalidationReviewAction, note?: string, suggestedSignTypeId?: number) => {
      if (!currentItem) return;

      const itemToVote = currentItem;

      // 1. Optimistically advance queue and store in history for summary metrics
      setItems((prev) => prev.slice(1));
      setHistory((prev) => [...prev, { item: itemToVote, action, note }]);
      setViewMode('evidence');

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

      // 2. Immediately dispatch vote API call for this evidence
      const decisionMap: Record<RevalidationReviewAction, RevalDecision> = {
        STILL_ACTIVE: 'STILL_ACTIVE',
        REMOVED: 'REMOVED',
        CHANGED: 'CHANGED',
        UNCLEAR: 'UNCLEAR',
      };

      voteMutation.mutate(
        {
          evidenceId: itemToVote.evidenceId,
          dto: {
            decision: decisionMap[action],
            note: note || undefined,
            suggestedSignTypeId: Number.isFinite(suggestedSignTypeId) ? suggestedSignTypeId : undefined,
          },
        },
        {
          onSuccess: () => {
            invalidateWalletAndStats();
          },
          onError: (err: any) => {
            console.error('[RevalidationReview] Vote API failed for evidence:', itemToVote.evidenceId, err);
            setToast({
              id: Date.now(),
              message: err?.message || 'Vote failed to record. Please check your connection.',
              tone: 'default',
            });
          },
        },
      );
    },
    [currentItem, invalidateWalletAndStats, voteMutation],
  );

  const handleFinishReviews = () => {
    const reviewedCount = history.length;
    void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });
    void queryClient.invalidateQueries({ queryKey: ['reviewer-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    invalidateWalletAndStats();

    setHistory([]);
    setItems([]);
    router.replace({
      pathname: '/work/submission-finish',
      params: { count: String(reviewedCount) },
    });
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
        {/* Top Progress Bar & Navigation Controls (Active Evaluation Mode Only) */}
        {currentItem ? (
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
                EVALUATING EVIDENCE {reviewPosition} OF {Math.max(totalCount, 1)}
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
              <Text style={{ marginTop: Spacing.two, color: theme.placeholder }}>
                Click to enlarge if no signs are visible
              </Text>
            </View>
            {/* =============================================================== */}
            {/* 2. COMPARISON SECTION: NEW EVIDENCE (LEFT) VS BASELINE (RIGHT)  */}
            {/* =============================================================== */}
            <View
              style={[
                styles.comparisonBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.comparisonColumnsRow}>
                {/* ----------------------------------------------------------- */}
                {/* LEFT COLUMN: NEW EVIDENCE (ON-SITE SUBMISSION)               */}
                {/* ----------------------------------------------------------- */}
                <View style={styles.comparisonColumn}>
                  <View style={styles.columnHeaderRow}>
                    <MaterialCommunityIcons color={theme.primary} name="camera-marker" size={13} />
                    <Text style={[styles.columnLabel, { color: theme.textSecondary }]}>
                      NEW EVIDENCE
                    </Text>
                  </View>

                  {/* Surveyor Stated Evidence Type Badge */}
                  <View
                    style={[
                      styles.evidenceStatusBadge,
                      currentItem.evidence.evidenceType === 'REMOVED'
                        ? styles.surveyorStatusRemoved
                        : currentItem.evidence.evidenceType === 'CHANGED'
                          ? styles.surveyorStatusChanged
                          : styles.surveyorStatusActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      color={
                        currentItem.evidence.evidenceType === 'REMOVED'
                          ? '#DC2626'
                          : currentItem.evidence.evidenceType === 'CHANGED'
                            ? '#D97706'
                            : '#16A34A'
                      }
                      name={
                        currentItem.evidence.evidenceType === 'REMOVED'
                          ? 'alert-circle-outline'
                          : currentItem.evidence.evidenceType === 'CHANGED'
                            ? 'swap-horizontal'
                            : 'check-circle-outline'
                      }
                      size={11}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.surveyorStatusText,
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
                        ? 'REPORTED REMOVED'
                        : currentItem.evidence.evidenceType === 'CHANGED'
                          ? 'REPORTED CHANGED'
                          : 'REPORTED ACTIVE'}
                    </Text>
                  </View>

                  {/* Condition Title */}
                  <Text numberOfLines={1} style={[styles.comparisonTitle, { color: theme.text }]}>
                    {currentItem.evidence.evidenceType === 'CHANGED'
                      ? 'Observed: Replaced'
                      : currentItem.evidence.evidenceType === 'REMOVED'
                        ? 'Observed: Removed'
                        : 'Observed: Still Active'}
                  </Text>

                  {/* Distance & Timestamp Telemetry */}
                  <View style={styles.columnTelemetryList}>
                    <View style={styles.telemetryItem}>
                      <MaterialCommunityIcons color={theme.placeholder} name="map-marker-distance" size={12} />
                      <Text numberOfLines={1} style={[styles.telemetryText, { color: theme.placeholder }]}>
                        {currentItem.evidence.distanceMeters != null
                          ? `${currentItem.evidence.distanceMeters}m away`
                          : 'Proximity verified'}
                      </Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <MaterialCommunityIcons color={theme.placeholder} name="clock-outline" size={12} />
                      <Text numberOfLines={1} style={[styles.telemetryText, { color: theme.placeholder }]}>
                        {formatDate(currentItem.evidence.submittedAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ----------------------------------------------------------- */}
                {/* CENTER DIVIDER WITH "VS" BADGE                              */}
                {/* ----------------------------------------------------------- */}
                <View style={styles.dividerWrapper}>
                  <View style={[styles.verticalDividerLine, { backgroundColor: theme.border }]} />
                  <View
                    style={[
                      styles.vsBadge,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.vsBadgeText, { color: theme.placeholder }]}>VS</Text>
                  </View>
                  <View style={[styles.verticalDividerLine, { backgroundColor: theme.border }]} />
                </View>

                {/* ----------------------------------------------------------- */}
                {/* RIGHT COLUMN: BASELINE RECORD (HISTORICAL SIGN)             */}
                {/* ----------------------------------------------------------- */}
                <View style={styles.comparisonColumn}>
                  <View style={styles.columnHeaderRow}>
                    <MaterialCommunityIcons color={theme.placeholder} name="shield-check-outline" size={13} />
                    <Text style={[styles.columnLabel, { color: theme.textSecondary }]}>
                      BASELINE SIGN
                    </Text>
                  </View>

                  {/* Baseline Sign Code Badge */}
                  <View style={[styles.baselineCodeBadge, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}35` }]}>
                    <Text numberOfLines={1} style={[styles.baselineCodeText, { color: theme.primary }]}>
                      {currentItem.verifiedSign.signCode || 'Traffic Sign'}
                    </Text>
                  </View>

                  {/* Baseline Sign Name */}
                  <Text numberOfLines={1} style={[styles.comparisonTitle, { color: theme.text }]}>
                    {currentItem.verifiedSign.nameVi || currentItem.verifiedSign.nameEn || currentItem.verifiedSign.signCode || 'Traffic Sign'}
                  </Text>

                  {/* Thumbnail & Freshness Score Row */}
                  <View style={styles.baselineMetaRow}>
                    {currentItem.verifiedSign.signCropUrl ? (
                      <Image
                        accessibilityLabel={currentItem.verifiedSign.signCode}
                        contentFit="cover"
                        source={{ uri: resolveS3Url(currentItem.verifiedSign.signCropUrl) }}
                        style={[styles.baselineMiniCrop, { borderColor: theme.border }]}
                      />
                    ) : (
                      <View style={[styles.baselineMiniCropPlaceholder, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <MaterialCommunityIcons color={theme.placeholder} name="traffic-light" size={14} />
                      </View>
                    )}
                    <View style={styles.baselineScoreContainer}>
                      <Text style={[styles.baselineScoreLabel, { color: scorePercent < 50 ? '#EA580C' : '#16A34A' }]}>
                        Score: {scorePercent}%
                      </Text>
                      {currentItem.verifiedSign.lastVerifiedAt ? (
                        <Text numberOfLines={1} style={[styles.baselineLastVerified, { color: theme.placeholder }]}>
                          Verified {formatDate(currentItem.verifiedSign.lastVerifiedAt)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>

              {/* Bottom Summary Bar */}
              <View style={[styles.comparisonBottomBar, { borderTopColor: theme.border }]}>
                <View style={styles.bottomBarItem}>
                  <MaterialCommunityIcons color={theme.placeholder} name="vote-outline" size={12} />
                  <Text style={[styles.bottomBarText, { color: theme.placeholder }]}>
                    {currentItem.currentVoteCount} votes recorded
                  </Text>
                </View>
                <View style={styles.bottomBarItem}>
                  <MaterialCommunityIcons color="#16A34A" name="gift-outline" size={12} />
                  <Text style={[styles.bottomBarText, { color: '#16A34A' }]}>
                    +{currentItem.rewardCredits} bounty credits
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
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    pressed && styles.circleButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons color={theme.text} name="swap-horizontal" size={26} />
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
                    { backgroundColor: theme.primary, borderColor: theme.border },
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
            </View>
          </View>
        ) : history.length > 0 ? (
          /* Revalidation Summary Screen (mirrors reviewer flow) */
          <View style={styles.summaryContent}>
            <View style={styles.summaryHeading}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Revalidation Summary</Text>
              <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                Today • {history.length} {history.length === 1 ? 'sign' : 'signs'} evaluated
              </Text>
            </View>

            <View style={styles.summaryMetrics}>
              <RevalSummaryMetric action="STILL_ACTIVE" count={counts.STILL_ACTIVE} />
              <RevalSummaryMetric action="REMOVED" count={counts.REMOVED} />
              <RevalSummaryMetric action="CHANGED" count={counts.CHANGED} />
              <RevalSummaryMetric action="UNCLEAR" count={counts.UNCLEAR} />
            </View>

            <ScrollView
              contentContainerStyle={styles.summaryReviewListContent}
              showsVerticalScrollIndicator={false}
              style={styles.summaryReviewList}
            >
              {history.map((record, index) => (
                <RevalReviewedSignRow key={`${record.item.evidenceId}-${index}`} record={record} />
              ))}
            </ScrollView>

            <View style={styles.summaryFooterActions}>
              <AppButton
                label="Back to Work"
                onPress={() => router.back()}
                style={[styles.summaryCheckButton, { borderColor: theme.border }]}
                textStyle={{ color: theme.textSecondary }}
                variant="surface"
              />
              <AppButton
                label="Submit"
                onPress={handleFinishReviews}
                style={styles.summarySubmitButton}
              />
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
        onConfirm={(note, suggestedSignTypeId) => {
          if (activeSheet === 'changed') handleVote('CHANGED', note, suggestedSignTypeId);
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
  comparisonBox: {
    width: '92%',
    maxWidth: 348,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  comparisonColumnsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  comparisonColumn: {
    flex: 1,
    paddingHorizontal: 3,
    justifyContent: 'flex-start',
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  columnLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  evidenceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 4,
  },
  surveyorStatusActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  surveyorStatusRemoved: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  surveyorStatusChanged: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  surveyorStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  baselineCodeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 4,
  },
  baselineCodeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  comparisonTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 4,
  },
  columnTelemetryList: {
    gap: 2,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  telemetryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  dividerWrapper: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 2,
  },
  verticalDividerLine: {
    flex: 1,
    width: 1,
  },
  vsBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  vsBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  baselineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  baselineMiniCrop: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
  },
  baselineMiniCropPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baselineScoreContainer: {
    flex: 1,
  },
  baselineScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  baselineLastVerified: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  comparisonBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 5,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  bottomBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bottomBarText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
    width: '100%',
  },
  undoCornerButton: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

  /* ── Summary Screen Styles (Reviewer Flow Match) ──────────── */
  summaryContent: {
    width: '100%',
    maxWidth: 600,
    flex: 1,
    alignSelf: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  summaryHeading: { gap: 2 },
  summaryTitle: { fontFamily: Fonts.body, fontSize: 24, fontWeight: '900', lineHeight: 31 },
  summarySubtitle: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  summaryMetrics: { flexDirection: 'row', gap: Spacing.one },
  summaryMetric: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.half,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
  },
  summaryMetricSymbol: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  summaryMetricSymbolLabel: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '900', lineHeight: 15 },
  summaryMetricCount: { fontFamily: Fonts.body, fontSize: 23, fontWeight: '900', lineHeight: 28 },
  summaryMetricLabel: { fontFamily: Fonts.body, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  summaryReviewList: { flex: 1 },
  summaryReviewListContent: { gap: Spacing.one },
  summarySignRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.one,
  },
  summarySignImage: { width: 66, height: 66, flexShrink: 0, borderRadius: Rounded.md },
  summarySignCopy: { minWidth: 0, flex: 1, gap: 2 },
  summarySignName: { fontFamily: Fonts.body, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  summarySignLocation: { fontFamily: Fonts.body, fontSize: 11, fontWeight: '500', lineHeight: 15 },
  summarySignSummary: { fontFamily: Fonts.body, fontSize: 10, fontWeight: '500', lineHeight: 14 },
  summaryStatusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  summaryStatusLabel: { fontFamily: Fonts.body, fontSize: 9, fontWeight: '800' },
  summaryFooterActions: { gap: Spacing.one, marginTop: 'auto' },
  summaryCheckButton: { minHeight: 48, borderWidth: 1 },
  summarySubmitButton: { minHeight: 50 },
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
  singleLineInput: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontFamily: Fonts.body,
    fontSize: 13,
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
