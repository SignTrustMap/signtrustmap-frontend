import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { AppInput } from '@/components/input';
import { VirtualList } from '@/components/virtual-list';
import { getCatalog, type CatalogSign } from '@/api/reviews/catalog';
import { loadCatalogFromStorage } from '@/api/reviews/catalog-storage';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { useOptionalSession } from '@/context/session-provider';
import {
  useGetSurveySubmissionStatus,
  useResubmitFalseNegativeMutation,
} from '@/feature/upload/hooks/use-survey-submission';
import { SIGN_CATEGORIES, getSignCategory, type SignCategory } from '@/constants/sign-categories';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { styles } from '@/feature/work/styles/returned-submission-item-screen.styles';

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category?: SignCategory | string;
  signCode?: string;
  signName?: string;
}

export interface CatalogSignItem {
  code: string;
  name: string;
  description?: string;
  categoryName?: string;
  imageUrl?: string | null;
}

export interface ReturnedSubmissionItemScreenProps {
  id?: string;
  initialImageUrl?: string;
  signs?: CatalogSignItem[];
}

export const MAX_BOXES = 7;

export const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả', color: '#00838F' },
  { id: 'P', label: 'Biển báo cấm', color: '#EF4444' },
  { id: 'W', label: 'Biển báo nguy hiểm', color: '#F59E0B' },
  { id: 'R', label: 'Biển báo hiệu lệnh', color: '#3B82F6' },
  { id: 'I', label: 'Biển chỉ dẫn', color: '#10B981' },
  { id: 'T', label: 'Biển phụ', color: '#F97316' },
] as const;

function mapCatalogSignsToItems(signs: CatalogSign[]): CatalogSignItem[] {
  return signs.map((s) => ({
    code: s.signCode,
    name: s.nameVi || s.nameEn,
    description: s.description || s.signCode,
    categoryName: (s.category as any)?.nameVi || s.category?.nameEn || '',
    imageUrl: s.representativeImageKey ?? undefined,
  }));
}

/**
 * Normalizes Vietnamese string for diacritic-insensitive, punctuation-insensitive search
 */
export function normalizeVietnameseSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[.\-_]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Returns color based on the first character of the traffic sign code:
 * P -> Prohibitory (Red)
 * W -> Warning (Yellow / Orange-Yellow)
 * R -> Mandatory (Blue)
 * I -> Information (Green)
 * T -> Temporary (Orange)
 */
export function getSignColorFromCode(signCode?: string, defaultColor = '#00838F'): string {
  if (!signCode) return defaultColor;
  const firstChar = signCode.trim().charAt(0).toUpperCase();
  switch (firstChar) {
    case 'P':
      return '#EF4444';
    case 'W':
      return '#F59E0B';
    case 'R':
      return '#3B82F6';
    case 'I':
      return '#10B981';
    case 'T':
      return '#F97316';
    default:
      return defaultColor;
  }
}

/**
 * Returns badge pill styling (background, text, and border) matching the sign category
 */
export function getSignBadgeColors(signCode?: string): {
  bg: string;
  text: string;
  border: string;
} {
  if (!signCode) return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
  const firstChar = signCode.trim().charAt(0).toUpperCase();
  switch (firstChar) {
    case 'P':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' }; // Prohibitory - Red
    case 'W':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' }; // Warning - Amber
    case 'R':
      return { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' }; // Mandatory - Blue
    case 'I':
      return { bg: '#DCFCE7', text: '#059669', border: '#BBF7D0' }; // Information - Green
    case 'T':
      return { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' }; // Temporary - Orange
    default:
      return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
  }
}

/**
 * Returns the color associated with the box's selected sign code, category, or default (theme.primary)
 */
export function getBoxColor(box: BoundingBox, defaultColor: string): string {
  if (box.signCode) {
    return getSignColorFromCode(box.signCode, defaultColor);
  }
  if (box.category) {
    const found = SIGN_CATEGORIES.find((c) => c.id === box.category);
    if (found) return found.color;
    return getSignColorFromCode(box.category, defaultColor);
  }
  return defaultColor;
}

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

        onUpdate(currentBox.id, { width: newW, height: newH });
      },

      onPanResponderRelease: () => {},
      onPanResponderTerminate: () => {},
    }),
  ).current;

  // 2. Move PanResponder: Freely moves box position (x, y) without changing width or height
  const movePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_e, gesture) => {
        return Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3;
      },
      onMoveShouldSetPanResponderCapture: () => false,

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

        onUpdate(currentBox.id, { x: newX, y: newY });
      },

      onPanResponderRelease: () => {},
      onPanResponderTerminate: () => {},
    }),
  ).current;

  return (
    <View
      style={[
        styles.boxContainer,
        {
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          zIndex: isSelected ? 30 : 20,
        },
      ]}
      testID={`bounding-box-${box.id}`}
    >
      {/* Move Area: Dragging inside the box body moves (x, y) */}
      <View
        {...movePanResponder.panHandlers}
        style={[
          styles.boxBody,
          {
            borderColor: color,
            backgroundColor: `${color}1A`,
            borderWidth: isSelected ? 2.5 : 2,
          },
        ]}
        testID={`bounding-box-move-area-${box.id}`}
      >
        {/* Subtle grid accent inside box */}
        <View style={[styles.cornerTL, { borderColor: color }]} />
        <View style={[styles.cornerTR, { borderColor: color }]} />
        <View style={[styles.cornerBL, { borderColor: color }]} />
      </View>

      {/* Top Label Badge */}
      <View pointerEvents="none" style={[styles.boxLabelBadge, { backgroundColor: color }]}>
        <MaterialCommunityIcons color="#FFFFFF" name="sign-caution" size={12} />
        <Text style={styles.boxLabelText}>
          {box.signCode ? `${box.signCode} (Biển báo #${index + 1})` : `Biển báo #${index + 1}`}
        </Text>
      </View>

      {/* Resize Handle: Bottom-Right Circle Handle */}
      <View
        {...resizePanResponder.panHandlers}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.resizeHandleContainer}
        testID={`bounding-box-resize-handle-${box.id}`}
      >
        <View
          style={[
            styles.resizeHandleCircle,
            {
              backgroundColor: color,
              borderColor: '#FFFFFF',
              transform: [{ scale: isSelected ? 1.15 : 1.0 }],
            },
          ]}
        >
          <MaterialCommunityIcons color="#FFFFFF" name="arrow-bottom-right" size={13} />
        </View>
      </View>
    </View>
  );
}

function SignGraphicFallback({ item }: { item: CatalogSignItem }) {
  const code = (item.code || '').trim().toUpperCase();
  const firstChar = code.charAt(0);

  // Prohibitory: Red circle
  if (firstChar === 'P') {
    if (code === 'P.102') {
      return (
        <View style={styles.fallbackCircleRed}>
          <View style={styles.fallbackRedBar} />
        </View>
      );
    }
    return (
      <View style={styles.fallbackCircleRed}>
        <MaterialCommunityIcons color="#EF4444" name="cancel" size={32} />
      </View>
    );
  }

  // Warning: Yellow/Amber
  if (firstChar === 'W') {
    return (
      <View style={styles.fallbackDiamondYellow}>
        <MaterialCommunityIcons color="#D97706" name="alert" size={30} />
      </View>
    );
  }

  // Mandatory: Blue circle
  if (firstChar === 'R') {
    return (
      <View style={styles.fallbackCircleBlue}>
        <MaterialCommunityIcons color="#FFFFFF" name="arrow-up-bold" size={28} />
      </View>
    );
  }

  // Information: Blue / Green rectangle
  if (firstChar === 'I') {
    return (
      <View style={styles.fallbackRectBlue}>
        <MaterialCommunityIcons color="#FFFFFF" name="routes" size={26} />
      </View>
    );
  }

  // Default / Temporary: Orange rectangle
  return (
    <View style={styles.fallbackRectOrange}>
      <MaterialCommunityIcons color="#FFFFFF" name="cone" size={26} />
    </View>
  );
}

function SignCatalogGridCard({
  item,
  isSelected,
  onSelect,
  theme,
}: {
  item: CatalogSignItem;
  isSelected: boolean;
  onSelect: (item: CatalogSignItem) => void;
  theme: any;
}) {
  const [imageError, setImageError] = useState(false);
  const badgeColors = getSignBadgeColors(item.code);
  const itemColor = getSignColorFromCode(item.code);
  const hasValidUrl = Boolean(
    item.imageUrl && !item.imageUrl.includes('signtrustmap.vn') && !imageError,
  );

  return (
    <Pressable
      accessibilityLabel={`Chọn biển báo ${item.code} ${item.name}`}
      accessibilityRole="button"
      onPress={() => onSelect(item)}
      style={({ pressed }) => [
        styles.cardItem,
        {
          backgroundColor: isSelected
            ? `${itemColor}0E`
            : pressed
              ? `${theme.primary}08`
              : theme.surface || '#FFFFFF',
          borderColor: isSelected ? itemColor : theme.border,
        },
      ]}
      testID={`catalog-sign-item-${item.code}`}
    >
      {/* 1. Traffic Sign Graphic / Image */}
      <View style={styles.cardImageContainer}>
        {hasValidUrl ? (
          <Image
            accessibilityLabel={`${item.code} ${item.name}`}
            contentFit="contain"
            onError={() => setImageError(true)}
            source={{ uri: item.imageUrl! }}
            style={styles.cardSignImage}
          />
        ) : (
          <SignGraphicFallback item={item} />
        )}
      </View>

      {/* 2. Code Badge Pill */}
      <View
        style={[
          styles.codeBadgePill,
          { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
        ]}
      >
        <Text style={[styles.codeBadgeText, { color: badgeColors.text }]}>{item.code}</Text>
      </View>

      {/* 3. Name Label */}
      <Text numberOfLines={2} style={[styles.cardSignName, { color: theme.text }]}>
        {item.name}
      </Text>
    </Pressable>
  );
}

export function ReturnedSubmissionItemScreen({
  id: propId,
  initialImageUrl,
  signs: propSigns,
}: ReturnedSubmissionItemScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useOptionalSession()?.session;
  const params = useLocalSearchParams<{ id?: string; imageUrl?: string }>();

  const id = propId || params.id || '';

  const { data: statusData, isLoading: isStatusLoading } = useGetSurveySubmissionStatus(id);
  const resubmitMutation = useResubmitFalseNegativeMutation();

  const imageUrl = useMemo(() => {
    if (initialImageUrl) return initialImageUrl;
    if (params.imageUrl) return params.imageUrl;

    if (Array.isArray(statusData?.mediaFiles) && statusData.mediaFiles.length > 0) {
      const imgFile: any =
        statusData.mediaFiles.find(
          (m: any) => (m.mediaType || m.media_type || '').toUpperCase() === 'IMAGE',
        ) || statusData.mediaFiles[0];
      const rawUrl =
        (imgFile?.fileUrl as string | undefined) ||
        (imgFile?.file_url as string | undefined) ||
        (imgFile?.storageKey as string | undefined) ||
        (imgFile?.url as string | undefined);
      if (rawUrl && typeof rawUrl === 'string') return resolveS3Url(rawUrl);
    }

    if (Array.isArray(statusData?.sessions) && statusData.sessions.length > 0) {
      const imgSession: any =
        statusData.sessions.find(
          (s: any) => (s.mediaType || s.media_type || '').toUpperCase() === 'IMAGE',
        ) || statusData.sessions[0];
      const rawUrl =
        (imgSession?.storageKey as string | undefined) ||
        (imgSession?.storage_key as string | undefined) ||
        (imgSession?.fileUrl as string | undefined) ||
        (imgSession?.url as string | undefined);
      if (rawUrl && typeof rawUrl === 'string') return resolveS3Url(rawUrl);
    }

    return '';
  }, [initialImageUrl, params.imageUrl, statusData]);

  const [isZoomed, setIsZoomed] = useState(false);
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);

  // Catalog Bottom Sheet states
  const [activePickerBoxId, setActivePickerBoxId] = useState<string | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'ALL' | 'P' | 'W' | 'R' | 'I' | 'T'
  >('ALL');
  const [storedCatalogSigns, setStoredCatalogSigns] = useState<CatalogSignItem[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  useEffect(() => {
    if (propSigns && propSigns.length > 0) return;

    let isMounted = true;
    const abortController = new AbortController();

    void (async () => {
      try {
        const cached = await loadCatalogFromStorage();
        if (cached?.data?.signs && cached.data.signs.length > 0) {
          if (isMounted) {
            setStoredCatalogSigns(mapCatalogSignsToItems(cached.data.signs));
          }
          return;
        }

        if (!session?.accessToken) return;
        if (isMounted) setIsCatalogLoading(true);
        const remote = await getCatalog(session.accessToken, { signal: abortController.signal });
        if (isMounted && remote?.signs && remote.signs.length > 0) {
          setStoredCatalogSigns(mapCatalogSignsToItems(remote.signs));
        }
      } catch {
        // Gracefully keep empty list if both local cache and API fail
      } finally {
        if (isMounted) setIsCatalogLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [propSigns, session?.accessToken]);

  const availableSigns = useMemo(() => {
    if (propSigns && propSigns.length > 0) return propSigns;
    return storedCatalogSigns;
  }, [propSigns, storedCatalogSigns]);

  const filteredSigns = useMemo(() => {
    const query = normalizeVietnameseSearch(catalogSearchQuery);
    return availableSigns.filter((sign) => {
      // 1. Filter by category tab
      if (selectedCategoryFilter !== 'ALL') {
        const firstLetter = sign.code.trim().charAt(0).toUpperCase();
        if (firstLetter !== selectedCategoryFilter) return false;
      }
      // 2. Search query (code, name, description, categoryName)
      if (!query) return true;
      const searchable = normalizeVietnameseSearch(
        `${sign.code} ${sign.name} ${sign.description || ''} ${sign.categoryName || ''}`,
      );
      return searchable.includes(query);
    });
  }, [availableSigns, catalogSearchQuery, selectedCategoryFilter]);

  const activePickerBox = useMemo(() => {
    return boxes.find((b) => b.id === activePickerBoxId);
  }, [boxes, activePickerBoxId]);

  const activePickerIndex = useMemo(() => {
    return boxes.findIndex((b) => b.id === activePickerBoxId);
  }, [boxes, activePickerBoxId]);

  const handleSelectCatalogSign = useCallback(
    (sign: CatalogSignItem) => {
      if (!activePickerBoxId) return;
      const category = getSignCategory({ signCode: sign.code, name: sign.name });
      setBoxes((prev) =>
        prev.map((b) =>
          b.id === activePickerBoxId
            ? {
                ...b,
                signCode: sign.code,
                signName: sign.name,
                category,
              }
            : b,
        ),
      );
      setActivePickerBoxId(null);
      setCatalogSearchQuery('');
    },
    [activePickerBoxId],
  );

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
  const handleUpdateBox = useCallback((idToUpdate: string, updates: Partial<BoundingBox>) => {
    setBoxes((prev) => prev.map((b) => (b.id === idToUpdate ? { ...b, ...updates } : b)));
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
    if (boxes.length === 0) {
      Alert.alert(
        'Chưa có biển báo',
        'Vui lòng chạm vào ảnh để khoanh vùng ít nhất một vị trí có biển báo bị bỏ sót trước khi gửi duyệt lại.',
      );
      return;
    }

    Alert.alert(
      'Bạn chắc chắn chứ?',
      `Bạn đang xác nhận ${boxes.length} vị trí khoanh vùng có biển báo giao thông hợp lệ.`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đồng ý',
          style: 'default',
          onPress: async () => {
            try {
              await resubmitMutation.mutateAsync({
                submissionId: id,
                boxes,
                imageDimensions: imageLayout,
              });
              Alert.alert(
                'Thành công',
                'Đã gửi lại khảo sát kèm vị trí khoanh vùng bổ sung. Hồ sơ sẽ được đưa vào hàng đợi kiểm duyệt lại.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ],
              );
            } catch (err: any) {
              Alert.alert(
                'Lỗi gửi duyệt lại',
                err?.message || 'Không thể gửi lại hồ sơ khảo sát. Vui lòng thử lại sau.',
              );
            }
          },
        },
      ],
    );
  }, [boxes, id, imageLayout, resubmitMutation, router]);

  const activeBox =
    boxes.find((b) => b.id === activeBoxId) || (boxes.length > 0 ? boxes[boxes.length - 1] : null);

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
              Xác nhận vị trí biển báo
            </Text>
            {id ? (
              <Text style={[styles.screenSubtitle, { color: theme.placeholder }]}>Hồ sơ: {id}</Text>
            ) : null}
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

              {isStatusLoading && !initialImageUrl && !params.imageUrl ? (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                  <ActivityIndicator color={theme.primary} size="large" />
                  <Text style={[styles.loadingText, { color: '#FFFFFF' }]}>
                    Đang tải ảnh khảo sát...
                  </Text>
                </View>
              ) : null}

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

              {/* Formed Bounding Boxes with category-specific or primary color */}
              {boxes.map((box, index) => {
                const boxColor = getBoxColor(box, theme.primary);
                return (
                  <BoundingBoxItem
                    box={box}
                    color={boxColor}
                    imageHeight={imageLayout.height}
                    imageWidth={imageLayout.width}
                    index={index}
                    isSelected={box.id === (activeBox?.id ?? '')}
                    key={box.id}
                    onSelect={(selectedId) => setActiveBoxId(selectedId)}
                    onUpdate={handleUpdateBox}
                  />
                );
              })}

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

          {/* Section: Phân loại biển báo (Chọn class từ Sign Catalog cho từng box) */}
          {boxes.length > 0 ? (
            <View
              style={[
                styles.classificationCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
              testID="box-classification-section"
            >
              <View style={styles.classificationHeader}>
                <View
                  style={[
                    styles.classificationIconBadge,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                >
                  <MaterialCommunityIcons color={theme.primary} name="tag-outline" size={18} />
                </View>
                <View style={styles.classificationTitleCol}>
                  <Text style={[styles.classificationTitle, { color: theme.text }]}>
                    Phân loại biển báo
                  </Text>
                  <Text style={[styles.classificationSubtitle, { color: theme.placeholder }]}>
                    Chọn loại danh mục tương ứng cho từng vị trí đã khoanh vùng
                  </Text>
                </View>
              </View>

              <View style={styles.classificationRowsContainer}>
                {boxes.map((box, index) => {
                  const boxColor = getBoxColor(box, theme.primary);
                  const selectedCat = SIGN_CATEGORIES.find((c) => c.id === box.category);
                  const isBoxActive = box.id === (activeBox?.id ?? '');

                  return (
                    <View
                      key={box.id}
                      style={styles.classificationRow}
                      testID={`box-class-row-${index}`}
                    >
                      {/* 1. ID của box biển báo (box 1 container) căn lề dọc thẳng hàng với icon ở trên */}
                      <Pressable
                        accessibilityLabel={`Chọn Box ${index + 1}`}
                        onPress={() => setActiveBoxId(box.id)}
                        style={[
                          styles.boxIdBadge,
                          {
                            backgroundColor: isBoxActive ? boxColor : `${theme.placeholder}18`,
                            borderColor: isBoxActive ? boxColor : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.boxIdText,
                            { color: isBoxActive ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          Box {index + 1}
                        </Text>
                      </Pressable>

                      {/* 2. Selector chọn cụ thể biển báo từ Catalog dưới dạng Bottom Sheet */}
                      <Pressable
                        accessibilityLabel={`Chọn biển báo cho Box ${index + 1}`}
                        accessibilityRole="button"
                        onPress={() => {
                          setActiveBoxId(box.id);
                          setActivePickerBoxId(box.id);
                        }}
                        style={[
                          styles.catalogPickerTrigger,
                          {
                            backgroundColor: theme.background,
                            borderColor: isBoxActive ? boxColor : theme.border,
                          },
                        ]}
                        testID={`box-catalog-trigger-${index}`}
                      >
                        {box.signCode ? (
                          <View style={styles.selectedSignDisplay}>
                            <View
                              style={[styles.inlineCodeBadge, { backgroundColor: `${boxColor}22` }]}
                            >
                              <Text style={[styles.inlineCodeText, { color: boxColor }]}>
                                {box.signCode}
                              </Text>
                            </View>
                            <Text
                              numberOfLines={1}
                              style={[styles.inlineSignName, { color: theme.text }]}
                            >
                              {box.signName || box.signCode}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            numberOfLines={1}
                            style={[styles.catalogPlaceholder, { color: theme.placeholder }]}
                          >
                            Chọn biển báo từ danh mục...
                          </Text>
                        )}
                        <MaterialCommunityIcons
                          color={box.signCode ? boxColor : theme.placeholder}
                          name="chevron-down"
                          size={20}
                        />
                      </Pressable>

                      {/* 3. Bên phải hình vuông nhỏ bo góc thể hiện màu của class đó */}
                      <View
                        accessibilityLabel={`Màu của Box ${index + 1}: ${box.signCode ? `${box.signCode} - ${box.signName}` : 'Mặc định'}`}
                        style={[
                          styles.colorSquareIndicator,
                          {
                            backgroundColor: boxColor,
                            borderColor: isBoxActive ? theme.text : 'rgba(0, 0, 0, 0.15)',
                          },
                        ]}
                        testID={`box-color-square-${index}`}
                      >
                        {box.signCode || box.category ? (
                          <MaterialCommunityIcons color="#FFFFFF" name="check" size={14} />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

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
                {boxes.length >= MAX_BOXES ? `Đã đủ ${MAX_BOXES} box` : 'Thêm box mới'}
              </Text>
            </AppButton>
          </View>

          {/* Bottom Button (Span hết container): Confirm (Xác nhận) */}
          <AppButton
            accessibilityLabel="Xác nhận vị trí biển báo"
            disabled={boxes.length === 0 || resubmitMutation.isPending}
            onPress={handleConfirm}
            style={[
              styles.confirmBtnFullWidth,
              (boxes.length === 0 || resubmitMutation.isPending) && styles.btnDisabled,
            ]}
            testID="confirm-btn"
            variant="primary"
          >
            {resubmitMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
            ) : (
              <MaterialCommunityIcons color="#FFFFFF" name="check" size={20} />
            )}
            <Text style={styles.confirmBtnText}>
              {resubmitMutation.isPending ? 'Đang gửi duyệt lại...' : 'Xác nhận'}
            </Text>
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

      {/* Catalog Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setActivePickerBoxId(null)}
        statusBarTranslucent
        testID="catalog-bottom-sheet-modal"
        transparent
        visible={activePickerBoxId !== null}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetOverlay}
        >
          <Pressable
            accessibilityLabel="Đóng danh mục biển báo"
            onPress={() => setActivePickerBoxId(null)}
            style={styles.sheetBackdropPressable}
            testID="catalog-sheet-backdrop"
          />

          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            testID="catalog-bottom-sheet"
          >
            {/* Handle Drag Bar */}
            <View style={styles.sheetHandleBarWrapper}>
              <View style={[styles.sheetHandleBar, { backgroundColor: theme.placeholder }]} />
            </View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderTitles}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  Chọn biển báo thay thế từ danh mục
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.primary }]}>
                  {`${availableSigns.length} biển báo trong danh mục`}
                </Text>
              </View>

              <AppButton
                accessibilityLabel="Đóng tra cứu"
                hitSlop={8}
                onPress={() => setActivePickerBoxId(null)}
                style={styles.sheetCloseBtn}
                testID="close-catalog-btn"
                variant="ghost"
              >
                <MaterialCommunityIcons color={theme.text} name="close" size={24} />
              </AppButton>
            </View>

            {/* Search Input using universal AppInput component */}
            <View style={styles.sheetSearchContainer}>
              <AppInput
                accessibilityLabel="Tìm kiếm biển báo theo mã hoặc tên"
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.sheetSearchInputContainer}
                leadingIcon={
                  <MaterialCommunityIcons color={theme.placeholder} name="magnify" size={20} />
                }
                onChangeText={setCatalogSearchQuery}
                placeholder="Tìm theo mã (P.102...), tên biển..."
                returnKeyType="search"
                testID="catalog-search-input"
                trailingIcon={
                  catalogSearchQuery ? (
                    <Pressable
                      accessibilityLabel="Xóa tìm kiếm"
                      hitSlop={8}
                      onPress={() => setCatalogSearchQuery('')}
                      testID="clear-catalog-search-btn"
                    >
                      <MaterialCommunityIcons
                        color={theme.placeholder}
                        name="close-circle"
                        size={18}
                      />
                    </Pressable>
                  ) : undefined
                }
                type="search"
                value={catalogSearchQuery}
              />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabsWrapper}>
              <ScrollView
                contentContainerStyle={styles.filterChipsRow}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {FILTER_TABS.map((tab) => {
                  const isSelected = selectedCategoryFilter === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setSelectedCategoryFilter(tab.id as any)}
                      style={[
                        styles.filterChip,
                        isSelected
                          ? [
                              styles.filterChipActive,
                              { backgroundColor: theme.primary, borderColor: theme.primary },
                            ]
                          : [
                              styles.filterChipInactive,
                              {
                                backgroundColor: theme.backgroundElement,
                                borderColor: theme.border,
                              },
                            ],
                      ]}
                      testID={`catalog-filter-${tab.id.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontFamily: Fonts.body,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* VirtualList with 2-Column Grid */}
            <View style={styles.gridContainer}>
              {isCatalogLoading && availableSigns.length === 0 ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={theme.primary} size="large" />
                  <Text style={[styles.loadingText, { color: theme.placeholder }]}>
                    Đang tải danh mục biển báo...
                  </Text>
                </View>
              ) : (
                <VirtualList<CatalogSignItem>
                  contentContainerStyle={styles.signsGridContent}
                  data={filteredSigns}
                  emptyDescription='Thử tìm với từ khóa khác (ví dụ: "cấm", "nguy hiểm", "P.101")'
                  emptyTitle="Không tìm thấy biển báo"
                  estimatedItemSize={185}
                  keyExtractor={(item) => item.code}
                  keyboardShouldPersistTaps="handled"
                  numColumns={2}
                  renderItem={({ item }) => (
                    <SignCatalogGridCard
                      isSelected={activePickerBox?.signCode === item.code}
                      item={item}
                      onSelect={handleSelectCatalogSign}
                      theme={theme}
                    />
                  )}
                  testID="catalog-signs-list"
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Zoom Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setIsZoomed(false)}
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
