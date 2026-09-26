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
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <MaterialCommunityIcons color={theme.primary} name="filter-variant" size={20} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sign filter lists</Text>
        </View>
        <AppButton
          accessibilityLabel="Create new filter list"
          onPress={handleOpenCreate}
          style={styles.headerAddButton}
          variant="ghost"
        >
          <MaterialCommunityIcons color={theme.primary} name="plus" size={18} />
          <Text style={[styles.headerAddText, { color: theme.primary }]}>New list</Text>
        </AppButton>
      </View>

      <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
        Only signs from the selected list will appear on map and trigger audio alerts
      </Text>

      {/* When no presets exist: Clean Empty State */}
      {presets.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundSelected }]}>
            <MaterialCommunityIcons color={theme.primary} name="filter-outline" size={30} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No filter lists created yet
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.placeholder }]}>
            Create your first custom list (e.g. &ldquo;Mandatory signs only&rdquo; or &ldquo;Mandatory and Prohibitory&rdquo;) to filter traffic signs during navigation.
          </Text>
          <AppButton
            accessibilityLabel="Create first filter list"
            onPress={handleOpenCreate}
            style={styles.emptyCtaButton}
          >
            <MaterialCommunityIcons color={theme.onPrimary} name="plus-circle-outline" size={18} />
            <Text style={[styles.emptyCtaText, { color: theme.onPrimary }]}>
              Create your first list
            </Text>
          </AppButton>
        </View>
      ) : (
        <View style={styles.presetList}>
          {/* Option: Show all signs (No filter selected) */}
          <Pressable
            accessibilityLabel={`Show all signs, ${activePresetId === null ? 'currently active' : 'inactive'}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: activePresetId === null }}
            onPress={() => void setActivePresetId(null)}
            style={({ pressed }) => [
              styles.presetCard,
              {
                backgroundColor:
                  activePresetId === null ? theme.backgroundSelected : theme.background,
                borderColor: activePresetId === null ? theme.primary : theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.radioRow}>
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: activePresetId === null ? theme.primary : theme.placeholder,
                      backgroundColor:
                        activePresetId === null ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  {activePresetId === null ? <View style={styles.radioDot} /> : null}
                </View>
                <View>
                  <Text style={[styles.presetName, { color: theme.text }]}>
                    All signs (No filter)
                  </Text>
                  <Text style={[styles.presetMeta, { color: theme.textSecondary }]}>
                    Displays and alerts all 5 sign categories
                  </Text>
                </View>
              </View>

              {activePresetId === null ? (
                <View style={[styles.activePill, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.activePillText, { color: theme.onPrimary }]}>Active</Text>
                </View>
              ) : null}
            </View>
          </Pressable>

          {/* User-created Presets */}
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <View
                key={preset.id}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: isActive ? theme.backgroundSelected : theme.background,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel={`${preset.name}, ${isActive ? 'active' : 'tap to activate'}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                  onPress={() => void setActivePresetId(preset.id)}
                  style={styles.cardSelectArea}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.radioRow}>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isActive ? theme.primary : theme.placeholder,
                            backgroundColor: isActive ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        {isActive ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={styles.titleCol}>
                        <Text numberOfLines={1} style={[styles.presetName, { color: theme.text }]}>
                          {preset.name}
                        </Text>
                        <Text style={[styles.presetMeta, { color: theme.textSecondary }]}>
                          {preset.categories.length}{' '}
                          {preset.categories.length === 1 ? 'category' : 'categories'} selected
                        </Text>
                      </View>
                    </View>

                    {isActive ? (
                      <View style={[styles.activePill, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.activePillText, { color: theme.onPrimary }]}>
                          Active
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.tapToActivate, { color: theme.placeholder }]}>
                        Tap to select
                      </Text>
                    )}
                  </View>

                  {/* Category Badges Preview */}
                  <View style={styles.badgeRow}>
                    {preset.categories.map((catId) => {
                      const catInfo = categoryMap.get(catId);
                      if (!catInfo) return null;
                      return (
                        <View
                          key={catId}
                          style={[styles.categoryBadge, { backgroundColor: catInfo.bgColor }]}
                        >
                          <MaterialCommunityIcons
                            color={catInfo.color}
                            name={catInfo.icon}
                            size={12}
                          />
                          <Text style={[styles.categoryBadgeText, { color: catInfo.color }]}>
                            {catInfo.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </Pressable>

                {/* Card Actions: Rename, Edit, Delete */}
                <View style={[styles.cardActionsRow, { borderTopColor: theme.border }]}>
                  <Pressable
                    accessibilityLabel={`Rename ${preset.name}`}
                    onPress={() => handleOpenRename(preset)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons color={theme.primary} name="pencil-outline" size={15} />
                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Rename</Text>
                  </Pressable>

                  <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

                  <Pressable
                    accessibilityLabel={`Edit categories for ${preset.name}`}
                    onPress={() => handleOpenEdit(preset)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons color={theme.primary} name="tune-variant" size={15} />
                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Categories</Text>
                  </Pressable>

                  <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />

                  <Pressable
                    accessibilityLabel={`Delete ${preset.name}`}
                    onPress={() => handleDeletePress(preset)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons color={theme.danger} name="trash-can-outline" size={15} />
                    <Text style={[styles.actionButtonText, { color: theme.danger }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

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
  container: {
    paddingVertical: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.half,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionTitle: {
    fontFamily: Fonts.title,
    fontSize: 16,
    fontWeight: 700,
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing.two,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
    minHeight: 32,
  },
  headerAddText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    padding: Spacing.three,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 700,
    marginBottom: Spacing.half,
  },
  emptyDescription: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  emptyCtaText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  presetList: {
    gap: Spacing.two,
  },
  presetCard: {
    borderWidth: 1.5,
    borderRadius: Rounded.md,
    overflow: 'hidden',
  },
  cardSelectArea: {
    padding: Spacing.two,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
    minWidth: 0,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  presetName: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 700,
  },
  presetMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  activePill: {
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Rounded.round,
  },
  activePillText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  tapToActivate: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.half,
    marginTop: Spacing.one,
    paddingLeft: 28,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.one,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  categoryBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 700,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
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
