import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CreateMissingTypeReportDto } from '@/types/reviewsType';

export type ReportNewSignTypeModalProps = {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: CreateMissingTypeReportDto) => void;
};

const CATEGORY_OPTIONS = [
  { id: 1, label: 'Prohibitory (P)' },
  { id: 2, label: 'Warning (W)' },
  { id: 3, label: 'Mandatory (R)' },
  { id: 4, label: 'Information (I)' },
  { id: 5, label: 'Supplementary (S)' },
];

const SHAPE_OPTIONS = [
  { value: 'Circle', label: 'Circle' },
  { value: 'Triangle', label: 'Triangle' },
  { value: 'Rectangle', label: 'Rectangle' },
  { value: 'Square', label: 'Square' },
  { value: 'Octagon', label: 'Octagon' },
];

const COLOR_OPTIONS = [
  { value: 'Red-White', label: 'Red - White' },
  { value: 'Yellow-Black', label: 'Yellow - Black' },
  { value: 'Blue-White', label: 'Blue - White' },
  { value: 'Green-White', label: 'Green - White' },
  { value: 'Black-White', label: 'Black - White' },
];

export function ReportNewSignTypeModal({
  candidateId,
  isOpen,
  onClose,
  onSubmit,
}: ReportNewSignTypeModalProps) {
  const theme = useTheme();

  const [proposedName, setProposedName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [selectedShape, setSelectedShape] = useState<string>('Circle');
  const [selectedColor, setSelectedColor] = useState<string>('Red-White');
  const [description, setDescription] = useState('');

  const canSubmit = true;

  const handleConfirm = () => {
    onSubmit({
      candidateId,
      proposedName: proposedName.trim() || undefined,
      proposedCategoryId: selectedCategoryId,
      suggestedShape: selectedShape,
      suggestedColorScheme: selectedColor,
      description: description.trim() || undefined,
    });
    // Reset state
    setProposedName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={isOpen}
    >
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close report modal" onPress={onClose} style={styles.backdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          enabled={Platform.OS !== 'web'}
          pointerEvents="box-none"
          style={styles.sheetPositioner}
        >
          <SafeAreaView
            edges={['bottom']}
            style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.headerTitleRow}>
                <MaterialCommunityIcons color={Colors.warning} name="alert-decagram" size={22} />
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  Report New Sign Type
                </Text>
              </View>
              <AppButton
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.sheetCloseButton}
                variant="ghost"
              >
                <MaterialCommunityIcons color={theme.text} name="close" size={22} />
              </AppButton>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
              style={styles.sheetBodyScroll}
            >
              <Text style={[styles.sheetHelper, { color: theme.textSecondary }]}>
                If this traffic sign does not exist in the official catalog, please provide details for Staff & Admin appraisal:
              </Text>

              {/* Proposed Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Proposed Sign Name (Optional)
                </Text>
                <TextInput
                  accessibilityLabel="Proposed sign name, required"
                  onChangeText={setProposedName}
                  placeholder="e.g. No Trailers, Dense Fog Warning..."
                  placeholderTextColor={theme.placeholder}
                  style={[
                    styles.textInput,
                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  ]}
                  value={proposedName}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Suggested Category
                </Text>
                <View style={styles.chipGrid}>
                  {CATEGORY_OPTIONS.map((cat) => {
                    const selected = selectedCategoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.primary : theme.surface,
                            borderColor: selected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? '#ffffff' : theme.text },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Shape */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Suggested Shape
                </Text>
                <View style={styles.chipGrid}>
                  {SHAPE_OPTIONS.map((shape) => {
                    const selected = selectedShape === shape.value;
                    return (
                      <Pressable
                        key={shape.value}
                        onPress={() => setSelectedShape(shape.value)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.primary : theme.surface,
                            borderColor: selected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? '#ffffff' : theme.text },
                          ]}
                        >
                          {shape.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Color */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Color Scheme
                </Text>
                <View style={styles.chipGrid}>
                  {COLOR_OPTIONS.map((c) => {
                    const selected = selectedColor === c.value;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => setSelectedColor(c.value)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.primary : theme.surface,
                            borderColor: selected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? '#ffffff' : theme.text },
                          ]}
                        >
                          {c.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Description
                </Text>
                <TextInput
                  accessibilityLabel="Description"
                  multiline
                  numberOfLines={3}
                  onChangeText={setDescription}
                  placeholder="Provide additional visual details or road conditions..."
                  placeholderTextColor={theme.placeholder}
                  style={[
                    styles.textArea,
                    { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                  ]}
                  textAlignVertical="top"
                  value={description}
                />
              </View>
            </ScrollView>

            <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
              <AppButton
                label="Cancel"
                onPress={onClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                disabled={!canSubmit}
                label="Gửi báo cáo"
                onPress={handleConfirm}
                style={[
                  styles.sheetFooterButton,
                  { backgroundColor: theme.primary },
                ]}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  chip: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inputGroup: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  noticeNote: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: Spacing.half,
  },
  sheet: {
    borderTopLeftRadius: Rounded.xlg,
    borderTopRightRadius: Rounded.xlg,
    maxHeight: '90%',
  },
  sheetBody: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  sheetBodyScroll: {
    maxHeight: 520,
  },
  sheetCloseButton: {
    padding: Spacing.half,
  },
  sheetFooter: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  sheetFooterButton: {
    flex: 1,
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginVertical: Spacing.half,
    width: 40,
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sheetHelper: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  sheetPositioner: {
    width: '100%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  textArea: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 80,
    padding: Spacing.sm,
  },
  textInput: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
  },
});
