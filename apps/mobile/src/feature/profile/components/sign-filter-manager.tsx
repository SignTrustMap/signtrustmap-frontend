import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import {
  SIGN_CATEGORIES,
  type SignCategory,
} from '@/constants/sign-categories';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
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

export function SignFilterManager() {
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

  useFocusEffect(
    useCallback(() => {
      void refetchPresets();
    }, [refetchPresets])
  );

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
  const { data: startSuggestions, isLoading: isStartSearching } = usePlaceSuggestions(startQuery);
  const { data: destSuggestions, isLoading: isDestSearching } = usePlaceSuggestions(destQuery);

  const [selectedCategories, setSelectedCategories] = useState<Set<SignCategory>>(
    new Set(['MANDATORY', 'WARNING', 'PROHIBITORY'])
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
      ]
    );
  };

  const categoryMap = useMemo(() => {
    const map = new Map<SignCategory, (typeof SIGN_CATEGORIES)[number]>();
    for (const c of SIGN_CATEGORIES) {
      map.set(c.id, c);
    }
    return map;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeadingRow}>
        <View style={styles.headingTitleRow}>
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>Lộ trình đã lưu & Bộ lọc</Text>
          <AppButton
            accessibilityLabel="Tạo danh sách lọc mới"
            onPress={handleOpenCreate}
            style={styles.headerAddButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.primary} name="plus" size={16} />
            <Text style={[styles.headerAddText, { color: theme.primary }]}>Thêm mới</Text>
          </AppButton>
        </View>
        <Text style={[styles.subsectionDescription, { color: theme.textSecondary }]}>
          Lộ trình đã lưu và quy tắc lọc biển báo (biển cố định, danh mục) khi dẫn đường
        </Text>
      </View>

      <View style={styles.roleList}>
        {/* Option: Show all signs (No filter selected) */}
        <AppButton
          accessibilityLabel={`Tất cả biển báo (Không lọc), ${activePresetId === null ? 'đã chọn' : 'chưa chọn'}`}
          accessibilityRole="radio"
          accessibilityState={{ checked: activePresetId === null }}
          onPress={() => void setActivePresetId(null)}
          style={[styles.overviewRow, styles.shadowRow]}
          variant="ghost"
        >
          <View style={styles.iconTile}>
            <MaterialCommunityIcons color={theme.primary} name="filter-outline" size={22} />
          </View>
          <View style={styles.rowCopy}>
            <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.text }]}>Tất cả biển báo (Không lọc)</Text>
            <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
              Hiển thị và cảnh báo cho tất cả danh mục biển báo
            </Text>
          </View>
          {activePresetId === null ? (
            <MaterialCommunityIcons color={theme.primary} name="check" size={22} />
          ) : null}
        </AppButton>

        {/* User-created Presets / Bookmarked Routes */}
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          const categoryLabels = preset.categories
            .map((catId) => categoryMap.get(catId)?.label)
            .filter(Boolean)
            .join(', ');

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
            preset.savedRoute?.originName && preset.savedRoute?.destinationName
          );
          const routeDisplayName = hasRouteDetails
            ? `${preset.savedRoute!.originName} ➔ ${preset.savedRoute!.destinationName}`
            : preset.name;

          return (
            <View
              key={preset.id}
              style={[
                styles.presetCardWrapper,
                styles.shadowRow,
              ]}
            >
              <AppButton
                accessibilityLabel={`${routeDisplayName}, ${isActive ? 'đã chọn' : 'chưa chọn'}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isActive }}
                onPress={() => void setActivePresetId(preset.id)}
                style={styles.presetMainRow}
                variant="ghost"
              >
                <View style={styles.iconTile}>
                  <MaterialCommunityIcons
                    color={theme.primary}
                    name={hasRouteDetails ? vehicleIcon : 'playlist-check'}
                    size={22}
                  />
                </View>
                <View style={styles.rowCopy}>
                  <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.text }]}>
                    {routeDisplayName}
                  </Text>
                  {hasRouteDetails && preset.name && preset.name !== routeDisplayName ? (
                    <Text numberOfLines={1} style={[styles.routePathText, { color: theme.textSecondary }]}>
                      {preset.name}
                    </Text>
                  ) : null}
                  <View style={styles.badgeRow}>
                    <Text numberOfLines={1} style={[styles.rowDescription, { color: theme.textSecondary, flex: 1 }]}>
                      {categoryLabels || `${preset.categories.length} danh mục`}
                    </Text>
                  </View>
                </View>
                {isActive ? (
                  <MaterialCommunityIcons color={theme.primary} name="check" size={22} />
                ) : null}
              </AppButton>

              {/* Action Buttons: View Map, Rename, Categories, Delete */}
              <View style={[styles.cardActionFooter, { borderTopColor: theme.border }]}>
                <AppButton
                  accessibilityLabel={`Xem trên bản đồ: ${preset.name}`}
                  onPress={() => handleViewOnMap(preset)}
                  style={styles.actionBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.primary} name="map-outline" size={14} />
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Bản đồ</Text>
                </AppButton>

                <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

                <AppButton
                  accessibilityLabel={`Chỉnh sửa bộ lọc cho ${preset.name}`}
                  onPress={() => handleOpenEdit(preset)}
                  style={styles.actionBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.primary} name="tune-variant" size={14} />
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Bộ lọc</Text>
                </AppButton>

                <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

                <AppButton
                  accessibilityLabel={`Đổi tên ${preset.name}`}
                  onPress={() => handleOpenRename(preset)}
                  style={styles.actionBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.primary} name="pencil-outline" size={14} />
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Đổi tên</Text>
                </AppButton>

                <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

                <AppButton
                  accessibilityLabel={`Xóa ${preset.name}`}
                  onPress={() => handleDeletePress(preset)}
                  style={styles.actionBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.danger} name="trash-can-outline" size={14} />
                  <Text style={[styles.actionBtnText, { color: theme.danger }]}>Xóa</Text>
                </AppButton>
              </View>
            </View>
          );
        })}

        {presets.length === 0 ? (
          <View style={[styles.overviewRow, styles.shadowRow]}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons color={theme.primary} name="bookmark-outline" size={22} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Chưa có lộ trình lưu nào</Text>
              <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                Tạo lộ trình hoặc lưu từ bản đồ để tùy chỉnh bộ lọc biển báo
              </Text>
            </View>
            <AppButton
              accessibilityLabel="Tạo danh sách lọc đầu tiên"
              onPress={handleOpenCreate}
              style={[styles.emptyAddBtn, { backgroundColor: theme.backgroundSelected }]}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.primary} name="plus" size={16} />
              <Text style={[styles.emptyAddBtnText, { color: theme.primary }]}>Tạo mới</Text>
            </AppButton>
          </View>
        ) : null}
      </View>

      {/* Modal: Create or Edit Preset */}
      <Modal
        animationType="fade"
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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingPreset ? 'Chỉnh sửa lộ trình & bộ lọc' : 'Lộ trình & bộ lọc mới'}
              </Text>
              <Pressable
                accessibilityLabel="Đóng chỉnh sửa"
                onPress={() => setIsEditorModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialCommunityIcons color={theme.placeholder} name="close" size={20} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Start Point Input */}
              <View style={styles.pointHeaderRow}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Điểm xuất phát</Text>
                <Pressable
                  accessibilityLabel="Chọn vị trí hiện tại cho điểm bắt đầu"
                  onPress={handleSelectCurrentLocationForStart}
                  disabled={isLocatingStart}
                  style={({ pressed }) => [
                    styles.gpsInlineBtn,
                    {
                      backgroundColor: startPoint?.title === 'Vị trí hiện tại' ? theme.backgroundSelected : theme.background,
                      borderColor: startPoint?.title === 'Vị trí hiện tại' ? theme.primary : theme.border,
                      opacity: pressed || isLocatingStart ? 0.7 : 1,
                    },
                  ]}
                >
                  {isLocatingStart ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="crosshairs-gps" size={14} color={theme.primary} />
                      <Text style={[styles.gpsInlineText, { color: theme.primary }]}>Vị trí hiện tại</Text>
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
                <MaterialCommunityIcons name="map-marker" size={18} color="#10B981" style={styles.inputLeadingIcon} />
                <TextInput
                  accessibilityLabel="Nhập điểm bắt đầu"
                  placeholder="Tìm kiếm điểm xuất phát..."
                  placeholderTextColor={theme.placeholder}
                  value={startQuery}
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
                  style={[styles.pointTextInput, { color: theme.text }]}
                />
                {startQuery.length > 0 ? (
                  <Pressable
                    accessibilityLabel="Xóa điểm bắt đầu"
                    onPress={() => {
                      setStartQuery('');
                      setStartPoint(null);
                    }}
                    hitSlop={8}
                    style={styles.clearBtn}
                  >
                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.placeholder} />
                  </Pressable>
                ) : null}
              </View>

              {/* Start Suggestions Dropdown */}
              {isStartFocused && !startPoint && (
                <View style={[styles.suggestionsDropdown, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  {isStartSearching ? (
                    <View style={styles.suggestionsLoading}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={[styles.searchingText, { color: theme.textSecondary }]}>Đang tìm kiếm...</Text>
                    </View>
                  ) : startSuggestions.length > 0 ? (
                    <ScrollView style={styles.suggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {startSuggestions.slice(0, 5).map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => handleSelectStartSuggestion(item)}
                          style={({ pressed }) => [
                            styles.suggestionItem,
                            { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
                          ]}
                        >
                          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.primary} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={[styles.suggestionTitle, { color: theme.text }]}>
                              {item.title}
                            </Text>
                            {item.address ? (
                              <Text numberOfLines={1} style={[styles.suggestionSubtitle, { color: theme.textSecondary }]}>
                                {item.address}
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
              <View style={[styles.pointHeaderRow, { marginTop: Spacing.two }]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Điểm đến</Text>
                <Pressable
                  accessibilityLabel="Chọn vị trí hiện tại cho điểm đến"
                  onPress={handleSelectCurrentLocationForDest}
                  disabled={isLocatingDest}
                  style={({ pressed }) => [
                    styles.gpsInlineBtn,
                    {
                      backgroundColor: destPoint?.title === 'Vị trí hiện tại' ? theme.backgroundSelected : theme.background,
                      borderColor: destPoint?.title === 'Vị trí hiện tại' ? theme.primary : theme.border,
                      opacity: pressed || isLocatingDest ? 0.7 : 1,
                    },
                  ]}
                >
                  {isLocatingDest ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="crosshairs-gps" size={14} color={theme.primary} />
                      <Text style={[styles.gpsInlineText, { color: theme.primary }]}>Vị trí hiện tại</Text>
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
                <MaterialCommunityIcons name="flag-checkered" size={18} color="#EF4444" style={styles.inputLeadingIcon} />
                <TextInput
                  accessibilityLabel="Nhập điểm đến"
                  placeholder="Tìm kiếm điểm đến..."
                  placeholderTextColor={theme.placeholder}
                  value={destQuery}
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
                  style={[styles.pointTextInput, { color: theme.text }]}
                />
                {destQuery.length > 0 ? (
                  <Pressable
                    accessibilityLabel="Xóa điểm đến"
                    onPress={() => {
                      setDestQuery('');
                      setDestPoint(null);
                    }}
                    hitSlop={8}
                    style={styles.clearBtn}
                  >
                    <MaterialCommunityIcons name="close-circle" size={16} color={theme.placeholder} />
                  </Pressable>
                ) : null}
              </View>

              {/* Destination Suggestions Dropdown */}
              {isDestFocused && !destPoint && (
                <View style={[styles.suggestionsDropdown, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  {isDestSearching ? (
                    <View style={styles.suggestionsLoading}>
                      <ActivityIndicator size="small" color={theme.primary} />
                      <Text style={[styles.searchingText, { color: theme.textSecondary }]}>Đang tìm kiếm...</Text>
                    </View>
                  ) : destSuggestions.length > 0 ? (
                    <ScrollView style={styles.suggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {destSuggestions.slice(0, 5).map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => handleSelectDestSuggestion(item)}
                          style={({ pressed }) => [
                            styles.suggestionItem,
                            { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
                          ]}
                        >
                          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.primary} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={[styles.suggestionTitle, { color: theme.text }]}>
                              {item.title}
                            </Text>
                            {item.address ? (
                              <Text numberOfLines={1} style={[styles.suggestionSubtitle, { color: theme.textSecondary }]}>
                                {item.address}
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
              <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
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
                          backgroundColor: isSelected ? theme.backgroundSelected : theme.background,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={v.icon as any}
                        size={16}
                        color={isSelected ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.vehicleModeText,
                          {
                            color: isSelected ? theme.primary : theme.textSecondary,
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
              <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
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

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
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
                          backgroundColor: isChecked ? theme.backgroundSelected : theme.background,
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
              >
                <Text style={[styles.modalSaveText, { color: theme.onPrimary }]}>
                  {editingPreset ? 'Cập nhật' : 'Tạo mới'}
                </Text>
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Quick Rename */}
      <Modal
        animationType="fade"
        onRequestClose={() => setIsRenameModalOpen(false)}
        transparent
        visible={isRenameModalOpen}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.renameDialog,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Đổi tên lộ trình</Text>
            <Text style={[styles.inputHint, { color: theme.placeholder }]}>
              Nhập tên mới cho lộ trình này:
            </Text>

            <TextInput
              accessibilityLabel="Tên danh sách mới"
              autoFocus
              maxLength={40}
              onChangeText={(t) => {
                setRenameInput(t);
                setRenameError('');
              }}
              placeholder="Tên lộ trình"
              placeholderTextColor={theme.placeholder}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  borderColor: renameError ? theme.danger : theme.border,
                  color: theme.text,
                  marginTop: Spacing.one,
                },
              ]}
              value={renameInput}
            />

            {renameError ? (
              <Text style={[styles.errorText, { color: theme.danger }]}>{renameError}</Text>
            ) : null}

            <View style={[styles.modalFooter, { borderTopColor: theme.border, marginTop: Spacing.two }]}>
              <AppButton
                accessibilityLabel="Hủy đổi tên"
                onPress={() => setIsRenameModalOpen(false)}
                style={styles.modalCancelBtn}
                variant="ghost"
              >
                <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>Hủy</Text>
              </AppButton>
              <AppButton
                accessibilityLabel="Lưu tên mới"
                onPress={handleSaveRename}
                style={styles.modalSaveBtn}
              >
                <Text style={[styles.modalSaveText, { color: theme.onPrimary }]}>Lưu</Text>
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  sectionHeadingRow: {
    paddingTop: Spacing.one,
    paddingBottom: Spacing.one,
  },
  headingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subsectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
    lineHeight: 21,
  },
  subsectionDescription: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 18,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
  },
  headerAddText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  roleList: {
    paddingTop: Spacing.half,
  },
  overviewRow: {
    minHeight: 62,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.three,
    borderRadius: Rounded.md,
    paddingHorizontal: 0,
    paddingVertical: Spacing.half,
    marginBottom: Spacing.two,
  },
  shadowRow: {
    boxShadow: '1px 2px 3px 2px rgba(0, 0, 0, 0.1)',
    padding: Spacing.half,
    borderRadius: Rounded.md,
  },
  iconTile: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.lg,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 21,
  },
  routePathText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Rounded.sm,
    borderWidth: 0.5,
  },
  ruleBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 600,
  },
  rowDescription: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 18,
  },
  presetCardWrapper: {
    width: '100%',
    borderRadius: Rounded.md,
    marginBottom: Spacing.two,
  },
  presetMainRow: {
    minHeight: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.three,
    borderRadius: Rounded.md,
    paddingHorizontal: 0,
    paddingVertical: Spacing.half,
  },
  cardActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.half,
    paddingTop: Spacing.half,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
  },
  actionBtnText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Rounded.round,
  },
  emptyAddBtnText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.two,
  },
  renameDialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.one,
  },
  modalTitle: {
    fontFamily: Fonts.title,
    fontSize: 17,
    fontWeight: 700,
  },
  modalCloseBtn: {
    padding: Spacing.half,
  },
  modalScrollContent: {
    paddingVertical: Spacing.one,
  },
  inputLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  inputHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: Spacing.one,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  categoryPickerList: {
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  catOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.md,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  catIconShell: {
    width: 30,
    height: 30,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catOptionCopy: {
    flex: 1,
    minWidth: 0,
  },
  catOptionTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  catOptionSublabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  catCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: Spacing.one,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalCancelBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  modalCancelText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
  },
  modalSaveBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  modalSaveText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  pointHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gpsInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Rounded.round,
    borderWidth: 1,
  },
  gpsInlineText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
  },
  searchFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.one,
    minHeight: 40,
  },
  inputLeadingIcon: {
    marginRight: 6,
  },
  pointTextInput: {
    flex: 1,
    paddingVertical: Spacing.one,
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  clearBtn: {
    padding: 4,
  },
  suggestionsDropdown: {
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: Rounded.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.two,
  },
  searchingText: {
    fontFamily: Fonts.body,
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
  suggestionTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  noSuggestionsText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  vehicleModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  vehicleModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  vehicleModeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
});
