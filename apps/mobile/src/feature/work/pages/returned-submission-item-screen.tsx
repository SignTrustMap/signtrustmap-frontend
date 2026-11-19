import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReturnedSubmissionItemScreenProps {
  id?: string;
  initialImageUrl?: string;
}

const DEFAULT_SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80';

const MAX_BOXES = 3;
const BOX_COLORS = ['#10B981', '#06B6D4', '#8B5CF6'];

interface BoundingBoxItemProps {
  box: BoundingBox;
  color: string;
  imageHeight: number;
  imageWidth: number;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BoundingBox>) => void;
}

function BoundingBoxItem({
  box,
  color,
  imageHeight,
  imageWidth,
  index,
  isSelected,
  onSelect,
  onUpdate,
}: BoundingBoxItemProps) {
  const boxRef = useRef(box);
  boxRef.current = box;

  const startDimRef = useRef<{ height: number; width: number }>({
    width: box.width,
    height: box.height,
  });
  const startPosRef = useRef<{ x: number; y: number }>({ x: box.x, y: box.y });

  // 1. Resize PanResponder: STRICTLY resizes width & height when dragging the bottom-right circle handle
  // x and y stay completely anchored (never moved)
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e) => {
        e.stopPropagation();
        startDimRef.current = { width: boxRef.current.width, height: boxRef.current.height };
        onSelect(boxRef.current.id);
      },

      onPanResponderMove: (_e, gesture) => {
        const minSize = 40;
        const currentBox = boxRef.current;
        const maxW = Math.max(minSize, imageWidth - currentBox.x);
        const maxH = Math.max(minSize, imageHeight - currentBox.y);
        const newW = Math.round(
          Math.max(minSize, Math.min(maxW, startDimRef.current.width + gesture.dx)),
        );
        const newH = Math.round(
          Math.max(minSize, Math.min(maxH, startDimRef.current.height + gesture.dy)),
        );

        // ONLY update width and height
        onUpdate(currentBox.id, { width: newW, height: newH });
      },

      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // 2. Move PanResponder: STRICTLY moves x & y when dragging freely inside the box
  // width and height stay completely unchanged
  const movePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false, // Do NOT steal touches from the resize handle
      onMoveShouldSetPanResponder: (_, gesture) => Math.hypot(gesture.dx, gesture.dy) > 2,
      onMoveShouldSetPanResponderCapture: () => false, // Do NOT steal touches from the resize handle

      onPanResponderGrant: () => {
        startPosRef.current = { x: boxRef.current.x, y: boxRef.current.y };
        onSelect(boxRef.current.id);
      },

      onPanResponderMove: (_e, gesture) => {
        const currentBox = boxRef.current;
        const maxX = Math.max(0, imageWidth - currentBox.width);
        const maxY = Math.max(0, imageHeight - currentBox.height);
        const newX = Math.round(Math.max(0, Math.min(maxX, startPosRef.current.x + gesture.dx)));
        const newY = Math.round(Math.max(0, Math.min(maxY, startPosRef.current.y + gesture.dy)));

        // ONLY update position x and y
        onUpdate(currentBox.id, { x: newX, y: newY });
      },

      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View
      style={[
        styles.boundingBox,
        {
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          borderColor: color,
          backgroundColor: `${color}25`,
          zIndex: isSelected ? 20 : 5 + index,
        },
      ]}
      testID={`bounding-box-${box.id}`}
    >
      {/* Move Area: Fills entire box surface for free dragging/moving */}
      <View
        style={StyleSheet.absoluteFill}
        testID={`bounding-box-move-area-${box.id}`}
        {...movePanResponder.panHandlers}
      />

      {/* Label tag indicates traffic sign */}
      <View pointerEvents="none" style={[styles.boundingBoxLabel, { backgroundColor: color }]}>
        <MaterialCommunityIcons color="#FFFFFF" name="sign-direction" size={12} />
        <Text style={styles.boundingBoxLabelText}>Biển báo #{index + 1}</Text>
      </View>

      {/* Resize Handle: Bottom-right circle for resizing ONLY */}
      <View
        style={styles.resizeTouchArea}
        testID={`bounding-box-resize-handle-${box.id}`}
        {...resizePanResponder.panHandlers}
      >
        <View
          style={[
            styles.resizeCircle,
            { backgroundColor: color },
            isSelected && styles.resizeHandleSelected,
          ]}
        >
          <MaterialCommunityIcons color="#FFFFFF" name="resize-bottom-right" size={16} />
        </View>
      </View>
    </View>
  );
}

export function ReturnedSubmissionItemScreen({
  id: propId,
  initialImageUrl,
}: ReturnedSubmissionItemScreenProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; imageUrl?: string }>();

  const submissionId = propId ?? params.id ?? 'mock-returned-sub-001';
  const imageUrl = initialImageUrl ?? params.imageUrl ?? DEFAULT_SAMPLE_IMAGE;

  // Full-screen image zoom modal
  const [isZoomed, setIsZoomed] = useState(false);

  // Multi bounding boxes state (up to 3 boxes)
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);

  // Image layout dimensions (to clamp boxes inside image bounds)
  const [imageLayout, setImageLayout] = useState<{ height: number; width: number }>({
    width: 340,
    height: 340,
  });

  const handleImageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setImageLayout({ width, height });
    }
  };

  // Add a new box at tap location or offset position
  const handleAddBox = useCallback(
    (targetX?: number, targetY?: number) => {
      setBoxes((prev) => {
        if (prev.length >= MAX_BOXES) {
          Alert.alert(
            'Giới hạn',
            `Bạn chỉ có thể khoanh vùng tối đa ${MAX_BOXES} biển báo trong một ảnh.`,
          );
          return prev;
        }

        const initialSize = 85;
        const defaultX = 50 + prev.length * 25;
        const defaultY = 50 + prev.length * 25;

        const posX = targetX !== undefined ? targetX - initialSize / 2 : defaultX;
        const posY = targetY !== undefined ? targetY - initialSize / 2 : defaultY;

        const clampedX = Math.max(0, Math.min(imageLayout.width - initialSize, posX));
        const clampedY = Math.max(0, Math.min(imageLayout.height - initialSize, posY));

        const newBox: BoundingBox = {
          id: `box-${Date.now()}-${prev.length + 1}`,
          x: Math.round(clampedX),
          y: Math.round(clampedY),
          width: initialSize,
          height: initialSize,
        };

        setActiveBoxId(newBox.id);
        return [...prev, newBox];
      });
    },
    [imageLayout],
  );

  // Quick resize buttons (+ / -) for active box
  const handleAdjustSize = useCallback(
    (delta: number) => {
      if (!activeBoxId) return;
      setBoxes((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoxId) return b;
          const minSize = 40;
          const maxW = imageLayout.width - b.x;
          const maxH = imageLayout.height - b.y;
          const newW = Math.round(Math.max(minSize, Math.min(maxW, b.width + delta)));
          const newH = Math.round(Math.max(minSize, Math.min(maxH, b.height + delta)));
          return { ...b, width: newW, height: newH };
        }),
      );
    },
    [activeBoxId, imageLayout],
  );

  // Update specific box
  const handleUpdateBox = useCallback((id: string, updates: Partial<BoundingBox>) => {
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  // Handle undo action: removes the active box or last added box
  const handleUndo = useCallback(() => {
    setBoxes((prev) => {
      if (prev.length === 0) return prev;
      if (activeBoxId) {
        const filtered = prev.filter((b) => b.id !== activeBoxId);
        setActiveBoxId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
        return filtered;
      }
      return prev.slice(0, -1);
    });
  }, [activeBoxId]);

  // Handle OK / confirmation action
  const handleConfirm = useCallback(() => {
    Alert.alert(
      'Bạn chắc chắn chứ?',
      `Bạn đang xác nhận ${boxes.length} vị trí khoanh vùng có biển báo giao thông hợp lệ.`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          style: 'default',
          onPress: () => {
            Alert.alert(
              'Thành công',
              'Đã gửi tọa độ khoanh vùng biển báo thành công! Hồ sơ sẽ được chuyển qua bộ phận thẩm định.',
              [{ text: 'Đóng', onPress: () => router.back() }],
            );
          },
        },
      ],
    );
  }, [boxes.length, router]);

  const activeBox =
    boxes.find((b) => b.id === activeBoxId) || (boxes.length > 0 ? boxes[boxes.length - 1] : null);
  const activeBoxIndex = activeBox ? boxes.findIndex((b) => b.id === activeBox.id) : -1;
  const activeBoxColor =
    activeBoxIndex >= 0 ? BOX_COLORS[activeBoxIndex % BOX_COLORS.length] : theme.primary;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Top Header Bar */}
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: theme.backgroundElement,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <AppButton
            accessibilityLabel="Quay lại danh sách"
            onPress={() => router.back()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>

          <View style={styles.topBarTitle}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>
              Xác nhận lại vị trí biển báo
            </Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {boxes.length}/{MAX_BOXES} box
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Instruction banner */}
          <View
            style={[
              styles.instructionBanner,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                borderLeftColor: theme.primary,
              },
            ]}
          >
            <MaterialCommunityIcons color={theme.primary} name="gesture-tap" size={20} />
            <Text style={[styles.instructionText, { color: theme.text }]}>
              Kéo hình tròn góc phải bên dưới để điều chỉnh kích thước. Kéo tự do trong thân box để
              di chuyển. Tối đa {MAX_BOXES} box.
            </Text>
          </View>

          {/* Center Image Container */}
          <View
            style={[
              styles.imageContainerCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <View onLayout={handleImageLayout} style={styles.imageWrapper}>
              <Image
                accessibilityLabel="Ảnh khảo sát cần khoanh vùng"
                contentFit="cover"
                source={{ uri: imageUrl }}
                style={styles.centerImage}
              />

              {/* Background Tap Surface behind boxes */}
              <Pressable
                accessibilityLabel="Chạm vào ảnh để tạo vùng chọn biển báo"
                onPress={(e) => {
                  if (boxes.length < MAX_BOXES) {
                    handleAddBox(e.nativeEvent.locationX, e.nativeEvent.locationY);
                  }
                }}
                style={StyleSheet.absoluteFill}
                testID="image-touch-area"
              />

              {/* Formed Bounding Boxes */}
              {boxes.map((box, index) => (
                <BoundingBoxItem
                  box={box}
                  color={BOX_COLORS[index % BOX_COLORS.length]}
                  imageHeight={imageLayout.height}
                  imageWidth={imageLayout.width}
                  index={index}
                  isSelected={box.id === (activeBox?.id ?? '')}
                  key={box.id}
                  onSelect={(id) => setActiveBoxId(id)}
                  onUpdate={handleUpdateBox}
                />
              ))}

              {/* Floating Zoom Button at bottom-right corner */}
              <AppButton
                accessibilityLabel="Xem phóng to toàn màn hình"
                onPress={() => setIsZoomed(true)}
                pressedOpacity={0.7}
                style={styles.zoomButton}
                testID="zoom-button"
                variant="primary"
              >
                <MaterialCommunityIcons color="#FFFFFF" name="arrow-expand" size={18} />
              </AppButton>
            </View>
          </View>

          {/* Action Row: Left: Undo | Right: Add New Box (ngang hàng) */}
          <View style={styles.buttonRow}>
            {/* Left Button: Undo */}
            <AppButton
              accessibilityLabel="Hoàn tác khoanh vùng"
              disabled={boxes.length === 0}
              onPress={handleUndo}
              style={[styles.actionBtn, styles.undoBtn, boxes.length === 0 && styles.btnDisabled]}
              testID="undo-btn"
              variant="surface"
            >
              <MaterialCommunityIcons
                color={boxes.length > 0 ? theme.text : theme.grey}
                name="undo"
                size={18}
              />
              <Text
                style={[styles.undoBtnText, { color: boxes.length > 0 ? theme.text : theme.grey }]}
              >
                Hoàn tác
              </Text>
            </AppButton>

            {/* Right Button (Ngang hàng): Add New Box (tối đa 3 box) */}
            <AppButton
              accessibilityLabel="Thêm một box mới"
              disabled={boxes.length >= MAX_BOXES}
              onPress={() => handleAddBox()}
              style={[
                styles.actionBtn,
                styles.addBoxBtn,
                boxes.length >= MAX_BOXES && styles.btnDisabled,
              ]}
              testID="add-box-btn"
              variant="surface"
            >
              <MaterialCommunityIcons
                color={boxes.length < MAX_BOXES ? theme.primary : theme.grey}
                name="plus-box-outline"
                size={18}
              />
              <Text
                style={[
                  styles.addBoxBtnText,
                  { color: boxes.length < MAX_BOXES ? theme.primary : theme.grey },
                ]}
              >
                {boxes.length >= MAX_BOXES ? 'Đã đủ 3 box' : 'Thêm box mới'}
              </Text>
            </AppButton>
          </View>

          {/* Bottom Button (Span hết container): Confirm (Xác nhận) */}
          <AppButton
            accessibilityLabel="Xác nhận vị trí biển báo"
            disabled={boxes.length === 0}
            onPress={handleConfirm}
            style={[styles.confirmBtnFullWidth, boxes.length === 0 && styles.btnDisabled]}
            testID="confirm-btn"
            variant="primary"
          >
            <MaterialCommunityIcons color="#FFFFFF" name="check" size={20} />
            <Text style={styles.confirmBtnText}>Xác nhận</Text>
          </AppButton>

          {/* Notice text below the confirmation button */}
          <View
            style={[
              styles.warningBox,
              {
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                borderColor: 'rgba(217, 119, 6, 0.25)',
              },
            ]}
          >
            <MaterialCommunityIcons color="#D97706" name="alert-circle-outline" size={20} />
            <Text style={[styles.warningText, { color: theme.text }]}>
              Chỉ chọn nếu bạn chắc chắn rằng ảnh có biển báo hợp lệ, nếu không, hệ thống sẽ trừ
              điểm credits của bạn.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Full-screen Zoom Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setIsZoomed(false)}
        statusBarTranslucent
        transparent
        visible={isZoomed}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.modalSafeArea}>
            {/* Close Button */}
            <AppButton
              accessibilityLabel="Đóng xem toàn màn hình"
              onPress={() => setIsZoomed(false)}
              style={[styles.modalCloseBtn, { top: Math.max(insets.top, 16) + 12 }]}
              testID="close-zoom-btn"
              variant="ghost"
            >
              <MaterialCommunityIcons color="#FFFFFF" name="close" size={26} />
            </AppButton>

            {/* Fullscreen Image */}
            <Image contentFit="contain" source={{ uri: imageUrl }} style={styles.modalImage} />

            <View style={styles.modalFooterHint}>
              <Text style={styles.modalFooterText}>Xem ảnh gốc toàn màn hình</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Rounded.round,
  },
  statusPillText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: Spacing.two,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  imageContainerCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 360,
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  centerImage: {
    width: '100%',
    height: '100%',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: Rounded.sm,
  },
  boundingBoxLabel: {
    position: 'absolute',
    top: -24,
    left: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  boundingBoxLabelText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resizeTouchArea: {
    position: 'absolute',
    bottom: -22,
    right: -22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  resizeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  resizeHandleSelected: {
    transform: [{ scale: 1.15 }],
  },
  zoomButton: {
    position: 'absolute',
    bottom: Spacing.three,
    right: Spacing.three,
    width: 40,
    height: 40,
    minHeight: 40,
    borderRadius: Rounded.round,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  boxControlsCard: {
    padding: Spacing.three,
    borderRadius: Rounded.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  boxControlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boxBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  boxControlsTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  boxSizeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '600',
  },
  resizeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  adjustSizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 38,
    borderRadius: Rounded.sm,
    borderWidth: 1,
  },
  adjustSizeBtnText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  boxStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  boxStatusText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.half,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    minHeight: 46,
    borderRadius: Rounded.md,
  },
  undoBtn: {
    borderWidth: 1.5,
  },
  undoBtnText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  addBoxBtn: {
    borderWidth: 1.5,
  },
  addBoxBtnText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtnFullWidth: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    minHeight: 48,
    borderRadius: Rounded.md,
    backgroundColor: '#10B981',
    marginTop: Spacing.one,
  },
  confirmBtnText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: Rounded.md,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  warningText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    minHeight: 44,
    borderRadius: Rounded.round,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  modalFooterHint: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Rounded.round,
  },
  modalFooterText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
  },
});
