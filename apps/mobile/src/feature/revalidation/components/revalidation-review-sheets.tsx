import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
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

import type { CatalogSign } from '@/api/reviews/catalog';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { AppButton } from '@/components/button';
import { Colors } from '@/constants/theme';
import { styles } from '@/feature/revalidation/styles/revalidation-review-screen.styles';
import { useTheme } from '@/hooks/use-theme';
import type { RevalidationQueueEvidenceItem } from '@/types/revalidationType';

export type RevalidationReviewAction =
  | 'STILL_ACTIVE'
  | 'REMOVED'
  | 'CHANGED'
  | 'UNCLEAR'
  | 'INVALID';

export type RevalidationSheetType = 'decline' | 'report' | 'recapture';

export const revalActionDetails: Record<
  RevalidationReviewAction,
  {
    bgAlpha: string;
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    summary: string;
    symbol: string;
    title: string;
  }
> = {
  STILL_ACTIVE: {
    bgAlpha: 'rgba(22, 163, 74, 0.12)',
    color: '#16A34A',
    icon: 'check-circle',
    label: 'Vẫn hoạt động',
    summary: 'Xác nhận biển báo vẫn tồn tại trên thực địa.',
    symbol: '✓',
    title: 'ĐÃ XÁC NHẬN HOẠT ĐỘNG',
  },
  REMOVED: {
    bgAlpha: 'rgba(239, 68, 68, 0.12)',
    color: Colors.danger,
    icon: 'close-circle',
    label: 'Đã gỡ bỏ',
    summary: 'Xác nhận biển báo đã không còn trên thực địa.',
    symbol: '×',
    title: 'ĐÃ XÁC NHẬN GỠ BỎ',
  },
  CHANGED: {
    bgAlpha: 'rgba(249, 115, 22, 0.12)',
    color: '#F97316',
    icon: 'cached',
    label: 'Đã thay đổi',
    summary: 'Loại biển báo hoặc thông tin đã thay đổi.',
    symbol: '⟳',
    title: 'ĐÃ GHI NHẬN THAY ĐỔI',
  },
  UNCLEAR: {
    bgAlpha: 'rgba(37, 99, 235, 0.12)',
    color: '#2563EB',
    icon: 'arrow-up-circle',
    label: 'Bỏ qua',
    summary: 'Đã bỏ qua do không thể nhận diện được biển báo.',
    symbol: '?',
    title: 'ĐÃ BỎ QUA',
  },
  INVALID: {
    bgAlpha: 'rgba(100, 116, 139, 0.12)',
    color: '#64748B',
    icon: 'alert-circle',
    label: 'Không hợp lệ',
    summary: 'Minh chứng không hợp lệ hoặc bị báo cáo vi phạm.',
    symbol: '!',
    title: 'ĐÃ BÁO CÁO VI PHẠM',
  },
};

export function RevalSummaryMetric({
  action,
  count,
}: {
  action: RevalidationReviewAction;
  count: number;
}) {
  const theme = useTheme();
  const details = revalActionDetails[action];

  return (
    <View
      style={[
        styles.summaryMetric,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={[styles.summaryMetricSymbol, { borderColor: details.color }]}>
        <Text style={[styles.summaryMetricSymbolLabel, { color: details.color }]}>
          {details.symbol}
        </Text>
      </View>
      <Text style={[styles.summaryMetricCount, { color: theme.text }]}>{count}</Text>
      <Text style={[styles.summaryMetricLabel, { color: details.color }]}>
        {details.label.toUpperCase()}
      </Text>
    </View>
  );
}

export function RevalReviewedSignRow({
  record,
}: {
  record: {
    item: RevalidationQueueEvidenceItem;
    action: RevalidationReviewAction;
    note?: string;
  };
}) {
  const theme = useTheme();
  const details = revalActionDetails[record.action];
  const imageUri = record.item.evidence.mediaUrl || record.item.verifiedSign.signCropUrl;

  return (
    <View
      style={[
        styles.summarySignRow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      {imageUri ? (
        <Image
          accessibilityLabel={record.item.verifiedSign.signCode}
          contentFit="cover"
          source={{ uri: resolveS3Url(imageUri) }}
          style={styles.summarySignImage}
        />
      ) : (
        <View
          style={[
            styles.summarySignImage,
            { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <MaterialCommunityIcons color={theme.placeholder} name="traffic-light" size={24} />
        </View>
      )}
      <View style={styles.summarySignCopy}>
        <Text numberOfLines={1} style={[styles.summarySignName, { color: theme.text }]}>
          {record.item.verifiedSign.nameVi ||
            record.item.verifiedSign.nameEn ||
            record.item.verifiedSign.signCode ||
            'Traffic Sign'}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.summarySignLocation, { color: theme.textSecondary }]}
        >
          {record.item.verifiedSign.signCode}
          {record.item.evidence.distanceMeters != null
            ? ` Khoảng cách so với vị trí gốc: ${record.item.evidence.distanceMeters}m`
            : ' Đã xác minh vị trí'}
        </Text>
        <Text numberOfLines={1} style={[styles.summarySignSummary, { color: theme.placeholder }]}>
          {record.note ? `Ghi chú: ${record.note}` : details.summary}
        </Text>
      </View>
      <View style={[styles.summaryStatusBadge, { backgroundColor: `${details.color}18` }]}>
        <Text style={[styles.summaryStatusLabel, { color: details.color }]}>{details.label}</Text>
      </View>
    </View>
  );
}

export function RevalidationReviewSkeleton() {
  return (
    <View accessibilityLabel="Đang tải các lượt tái thẩm định" style={styles.skeletonContainer}>
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

const DECLINE_COUNTER_CHOICES: Array<{
  id: string;
  label: string;
  desc: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}> = [
  {
    id: 'STILL_ACTIVE',
    label: 'Biển báo vẫn còn hoạt động',
    desc: 'Biển báo thực tế vẫn đang đứng vững và hoạt động bình thường.',
    icon: 'check-circle-outline',
    color: '#16A34A',
  },
  {
    id: 'REMOVED',
    label: 'Biển báo đã bị gỡ bỏ',
    desc: 'Không còn thấy biển báo tại vị trí chỉ định.',
    icon: 'close-circle-outline',
    color: '#DC2626',
  },
  {
    id: 'CHANGED',
    label: 'Biển báo đã thay đổi',
    desc: 'Biển báo đã được thay thế hoặc đổi sang mã biển khác.',
    color: '#D97706',
  },
];

const REPORT_ISSUE_CHOICES = [
  'Ảnh mờ / Không rõ biển báo',
  'Ảnh bị che khuất hoặc góc chụp xấu',
  'Chói sáng ban đêm / Không nhận diện được',
  'Sai lệch vị trí tọa độ GPS quá xa',
  'Vi phạm quy tắc / Ảnh không hợp lệ',
];

const RECAPTURE_REASONS: Array<{
  id: string;
  label: string;
  desc: string;
}> = [
  {
    id: 'BLURRY',
    label: 'Ảnh bị mờ / Lóa sáng / Mất nét',
    desc: 'Không nhìn rõ được biểu tượng hoặc chữ trên biển báo.',
  },
  {
    id: 'OBSTRUCTED',
    label: 'Biển báo bị che khuất',
    desc: 'Cây cối, công trình hoặc phương tiện che khuất biển.',
  },
  {
    id: 'WRONG_SIGN',
    label: 'Chụp sai biển báo hoặc góc quá xa',
    desc: 'Khoảng cách chụp quá xa hoặc không đúng đối tượng mục tiêu.',
  },
  {
    id: 'OTHER',
    label: 'Lý do khác',
    desc: 'Cần chụp lại với góc nhìn trực diện và rõ ràng hơn.',
  },
];

type RevalidationBottomSheetProps = {
  type?: RevalidationSheetType;
  surveyorVerdict?: string;
  selectedCatalogSign?: CatalogSign | null;
  onOpenCatalog?: () => void;
  onClearCatalogSign?: () => void;
  onClose: () => void;
  onConfirmDecline: (decision: string, note?: string, suggestedSignTypeId?: number) => void;
  onConfirmReport: (reason: string, note?: string) => void;
  onConfirmRecapture?: (reason: string, note?: string) => void;
};

export function RevalidationBottomSheet({
  type,
  surveyorVerdict,
  selectedCatalogSign,
  onOpenCatalog,
  onClearCatalogSign,
  onClose,
  onConfirmDecline,
  onConfirmReport,
  onConfirmRecapture,
}: RevalidationBottomSheetProps) {
  const theme = useTheme();
  const [selectedDeclineAction, setSelectedDeclineAction] = useState<string>('STILL_ACTIVE');
  const [selectedReportReason, setSelectedReportReason] = useState<string>(REPORT_ISSUE_CHOICES[0]);
  const [selectedRecaptureReason, setSelectedRecaptureReason] = useState<string>(
    RECAPTURE_REASONS[0].id,
  );
  const [note, setNote] = useState('');

  const title =
    type === 'decline'
      ? 'Từ chối kết luận của điều tra viên'
      : type === 'recapture'
        ? 'Yêu cầu điều tra viên chụp lại ảnh'
        : 'Báo cáo sự cố minh chứng';

  const helperText =
    type === 'decline'
      ? `Điều tra viên kết luận: "${surveyorVerdict || 'Chưa rõ'}". Hãy chọn tình trạng đúng theo quan sát của bạn:`
      : type === 'recapture'
        ? 'Chọn lý do ảnh không đạt chuẩn để gửi thông báo yêu cầu chụp lại tại hiện trường cho Surveyor:'
        : 'Chọn lý do minh chứng không hợp lệ hoặc khó nhận diện:';

  const confirmColor =
    type === 'decline' ? Colors.danger : type === 'recapture' ? '#D97706' : '#EA580C';

  const handleConfirm = () => {
    if (type === 'decline') {
      onConfirmDecline(
        selectedDeclineAction,
        note.trim() || undefined,
        selectedDeclineAction === 'CHANGED' && selectedCatalogSign
          ? selectedCatalogSign.id
          : undefined,
      );
    } else if (type === 'report') {
      onConfirmReport(selectedReportReason, note.trim() || undefined);
    } else if (type === 'recapture') {
      onConfirmRecapture?.(selectedRecaptureReason, note.trim() || undefined);
    }
    setNote('');
    onClose();
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={Boolean(type)}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Đóng tùy chọn thẩm định"
          onPress={handleClose}
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
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
              <AppButton
                accessibilityLabel="Đóng"
                onPress={handleClose}
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
              <Text style={[styles.sheetHelper, { color: theme.textSecondary }]}>{helperText}</Text>

              {type === 'decline' ? (
                <View style={{ gap: 8, marginBottom: 14 }}>
                  <View style={{ gap: 6 }}>
                    {DECLINE_COUNTER_CHOICES.map((choice) => {
                      const isSelected = selectedDeclineAction === choice.id;
                      return (
                        <Pressable
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          key={choice.id}
                          onPress={() => setSelectedDeclineAction(choice.id)}
                          style={[
                            styles.reasonOption,
                            {
                              backgroundColor: isSelected
                                ? theme.backgroundSelected
                                : theme.surface,
                              borderColor: isSelected ? choice.color : theme.border,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            color={choice.color}
                            name={choice.icon}
                            size={22}
                          />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.reasonLabel, { color: theme.text }]}>
                              {choice.label}
                            </Text>
                            <Text
                              style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}
                            >
                              {choice.desc}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.radio,
                              { borderColor: isSelected ? choice.color : theme.placeholder },
                            ]}
                          >
                            {isSelected ? (
                              <View style={[styles.radioDot, { backgroundColor: choice.color }]} />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {selectedDeclineAction === 'CHANGED' ? (
                    <View
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        marginTop: 4,
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>
                        Biển báo thực tế thay thế (tùy chọn):
                      </Text>
                      {selectedCatalogSign ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: theme.backgroundElement,
                            padding: 8,
                            borderRadius: 8,
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{ fontWeight: '700', fontSize: 13, color: theme.text }}>
                              {selectedCatalogSign.signCode} - {selectedCatalogSign.nameVi}
                            </Text>
                          </View>
                          <AppButton
                            accessibilityLabel="Xóa biển báo đã chọn"
                            onPress={onClearCatalogSign}
                            style={{ paddingHorizontal: 8, minHeight: 32 }}
                            variant="ghost"
                          >
                            <MaterialCommunityIcons color={Colors.danger} name="close" size={18} />
                          </AppButton>
                        </View>
                      ) : (
                        <AppButton
                          accessibilityLabel="Chọn biển báo từ danh mục"
                          label="Tra cứu danh mục biển báo"
                          onPress={onOpenCatalog}
                          style={{ borderColor: theme.border }}
                          variant="surface"
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {type === 'report' ? (
                <View style={{ gap: 6, marginBottom: 14 }}>
                  {REPORT_ISSUE_CHOICES.map((reason) => {
                    const isSelected = selectedReportReason === reason;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        key={reason}
                        onPress={() => setSelectedReportReason(reason)}
                        style={[
                          styles.reasonOption,
                          {
                            backgroundColor: isSelected ? theme.backgroundSelected : theme.surface,
                            borderColor: isSelected ? '#EA580C' : theme.border,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons color="#EA580C" name="flag-outline" size={20} />
                        <Text
                          style={[
                            styles.reasonLabel,
                            { flex: 1, marginLeft: 10, color: theme.text },
                          ]}
                        >
                          {reason}
                        </Text>
                        <View
                          style={[
                            styles.radio,
                            { borderColor: isSelected ? '#EA580C' : theme.placeholder },
                          ]}
                        >
                          {isSelected ? (
                            <View style={[styles.radioDot, { backgroundColor: '#EA580C' }]} />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {type === 'recapture' ? (
                <View style={{ gap: 6, marginBottom: 14 }}>
                  {RECAPTURE_REASONS.map((choice) => {
                    const isSelected = selectedRecaptureReason === choice.id;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        key={choice.id}
                        onPress={() => setSelectedRecaptureReason(choice.id)}
                        style={[
                          styles.reasonOption,
                          {
                            backgroundColor: isSelected ? theme.backgroundSelected : theme.surface,
                            borderColor: isSelected ? '#D97706' : theme.border,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          color="#D97706"
                          name="camera-retake-outline"
                          size={20}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.reasonLabel, { color: theme.text }]}>
                            {choice.label}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                            {choice.desc}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radio,
                            { borderColor: isSelected ? '#D97706' : theme.placeholder },
                          ]}
                        >
                          {isSelected ? (
                            <View style={[styles.radioDot, { backgroundColor: '#D97706' }]} />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.reasonInputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Ghi chú chi tiết (tùy chọn)
                </Text>
                <TextInput
                  accessibilityLabel="Ghi chú quan sát của thẩm định viên"
                  multiline
                  onChangeText={setNote}
                  placeholder="Nhập thêm chi tiết nếu cần..."
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
                  value={note}
                />
              </View>
            </ScrollView>

            <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
              <AppButton
                label="Hủy"
                onPress={handleClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                label={
                  type === 'decline'
                    ? 'Xác nhận từ chối'
                    : type === 'recapture'
                      ? 'Gửi yêu cầu chụp lại'
                      : 'Gửi báo cáo'
                }
                onPress={handleConfirm}
                style={[styles.sheetFooterButton, { backgroundColor: confirmColor }]}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
