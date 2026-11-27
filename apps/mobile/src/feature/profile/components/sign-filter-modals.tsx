import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { ApiPlace } from '@/api/navigation/places';
import { AppButton } from '@/components/button';
import { SIGN_CATEGORIES, type SignCategory } from '@/constants/sign-categories';
import { Spacing } from '@/constants/theme';
import type { SignFilterPreset } from '@/context/sign-filter-provider';
import { useTheme } from '@/hooks/use-theme';
import type { FilterVehicleMode, SelectedFilterPlace } from '../hooks/use-sign-filter-modals';
import { styles } from '../styles/sign-filter-modals.styles';

type PointPickerProps = {
  accessibilityInputLabel: string;
  accessibilityClearLabel: string;
  accessibilityGpsLabel: string;
  hasError: boolean;
  iconColor: string;
  iconName: 'map-marker' | 'flag-checkered';
  isFocused: boolean;
  isLocating: boolean;
  isSearching: boolean;
  label: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onPressGps: () => void;
  onSelectSuggestion: (item: ApiPlace) => void;
  placeholder: string;
  point: SelectedFilterPlace | null;
  query: string;
  suggestions: ApiPlace[];
};

function RoutePointPicker({
  accessibilityClearLabel,
  accessibilityGpsLabel,
  accessibilityInputLabel,
  hasError,
  iconColor,
  iconName,
  isFocused,
  isLocating,
  isSearching,
  label,
  onChangeText,
  onClear,
  onFocus,
  onPressGps,
  onSelectSuggestion,
  placeholder,
  point,
  query,
  suggestions,
}: PointPickerProps) {
  const theme = useTheme();
  const isCurrentLoc = point?.title === 'Vị trí hiện tại';

  return (
    <>
      <View style={styles.pointHeaderRow}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
        <Pressable
          accessibilityLabel={accessibilityGpsLabel}
          disabled={isLocating}
          onPress={onPressGps}
          style={({ pressed }) => [
            styles.gpsInlineBtn,
            {
              backgroundColor: isCurrentLoc ? theme.backgroundSelected : theme.background,
              borderColor: isCurrentLoc ? theme.primary : theme.border,
              opacity: pressed || isLocating ? 0.7 : 1,
            },
          ]}
        >
          {isLocating ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons color={theme.primary} name="crosshairs-gps" size={14} />
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
            borderColor: hasError ? theme.danger : theme.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          color={iconColor}
          name={iconName}
          size={18}
          style={styles.inputLeadingIcon}
        />
        <TextInput
          accessibilityLabel={accessibilityInputLabel}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          style={[styles.pointTextInput, { color: theme.text }]}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable accessibilityLabel={accessibilityClearLabel} hitSlop={8} onPress={onClear} style={styles.clearBtn}>
            <MaterialCommunityIcons color={theme.placeholder} name="close-circle" size={16} />
          </Pressable>
        ) : null}
      </View>

      {isFocused && !point ? (
        <View
          style={[
            styles.suggestionsDropdown,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          {isSearching ? (
            <View style={styles.suggestionsLoading}>
              <ActivityIndicator color={theme.primary} size="small" />
              <Text style={[styles.searchingText, { color: theme.textSecondary }]}>
                Đang tìm kiếm...
              </Text>
            </View>
          ) : suggestions.length > 0 ? (
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.suggestionsList}>
              {suggestions.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectSuggestion(item)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <MaterialCommunityIcons color={theme.primary} name="map-marker-outline" size={16} />
                  <View style={styles.suggestionTextWrapper}>
                    <Text numberOfLines={1} style={[styles.suggestionTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    {item.address ? (
                      <Text
                        numberOfLines={1}
                        style={[styles.suggestionSubtitle, { color: theme.textSecondary }]}
                      >
                        {item.address}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : query.trim().length >= 2 ? (
            <Text style={[styles.noSuggestionsText, { color: theme.textSecondary }]}>
              Không tìm thấy địa điểm phù hợp
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

const VEHICLE_MODES: { id: FilterVehicleMode; label: string; icon: string }[] = [
  { id: 'MOTORCYCLE', label: 'Xe máy', icon: 'motorbike' },
  { id: 'CAR', label: 'Ô tô', icon: 'car' },
  { id: 'CYCLING', label: 'Xe đạp', icon: 'bicycle' },
  { id: 'WALKING', label: 'Đi bộ', icon: 'walk' },
];

type SignFilterModalsProps = {
  destPoint: SelectedFilterPlace | null;
  destQuery: string;
  destSuggestions: ApiPlace[];
  editingPreset: SignFilterPreset | null;
  editorCreateLabel?: string;
  editorError: string;
  editorUpdateLabel?: string;
  isDestFocused: boolean;
  isDestSearching: boolean;
  isEditorModalOpen: boolean;
  isLocatingDest: boolean;
  isLocatingStart: boolean;
  isRenameModalOpen: boolean;
  isStartFocused: boolean;
  isStartSearching: boolean;
  onCloseEditor: () => void;
  onCloseRename: () => void;
  onDestChange: (text: string) => void;
  onDestClear: () => void;
  onDestFocus: () => void;
  onDestGps: () => void;
  onPresetNameChange: (text: string) => void;
  onRenameInputChange: (text: string) => void;
  onSaveEditor: () => void;
  onSaveRename: () => void;
  onSelectDestSuggestion: (item: ApiPlace) => void;
  onSelectStartSuggestion: (item: ApiPlace) => void;
  onStartChange: (text: string) => void;
  onStartClear: () => void;
  onStartFocus: () => void;
  onStartGps: () => void;
  onToggleCategory: (cat: SignCategory) => void;
  onVehicleModeChange: (mode: FilterVehicleMode) => void;
  presetNameInput: string;
  renameError: string;
  renameInput: string;
  renameInputLabel?: string;
  renamePlaceholder?: string;
  renameSaveLabel?: string;
  selectedCategories: Set<SignCategory>;
  startPoint: SelectedFilterPlace | null;
  startQuery: string;
  startSuggestions: ApiPlace[];
  vehicleMode: FilterVehicleMode;
};

/**
 * Shared Create/Edit and Rename modals for sign-filter presets.
 */
export function SignFilterModals({
  destPoint,
  destQuery,
  destSuggestions,
  editingPreset,
  editorCreateLabel = 'Tạo lộ trình',
  editorError,
  editorUpdateLabel = 'Lưu thay đổi',
  isDestFocused,
  isDestSearching,
  isEditorModalOpen,
  isLocatingDest,
  isLocatingStart,
  isRenameModalOpen,
  isStartFocused,
  isStartSearching,
  onCloseEditor,
  onCloseRename,
  onDestChange,
  onDestClear,
  onDestFocus,
  onDestGps,
  onPresetNameChange,
  onRenameInputChange,
  onSaveEditor,
  onSaveRename,
  onSelectDestSuggestion,
  onSelectStartSuggestion,
  onStartChange,
  onStartClear,
  onStartFocus,
  onStartGps,
  onToggleCategory,
  onVehicleModeChange,
  presetNameInput,
  renameError,
  renameInput,
  renameInputLabel = 'Nhập tên lộ trình mới',
  renamePlaceholder = 'Nhập tên danh sách / lộ trình...',
  renameSaveLabel = 'Xác nhận đổi tên',
  selectedCategories,
  startPoint,
  startQuery,
  startSuggestions,
  vehicleMode,
}: SignFilterModalsProps) {
  const theme = useTheme();

  return (
    <>
      <Modal animationType="slide" onRequestClose={onCloseEditor} transparent visible={isEditorModalOpen}>
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
              <Pressable accessibilityLabel="Đóng chỉnh sửa" hitSlop={8} onPress={onCloseEditor} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons color={theme.placeholder} name="close" size={22} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <RoutePointPicker
                accessibilityClearLabel="Xóa điểm bắt đầu"
                accessibilityGpsLabel="Chọn vị trí hiện tại cho điểm bắt đầu"
                accessibilityInputLabel="Nhập điểm bắt đầu"
                hasError={!startPoint && Boolean(editorError)}
                iconColor="#10B981"
                iconName="map-marker"
                isFocused={isStartFocused}
                isLocating={isLocatingStart}
                isSearching={isStartSearching}
                label="Điểm xuất phát"
                onChangeText={onStartChange}
                onClear={onStartClear}
                onFocus={onStartFocus}
                onPressGps={onStartGps}
                onSelectSuggestion={onSelectStartSuggestion}
                placeholder="Tìm kiếm điểm xuất phát..."
                point={startPoint}
                query={startQuery}
                suggestions={startSuggestions}
              />

              <View style={{ marginTop: Spacing.one }} />

              <RoutePointPicker
                accessibilityClearLabel="Xóa điểm đến"
                accessibilityGpsLabel="Chọn vị trí hiện tại cho điểm đến"
                accessibilityInputLabel="Nhập điểm đến"
                hasError={!destPoint && Boolean(editorError)}
                iconColor="#EF4444"
                iconName="flag-checkered"
                isFocused={isDestFocused}
                isLocating={isLocatingDest}
                isSearching={isDestSearching}
                label="Điểm đến"
                onChangeText={onDestChange}
                onClear={onDestClear}
                onFocus={onDestFocus}
                onPressGps={onDestGps}
                onSelectSuggestion={onSelectDestSuggestion}
                placeholder="Tìm kiếm điểm đến..."
                point={destPoint}
                query={destQuery}
                suggestions={destSuggestions}
              />

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
                Phương tiện di chuyển
              </Text>
              <View style={styles.vehicleModeRow}>
                {VEHICLE_MODES.map((v) => {
                  const isSelected = vehicleMode === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => onVehicleModeChange(v.id)}
                      style={[
                        styles.vehicleModeChip,
                        {
                          backgroundColor: isSelected ? theme.backgroundSelected : theme.background,
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

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
                Tên lộ trình (Tùy chọn)
              </Text>
              <TextInput
                accessibilityLabel="Tên lộ trình tùy chọn"
                maxLength={60}
                onChangeText={onPresetNameChange}
                placeholder={
                  startPoint && destPoint
                    ? `${startPoint.title} ➔ ${destPoint.title}`
                    : 'Tự động tạo: [Điểm xuất phát] ➔ [Điểm đến]'
                }
                placeholderTextColor={theme.placeholder}
                style={[
                  styles.textInput,
                  { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
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
                      onPress={() => onToggleCategory(cat.id)}
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
                        <Text style={[styles.catOptionTitle, { color: theme.text }]}>{cat.label}</Text>
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
                        {isChecked ? <MaterialCommunityIcons color="#FFFFFF" name="check" size={13} /> : null}
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
              <AppButton accessibilityLabel="Hủy chỉnh sửa" onPress={onCloseEditor} style={styles.modalCancelBtn} variant="ghost">
                <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>Hủy</Text>
              </AppButton>
              <AppButton accessibilityLabel="Lưu danh sách lọc" onPress={onSaveEditor} style={styles.modalSaveBtn} variant="primary">
                <Text style={styles.modalSaveText}>
                  {editingPreset ? editorUpdateLabel : editorCreateLabel}
                </Text>
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={onCloseRename} transparent visible={isRenameModalOpen}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalDialogSmall,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Đổi tên lộ trình</Text>
            <TextInput
              accessibilityLabel={renameInputLabel}
              autoFocus
              maxLength={60}
              onChangeText={onRenameInputChange}
              placeholder={renamePlaceholder}
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
              <AppButton accessibilityLabel="Hủy đổi tên" onPress={onCloseRename} style={styles.modalCancelBtn} variant="ghost">
                <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>Hủy</Text>
              </AppButton>
              <AppButton accessibilityLabel={renameSaveLabel} onPress={onSaveRename} style={styles.modalSaveBtn} variant="primary">
                <Text style={styles.modalSaveText}>Lưu</Text>
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
