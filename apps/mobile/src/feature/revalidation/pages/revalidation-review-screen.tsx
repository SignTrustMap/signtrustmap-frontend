import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { CANNOT_RECORD_VOTE_MESSAGE } from '@/constants/message';
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
    label: 'Vẫn hoạt động',
    summary: 'Xác nhận biển báo vẫn tồn tại trên thực địa.',
    symbol: '✓',
  },
  REMOVED: {
    color: Colors.danger,
    label: 'Đã gỡ bỏ',
    summary: 'Xác nhận biển báo đã không còn trên thực địa.',
    symbol: '×',
  },
  CHANGED: {
    color: '#F97316',
    label: 'Đã thay đổi',
    summary: 'Loại biển báo hoặc thông tin đã thay đổi.',
    symbol: '⇄',
  },
  UNCLEAR: {
    color: '#2563EB',
    label: 'Không rõ ràng',
    summary: 'Không thể nhận diện biển báo / hình ảnh mờ.',
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
            ? ` • Cách vị trí gốc ${record.item.evidence.distanceMeters}m`
            : ' • Đã xác minh vị trí'}
        </Text>
        <Text numberOfLines={1} style={[styles.summarySignSummary, { color: theme.placeholder }]}>
          {record.note ? `Ghi chú: ${record.note}` : details.summary}
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
    <View accessibilityLabel="Đang tải các lượt tái thẩm định" style={styles.skeletonContainer}>
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
      ? 'Đổi loại biển báo'
      : type === 'removed'
        ? 'Xác nhận biển đã gỡ bỏ'
        : 'Đánh dấu không rõ / Không hợp lệ';

  const helperText =
    type === 'changed'
      ? 'Giải thích biển báo thực tế khác biệt như thế nào so với dữ liệu gốc:'
      : type === 'removed'
        ? 'Xác nhận rằng biển báo giao thông không còn hiện diện tại vị trí này:'
        : 'Nêu rõ lý do minh chứng không rõ ràng (ví dụ: mờ, bị che khuất, chói sáng ban đêm, sai vị trí):';

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
        <Pressable accessibilityLabel="Đóng tùy chọn thẩm định" onPress={handleClose} style={styles.backdrop} />
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
                accessibilityLabel="Đóng"
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
                    ID loại biển đề xuất (tùy chọn)
                  </Text>
                  <TextInput
                    accessibilityLabel="Mã loại biển báo đề xuất"
                    keyboardType="number-pad"
                    onChangeText={setSuggestedTypeId}
                    placeholder="Ví dụ: 42"
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
                  Ghi chú của thẩm định viên {type === 'changed' ? <Text style={{ color: Colors.danger }}>*</Text> : '(tùy chọn)'}
                </Text>
                <TextInput
                  accessibilityLabel="Ghi chú quan sát của thẩm định viên"
                  multiline
                  onChangeText={setNote}
                  placeholder="Nhập chi tiết ghi nhận..."
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
                label="Hủy"
                onPress={handleClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                label="Xác nhận bình chọn"
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
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
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
        STILL_ACTIVE: 'Đã xác nhận: Biển báo vẫn hoạt động',
        REMOVED: 'Đã xác nhận: Biển báo đã gỡ bỏ',
        CHANGED: 'Đã bình chọn: Biển báo đã thay đổi',
        UNCLEAR: 'Đã đánh dấu: Minh chứng không rõ ràng / Không hợp lệ',
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
              message: err?.message || CANNOT_RECORD_VOTE_MESSAGE,
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
        onPanResponderGrant: () => {
          gestureAxis.current = 'none';
        },
        onPanResponderMove: (_, gestureState) => {
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          // Khóa trục chuyển động (Axis lock): chỉ cho phép trượt ngang hoặc trượt dọc, TUYỆT ĐỐI không đi xéo
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
          const SWIPE_THRESHOLD = 90;
          const currentAxis = gestureAxis.current;
          gestureAxis.current = 'none';

          if (currentAxis === 'horizontal') {
            // Vuốt ngang: Phải -> VẪN HOẠT ĐỘNG, Trái -> ĐÃ GỠ BỎ
            if (dx > SWIPE_THRESHOLD || (dx > 35 && vx > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: 500, y: 0 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                handleVote('STILL_ACTIVE');
              });
              return;
            } else if (dx < -SWIPE_THRESHOLD || (dx < -35 && vx < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: -500, y: 0 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('removed');
              });
              return;
            }
          } else if (currentAxis === 'vertical') {
            // Vuốt dọc: Lên -> ĐÃ THAY ĐỔI, Xuống -> KHÔNG RÕ
            if (dy < -SWIPE_THRESHOLD || (dy < -35 && vy < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: 0, y: -500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('changed');
              });
              return;
            } else if (dy > SWIPE_THRESHOLD || (dy > 35 && vy > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: 0, y: 500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('unclear');
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
                accessibilityLabel="Quay lại"
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
                  <Animated.View
                    style={[styles.swipeBadge, styles.activeBadge, { opacity: activeBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>VẪN HOẠT ĐỘNG</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.swipeBadge, styles.removedBadge, { opacity: removedBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>ĐÃ GỠ BỎ</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.swipeBadge, styles.changedBadge, { opacity: changedBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>ĐÃ THAY ĐỔI</Text>
                  </Animated.View>

                  <Animated.View
                    style={[styles.swipeBadge, styles.unclearBadge, { opacity: unclearBadgeOpacity }]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>KHÔNG RÕ</Text>
                  </Animated.View>

                  {/* Zoom button */}
                  <View style={styles.zoomButton}>
                    <MaterialCommunityIcons color="#FFFFFF" name="magnify-plus-outline" size={18} />
                  </View>
                </Pressable>

                {/* Floating Top-Left Tab: Switch between Evidence and Baseline Original Sign */}
                <View style={styles.imageSourceToggleContainer}>
                  <Pressable
                    accessibilityLabel="Xem ảnh bằng chứng"
                    accessibilityRole="tab"
                    onPress={() => setViewMode('evidence')}
                    style={[
                      styles.imageSourcePill,
                      viewMode === 'evidence' && [styles.imageSourcePillActive, { backgroundColor: theme.primary }],
                    ]}
                  >

                    <Text
                      style={[
                        styles.imageSourcePillText,
                        viewMode === 'evidence' && styles.imageSourcePillTextActive,
                      ]}
                    >
                      Ảnh bằng chứng
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Xem ảnh gốc"
                    accessibilityRole="tab"
                    onPress={() => setViewMode('baseline')}
                    style={[
                      styles.imageSourcePill,
                      viewMode === 'baseline' && [styles.imageSourcePillActive, { backgroundColor: theme.primary }],
                    ]}
                  >

                    <Text
                      style={[
                        styles.imageSourcePillText,
                        viewMode === 'baseline' && styles.imageSourcePillTextActive,
                      ]}
                    >
                      Ảnh gốc
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
              <Text style={{ marginTop: Spacing.two, color: theme.placeholder }}>
                Nhấn để phóng to nếu chưa nhìn rõ biển báo
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
                  <Text style={[styles.columnLabel, { color: theme.textSecondary, marginBottom: 4 }]}>
                    MINH CHỨNG MỚI
                  </Text>

                  {/* Condition Title */}
                  <Text numberOfLines={1} style={[styles.comparisonTitle, { color: theme.text }]}>
                    {currentItem.evidence.evidenceType === 'CHANGED'
                      ? 'Ghi nhận: Đã thay thế'
                      : currentItem.evidence.evidenceType === 'REMOVED'
                        ? 'Ghi nhận: Đã gỡ bỏ'
                        : 'Ghi nhận: Vẫn còn'}
                  </Text>

                  {/* Distance & Timestamp Telemetry */}
                  <View style={styles.columnTelemetryList}>
                    <View style={styles.telemetryItem}>
                      <Text numberOfLines={1} style={[styles.telemetryText, { color: theme.placeholder }]}>
                        {currentItem.evidence.distanceMeters != null
                          ? `Cách vị trí cũ ${currentItem.evidence.distanceMeters}m`
                          : 'Đã xác minh vị trí'}
                      </Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <Text numberOfLines={1} style={[styles.telemetryText, { color: theme.placeholder }]}>
                        Thời gian chụp: {formatDate(currentItem.evidence.submittedAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ----------------------------------------------------------- */}
                {/* CENTER DIVIDER LINE                                         */}
                {/* ----------------------------------------------------------- */}
                <View style={[styles.columnDivider, { backgroundColor: theme.border }]} />

                {/* ----------------------------------------------------------- */}
                {/* RIGHT COLUMN: BASELINE RECORD (HISTORICAL SIGN)             */}
                {/* ----------------------------------------------------------- */}
                <View style={styles.comparisonColumn}>
                  <View style={styles.columnHeaderRow}>
                    <Text style={[styles.columnLabel, { color: theme.textSecondary }]}>
                      BIỂN BÁO GỐC
                    </Text>
                  </View>



                  {/* Baseline Sign Name */}
                  <Text numberOfLines={1} style={[styles.comparisonTitle, { color: theme.text }]}>
                    {currentItem.verifiedSign.nameVi || currentItem.verifiedSign.nameEn || currentItem.verifiedSign.signCode || 'Biển báo giao thông'}
                  </Text>

                  {/* Thumbnail & Freshness Score Row */}
                  <View style={styles.baselineMetaRow}>
                    <View style={styles.baselineScoreContainer}>
                      {currentItem.verifiedSign.lastVerifiedAt ? (
                        <Text numberOfLines={1} style={[styles.baselineLastVerified, { color: theme.placeholder }]}>
                          Lần cuối xác minh {formatDate(currentItem.verifiedSign.lastVerifiedAt)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>

              {/* Conclusion Section (Surveyor Report Conclusion) */}
              <View
                style={[
                  styles.conclusionBanner,
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
                  size={12}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.conclusionText,
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
                    ? 'KẾT LUẬN: BÁO CÁO ĐÃ GỠ'
                    : currentItem.evidence.evidenceType === 'CHANGED'
                      ? 'KẾT LUẬN: BÁO CÁO ĐÃ ĐỔI'
                      : 'KẾT LUẬN: BÁO CÁO VẪN CÒN'}
                </Text>
              </View>

              {/* Bottom Summary Bar */}
              <View style={[styles.comparisonBottomBar, { borderTopColor: theme.border }]}>
                <View style={styles.bottomBarItem}>
                  <MaterialCommunityIcons color={theme.placeholder} name="vote-outline" size={12} />
                  <Text style={[styles.bottomBarText, { color: theme.placeholder }]}>
                    Đã có {currentItem.currentVoteCount} người bình chọn trước bạn
                  </Text>
                </View>
                <View style={styles.bottomBarItem}>
                  <MaterialCommunityIcons color="#16A34A" name="gift-outline" size={12} />
                  <Text style={[styles.bottomBarText, { color: '#16A34A' }]}>
                    +{currentItem.rewardCredits} Credits thưởng
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions: 4-Way Diamond Decision Buttons & FABs */}
            <View style={styles.actionsFooter}>
              {/* Floating Action Buttons */}
              <View style={styles.fabColumn}>
                {/* Catalog Screen FAB (Placeholder - No routing) */}
                <AppButton
                  accessibilityLabel="Xem danh mục biển báo"
                  accessibilityRole="button"
                  onPress={() => {
                    // Placeholder: navigate to catalog screen
                  }}
                  style={[
                    styles.fabButton,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                  variant="surface"
                >
                  <MaterialCommunityIcons color={theme.text} name="book-open-outline" size={20} />
                </AppButton>

                {/* Help Swipe Guide FAB (Dấu chấm hỏi ở dưới) */}
                <AppButton
                  accessibilityLabel="Hướng dẫn thao tác quẹt"
                  accessibilityRole="button"
                  onPress={() => setIsHelpModalVisible(true)}
                  style={[
                    styles.fabButton,
                    { backgroundColor: theme.primary, borderColor: theme.border },
                  ]}
                  variant="surface"
                >
                  <MaterialCommunityIcons color={theme.surface} name="help" size={22} />
                </AppButton>
              </View>

              <View style={styles.diamondContainer}>
                {/* Top Button: CHANGED Sign Type */}
                <Pressable
                  accessibilityLabel="Biển báo đã đổi loại"
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
                  accessibilityLabel="Xác nhận biển báo đã bị gỡ bỏ"
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
                  accessibilityLabel="Xác nhận biển báo vẫn còn hoạt động"
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
                  accessibilityLabel="Đánh dấu không rõ ràng hoặc không hợp lệ"
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
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Tổng kết tái thẩm định</Text>
              <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                Hôm nay • Đã đánh giá {history.length} biển báo
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
                label="Quay lại công việc"
                onPress={() => router.back()}
                style={[styles.summaryCheckButton, { borderColor: theme.border }]}
                textStyle={{ color: theme.textSecondary }}
                variant="surface"
              />
              <AppButton
                label="Hoàn tất"
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
            <Text style={[styles.completeTitle, { color: theme.text }]}>Đã đánh giá tất cả minh chứng</Text>
            <Text style={[styles.completeCopy, { color: theme.textSecondary }]}>
              Bạn đã xem xét tất cả các minh chứng tái thẩm định thực địa trong hàng đợi.
            </Text>
            <AppButton
              label="Quay lại công việc"
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
          accessibilityLabel="Đóng xem phóng to"
          onPress={() => setIsImageZoomed(false)}
          style={styles.zoomBackdrop}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.zoomSafeArea}>
            <Pressable
              accessibilityLabel="Đóng xem phóng to"
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
              <View style={[styles.helpHeaderIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                <MaterialCommunityIcons color={theme.primary} name="gesture-swipe" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.helpDialogTitle, { color: theme.text }]}>Hướng dẫn quẹt thẻ</Text>
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
              {/* Right: Still Active */}
              <View style={[styles.helpGuideItem, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#16A34A' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-right-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#16A34A' }]}>Quẹt sang PHẢI: Vẫn còn</Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Xác nhận biển báo trên thực tế vẫn còn hoạt động tốt.
                  </Text>
                </View>
              </View>

              {/* Left: Removed */}
              <View style={[styles.helpGuideItem, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#DC2626' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-left-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#DC2626' }]}>Quẹt sang TRÁI: Đã gỡ bỏ</Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Biển báo không còn tồn tại trên thực địa.
                  </Text>
                </View>
              </View>

              {/* Up: Changed */}
              <View style={[styles.helpGuideItem, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#F97316' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-up-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#D97706' }]}>Quẹt LÊN TRÊN: Đã thay đổi</Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Biển báo đã bị thay thế bằng một loại biển khác.
                  </Text>
                </View>
              </View>

              {/* Down: Unclear */}
              <View style={[styles.helpGuideItem, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
                <View style={[styles.helpItemIconBadge, { backgroundColor: '#64748B' }]}>
                  <MaterialCommunityIcons color="#FFFFFF" name="arrow-down-bold" size={16} />
                </View>
                <View style={styles.helpItemContent}>
                  <Text style={[styles.helpItemTitle, { color: '#475569' }]}>Quẹt XUỐNG DƯỚI: Không rõ</Text>
                  <Text style={[styles.helpItemDesc, { color: theme.textSecondary }]}>
                    Ảnh mờ, bị che khuất hoặc không thể nhận diện.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.helpTipBox}>
              <MaterialCommunityIcons color={theme.placeholder} name="information-outline" size={14} />
              <Text style={[styles.helpTipText, { color: theme.textSecondary }]}>
                Bạn cũng có thể bấm trực tiếp vào 4 nút tròn kim cương ở dưới để đưa ra quyết định.
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
    top: 10,
    left: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 20,
    padding: 3,
    gap: 3,
    zIndex: 20,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  imageSourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  imageSourcePillActive: {
    backgroundColor: '#0671EB',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imageSourcePillText: {
    color: '#CBD5E1',
    fontSize: 11,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
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
    marginBottom: 10,
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
    borderColor: '#22C55E',
  },
  surveyorStatusRemoved: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  surveyorStatusChanged: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  surveyorStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  conclusionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.2,
    marginBottom: 10,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  conclusionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
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
  columnDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: 8,
    marginVertical: 2,
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
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  comparisonBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
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

  /* ── Floating Action Buttons (FABs) ─────────────── */
  fabColumn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    gap: 10,
    zIndex: 10,
  },
  fabButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
  },

  /* ── Swipe Guide Help Dialog ─────────────────────── */
  helpModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  helpDialogCard: {
    width: '100%',
    maxWidth: 348,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  helpDialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  helpHeaderIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpDialogTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  helpDialogSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  helpCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpGuideList: {
    gap: 8,
    marginBottom: 12,
  },
  helpGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  helpItemIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '800',
  },
  helpItemDesc: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 1,
  },
  helpTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 14,
  },
  helpTipText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  helpConfirmBtn: {
    minHeight: 44,
    borderRadius: 12,
  },
});
