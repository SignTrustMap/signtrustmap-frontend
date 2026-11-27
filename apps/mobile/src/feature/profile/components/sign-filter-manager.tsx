import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/button';
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
import { styles } from '@/feature/profile/styles/sign-filter-manager.styles';
import { useSignFilterModals } from '@/feature/profile/hooks/use-sign-filter-modals';
import { SignFilterModals } from '@/feature/profile/components/sign-filter-modals';

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
  const handleViewOnMap = (preset: SignFilterPreset) => {
    void setActivePresetId(preset.id);
    router.push({
      pathname: '/(authenticated)/(tabs)/home',
      params: { savedRouteId: preset.id },
    });
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

      <SignFilterModals
        destPoint={destPoint}
        destQuery={destQuery}
        destSuggestions={destSuggestions}
        editingPreset={editingPreset}
        editorCreateLabel="Tạo mới"
        editorError={editorError}
        editorUpdateLabel="Cập nhật"
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
        renameInputLabel="Tên danh sách mới"
        renamePlaceholder="Tên lộ trình"
        renameSaveLabel="Lưu tên mới"
        selectedCategories={selectedCategories}
        startPoint={startPoint}
        startQuery={startQuery}
        startSuggestions={startSuggestions}
        vehicleMode={vehicleMode}
      />
    </View>
  );
}
