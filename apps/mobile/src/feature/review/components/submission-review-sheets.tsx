import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolveS3Url, type RemedySign } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/button';
import { Colors, Fonts } from '@/constants/theme';
import { styles } from '@/feature/review/styles/submission-review-screen.styles';
import { useTheme } from '@/hooks/use-theme';

export type ReviewSheet = 'decline' | 'report';

export const DEFAULT_REMEDY_SIGNS: RemedySign[] = [
  {
    id: 102,
    signCode: 'W.201a',
    nameVi: 'Chỗ ngoặt nguy hiểm bên trái',
    nameEn: 'Dangerous Curve Left',
    imageUrl: resolveS3Url('stm-sign-crops/w201a.png'),
  },
  {
    id: 103,
    signCode: 'P.102',
    nameVi: 'Cấm đi ngược chiều',
    nameEn: 'No Entry',
    imageUrl: resolveS3Url('stm-sign-crops/p102.png'),
  },
  {
    id: 104,
    signCode: 'P.123a',
    nameVi: 'Cấm rẽ trái',
    nameEn: 'No Left Turn',
    imageUrl: resolveS3Url('stm-sign-crops/p123a.png'),
  },
  {
    id: 105,
    signCode: 'I.408',
    nameVi: 'Nơi đỗ xe',
    nameEn: 'Parking Space',
    imageUrl: resolveS3Url('stm-sign-crops/i408.png'),
  },
  {
    id: 106,
    signCode: 'P.130',
    nameVi: 'Cấm dừng xe và đỗ xe',
    nameEn: 'No Stopping and Parking',
    imageUrl: resolveS3Url('stm-sign-crops/p130.png'),
  },
];

export const declineReasons = [
  { value: 'Sign Not Found', label: 'Không tìm thấy biển báo' },
  { value: 'Incorrect Sign Type', label: 'Sai loại biển báo' },
  { value: 'Too Poor Image Quality', label: 'Chất lượng ảnh quá kém' },
  { value: 'Duplicate Submission', label: 'Dữ liệu bị trùng lặp' },
  { value: 'Other', label: 'Lý do khác' },
] as const;

export type DeclineReason = (typeof declineReasons)[number]['value'];
export type ReportIssueType = 'missing_type' | 'other';

export const REPORT_ISSUE_OPTIONS: Array<{
  id: ReportIssueType;
  label: string;
  badge?: string;
}> = [
  { id: 'missing_type', label: 'Biển chưa có trong danh mục' },
  { id: 'other', label: 'Vấn đề khác' },
];

export function SubmissionReviewSkeleton() {
  return (
    <View accessibilityLabel="Đang tải danh sách thẩm định" style={styles.skeletonContainer}>
      <View style={[styles.skeletonBlock, { width: '100%', height: 4, marginVertical: 8 }]} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonInfoBox} />
      <View style={styles.skeletonDiamond}>
        <View style={[styles.skeletonCircleButton, styles.diamondTop]} />
        <View style={[styles.skeletonCircleButton, styles.diamondLeft]} />
        <View style={[styles.skeletonCircleButton, styles.diamondRight]} />
        <View style={[styles.skeletonCircleButton, styles.diamondBottom]} />
      </View>
    </View>
  );
}

type ReviewBottomSheetProps = {
  declineReason?: DeclineReason;
  declineReasonDetail?: string;
  onChangeDeclineReason?: (reason?: DeclineReason) => void;
  onChangeDeclineReasonDetail?: (value: string) => void;
  onChangeReportIssueType?: (issue: ReportIssueType) => void;
  onChangeReportNote: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onOpenCatalog?: () => void;
  onOpenReport?: () => void;
  onSelectRemedySign?: (sign?: RemedySign) => void;
  remedySigns?: RemedySign[];
  reportIssueType?: ReportIssueType;
  reportNote: string;
  selectedRemedySign?: RemedySign;
  type?: ReviewSheet;
  isSubmitting?: boolean;
};

export function ReviewBottomSheet({
  declineReason,
  declineReasonDetail,
  isSubmitting = false,
  onChangeDeclineReason,
  onChangeDeclineReasonDetail,
  onChangeReportIssueType,
  onChangeReportNote,
  onClose,
  onConfirm,
  onOpenCatalog,
  onOpenReport,
  onSelectRemedySign,
  remedySigns = [],
  reportIssueType = 'other',
  reportNote,
  selectedRemedySign,
  type,
}: ReviewBottomSheetProps) {
  const theme = useTheme();
  const isDecline = type === 'decline';
  const isMissingType = reportIssueType === 'missing_type';
  const isReportOther = reportIssueType === 'other';

  const canConfirm =
    !isSubmitting &&
    (isDecline
      ? Boolean(
          selectedRemedySign ||
            (declineReason && (declineReason !== 'Other' || Boolean(declineReasonDetail?.trim()))),
        )
      : isMissingType || !isReportOther || Boolean(reportNote.trim()));

  const confirmLabel = isDecline
    ? selectedRemedySign
      ? 'Xác nhận chọn'
      : declineReason
        ? 'Xác nhận từ chối'
        : 'Xác nhận chọn'
    : 'Gửi báo cáo';

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={Boolean(type)}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Đóng tùy chọn thẩm định"
          onPress={onClose}
          style={styles.backdrop}
        />
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
          }
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
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {isDecline ? 'Gợi ý biển báo' : 'Báo cáo sự cố'}
              </Text>
              {!isDecline ? <Text style={styles.srOnlyText}>Báo cáo dữ liệu</Text> : null}
              <AppButton
                accessibilityLabel="Đóng"
                onPress={onClose}
                style={styles.sheetCloseButton}
                variant="ghost"
              >
                <MaterialCommunityIcons color={theme.text} name="close" size={22} />
              </AppButton>
            </View>

            {isDecline ? (
              <ScrollView
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                style={styles.sheetBodyScroll}
              >
                {selectedRemedySign &&
                !remedySigns.slice(0, 4).some((s) => s.id === selectedRemedySign.id) ? (
                  <View
                    style={[
                      styles.catalogSelectedCard,
                      { backgroundColor: theme.backgroundSelected, borderColor: theme.primary },
                    ]}
                  >
                    <View style={[styles.remedyImageWrapper, { backgroundColor: theme.neutral }]}>
                      {selectedRemedySign.imageUrl ? (
                        <Image
                          accessibilityLabel={selectedRemedySign.signCode}
                          contentFit="contain"
                          source={{ uri: resolveS3Url(selectedRemedySign.imageUrl) }}
                          style={styles.remedyImage}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          color={theme.placeholder}
                          name="traffic-light"
                          size={32}
                        />
                      )}
                      <View style={[styles.remedyCheckBadge, { backgroundColor: theme.primary }]}>
                        <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
                      </View>
                    </View>
                    <View style={styles.catalogSelectedInfo}>
                      <Text style={[styles.catalogSelectedBadge, { color: theme.primary }]}>
                        Đã chọn từ danh mục
                      </Text>
                      <Text numberOfLines={1} style={[styles.remedyCode, { color: theme.text }]}>
                        {selectedRemedySign.signCode}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[styles.remedyName, { color: theme.textSecondary }]}
                      >
                        {selectedRemedySign.nameVi || selectedRemedySign.nameEn}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Đổi biển báo khác"
                      accessibilityRole="button"
                      onPress={onOpenCatalog}
                      style={styles.catalogChangeButton}
                    >
                      <Text style={[styles.catalogChangeButtonText, { color: theme.primary }]}>
                        Đổi biển
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <Text style={[styles.sheetHelper, { color: theme.textSecondary }]}>
                  Chọn biển báo đúng từ các gợi ý:
                </Text>

                <View style={styles.remediesGrid} testID="remedies-grid">
                  {remedySigns.slice(0, 4).map((sign) => {
                    const selected = selectedRemedySign?.id === sign.id;
                    return (
                      <Pressable
                        accessibilityLabel={`Chọn biển báo ${sign.signCode} - ${sign.nameVi || sign.nameEn}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        key={sign.id}
                        onPress={() => {
                          onSelectRemedySign?.(sign);
                          onChangeDeclineReason?.(undefined);
                        }}
                        style={({ pressed }) => [
                          styles.remedyCard,
                          {
                            backgroundColor: selected ? theme.backgroundSelected : theme.surface,
                            borderColor: selected ? theme.primary : theme.border,
                            opacity: pressed ? 0.85 : 1,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          },
                        ]}
                      >
                        <View style={[styles.remedyImageWrapper, { backgroundColor: theme.neutral }]}>
                          {sign.imageUrl ? (
                            <Image
                              accessibilityLabel={sign.signCode}
                              contentFit="contain"
                              source={{ uri: resolveS3Url(sign.imageUrl) }}
                              style={styles.remedyImage}
                            />
                          ) : (
                            <MaterialCommunityIcons
                              color={theme.placeholder}
                              name="traffic-light"
                              size={32}
                            />
                          )}
                          {selected ? (
                            <View style={[styles.remedyCheckBadge, { backgroundColor: theme.primary }]}>
                              <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} />
                            </View>
                          ) : null}
                        </View>
                        <Text numberOfLines={1} style={[styles.remedyCode, { color: theme.text }]}>
                          {sign.signCode}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={[styles.remedyName, { color: theme.textSecondary }]}
                        >
                          {sign.nameVi || sign.nameEn}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.noOptionContainer}>
                  <View style={styles.noOptionHeader}>
                    <Text style={[styles.noOptionLabel, { color: theme.textSecondary }]}>
                      Không có biển báo đúng ở trên?
                    </Text>
                    <Text style={styles.srOnlyText}>no correct option?</Text>
                  </View>

                  <AppButton
                    accessibilityLabel="Chọn biển báo từ danh mục"
                    label="Tra cứu toàn bộ danh mục biển báo..."
                    onPress={onOpenCatalog}
                    style={[styles.catalogPickerTriggerButton, { borderColor: theme.border }]}
                    textStyle={{ color: theme.text, fontSize: 13, fontWeight: '600' }}
                    variant="surface"
                  />

                  <View style={styles.declineReasonsSection}>
                    <Text style={[styles.declineReasonsTitle, { color: theme.textSecondary }]}>
                      Hoặc từ chối trực tiếp:
                    </Text>
                    <View style={styles.declineReasonsList}>
                      {declineReasons.map((r) => {
                        const isSelected = declineReason === r.value;
                        return (
                          <Pressable
                            accessibilityLabel={r.label}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isSelected }}
                            key={r.value}
                            onPress={() => {
                              onChangeDeclineReason?.(r.value);
                              onSelectRemedySign?.(undefined);
                            }}
                            style={[
                              styles.declineReasonChip,
                              {
                                backgroundColor: isSelected ? `${Colors.danger}15` : theme.surface,
                                borderColor: isSelected ? Colors.danger : theme.border,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              color={isSelected ? Colors.danger : theme.placeholder}
                              name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                              size={18}
                            />
                            <Text
                              style={[
                                styles.declineReasonChipText,
                                { color: isSelected ? Colors.danger : theme.text },
                              ]}
                            >
                              {r.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {declineReason === 'Other' ? (
                      <TextInput
                        accessibilityLabel="Chi tiết lý do khác"
                        multiline
                        onChangeText={onChangeDeclineReasonDetail}
                        placeholder="Nhập chi tiết lý do từ chối..."
                        placeholderTextColor={theme.placeholder}
                        style={[
                          styles.reasonDetailInput,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                        value={declineReasonDetail}
                      />
                    ) : null}
                  </View>

                  <View style={[styles.reportRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.reportRowLabel, { color: theme.placeholder }]}>
                      Dữ liệu vi phạm hoặc ảnh sai lệch?
                    </Text>
                    <AppButton
                      accessibilityLabel="Báo cáo"
                      label="Báo cáo"
                      onPress={onOpenReport}
                      style={[styles.remedyReportButton, { borderColor: theme.border }]}
                      textStyle={{ color: theme.text }}
                      variant="surface"
                    />
                  </View>
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                style={styles.sheetBodyScroll}
              >
                <View style={styles.reasonList}>
                  {REPORT_ISSUE_OPTIONS.map((option) => {
                    const selected = reportIssueType === option.id;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        key={option.id}
                        onPress={() => onChangeReportIssueType?.(option.id)}
                        style={[
                          styles.reasonOption,
                          {
                            backgroundColor: selected ? theme.backgroundSelected : theme.surface,
                            borderColor: selected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.reasonLabel, { color: theme.text }]}>
                          {option.label}
                        </Text>
                        {option.badge ? (
                          <View
                            style={[styles.inlineBadge, { backgroundColor: `${theme.primary}18` }]}
                          >
                            <Text style={[styles.inlineBadgeText, { color: theme.primary }]}>
                              {option.badge}
                            </Text>
                          </View>
                        ) : null}
                        <View
                          style={[
                            styles.radio,
                            { borderColor: selected ? theme.primary : theme.placeholder },
                          ]}
                        >
                          {selected ? (
                            <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {isReportOther ? (
                  <View style={styles.reasonInputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>
                      Mô tả chi tiết <Text style={{ color: Colors.danger }}>*</Text>
                    </Text>
                    <TextInput
                      accessibilityLabel="Report Note, required"
                      multiline
                      onChangeText={onChangeReportNote}
                      placeholder="Mô tả sự cố hoặc sai lệch với dữ liệu này..."
                      placeholderTextColor={theme.placeholder}
                      style={[
                        styles.reasonInput,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                      textAlignVertical="top"
                      value={reportNote}
                    />
                  </View>
                ) : null}
              </ScrollView>
            )}

            <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
              <AppButton
                label="Hủy"
                onPress={onClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                disabled={!canConfirm}
                label={confirmLabel}
                onPress={onConfirm}
                style={[
                  styles.sheetFooterButton,
                  {
                    backgroundColor: !canConfirm
                      ? theme.placeholder
                      : isDecline
                        ? declineReason
                          ? Colors.danger
                          : theme.primary
                        : theme.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  {confirmLabel}
                </Text>
                {!isDecline ? <Text style={styles.srOnlyText}>Submit Report</Text> : null}
              </AppButton>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
