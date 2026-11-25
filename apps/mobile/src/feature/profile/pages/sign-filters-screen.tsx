import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
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
import {
  useSignFilter,
  type SignFilterPreset,
} from '@/context/sign-filter-provider';
import { useOptionalSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { styles } from '@/feature/profile/styles/sign-filters-screen.styles';
import { useSignFilterModals } from '@/feature/profile/hooks/use-sign-filter-modals';
import { SignFilterModals } from '@/feature/profile/components/sign-filter-modals';

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

  const {
    destPoint,
    destQuery,
    destSuggestions,
    editingPreset,
    editorError,
    handleDeletePress,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenRename,
    handleSaveEditor,
    handleSaveRename,
    handleSelectCurrentLocationForDest,
    handleSelectCurrentLocationForStart,
    handleSelectDestSuggestion,
    handleSelectStartSuggestion,
    handleToggleCategory,
    isDestFocused,
    isDestSearching,
    isEditorModalOpen,
    isLocatingDest,
    isLocatingStart,
    isRenameModalOpen,
    isStartFocused,
    isStartSearching,
    presetNameInput,
    renameError,
    renameInput,
    selectedCategories,
    setDestPoint,
    setDestQuery,
    setEditorError,
    setIsDestFocused,
    setIsEditorModalOpen,
    setIsRenameModalOpen,
    setIsStartFocused,
    setPresetNameInput,
    setRenameError,
    setRenameInput,
    setStartPoint,
    setStartQuery,
    setVehicleMode,
    startPoint,
    startQuery,
    startSuggestions,
    vehicleMode,
  } = useSignFilterModals({
    accessToken: session?.accessToken,
    createPreset,
    deletePreset,
    renamePreset,
    updatePreset,
  });

  // Navigate to map to view corridor and signs
  const handleViewOnMap = useCallback(
    (preset: SignFilterPreset) => {
      void setActivePresetId(preset.id);
      router.push({
        pathname: '/(authenticated)/(tabs)/home',
        params: { savedRouteId: preset.id },
      });
    },
    [router, setActivePresetId],
  );

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

        <SignFilterModals
          destPoint={destPoint}
          destQuery={destQuery}
          destSuggestions={destSuggestions}
          editingPreset={editingPreset}
          editorError={editorError}
          isDestFocused={isDestFocused}
          isDestSearching={isDestSearching}
          isEditorModalOpen={isEditorModalOpen}
          isLocatingDest={isLocatingDest}
          isLocatingStart={isLocatingStart}
          isRenameModalOpen={isRenameModalOpen}
          isStartFocused={isStartFocused}
          isStartSearching={isStartSearching}
          onCloseEditor={() => setIsEditorModalOpen(false)}
          onCloseRename={() => setIsRenameModalOpen(false)}
          onDestChange={(t) => {
            setDestQuery(t);
            if (destPoint && t !== destPoint.title) setDestPoint(null);
            setEditorError('');
          }}
          onDestClear={() => {
            setDestQuery('');
            setDestPoint(null);
          }}
          onDestFocus={() => {
            setIsDestFocused(true);
            setIsStartFocused(false);
          }}
          onDestGps={handleSelectCurrentLocationForDest}
          onPresetNameChange={(t) => {
            setPresetNameInput(t);
            setEditorError('');
          }}
          onRenameInputChange={(t) => {
            setRenameInput(t);
            setRenameError('');
          }}
          onSaveEditor={handleSaveEditor}
          onSaveRename={handleSaveRename}
          onSelectDestSuggestion={handleSelectDestSuggestion}
          onSelectStartSuggestion={handleSelectStartSuggestion}
          onStartChange={(t) => {
            setStartQuery(t);
            if (startPoint && t !== startPoint.title) setStartPoint(null);
            setEditorError('');
          }}
          onStartClear={() => {
            setStartQuery('');
            setStartPoint(null);
          }}
          onStartFocus={() => {
            setIsStartFocused(true);
            setIsDestFocused(false);
          }}
          onStartGps={handleSelectCurrentLocationForStart}
          onToggleCategory={handleToggleCategory}
          onVehicleModeChange={setVehicleMode}
          presetNameInput={presetNameInput}
          renameError={renameError}
          renameInput={renameInput}
          selectedCategories={selectedCategories}
          startPoint={startPoint}
          startQuery={startQuery}
          startSuggestions={startSuggestions}
          vehicleMode={vehicleMode}
        />
      </SafeAreaView>
    </View>
  );
}
