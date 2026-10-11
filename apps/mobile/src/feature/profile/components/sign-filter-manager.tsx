import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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
import { useTheme } from '@/hooks/use-theme';

export function SignFilterManager() {
  const theme = useTheme();
  const router = useRouter();
  const {
    activePresetId,
    createPreset,
    deletePreset,
    presets,
    renamePreset,
    setActivePresetId,
    updatePreset,
  } = useSignFilter();

  // Create / Edit modal state
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SignFilterPreset | null>(null);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [onlyFixedSignsInput, setOnlyFixedSignsInput] = useState(true);
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
    setPresetNameInput(`Lộ trình ${presets.length + 1}`);
    setSelectedCategories(new Set(['MANDATORY', 'WARNING', 'PROHIBITORY']));
    setOnlyFixedSignsInput(true);
    setEditorError('');
    setIsEditorModalOpen(true);
  };

  // Open editor for existing preset
  const handleOpenEdit = (preset: SignFilterPreset) => {
    setEditingPreset(preset);
    setPresetNameInput(preset.name);
    setSelectedCategories(new Set(preset.categories));
    setOnlyFixedSignsInput(preset.onlyFixedSigns !== false);
    setEditorError('');
    setIsEditorModalOpen(true);
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
    const trimmed = presetNameInput.trim();
    if (!trimmed) {
      setEditorError('Vui lòng nhập tên cho lộ trình/danh sách.');
      return;
    }
    if (selectedCategories.size === 0) {
      setEditorError('Chọn ít nhất một danh mục biển báo.');
      return;
    }

    const categoriesArray = Array.from(selectedCategories);
    if (editingPreset) {
      await updatePreset(editingPreset.id, {
        name: trimmed,
        categories: categoriesArray,
        onlyFixedSigns: onlyFixedSignsInput,
      });
    } else {
      await createPreset(trimmed, categoriesArray, {
        onlyFixedSigns: onlyFixedSignsInput,
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
            <Text style={[styles.rowTitle, { color: theme.text }]}>Tất cả biển báo (Không lọc)</Text>
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

          const vehicleMode = preset.savedRoute?.vehicleMode?.toUpperCase();
          const isBike = vehicleMode === 'MOTORCYCLE' || vehicleMode === 'BIKE';
          const vehicleIcon = isBike ? 'motorbike' : 'car';
          const hasRouteDetails = Boolean(
            preset.savedRoute?.originName && preset.savedRoute?.destinationName
          );

          return (
            <View
              key={preset.id}
              style={[
                styles.presetCardWrapper,
                styles.shadowRow,
              ]}
            >
              <AppButton
                accessibilityLabel={`${preset.name}, ${isActive ? 'đã chọn' : 'chưa chọn'}`}
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
                    {preset.name}
                  </Text>
                  {hasRouteDetails ? (
                    <Text numberOfLines={1} style={[styles.routePathText, { color: theme.textSecondary }]}>
                      {`${preset.savedRoute!.originName} → ${preset.savedRoute!.destinationName}`}
                    </Text>
                  ) : null}
                  <View style={styles.badgeRow}>
                    {preset.onlyFixedSigns ? (
                      <View style={[styles.ruleBadge, { backgroundColor: '#10B9811A', borderColor: '#10B981' }]}>
                        <MaterialCommunityIcons color="#10B981" name="shield-check" size={11} />
                        <Text style={[styles.ruleBadgeText, { color: '#10B981' }]}>Chỉ biển cố định</Text>
                      </View>
                    ) : null}
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

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Tên lộ trình / danh sách</Text>
              <TextInput
                accessibilityLabel="Tên danh sách lọc"
                autoFocus
                maxLength={40}
                onChangeText={(t) => {
                  setPresetNameInput(t);
                  setEditorError('');
                }}
                placeholder="VD: Đi làm hàng ngày, Lộ trình Q1 đến Q7"
                placeholderTextColor={theme.placeholder}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: editorError && !presetNameInput.trim() ? theme.danger : theme.border,
                    color: theme.text,
                  },
                ]}
                value={presetNameInput}
              />

              {/* Only Fixed Signs option */}
              <Pressable
                accessibilityLabel={`Chỉ hiển thị biển báo cố định, ${onlyFixedSignsInput ? 'bật' : 'tắt'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: onlyFixedSignsInput }}
                onPress={() => setOnlyFixedSignsInput((prev) => !prev)}
                style={({ pressed }) => [
                  styles.catOptionRow,
                  {
                    backgroundColor: onlyFixedSignsInput ? theme.backgroundSelected : theme.background,
                    borderColor: onlyFixedSignsInput ? theme.primary : theme.border,
                    opacity: pressed ? 0.75 : 1,
                    marginTop: Spacing.two,
                    marginBottom: Spacing.one,
                  },
                ]}
              >
                <View style={[styles.catIconShell, { backgroundColor: '#10B9811A' }]}>
                  <MaterialCommunityIcons color="#10B981" name="shield-check" size={18} />
                </View>

                <View style={styles.catOptionCopy}>
                  <Text style={[styles.catOptionTitle, { color: theme.text }]}>
                    Chỉ hiển thị biển cố định
                  </Text>
                  <Text style={[styles.catOptionSublabel, { color: theme.placeholder }]}>
                    Bỏ qua biển báo tạm thời, công trường, phân luồng sửa chữa
                  </Text>
                </View>

                <View
                  style={[
                    styles.catCheckbox,
                    {
                      backgroundColor: onlyFixedSignsInput ? theme.primary : 'transparent',
                      borderColor: onlyFixedSignsInput ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {onlyFixedSignsInput ? (
                    <MaterialCommunityIcons color="#FFFFFF" name="check" size={13} />
                  ) : null}
                </View>
              </Pressable>

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
});
