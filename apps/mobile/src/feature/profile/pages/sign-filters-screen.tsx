import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { VirtualList } from '@/components/virtual-list';
import {
  SIGN_CATEGORIES,
  type SignCategory,
} from '@/constants/sign-categories';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  useSignFilter,
  type SignFilterPreset,
} from '@/context/sign-filter-provider';
import type { ApiPlace } from '@/api/navigation/places';
import { usePlaceSuggestions } from '@/feature/navigation/hooks/use-places';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { resolveLocation, formatResolvedLocationTitle } from '@/api/spatial/spatial';
import { useOptionalSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';

type SelectedPlace = {
  title: string;
  address?: string | null;
  latitude: number;
  longitude: number;
};

export type SignFilterListItem =
  | {
      id: string;
      type: 'default';
      title: string;
      description: string;
    }
  | {
      id: string;
      type: 'preset';
      preset: SignFilterPreset;
    };

export function SignFiltersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useOptionalSession()?.session;
  const {
    activePresetId,
    createPreset,
    deletePreset,
    presets,
    refetchPresets,
    renamePreset,
    setActivePresetId,
    updatePreset,
  } = useSignFilter();

  const [isRefetching, setIsRefetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void refetchPresets();
    }, [refetchPresets]),
  );

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true);
    try {
      await refetchPresets();
    } finally {
      setIsRefetching(false);
    }
  }, [refetchPresets]);

  // Create / Edit modal state
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SignFilterPreset | null>(null);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [vehicleMode, setVehicleMode] = useState<'MOTORCYCLE' | 'CAR' | 'CYCLING' | 'WALKING'>('MOTORCYCLE');

  // Start point state
  const [startPoint, setStartPoint] = useState<SelectedPlace | null>(null);
  const [startQuery, setStartQuery] = useState('');
  const [isStartFocused, setIsStartFocused] = useState(false);
  const [isLocatingStart, setIsLocatingStart] = useState(false);

  // Destination point state
  const [destPoint, setDestPoint] = useState<SelectedPlace | null>(null);
  const [destQuery, setDestQuery] = useState('');
  const [isDestFocused, setIsDestFocused] = useState(false);
  const [isLocatingDest, setIsLocatingDest] = useState(false);

  // Debounced place suggestions
  const { data: startSuggestions = [], isLoading: isStartSearching } = usePlaceSuggestions(startQuery);
  const { data: destSuggestions = [], isLoading: isDestSearching } = usePlaceSuggestions(destQuery);

  const [selectedCategories, setSelectedCategories] = useState<Set<SignCategory>>(
    new Set(['MANDATORY', 'WARNING', 'PROHIBITORY']),
  );
  const [editorError, setEditorError] = useState('');

  // Rename-only modal state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameError, setRenameError] = useState('');

  // Open editor for new preset
  const handleOpenCreate = () => {
    setEditingPreset(null);
    setPresetNameInput('');
    setStartPoint(null);
    setStartQuery('');
    setIsStartFocused(false);
    setDestPoint(null);
    setDestQuery('');
    setIsDestFocused(false);
    setVehicleMode('MOTORCYCLE');
    setSelectedCategories(new Set(['MANDATORY', 'WARNING', 'PROHIBITORY']));
    setEditorError('');
    setIsEditorModalOpen(true);
  };

  // Open editor for existing preset
  const handleOpenEdit = (preset: SignFilterPreset) => {
    setEditingPreset(preset);
    setPresetNameInput(preset.name);
    setSelectedCategories(new Set(preset.categories));
    if (preset.savedRoute) {
      setStartPoint({
        title: preset.savedRoute.originName,
        latitude: preset.savedRoute.originLatitude,
        longitude: preset.savedRoute.originLongitude,
      });
      setStartQuery(preset.savedRoute.originName);
      setDestPoint({
        title: preset.savedRoute.destinationName,
        latitude: preset.savedRoute.destinationLatitude,
        longitude: preset.savedRoute.destinationLongitude,
      });
      setDestQuery(preset.savedRoute.destinationName);
      const vMode = preset.savedRoute.vehicleMode?.toUpperCase();
      if (vMode === 'CYCLING' || vMode === 'BICYCLE') setVehicleMode('CYCLING');
      else if (vMode === 'WALKING' || vMode === 'PEDESTRIAN') setVehicleMode('WALKING');
      else if (vMode === 'CAR') setVehicleMode('CAR');
      else setVehicleMode('MOTORCYCLE');
    } else {
      setStartPoint(null);
      setStartQuery('');
      setDestPoint(null);
      setDestQuery('');
      setVehicleMode('MOTORCYCLE');
    }
    setIsStartFocused(false);
    setIsDestFocused(false);
    setEditorError('');
    setIsEditorModalOpen(true);
  };

  // GPS for Start
  const handleSelectCurrentLocationForStart = async () => {
    setIsLocatingStart(true);
    try {
      const pos = await fetchFreshGpsPosition(3500);
      if (pos) {
        let resolvedTitle = 'Vị trí hiện tại';
        let resolvedAddress = 'Tọa độ GPS thiết bị';
        try {
          const resolved = await resolveLocation(pos[1], pos[0], session?.accessToken);
          const formatted = formatResolvedLocationTitle(resolved);
          if (formatted) {
            resolvedTitle = formatted;
            resolvedAddress = resolved?.displayAddress || resolvedAddress;
          }
        } catch {
          // keep fallback
        }
        setStartPoint({
          title: resolvedTitle,
          address: resolvedAddress,
          latitude: pos[1],
          longitude: pos[0],
        });
        setStartQuery(resolvedTitle);
        setIsStartFocused(false);
        setEditorError('');
      } else {
        Alert.alert('Không thể xác định vị trí', 'Vui lòng kiểm tra quyền truy cập vị trí và bật GPS.');
      }
    } catch {
      Alert.alert('Lỗi GPS', 'Không thể lấy vị trí hiện tại.');
    } finally {
      setIsLocatingStart(false);
    }
  };

  // GPS for Destination
  const handleSelectCurrentLocationForDest = async () => {
    setIsLocatingDest(true);
    try {
      const pos = await fetchFreshGpsPosition(3500);
      if (pos) {
        let resolvedTitle = 'Vị trí hiện tại';
        let resolvedAddress = 'Tọa độ GPS thiết bị';
        try {
          const resolved = await resolveLocation(pos[1], pos[0], session?.accessToken);
          const formatted = formatResolvedLocationTitle(resolved);
          if (formatted) {
            resolvedTitle = formatted;
            resolvedAddress = resolved?.displayAddress || resolvedAddress;
          }
        } catch {
          // keep fallback
        }
        setDestPoint({
          title: resolvedTitle,
          address: resolvedAddress,
          latitude: pos[1],
          longitude: pos[0],
        });
        setDestQuery(resolvedTitle);
        setIsDestFocused(false);
        setEditorError('');
      } else {
        Alert.alert('Không thể xác định vị trí', 'Vui lòng kiểm tra quyền truy cập vị trí và bật GPS.');
      }
    } catch {
      Alert.alert('Lỗi GPS', 'Không thể lấy vị trí hiện tại.');
    } finally {
      setIsLocatingDest(false);
    }
  };

  // Select suggestion for Start
  const handleSelectStartSuggestion = (item: ApiPlace) => {
    if (item.latitude == null || item.longitude == null) return;
    setStartPoint({
      title: item.title,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setStartQuery(item.title);
    setIsStartFocused(false);
    setEditorError('');
  };

  // Select suggestion for Destination
  const handleSelectDestSuggestion = (item: ApiPlace) => {
    if (item.latitude == null || item.longitude == null) return;
    setDestPoint({
      title: item.title,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setDestQuery(item.title);
    setIsDestFocused(false);
    setEditorError('');
  };

  // Open rename modal
  const handleOpenRename = (preset: SignFilterPreset) => {
    setRenamingPresetId(preset.id);
    setRenameInput(preset.name);
    setRenameError('');
    setIsRenameModalOpen(true);
  };

  // Navigate to map to view corridor and signs
  const handleViewOnMap = (preset: SignFilterPreset) => {
    void setActivePresetId(preset.id);
    router.push({
      pathname: '/(authenticated)/(tabs)/home',
      params: { savedRouteId: preset.id },
    });
  };

  // Toggle category checkbox in editor
  const handleToggleCategory = (cat: SignCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) {
          setEditorError('Danh sách phải bao gồm ít nhất một danh mục biển báo.');
          return prev;
        }
        next.delete(cat);
      } else {
        next.add(cat);
      }
      setEditorError('');
      return next;
    });
  };

  // Save create / edit
  const handleSaveEditor = async () => {
    if (selectedCategories.size === 0) {
      setEditorError('Chọn ít nhất một danh mục biển báo.');
      return;
    }

    const categoriesArray = Array.from(selectedCategories);
    if (editingPreset) {
      const trimmed = presetNameInput.trim() || editingPreset.name;
      await updatePreset(editingPreset.id, {
        name: trimmed,
        categories: categoriesArray,
        onlyFixedSigns: true,
      });
    } else {
      if (!startPoint) {
        setEditorError('Vui lòng chọn Điểm bắt đầu (nhập tìm kiếm hoặc chọn Vị trí hiện tại).');
        return;
      }
      if (!destPoint) {
        setEditorError('Vui lòng chọn Điểm đến (nhập tìm kiếm hoặc chọn Vị trí hiện tại).');
        return;
      }

      const finalName = presetNameInput.trim() || `${startPoint.title} ➔ ${destPoint.title}`;
      await createPreset(finalName, categoriesArray, {
        originName: startPoint.title,
        originLatitude: startPoint.latitude,
        originLongitude: startPoint.longitude,
        destinationName: destPoint.title,
        destinationLatitude: destPoint.latitude,
        destinationLongitude: destPoint.longitude,
        vehicleMode,
        onlyFixedSigns: true,
      });
    }
    setIsEditorModalOpen(false);
  };

  // Save rename
  const handleSaveRename = async () => {
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setRenameError('Tên danh sách không được để trống.');
      return;
    }
    if (renamingPresetId) {
      await renamePreset(renamingPresetId, trimmed);
    }
    setIsRenameModalOpen(false);
  };

  // Confirm delete
  const handleDeletePress = (preset: SignFilterPreset) => {
    Alert.alert(
      'Xóa lộ trình đã lưu',
      `Bạn có chắc chắn muốn xóa "${preset.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void deletePreset(preset.id);
          },
        },
      ],
    );
  };

  const categoryMap = useMemo(() => {
    const map = new Map<SignCategory, (typeof SIGN_CATEGORIES)[number]>();
    for (const c of SIGN_CATEGORIES) {
      map.set(c.id, c);
    }
    return map;
  }, []);

  // Filtered List Items for VirtualList
  const listItems = useMemo<SignFilterListItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: SignFilterListItem[] = [];

    // Default "All signs" item
    if (!q || 'tất cả biển báo không lọc'.includes(q)) {
      result.push({
        id: '__default_filter__',
        type: 'default',
        title: 'Tất cả biển báo (Không lọc)',
        description: 'Hiển thị và cảnh báo cho tất cả danh mục biển báo',
      });
    }

    // Custom presets
    for (const preset of presets) {
      const matchName = preset.name.toLowerCase().includes(q);
      const matchOrigin = preset.savedRoute?.originName?.toLowerCase().includes(q);
      const matchDest = preset.savedRoute?.destinationName?.toLowerCase().includes(q);
      if (!q || matchName || matchOrigin || matchDest) {
        result.push({
          id: preset.id,
          type: 'preset',
          preset,
        });
      }
    }

    return result;
  }, [presets, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: SignFilterListItem }) => {
      if (item.type === 'default') {
        const isSelected = activePresetId === null;
        return (
          <Pressable
            accessibilityLabel={`Tất cả biển báo (Không lọc), ${isSelected ? 'đã chọn' : 'chưa chọn'}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={() => void setActivePresetId(null)}
            style={({ pressed }) => [
              styles.presetCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: isSelected ? theme.primary : theme.border,
                borderWidth: isSelected ? 1.5 : 1,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: isSelected ? `${theme.primary}15` : `${theme.placeholder}12`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  color={isSelected ? theme.primary : theme.placeholder}
                  name="filter-outline"
                  size={22}
                />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTitleLine}>
                  <Text numberOfLines={1} style={[styles.cardTitleText, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  {isSelected ? (
                    <View style={[styles.activeBadge, { backgroundColor: `${theme.primary}18` }]}>
                      <Text style={[styles.activeBadgeText, { color: theme.primary }]}>
                        Đang chọn
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.cardDescText, { color: theme.placeholder }]}>
                  {item.description}
                </Text>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.primary : 'transparent',
                  },
                ]}
              >
                {isSelected ? (
                  <MaterialCommunityIcons color="#FFFFFF" name="check" size={14} />
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      }

      // Custom Preset
      const { preset } = item;
      const isSelected = activePresetId === preset.id;
      const vMode = preset.savedRoute?.vehicleMode?.toUpperCase();
      const vehicleIcon =
        vMode === 'CYCLING' || vMode === 'BICYCLE'
          ? 'bicycle'
          : vMode === 'WALKING' || vMode === 'PEDESTRIAN'
            ? 'walk'
            : vMode === 'MOTORCYCLE' || vMode === 'BIKE'
              ? 'motorbike'
              : 'car';
      const hasRouteDetails = Boolean(
        preset.savedRoute?.originName && preset.savedRoute?.destinationName,
      );
      const routeDisplayName = hasRouteDetails
        ? `${preset.savedRoute!.originName} ➔ ${preset.savedRoute!.destinationName}`
        : preset.name;

      const categoryLabels = preset.categories
        .map((catId) => categoryMap.get(catId)?.label)
        .filter(Boolean)
        .join(', ');

      return (
        <View
          style={[
            styles.presetCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: isSelected ? theme.primary : theme.border,
              borderWidth: isSelected ? 1.5 : 1,
            },
          ]}
        >
          {/* Main Selectable Area */}
          <Pressable
            accessibilityLabel={`${routeDisplayName}, ${isSelected ? 'đã chọn' : 'chưa chọn'}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={() => void setActivePresetId(preset.id)}
            style={({ pressed }) => [
              styles.cardHeaderRow,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View
              style={[
                styles.iconTile,
                {
                  backgroundColor: isSelected ? `${theme.primary}15` : `${theme.placeholder}12`,
                },
              ]}
            >
              <MaterialCommunityIcons
                color={isSelected ? theme.primary : theme.placeholder}
                name={hasRouteDetails ? vehicleIcon : 'playlist-check'}
                size={22}
              />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTitleLine}>
                <Text numberOfLines={1} style={[styles.cardTitleText, { color: theme.text }]}>
                  {routeDisplayName}
                </Text>
                {isSelected ? (
                  <View style={[styles.activeBadge, { backgroundColor: `${theme.primary}18` }]}>
                    <Text style={[styles.activeBadgeText, { color: theme.primary }]}>
                      Đang chọn
                    </Text>
                  </View>
                ) : null}
              </View>

              {hasRouteDetails && preset.name && preset.name !== routeDisplayName ? (
                <View style={styles.nicknameRow}>
                  <MaterialCommunityIcons
                    color={theme.placeholder}
                    name="bookmark-outline"
                    size={13}
                  />
                  <Text numberOfLines={1} style={[styles.nicknameText, { color: theme.placeholder }]}>
                    {preset.name}
                  </Text>
                </View>
              ) : null}

              {/* Category tags */}
              <View style={styles.categoriesRow}>
                <MaterialCommunityIcons
                  color={theme.primary}
                  name="shield-check-outline"
                  size={14}
                  style={styles.categoryLeadIcon}
                />
                <Text numberOfLines={1} style={[styles.categoriesText, { color: theme.textSecondary }]}>
                  {categoryLabels || `${preset.categories.length} danh mục`}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: isSelected ? theme.primary : theme.border,
                  backgroundColor: isSelected ? theme.primary : 'transparent',
                },
              ]}
            >
              {isSelected ? (
                <MaterialCommunityIcons color="#FFFFFF" name="check" size={14} />
              ) : null}
            </View>
          </Pressable>

          {/* Action Footer */}
          <View style={[styles.cardActionFooter, { borderTopColor: theme.border }]}>
            <AppButton
              accessibilityLabel={`Xem trên bản đồ: ${preset.name}`}
              onPress={() => handleViewOnMap(preset)}
              style={styles.actionBtn}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.primary} name="map-outline" size={15} />
              <Text style={[styles.actionBtnText, { color: theme.primary }]}>Bản đồ</Text>
            </AppButton>

            <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

            <AppButton
              accessibilityLabel={`Chỉnh sửa bộ lọc cho ${preset.name}`}
              onPress={() => handleOpenEdit(preset)}
              style={styles.actionBtn}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.primary} name="tune-variant" size={15} />
              <Text style={[styles.actionBtnText, { color: theme.primary }]}>Bộ lọc</Text>
            </AppButton>

            <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

            <AppButton
              accessibilityLabel={`Đổi tên ${preset.name}`}
              onPress={() => handleOpenRename(preset)}
              style={styles.actionBtn}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.primary} name="pencil-outline" size={15} />
              <Text style={[styles.actionBtnText, { color: theme.primary }]}>Đổi tên</Text>
            </AppButton>

            <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

            <AppButton
              accessibilityLabel={`Xóa ${preset.name}`}
              onPress={() => handleDeletePress(preset)}
              style={styles.actionBtn}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.danger} name="trash-can-outline" size={15} />
              <Text style={[styles.actionBtnText, { color: theme.danger }]}>Xóa</Text>
            </AppButton>
          </View>
        </View>
      );
    },
    [activePresetId, categoryMap, handleDeletePress, handleOpenEdit, handleOpenRename, handleViewOnMap, setActivePresetId, theme],
  );

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
          <View style={styles.topBarLeft}>
            <AppButton
              accessibilityLabel="Quay lại"
              onPress={() => router.back()}
              pressedOpacity={0.6}
              style={styles.backButton}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
            </AppButton>
            <View style={styles.topBarTitles}>
              <Text style={[styles.screenTitle, { color: theme.text }]}>Bộ lọc biển báo</Text>
              <Text style={[styles.screenSubtitle, { color: theme.placeholder }]}>
                Lộ trình đã lưu & quy tắc lọc
              </Text>
            </View>
          </View>

          <AppButton
            accessibilityLabel="Tạo lộ trình & bộ lọc mới"
            onPress={handleOpenCreate}
            style={styles.headerAddBtn}
            variant="primary"
          >
            <MaterialCommunityIcons color="#FFFFFF" name="plus" size={16} />
            <Text style={styles.headerAddBtnText}>Thêm mới</Text>
          </AppButton>
        </View>

        {/* Search Bar & Filter Summary Header */}
        <View style={styles.listHeaderContainer}>
          <View
            style={[
              styles.searchBarWrapper,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              color={theme.placeholder}
              name="magnify"
              size={20}
              style={styles.searchIcon}
            />
            <TextInput
              accessibilityLabel="Tìm kiếm lộ trình hoặc địa điểm"
              onChangeText={setSearchQuery}
              placeholder="Tìm lộ trình hoặc địa điểm..."
              placeholderTextColor={theme.placeholder}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
            />
            {searchQuery.length > 0 ? (
              <Pressable
                accessibilityLabel="Xóa tìm kiếm"
                hitSlop={8}
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <MaterialCommunityIcons color={theme.placeholder} name="close-circle" size={18} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              Danh sách bộ lọc ({presets.length + 1})
            </Text>
            <Text style={[styles.summaryHint, { color: theme.placeholder }]}>
              Chạm để kích hoạt bộ lọc
            </Text>
          </View>
        </View>

        {/* Virtual List */}
        <View style={styles.listContainer}>
          <VirtualList<SignFilterListItem>
            contentContainerStyle={styles.listContent}
            data={listItems}
            estimatedItemSize={140}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={theme.primary}
                    name="routes"
                    size={42}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Không tìm thấy lộ trình nào
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                  {searchQuery
                    ? 'Không có lộ trình nào phù hợp với từ khóa tìm kiếm.'
                    : 'Hãy tạo lộ trình mới để lọc biển báo trên tuyến đường của bạn.'}
                </Text>
                <AppButton
                  accessibilityLabel="Tạo lộ trình & bộ lọc đầu tiên"
                  onPress={handleOpenCreate}
                  style={styles.emptyAddBtn}
                  variant="primary"
                >
                  <MaterialCommunityIcons color="#FFFFFF" name="plus" size={18} />
                  <Text style={styles.emptyAddBtnText}>Thêm lộ trình mới</Text>
                </AppButton>
              </View>
            }
            refreshControl={
              <RefreshControl
                colors={[theme.primary]}
                onRefresh={() => void handleRefresh()}
                refreshing={isRefetching}
                tintColor={theme.primary}
              />
            }
            renderItem={renderItem}
          />
        </View>

        {/* Modal: Create or Edit Preset */}
        <Modal
          animationType="slide"
          onRequestClose={() => setIsEditorModalOpen(false)}
          transparent
          visible={isEditorModalOpen}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalDialog,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {editingPreset ? 'Chỉnh sửa lộ trình & bộ lọc' : 'Lộ trình & bộ lọc mới'}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.placeholder }]}>
                    {editingPreset
                      ? 'Cập nhật danh mục biển báo và tùy chọn lộ trình'
                      : 'Thiết lập điểm đi, điểm đến và danh mục biển báo'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Đóng chỉnh sửa"
                  hitSlop={8}
                  onPress={() => setIsEditorModalOpen(false)}
                  style={styles.modalCloseBtn}
                >
                  <MaterialCommunityIcons color={theme.placeholder} name="close" size={22} />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Start Point Input */}
                <View style={styles.pointHeaderRow}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Điểm xuất phát</Text>
                  <Pressable
                    accessibilityLabel="Chọn vị trí hiện tại cho điểm bắt đầu"
                    disabled={isLocatingStart}
                    onPress={handleSelectCurrentLocationForStart}
                    style={({ pressed }) => [
                      styles.gpsInlineBtn,
                      {
                        backgroundColor:
                          startPoint?.title === 'Vị trí hiện tại'
                            ? theme.backgroundSelected
                            : theme.background,
                        borderColor:
                          startPoint?.title === 'Vị trí hiện tại' ? theme.primary : theme.border,
                        opacity: pressed || isLocatingStart ? 0.7 : 1,
                      },
                    ]}
                  >
                    {isLocatingStart ? (
                      <ActivityIndicator color={theme.primary} size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          color={theme.primary}
                          name="crosshairs-gps"
                          size={14}
                        />
                        <Text style={[styles.gpsInlineText, { color: theme.primary }]}>
                          Vị trí hiện tại
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.searchFieldWrapper,
                    {
                      backgroundColor: theme.background,
                      borderColor: !startPoint && editorError ? theme.danger : theme.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    color="#10B981"
                    name="map-marker"
                    size={18}
                    style={styles.inputLeadingIcon}
                  />
                  <TextInput
                    accessibilityLabel="Nhập điểm bắt đầu"
                    onChangeText={(t) => {
                      setStartQuery(t);
                      if (startPoint && t !== startPoint.title) {
                        setStartPoint(null);
                      }
                      setEditorError('');
                    }}
                    onFocus={() => {
                      setIsStartFocused(true);
                      setIsDestFocused(false);
                    }}
                    placeholder="Tìm kiếm điểm xuất phát..."
                    placeholderTextColor={theme.placeholder}
                    style={[styles.pointTextInput, { color: theme.text }]}
                    value={startQuery}
                  />
                  {startQuery.length > 0 ? (
                    <Pressable
                      accessibilityLabel="Xóa điểm bắt đầu"
                      hitSlop={8}
                      onPress={() => {
                        setStartQuery('');
                        setStartPoint(null);
                      }}
                      style={styles.clearBtn}
                    >
                      <MaterialCommunityIcons
                        color={theme.placeholder}
                        name="close-circle"
                        size={16}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {/* Start Suggestions Dropdown */}
                {isStartFocused && !startPoint && (
                  <View
                    style={[
                      styles.suggestionsDropdown,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    {isStartSearching ? (
                      <View style={styles.suggestionsLoading}>
                        <ActivityIndicator color={theme.primary} size="small" />
                        <Text style={[styles.searchingText, { color: theme.textSecondary }]}>
                          Đang tìm kiếm...
                        </Text>
                      </View>
                    ) : startSuggestions.length > 0 ? (
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        style={styles.suggestionsList}
                      >
                        {startSuggestions.slice(0, 5).map((sug) => (
                          <Pressable
                            key={sug.id}
                            onPress={() => handleSelectStartSuggestion(sug)}
                            style={({ pressed }) => [
                              styles.suggestionItem,
                              { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
                            ]}
                          >
                            <MaterialCommunityIcons
                              color={theme.primary}
                              name="map-marker-outline"
                              size={16}
                            />
                            <View style={styles.suggestionTextWrapper}>
                              <Text
                                numberOfLines={1}
                                style={[styles.suggestionTitle, { color: theme.text }]}
                              >
                                {sug.title}
                              </Text>
                              {sug.address ? (
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.suggestionSubtitle,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  {sug.address}
                                </Text>
                              ) : null}
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : startQuery.trim().length >= 2 ? (
                      <Text style={[styles.noSuggestionsText, { color: theme.textSecondary }]}>
                        Không tìm thấy địa điểm phù hợp
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Destination Point Input */}
                <View style={[styles.pointHeaderRow, { marginTop: Spacing.three }]}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Điểm đến</Text>
                  <Pressable
                    accessibilityLabel="Chọn vị trí hiện tại cho điểm đến"
                    disabled={isLocatingDest}
                    onPress={handleSelectCurrentLocationForDest}
                    style={({ pressed }) => [
                      styles.gpsInlineBtn,
                      {
                        backgroundColor:
                          destPoint?.title === 'Vị trí hiện tại'
                            ? theme.backgroundSelected
                            : theme.background,
                        borderColor:
                          destPoint?.title === 'Vị trí hiện tại' ? theme.primary : theme.border,
                        opacity: pressed || isLocatingDest ? 0.7 : 1,
                      },
                    ]}
                  >
                    {isLocatingDest ? (
                      <ActivityIndicator color={theme.primary} size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          color={theme.primary}
                          name="crosshairs-gps"
                          size={14}
                        />
                        <Text style={[styles.gpsInlineText, { color: theme.primary }]}>
                          Vị trí hiện tại
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.searchFieldWrapper,
                    {
                      backgroundColor: theme.background,
                      borderColor: !destPoint && editorError ? theme.danger : theme.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    color="#EF4444"
                    name="flag-checkered"
                    size={18}
                    style={styles.inputLeadingIcon}
                  />
                  <TextInput
                    accessibilityLabel="Nhập điểm đến"
                    onChangeText={(t) => {
                      setDestQuery(t);
                      if (destPoint && t !== destPoint.title) {
                        setDestPoint(null);
                      }
                      setEditorError('');
                    }}
                    onFocus={() => {
                      setIsDestFocused(true);
                      setIsStartFocused(false);
                    }}
                    placeholder="Tìm kiếm điểm đến..."
                    placeholderTextColor={theme.placeholder}
                    style={[styles.pointTextInput, { color: theme.text }]}
                    value={destQuery}
                  />
                  {destQuery.length > 0 ? (
                    <Pressable
                      accessibilityLabel="Xóa điểm đến"
                      hitSlop={8}
                      onPress={() => {
                        setDestQuery('');
                        setDestPoint(null);
                      }}
                      style={styles.clearBtn}
                    >
                      <MaterialCommunityIcons
                        color={theme.placeholder}
                        name="close-circle"
                        size={16}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {/* Destination Suggestions Dropdown */}
                {isDestFocused && !destPoint && (
                  <View
                    style={[
                      styles.suggestionsDropdown,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    {isDestSearching ? (
                      <View style={styles.suggestionsLoading}>
                        <ActivityIndicator color={theme.primary} size="small" />
                        <Text style={[styles.searchingText, { color: theme.textSecondary }]}>
                          Đang tìm kiếm...
                        </Text>
                      </View>
                    ) : destSuggestions.length > 0 ? (
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        style={styles.suggestionsList}
                      >
                        {destSuggestions.slice(0, 5).map((sug) => (
                          <Pressable
                            key={sug.id}
                            onPress={() => handleSelectDestSuggestion(sug)}
                            style={({ pressed }) => [
                              styles.suggestionItem,
                              { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
                            ]}
                          >
                            <MaterialCommunityIcons
                              color={theme.primary}
                              name="map-marker-outline"
                              size={16}
                            />
                            <View style={styles.suggestionTextWrapper}>
                              <Text
                                numberOfLines={1}
                                style={[styles.suggestionTitle, { color: theme.text }]}
                              >
                                {sug.title}
                              </Text>
                              {sug.address ? (
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.suggestionSubtitle,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  {sug.address}
                                </Text>
                              ) : null}
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : destQuery.trim().length >= 2 ? (
                      <Text style={[styles.noSuggestionsText, { color: theme.textSecondary }]}>
                        Không tìm thấy địa điểm phù hợp
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Vehicle Preference */}
                <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.three }]}>
                  Phương tiện di chuyển
                </Text>
                <View style={styles.vehicleModeRow}>
                  {[
                    { id: 'MOTORCYCLE', label: 'Xe máy', icon: 'motorbike' },
                    { id: 'CAR', label: 'Ô tô', icon: 'car' },
                    { id: 'CYCLING', label: 'Xe đạp', icon: 'bicycle' },
                    { id: 'WALKING', label: 'Đi bộ', icon: 'walk' },
                  ].map((v) => {
                    const isSelected = vehicleMode === v.id;
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => setVehicleMode(v.id as any)}
                        style={[
                          styles.vehicleModeChip,
                          {
                            backgroundColor: isSelected
                              ? theme.backgroundSelected
                              : theme.background,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color={isSelected ? theme.primary : theme.placeholder}
                          name={v.icon as any}
                          size={18}
                        />
                        <Text
                          style={[
                            styles.vehicleModeText,
                            {
                              color: isSelected ? theme.primary : theme.placeholder,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {v.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Optional Custom Name */}
                <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.three }]}>
                  Tên lộ trình (Tùy chọn)
                </Text>
                <TextInput
                  accessibilityLabel="Tên lộ trình tùy chọn"
                  maxLength={60}
                  onChangeText={(t) => {
                    setPresetNameInput(t);
                    setEditorError('');
                  }}
                  placeholder={
                    startPoint && destPoint
                      ? `${startPoint.title} ➔ ${destPoint.title}`
                      : 'Tự động tạo: [Điểm xuất phát] ➔ [Điểm đến]'
                  }
                  placeholderTextColor={theme.placeholder}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={presetNameInput}
                />

                {/* Category Picker */}
                <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.three }]}>
                  Chọn danh mục biển báo cần bao gồm
                </Text>
                <Text style={[styles.inputHint, { color: theme.placeholder }]}>
                  Chỉ các biển báo thuộc danh mục được chọn mới được hiển thị và cảnh báo.
                </Text>

                <View style={styles.categoryPickerList}>
                  {SIGN_CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.has(cat.id);
                    return (
                      <Pressable
                        key={cat.id}
                        accessibilityLabel={`Biển ${cat.label}, ${isChecked ? 'đã bao gồm' : 'chưa bao gồm'}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isChecked }}
                        onPress={() => handleToggleCategory(cat.id)}
                        style={({ pressed }) => [
                          styles.catOptionRow,
                          {
                            backgroundColor: isChecked
                              ? theme.backgroundSelected
                              : theme.background,
                            borderColor: isChecked ? cat.color : theme.border,
                            opacity: pressed ? 0.75 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.catIconShell, { backgroundColor: cat.bgColor }]}>
                          <MaterialCommunityIcons color={cat.color} name={cat.icon} size={18} />
                        </View>

                        <View style={styles.catOptionCopy}>
                          <Text style={[styles.catOptionTitle, { color: theme.text }]}>
                            {cat.label}
                          </Text>
                          <Text style={[styles.catOptionSublabel, { color: theme.placeholder }]}>
                            {cat.sublabel}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.catCheckbox,
                            {
                              backgroundColor: isChecked ? cat.color : 'transparent',
                              borderColor: isChecked ? cat.color : theme.border,
                            },
                          ]}
                        >
                          {isChecked ? (
                            <MaterialCommunityIcons color="#FFFFFF" name="check" size={13} />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {editorError ? (
                  <Text style={[styles.errorText, { color: theme.danger }]}>{editorError}</Text>
                ) : null}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <AppButton
                  accessibilityLabel="Hủy chỉnh sửa"
                  onPress={() => setIsEditorModalOpen(false)}
                  style={styles.modalCancelBtn}
                  variant="ghost"
                >
                  <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>Hủy</Text>
                </AppButton>
                <AppButton
                  accessibilityLabel="Lưu danh sách lọc"
                  onPress={handleSaveEditor}
                  style={styles.modalSaveBtn}
                  variant="primary"
                >
                  <Text style={styles.modalSaveText}>
                    {editingPreset ? 'Lưu thay đổi' : 'Tạo lộ trình'}
                  </Text>
                </AppButton>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Rename Preset */}
        <Modal
          animationType="fade"
          onRequestClose={() => setIsRenameModalOpen(false)}
          transparent
          visible={isRenameModalOpen}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalDialogSmall,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>Đổi tên lộ trình</Text>
              <TextInput
                accessibilityLabel="Nhập tên lộ trình mới"
                autoFocus
                maxLength={60}
                onChangeText={(t) => {
                  setRenameInput(t);
                  setRenameError('');
                }}
                placeholder="Nhập tên danh sách / lộ trình..."
                placeholderTextColor={theme.placeholder}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: renameError ? theme.danger : theme.border,
                    color: theme.text,
                    marginTop: Spacing.two,
                  },
                ]}
                value={renameInput}
              />
              {renameError ? (
                <Text style={[styles.errorText, { color: theme.danger }]}>{renameError}</Text>
              ) : null}

              <View style={styles.renameActionRow}>
                <AppButton
                  accessibilityLabel="Hủy đổi tên"
                  onPress={() => setIsRenameModalOpen(false)}
                  style={styles.modalCancelBtn}
                  variant="ghost"
                >
                  <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>Hủy</Text>
                </AppButton>
                <AppButton
                  accessibilityLabel="Xác nhận đổi tên"
                  onPress={handleSaveRename}
                  style={styles.modalSaveBtn}
                  variant="primary"
                >
                  <Text style={styles.modalSaveText}>Lưu</Text>
                </AppButton>
              </View>
            </View>
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
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  topBarTitles: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.title,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    borderRadius: Rounded.lg,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listHeaderContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    paddingHorizontal: 2,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryHint: {
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.five,
  },
  presetCard: {
    borderRadius: Rounded.xlg,
    marginBottom: Spacing.two,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  cardDescText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  activeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nicknameText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  categoryLeadIcon: {
    marginTop: 1,
  },
  categoriesText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  cardActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 0,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.half,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.lg,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  modalDialog: {
    maxHeight: '90%',
    borderRadius: Rounded.xlg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalDialogSmall: {
    borderRadius: Rounded.xlg,
    borderWidth: 1,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: Spacing.four,
  },
  pointHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  gpsInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  gpsInlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    height: 42,
  },
  inputLeadingIcon: {
    marginRight: 6,
  },
  pointTextInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  suggestionsDropdown: {
    marginTop: 4,
    borderRadius: Rounded.md,
    borderWidth: 1,
    maxHeight: 180,
    overflow: 'hidden',
  },
  suggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
  },
  searchingText: {
    fontSize: 12,
  },
  suggestionsList: {
    maxHeight: 180,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  noSuggestionsText: {
    padding: Spacing.two,
    fontSize: 12,
    textAlign: 'center',
  },
  vehicleModeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  vehicleModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  vehicleModeText: {
    fontSize: 11,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    paddingHorizontal: Spacing.two,
    fontSize: 13,
    marginTop: 6,
  },
  inputHint: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  categoryPickerList: {
    gap: 6,
    marginTop: 4,
  },
  catOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    gap: 8,
  },
  catIconShell: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catOptionCopy: {
    flex: 1,
    minWidth: 0,
  },
  catOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  catOptionSublabel: {
    fontSize: 11,
    marginTop: 1,
  },
  catCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalCancelBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderRadius: Rounded.lg,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  renameActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
});
