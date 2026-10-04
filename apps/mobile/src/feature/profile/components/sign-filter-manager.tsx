import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [selectedCategories, setSelectedCategories] = useState<Set<SignCategory>>(
    new Set(['MANDATORY'])
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
    setPresetNameInput(`List ${presets.length + 1}`);
    setSelectedCategories(new Set(['MANDATORY']));
    setEditorError('');
    setIsEditorModalOpen(true);
  };

  // Open editor for existing preset
  const handleOpenEdit = (preset: SignFilterPreset) => {
    setEditingPreset(preset);
    setPresetNameInput(preset.name);
    setSelectedCategories(new Set(preset.categories));
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

  // Toggle category checkbox in editor
  const handleToggleCategory = (cat: SignCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) {
          setEditorError('A list must include at least one sign category.');
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
      setEditorError('Please provide a name for the list.');
      return;
    }
    if (selectedCategories.size === 0) {
      setEditorError('Select at least one sign category.');
      return;
    }

    const categoriesArray = Array.from(selectedCategories);
    if (editingPreset) {
      await updatePreset(editingPreset.id, {
        name: trimmed,
        categories: categoriesArray,
      });
    } else {
      await createPreset(trimmed, categoriesArray);
    }
    setIsEditorModalOpen(false);
  };

  // Save rename
  const handleSaveRename = async () => {
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setRenameError('List name cannot be empty.');
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
      'Delete list',
      `Are you sure you want to delete "${preset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>Sign filter lists</Text>
          <AppButton
            accessibilityLabel="Create new filter list"
            onPress={handleOpenCreate}
            style={styles.headerAddButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.primary} name="plus" size={16} />
            <Text style={[styles.headerAddText, { color: theme.primary }]}>New list</Text>
          </AppButton>
        </View>
        <Text style={[styles.subsectionDescription, { color: theme.textSecondary }]}>
          Only signs from the selected list will appear on map and trigger audio alerts
        </Text>
      </View>

      <View style={styles.roleList}>
        {/* Option: Show all signs (No filter selected) */}
        <AppButton
          accessibilityLabel={`All signs (No filter), ${activePresetId === null ? 'selected' : 'not selected'}`}
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
            <Text style={[styles.rowTitle, { color: theme.text }]}>All signs (No filter)</Text>
            <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
              Displays and alerts all 5 sign categories
            </Text>
          </View>
          {activePresetId === null ? (
            <MaterialCommunityIcons color={theme.primary} name="check" size={22} />
          ) : null}
        </AppButton>

        {/* User-created Presets */}
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          const categoryLabels = preset.categories
            .map((catId) => categoryMap.get(catId)?.label)
            .filter(Boolean)
            .join(', ');

          return (
            <View
              key={preset.id}
              style={[
                styles.presetCardWrapper,
                styles.shadowRow,
              ]}
            >
              <AppButton
                accessibilityLabel={`${preset.name}, ${isActive ? 'selected' : 'not selected'}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isActive }}
                onPress={() => void setActivePresetId(preset.id)}
                style={styles.presetMainRow}
                variant="ghost"
              >
                <View style={styles.iconTile}>
                  <MaterialCommunityIcons color={theme.primary} name="playlist-check" size={22} />
                </View>
                <View style={styles.rowCopy}>
                  <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.text }]}>
                    {preset.name}
                  </Text>
                  <Text numberOfLines={1} style={[styles.rowDescription, { color: theme.textSecondary }]}>
                    {categoryLabels || `${preset.categories.length} categories`}
                  </Text>
                </View>
                {isActive ? (
                  <MaterialCommunityIcons color={theme.primary} name="check" size={22} />
                ) : null}
              </AppButton>

              {/* Action Buttons: Rename, Categories, Delete */}
              <View style={[styles.cardActionFooter, { borderTopColor: theme.border }]}>
                <AppButton
                  accessibilityLabel={`Rename ${preset.name}`}
                  onPress={() => handleOpenRename(preset)}
                  style={styles.actionBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.primary} name="pencil-outline" size={14} />
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Rename</Text>
                </AppButton>

                <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

                <AppButton
                  accessibilityLabel={`Edit categories for ${preset.name}`}
                  onPress={() => handleOpenEdit(preset)}
                  style={styles.actionBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.primary} name="tune-variant" size={14} />
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Categories</Text>
                </AppButton>

                <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

                <AppButton
                  accessibilityLabel={`Delete ${preset.name}`}
                  onPress={() => handleDeletePress(preset)}
                  style={styles.actionBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.danger} name="trash-can-outline" size={14} />
                  <Text style={[styles.actionBtnText, { color: theme.danger }]}>Delete</Text>
                </AppButton>
              </View>
            </View>
          );
        })}

        {presets.length === 0 ? (
          <View style={[styles.overviewRow, styles.shadowRow]}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons color={theme.primary} name="playlist-plus" size={22} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>No custom lists yet</Text>
              <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                Create custom lists to filter signs
              </Text>
            </View>
            <AppButton
              accessibilityLabel="Create first filter list"
              onPress={handleOpenCreate}
              style={[styles.emptyAddBtn, { backgroundColor: theme.backgroundSelected }]}
              variant="ghost"
            >
              <MaterialCommunityIcons color={theme.primary} name="plus" size={16} />
              <Text style={[styles.emptyAddBtnText, { color: theme.primary }]}>Create</Text>
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
                {editingPreset ? 'Edit Filter List' : 'New Filter List'}
              </Text>
              <Pressable
                accessibilityLabel="Close editor"
                onPress={() => setIsEditorModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialCommunityIcons color={theme.placeholder} name="close" size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>List Name</Text>
              <TextInput
                accessibilityLabel="Filter list name"
                autoFocus
                maxLength={40}
                onChangeText={(t) => {
                  setPresetNameInput(t);
                  setEditorError('');
                }}
                placeholder="e.g. Mandatory Only, Highway Driving"
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

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: Spacing.two }]}>
                Select Sign Categories to Include
              </Text>
              <Text style={[styles.inputHint, { color: theme.placeholder }]}>
                Only signs matching checked categories will be displayed and announced.
              </Text>

              <View style={styles.categoryPickerList}>
                {SIGN_CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.has(cat.id);
                  return (
                    <Pressable
                      key={cat.id}
                      accessibilityLabel={`${cat.label} signs, ${isChecked ? 'included' : 'excluded'}`}
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
                accessibilityLabel="Cancel editing"
                onPress={() => setIsEditorModalOpen(false)}
                style={styles.modalCancelBtn}
                variant="ghost"
              >
                <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>Cancel</Text>
              </AppButton>
              <AppButton
                accessibilityLabel="Save filter list"
                onPress={handleSaveEditor}
                style={styles.modalSaveBtn}
              >
                <Text style={[styles.modalSaveText, { color: theme.onPrimary }]}>
                  {editingPreset ? 'Update List' : 'Create List'}
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
            <Text style={[styles.modalTitle, { color: theme.text }]}>Rename Filter List</Text>
            <Text style={[styles.inputHint, { color: theme.placeholder }]}>
              Enter a new name for this list:
            </Text>

            <TextInput
              accessibilityLabel="New list name"
              autoFocus
              maxLength={40}
              onChangeText={(t) => {
                setRenameInput(t);
                setRenameError('');
              }}
              placeholder="List name"
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
                accessibilityLabel="Cancel rename"
                onPress={() => setIsRenameModalOpen(false)}
                style={styles.modalCancelBtn}
                variant="ghost"
              >
                <Text style={[styles.modalCancelText, { color: theme.placeholder }]}>Cancel</Text>
              </AppButton>
              <AppButton
                accessibilityLabel="Save new name"
                onPress={handleSaveRename}
                style={styles.modalSaveBtn}
              >
                <Text style={[styles.modalSaveText, { color: theme.onPrimary }]}>Save</Text>
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
