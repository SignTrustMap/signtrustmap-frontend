import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { AppToast } from '@/components/toast';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  type ReviewActionType,
  useReviewWorkflow,
} from '@/feature/review/context/review-workflow-provider';
import { ReportNewSignTypeModal } from '../components/report-new-sign-type-modal';
import type { CreateMissingTypeReportDto } from '@/types/reviewsType';
import { useGetCatalog } from '@/feature/review/hooks/use-review';
import { resolveS3Url, type RemedySign } from '@/api/reviews/review-workflow';
import { resolveLocation, formatResolvedLocationTitle } from '@/api/spatial/spatial';
import { useOptionalSession } from '@/context/session-provider';
import { ReviewInstructionModal } from '@/feature/review/components/review-instruction-modal';
import { RevalidationSignPickerModal } from '@/feature/revalidation/components/revalidation-sign-picker-modal';
import { useTheme } from '@/hooks/use-theme';

export type SubmissionReviewState = 'loading' | 'ready' | 'reviewed';

type SubmissionReviewScreenProps = {
  state?: SubmissionReviewState;
};

type ReviewSheet = 'decline' | 'report';

export const DEFAULT_REMEDY_SIGNS: RemedySign[] = [
  {
    id: 102,
    signCode: 'W.201a',
    nameVi: 'Chỗ ngoặt nguy hiểm bên trái',
    nameEn: 'Dangerous Curve Left',
    imageUrl: 'https://s3.signmap.site/stm-sign-crops/w201a.png',
  },
  {
    id: 103,
    signCode: 'P.102',
    nameVi: 'Cấm đi ngược chiều',
    nameEn: 'No Entry',
    imageUrl: 'https://s3.signmap.site/stm-sign-crops/p102.png',
  },
  {
    id: 104,
    signCode: 'P.123a',
    nameVi: 'Cấm rẽ trái',
    nameEn: 'No Left Turn',
    imageUrl: 'https://s3.signmap.site/stm-sign-crops/p123a.png',
  },
  {
    id: 105,
    signCode: 'I.408',
    nameVi: 'Nơi đỗ xe',
    nameEn: 'Parking Space',
    imageUrl: 'https://s3.signmap.site/stm-sign-crops/i408.png',
  },
  {
    id: 106,
    signCode: 'P.130',
    nameVi: 'Cấm dừng xe và đỗ xe',
    nameEn: 'No Stopping and Parking',
    imageUrl: 'https://s3.signmap.site/stm-sign-crops/p130.png',
  },
];

const declineReasons = [
  { value: 'Sign Not Found', label: 'Không tìm thấy biển báo' },
  { value: 'Incorrect Sign Type', label: 'Sai loại biển báo' },
  { value: 'Too Poor Image Quality', label: 'Chất lượng ảnh quá kém' },
  { value: 'Duplicate Submission', label: 'Dữ liệu bị trùng lặp' },
  { value: 'Other', label: 'Lý do khác' },
] as const;

type DeclineReason = (typeof declineReasons)[number]['value'];

export type ReportIssueType =
  | 'missing_type'
  | 'other';

export const REPORT_ISSUE_OPTIONS: Array<{
  id: ReportIssueType;
  label: string;
  badge?: string;
}> = [
  {
    id: 'missing_type',
    label: 'Sign not in catalog',
    badge: 'Flow 4',
  },
  {
    id: 'other',
    label: 'Other issue',
  },
];

function SubmissionReviewSkeleton() {
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
};

function ReviewBottomSheet({
  declineReason,
  declineReasonDetail,
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
  reportIssueType = 'missing_type',
  reportNote,
  selectedRemedySign,
  type,
}: ReviewBottomSheetProps) {
  const theme = useTheme();
  const isDecline = type === 'decline';
  const isMissingType = reportIssueType === 'missing_type';
  const isReportOther = reportIssueType === 'other';

  const canConfirm = isDecline
    ? Boolean(
        selectedRemedySign ||
        (declineReason && (declineReason !== 'Other' || Boolean(declineReasonDetail?.trim())))
      )
    : (isMissingType || !isReportOther || Boolean(reportNote.trim()));

  const confirmLabel = isDecline
    ? selectedRemedySign
      ? 'Xác nhận chọn'
      : declineReason
        ? 'Xác nhận từ chối'
        : 'Xác nhận chọn'
    : isMissingType
      ? 'Tiếp tục'
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
        <Pressable accessibilityLabel="Đóng tùy chọn thẩm định" onPress={onClose} style={styles.backdrop} />
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
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {isDecline ? 'Gợi ý biển báo' : 'Report Issue'}
              </Text>
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
                {/* Active selection banner if chosen from Catalog outside top remedies */}
                {selectedRemedySign && !remedySigns.slice(0, 4).some((s) => s.id === selectedRemedySign.id) ? (
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
                        <MaterialCommunityIcons color={theme.placeholder} name="traffic-light" size={32} />
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
                      <Text numberOfLines={2} style={[styles.remedyName, { color: theme.textSecondary }]}>
                        {selectedRemedySign.nameVi || selectedRemedySign.nameEn}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Đổi biển báo khác"
                      accessibilityRole="button"
                      onPress={onOpenCatalog}
                      style={styles.catalogChangeButton}
                    >
                      <Text style={[styles.catalogChangeButtonText, { color: theme.primary }]}>Đổi biển</Text>
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
                          <Text numberOfLines={2} style={[styles.remedyName, { color: theme.textSecondary }]}>
                            {sign.nameVi || sign.nameEn}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                {/* Below the grid: actions when none of the top 4 is right */}
                <View style={styles.noOptionContainer}>
                  <View style={styles.noOptionHeader}>
                    <Text style={[styles.noOptionLabel, { color: theme.textSecondary }]}>
                      Không có biển báo đúng ở trên?
                    </Text>
                    {/* srOnly test accessibility anchor for backward compatibility */}
                    <Text style={styles.srOnlyText}>no correct option?</Text>
                  </View>

                  {/* 1. Pick any sign from full QCVN 41 catalog */}
                  <AppButton
                    accessibilityLabel="Chọn biển báo từ danh mục"
                    label="Tra cứu toàn bộ danh mục biển báo..."
                    onPress={onOpenCatalog}
                    style={[styles.catalogPickerTriggerButton, { borderColor: theme.border }]}
                    textStyle={{ color: theme.text, fontSize: 13, fontWeight: '600' }}
                    variant="surface"
                  />

                  {/* 2. Direct decline options (not a sign / bad quality / duplicate) */}
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
                          { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                        ]}
                        value={declineReasonDetail}
                      />
                    ) : null}
                  </View>

                  {/* 3. Report button for violations/bad data */}
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
                <Text style={[styles.sheetHelper, { color: theme.textSecondary }]}>
                  Please select the issue with this sign submission:
                </Text>

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
                        <Text style={[styles.reasonLabel, { color: theme.text }]}>{option.label}</Text>
                        {option.badge ? (
                          <View style={[styles.inlineBadge, { backgroundColor: `${theme.primary}18` }]}>
                            <Text style={[styles.inlineBadgeText, { color: theme.primary }]}>{option.badge}</Text>
                          </View>
                        ) : null}
                        <View
                          style={[
                            styles.radio,
                            { borderColor: selected ? theme.primary : theme.placeholder },
                          ]}
                        >
                          {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {isReportOther ? (
                  <View style={styles.reasonInputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>
                      Details <Text style={{ color: Colors.danger }}>*</Text>
                    </Text>
                    <TextInput
                      accessibilityLabel="Report details, required"
                      multiline
                      onChangeText={onChangeReportNote}
                      placeholder="Please specify the issue"
                      placeholderTextColor={theme.placeholder}
                      style={[
                        styles.reasonInput,
                        { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
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
                        ? (declineReason ? Colors.danger : theme.primary)
                        : theme.primary,
                  },
                ]}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: Fonts.body, fontSize: 14, fontWeight: '700' }}>
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

export function SubmissionReviewScreen({ state = 'ready' }: SubmissionReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const {
    completeCurrentReview,
    isLoading,
    pendingSubmissions,
    recheckingPreviousAction,
    recheckingSubmission,
    reviewHistory,
    totalSubmissions,
    undoLastReview,
  } = useReviewWorkflow();

  const [activeSheet, setActiveSheet] = useState<ReviewSheet>();
  const [selectedRemedySign, setSelectedRemedySign] = useState<RemedySign>();
  const [declineReason, setDeclineReason] = useState<DeclineReason>();
  const [declineReasonDetail, setDeclineReasonDetail] = useState('');
  const [reportIssueType, setReportIssueType] = useState<ReportIssueType>('missing_type');
  const [reportNote, setReportNote] = useState('');
  const [isNewSignTypeModalOpen, setIsNewSignTypeModalOpen] = useState(false);
  const [isCatalogPickerVisible, setIsCatalogPickerVisible] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isSignFocused, setIsSignFocused] = useState(true);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'default' | 'success';
  }>();

  const { data: catalog } = useGetCatalog();
  const catalogSigns = useMemo(() => catalog?.signs ?? [], [catalog]);

  const displayedReviewAction = recheckingPreviousAction;
  const submission = pendingSubmissions[0];
  const nextSubmission = pendingSubmissions[1];
  const session = typeof useOptionalSession === 'function' ? useOptionalSession()?.session : undefined;
  const [resolvedAddress, setResolvedAddress] = useState<string>();

  useEffect(() => {
    if (!submission) {
      setResolvedAddress(undefined);
      return;
    }

    if (submission.location && submission.location !== 'Estimated GPS coordinates available') {
      setResolvedAddress(submission.location.replace(/^[•\s,.-]+/, '').trim());
      return;
    }

    const lat = submission.latitude;
    const lon = submission.longitude;
    if (lat == null || lon == null) {
      setResolvedAddress(undefined);
      return;
    }

    let isMounted = true;
    void (async () => {
      try {
        const resolved = await resolveLocation(lat, lon, session?.accessToken);
        if (isMounted && resolved) {
          const formatted = (resolved.displayAddress || formatResolvedLocationTitle(resolved) || '')
            .replace(/^[•\s,.-]+/, '')
            .trim();
          if (formatted) {
            setResolvedAddress(formatted);
          }
        }
      } catch {
        // keep undefined
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [submission?.id, submission?.location, submission?.latitude, submission?.longitude, session?.accessToken]);

  const displayLocation = useMemo(() => {
    if (resolvedAddress) return resolvedAddress;
    if (submission?.location && submission.location !== 'Estimated GPS coordinates available') {
      return submission.location;
    }
    return '';
  }, [resolvedAddress, submission?.location]);

  const totalInQueue = Math.max(
    totalSubmissions,
    reviewHistory.length + pendingSubmissions.length,
    1,
  );
  const reviewPosition = Math.min(
    reviewHistory.length + (submission ? 1 : 0),
    totalInQueue,
  );

  const activeRemedySigns: RemedySign[] = useMemo(() => {
    const candidateSignId = (submission as any)?.predictedSignTypeId;
    const candidateTitle = (submission?.title || '').toLowerCase();
    const candidateCode = submission?.title?.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';

    const isCandidateSign = (sign: { id?: number; signCode?: string }) => {
      if (candidateSignId != null && sign.id === candidateSignId) return true;
      if (sign.signCode) {
        const lowerCode = sign.signCode.toLowerCase();
        if (candidateCode && lowerCode === candidateCode) return true;
        if (candidateTitle.includes(lowerCode)) return true;
      }
      return false;
    };

    // 1. From embedded remedySigns if provided on submission
    if (submission?.remedySigns && submission.remedySigns.length > 0) {
      // Exclude any sign matching the candidate's prediction
      let remedies = submission.remedySigns.filter((s) => !isCandidateSign(s));

      // If the duplicate was not filtered by id/title, drop the first one as it is the prediction
      if (remedies.length === submission.remedySigns.length && submission.remedySigns.length > 1) {
        remedies = submission.remedySigns.slice(1);
      }

      // If we have 4 or more other signs, take the 4 other signs
      if (remedies.length >= 4) {
        return remedies.slice(0, 4);
      }

      // If fewer than 4 non-duplicate signs remain, supplement with catalog signs to always display 4
      const needed = 4 - remedies.length;
      const additionalFromCatalog = catalogSigns
        .filter((s) => !isCandidateSign(s) && !remedies.some((r) => r.id === s.id || r.signCode.toLowerCase() === s.signCode.toLowerCase()))
        .slice(0, needed)
        .map((s) => ({
          id: s.id,
          signCode: s.signCode,
          nameVi: s.nameVi,
          nameEn: s.nameEn,
          imageUrl: s.representativeImageKey,
        }));

      return [...remedies, ...additionalFromCatalog].slice(0, 4);
    }

    // 2. Fallback from catalog
    const fromCatalog = catalogSigns.filter((s) => !isCandidateSign(s));

    if (fromCatalog.length >= 4) {
      return fromCatalog.slice(0, 4).map((s) => ({
        id: s.id,
        signCode: s.signCode,
        nameVi: s.nameVi,
        nameEn: s.nameEn,
        imageUrl: s.representativeImageKey,
      }));
    }

    return DEFAULT_REMEDY_SIGNS.filter((s) => !isCandidateSign(s)).slice(0, 4);
  }, [catalogSigns, submission]);

  const completeReview = useCallback(
    (
      action: ReviewActionType,
      details?: {
        declineReason?: string;
        declineNote?: string;
        suggestedSignTypeId?: number;
        newSignReport?: CreateMissingTypeReportDto;
      },
    ) => {
      if (!submission) return;
      const completesReviewQueue = pendingSubmissions.length === 1;

      completeCurrentReview(action, details);

      const toastMessages: Record<ReviewActionType, string> = {
        approved: 'Đã phê duyệt biển báo',
        declined: 'Đã từ chối biển báo',
        reported: 'Đã báo cáo biển báo',
        skipped: 'Đã bỏ qua biển báo (không thể nhận diện)',
        reported_new_sign: 'Đã báo cáo loại biển mới chờ thẩm định catalog',
      };

      setToast((current) => ({
        id: (current?.id ?? 0) + 1,
        message: toastMessages[action],
        tone: action === 'approved' || action === 'reported_new_sign' ? 'success' : 'default',
      }));

      if (completesReviewQueue) {
        router.replace('/work/submission-summary');
      }
    },
    [completeCurrentReview, pendingSubmissions.length, router, submission],
  );

  const handleConfirmNewSignType = (reportDto: CreateMissingTypeReportDto) => {
    completeReview('reported_new_sign', { newSignReport: reportDto });
  };

  const closeSheet = () => {
    setActiveSheet(undefined);
    setSelectedRemedySign(undefined);
    setDeclineReason(undefined);
    setDeclineReasonDetail('');
  };

  const confirmDecline = () => {
    if (selectedRemedySign) {
      completeReview('declined', {
        suggestedSignTypeId: selectedRemedySign.id,
        declineReason: `Corrected to ${selectedRemedySign.signCode}`,
        declineNote: selectedRemedySign.nameVi || selectedRemedySign.nameEn,
      });
    } else if (declineReason) {
      completeReview('declined', {
        declineReason,
        declineNote: declineReasonDetail.trim() || declineReason,
      });
    } else {
      return;
    }

    setSelectedRemedySign(undefined);
    setDeclineReason(undefined);
    setDeclineReasonDetail('');
    closeSheet();
  };

  const confirmReport = () => {
    if (reportIssueType === 'missing_type') {
      closeSheet();
      setIsNewSignTypeModalOpen(true);
      return;
    }

    const selectedOption = REPORT_ISSUE_OPTIONS.find((opt) => opt.id === reportIssueType);
    const reasonTitle = selectedOption?.label || 'Reported Issue';
    const fullReason = reportNote.trim() ? `${reasonTitle}: ${reportNote.trim()}` : reasonTitle;

    completeReview('reported', { declineReason: reasonTitle, declineNote: fullReason });
    setReportNote('');
    closeSheet();
  };

  const undoLastAction = () => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return;

    undoLastReview();
    setToast(undefined);
  };

  // ---------------------------------------------------------------------------
  // Swipe Gestures: Right -> Approve, Left -> Reject, Up -> Skip, Down -> Report
  // ---------------------------------------------------------------------------
  const [pan] = useState(() => new Animated.ValueXY());

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [submission?.id, pan]);

  const rotate = pan.x.interpolate({
    inputRange: [-240, 0, 240],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const approveBadgeOpacity = pan.x.interpolate({
    inputRange: [25, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const declineBadgeOpacity = pan.x.interpolate({
    inputRange: [-90, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const skipBadgeOpacity = pan.y.interpolate({
    inputRange: [-90, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const reportBadgeOpacity = pan.y.interpolate({
    inputRange: [25, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy, vx, vy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const SWIPE_THRESHOLD = 85;

          if (absDx > absDy) {
            // Horizontal swipe: Right -> Approve, Left -> Reject
            if (dx > SWIPE_THRESHOLD || (dx > 35 && vx > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: 500, y: dy },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                completeReview('approved');
              });
              return;
            } else if (dx < -SWIPE_THRESHOLD || (dx < -35 && vx < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: -500, y: dy },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('decline');
              });
              return;
            }
          } else {
            // Vertical swipe: Up -> Skip, Down -> Report Issue
            if (dy < -SWIPE_THRESHOLD || (dy < -35 && vy < -0.4)) {
              Animated.timing(pan, {
                toValue: { x: dx, y: -500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                completeReview('skipped');
              });
              return;
            } else if (dy > SWIPE_THRESHOLD || (dy > 35 && vy > 0.4)) {
              Animated.timing(pan, {
                toValue: { x: dx, y: 500 },
                duration: 200,
                useNativeDriver: false,
              }).start(() => {
                pan.setValue({ x: 0, y: 0 });
                setActiveSheet('report');
              });
              return;
            }
          }

          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 50,
            useNativeDriver: false,
          }).start();
        },
      }),
    [completeReview, pan],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Reviewer Progress Bar & Navigation Controls */}
        <View style={styles.progressSection}>
          <View style={styles.progressTopRow}>
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={Spacing.one}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons color={theme.text} name="arrow-left" size={22} />
            </Pressable>

            <View style={styles.progressTrackWrapper}>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${Math.min(100, (reviewPosition / totalInQueue) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.topBarSpacer} />
          </View>
          <View style={styles.progressCounterRow}>
            <Text style={[styles.progressCounterText, { color: theme.textSecondary }]}>
              {submission ? 'REVIEWING' : 'REVIEWED'}{' '}
              {reviewPosition} OF {totalInQueue}
            </Text>
          </View>
        </View>

        {state === 'loading' || (isLoading && pendingSubmissions.length === 0) ? (
          <SubmissionReviewSkeleton />
        ) : submission ? (
          <View style={styles.mainContainer}>
            {/* Card & Image with White Info Box */}
            <View style={styles.cardArea}>
              {/* Upcoming card peeking subtly on the right (like Tinder) */}
              {nextSubmission ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.peekCard,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Image
                    contentFit="cover"
                    source={nextSubmission.image}
                    style={styles.cardImage}
                    transition={180}
                  />
                  <View style={styles.peekDimOverlay} />
                </View>
              ) : null}

              {/* Active Main Card with 4-Way Swipe Gesture */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.mainCard,
                  Boolean(nextSubmission) && styles.mainCardOffset,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { rotate },
                    ],
                  },
                ]}
              >
                <Pressable
                  accessibilityLabel="Ảnh biển báo. Chạm để phóng to."
                  onPress={() => setIsImageZoomed(true)}
                  style={styles.cardInnerPressable}
                >
                  <Image
                    accessibilityLabel={submission.title}
                    contentFit={isSignFocused ? "contain" : "cover"}
                    source={submission.image}
                    style={[
                      styles.cardImage,
                      isSignFocused && { transform: [{ scale: 1.15 }] },
                    ]}
                    transition={180}
                  />

                  {/* Focus Toggle Pill */}
                  <Pressable
                    accessibilityLabel="Toggle sign focus"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      setIsSignFocused((prev) => !prev);
                    }}
                    style={styles.focusToggleBadge}
                  >
                    <MaterialCommunityIcons
                      color="#FFFFFF"
                      name={isSignFocused ? "target" : "image-filter-center-focus"}
                      size={13}
                    />
                    <Text style={styles.focusToggleText}>
                      {isSignFocused ? "Focus Biển báo" : "Toàn cảnh"}
                    </Text>
                  </Pressable>

                  {/* Directional Swipe Badges */}
                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.approveBadge,
                      { opacity: approveBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>PHÊ DUYỆT</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.declineBadge,
                      { opacity: declineBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>TỪ CHỐI</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.skipBadge,
                      { opacity: skipBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>BỎ QUA</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeBadge,
                      styles.reportBadge,
                      { opacity: reportBadgeOpacity },
                    ]}
                  >
                    <Text style={[styles.swipeBadgeText, { color: '#FFFFFF' }]}>BÁO CÁO</Text>
                  </Animated.View>

                  {displayedReviewAction ? (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            displayedReviewAction === 'approved'
                              ? 'rgba(22, 128, 58, 0.9)'
                              : displayedReviewAction === 'declined'
                                ? 'rgba(239, 68, 68, 0.9)'
                                : displayedReviewAction === 'reported'
                                  ? 'rgba(249, 115, 22, 0.9)'
                                  : 'rgba(100, 116, 139, 0.9)',
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeLabel}>
                        {displayedReviewAction === 'approved'
                          ? 'ĐÃ PHÊ DUYỆT'
                          : displayedReviewAction === 'declined'
                            ? 'ĐÃ TỪ CHỐI'
                            : displayedReviewAction === 'reported'
                              ? 'ĐÃ BÁO CÁO'
                              : 'ĐÃ BỎ QUA'}
                      </Text>
                    </View>
                  ) : null}

                  {/* Subtle zoom button */}
                  <View style={styles.zoomButton}>
                    <MaterialCommunityIcons color="#FFFFFF" name="magnify-plus-outline" size={18} />
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            {/* Sign name textbox out of image container, between image and buttons */}
            <View
              style={[
                styles.signInfoBox,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text numberOfLines={2} style={[styles.infoBoxTitle, { color: theme.text }]}>
                {submission.title}
              </Text>
              <Text numberOfLines={1} style={[styles.infoBoxSubtitle, { color: theme.placeholder }]}>
                {[submission.captured, displayLocation].filter(Boolean).join(', ')}
              </Text>
            </View>

            {/* Bottom Section: Approve (Heart) & Reject (X) Buttons */}
            <View style={styles.actionsFooter}>
              <View style={styles.diamondContainer}>
                {/* Top Button: Arrow pointing up -> Skip (Cannot Identify) */}
                <View style={[styles.diamondItem, styles.diamondTop]}>
                  <Pressable
                    accessibilityLabel="Skip submission (cannot identify)"
                    accessibilityRole="button"
                    onPress={() => completeReview('skipped')}
                    style={({ pressed }) => [
                      styles.diamondButton,
                      styles.neutralDiamondButton,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      pressed && styles.circleButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons color={theme.text} name="arrow-up" size={24} />
                  </Pressable>
                  <Text style={[styles.diamondLabel, { color: theme.text }]}>
                    Bỏ qua
                  </Text>
                </View>

                {/* Left Button: Decline (X) */}
                <View style={[styles.diamondItem, styles.diamondLeft]}>
                  <Pressable
                    accessibilityLabel="Decline submission"
                    accessibilityRole="button"
                    onPress={() => setActiveSheet('decline')}
                    style={({ pressed }) => [
                      styles.diamondButton,
                      styles.declineButton,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      pressed && styles.circleButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons color={Colors.danger} name="close" size={28} />
                  </Pressable>
                  <Text style={[styles.diamondLabel, { color: theme.text }]}>
                    Từ chối
                  </Text>
                </View>

                {/* Right Button: Approve (Heart) */}
                <View style={[styles.diamondItem, styles.diamondRight]}>
                  <Pressable
                    accessibilityLabel="Approve submission"
                    accessibilityRole="button"
                    onPress={() => completeReview('approved')}
                    style={({ pressed }) => [
                      styles.diamondButton,
                      styles.approveButton,
                      pressed && styles.circleButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons color="#FFFFFF" name="heart" size={28} />
                  </Pressable>
                  <Text style={[styles.diamondLabel, { color: theme.text }]}>
                    Đồng ý
                  </Text>
                </View>

                {/* Bottom Button: Report */}
                <View style={[styles.diamondItem, styles.diamondBottom]}>
                  <Pressable
                    accessibilityLabel="Report submission"
                    accessibilityRole="button"
                    onPress={() => setActiveSheet('report')}
                    style={({ pressed }) => [
                      styles.diamondButton,
                      styles.neutralDiamondButton,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      pressed && styles.circleButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons color={theme.textSecondary} name="flag-outline" size={22} />
                  </Pressable>
                  <Text style={[styles.diamondLabel, { color: theme.text }]}>
                    Báo cáo
                  </Text>
                </View>
              </View>

              {/* Undo Action (Subtle under the buttons) */}
              {reviewHistory.length > 0 && !recheckingSubmission ? (
                <Pressable
                  accessibilityLabel="Undo last review action"
                  onPress={undoLastAction}
                  style={styles.undoRow}
                >
                  <MaterialCommunityIcons color={theme.placeholder} name="undo-variant" size={14} />
                  <Text style={[styles.undoText, { color: theme.placeholder }]}>
                    Undo last action
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.undoSpacer} />
              )}

              {/* Floating Action Button: Question Mark Help Guide */}
              <Pressable
                accessibilityLabel="Hướng dẫn thao tác thẩm định"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsHelpModalVisible(true)}
                style={({ pressed }) => [
                  styles.helpFab,
                  { backgroundColor: theme.primary },
                  pressed && styles.helpFabPressed,
                ]}
              >
                <MaterialCommunityIcons color="#FFFFFF" name="help" size={24} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.completeState}>
            <View style={[styles.completeIcon, { backgroundColor: '#E8F7ED' }]}>
              <MaterialCommunityIcons color="#16803A" name="check" size={36} />
            </View>
            <Text accessibilityLabel="All reviews completed" style={[styles.completeTitle, { color: theme.text }]}>
              All reviews completed
            </Text>
            <Text style={[styles.completeCopy, { color: theme.textSecondary }]}>
              Bạn đã xem xét toàn bộ các biển báo trong hàng đợi.
            </Text>
            {reviewHistory.length > 0 ? (
              <AppButton
                label="Xem tổng kết"
                onPress={() => router.replace('/work/submission-summary')}
                style={styles.completeSummaryButton}
              />
            ) : null}
          </View>
        )}
      </SafeAreaView>

      {/* Image Zoom Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setIsImageZoomed(false)}
        statusBarTranslucent
        transparent
        visible={isImageZoomed}
      >
        <Pressable
          accessibilityLabel="Đóng xem phóng to"
          onPress={() => setIsImageZoomed(false)}
          style={styles.zoomBackdrop}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.zoomSafeArea}>
            <Pressable
              accessibilityLabel="Đóng xem phóng to"
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => setIsImageZoomed(false)}
              style={[
                styles.zoomCloseBtn,
                { top: Math.max(insets.top, 16) + 12 },
              ]}
            >
              <MaterialCommunityIcons color="#FFFFFF" name="close" size={26} />
            </Pressable>
            {submission ? (
              <Image
                contentFit={isSignFocused ? "contain" : "cover"}
                source={submission.image}
                style={[
                  styles.zoomedImage,
                  isSignFocused && { transform: [{ scale: 1.25 }] },
                ]}
              />
            ) : null}
            <Pressable
              accessibilityLabel="Toggle sign focus in fullscreen"
              accessibilityRole="button"
              hitSlop={12}
              onPress={(e) => {
                e.stopPropagation();
                setIsSignFocused((prev) => !prev);
              }}
              style={styles.zoomFocusToggle}
            >
              <MaterialCommunityIcons
                color="#FFFFFF"
                name={isSignFocused ? "target" : "image-filter-center-focus"}
                size={16}
              />
              <Text style={styles.zoomFocusToggleText}>
                {isSignFocused ? "Chế độ: Focus Biển báo" : "Chế độ: Toàn cảnh"}
              </Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>

      {/* Toast */}
      {toast ? (
        <AppToast
          duration={1300}
          key={toast.id}
          message={toast.message}
          onDismiss={() => setToast(undefined)}
          placement="center"
          tone={toast.tone}
        />
      ) : null}

      {/* Decline / Report Bottom Sheet */}
      <ReviewBottomSheet
        declineReason={declineReason}
        declineReasonDetail={declineReasonDetail}
        onChangeDeclineReason={setDeclineReason}
        onChangeDeclineReasonDetail={setDeclineReasonDetail}
        onChangeReportIssueType={setReportIssueType}
        onChangeReportNote={setReportNote}
        onClose={closeSheet}
        onConfirm={activeSheet === 'decline' ? confirmDecline : confirmReport}
        onOpenCatalog={() => setIsCatalogPickerVisible(true)}
        onOpenReport={() => {
          setSelectedRemedySign(undefined);
          setDeclineReason(undefined);
          setDeclineReasonDetail('');
          setActiveSheet('report');
        }}
        onSelectRemedySign={setSelectedRemedySign}
        remedySigns={activeRemedySigns}
        reportIssueType={reportIssueType}
        reportNote={reportNote}
        selectedRemedySign={selectedRemedySign}
        type={activeSheet}
      />

      {/* Report New Sign Type Modal */}
      {submission ? (
        <ReportNewSignTypeModal
          candidateId={submission.id}
          isOpen={isNewSignTypeModalOpen}
          onClose={() => setIsNewSignTypeModalOpen(false)}
          onSubmit={handleConfirmNewSignType}
        />
      ) : null}

      {/* Catalog Sign Picker Modal */}
      <RevalidationSignPickerModal
        onClose={() => setIsCatalogPickerVisible(false)}
        onSelectSign={(sign) => {
          setSelectedRemedySign({
            id: sign.id,
            signCode: sign.signCode,
            nameVi: sign.nameVi,
            nameEn: sign.nameEn,
            imageUrl: sign.representativeImageKey,
          });
          setDeclineReason(undefined);
          setDeclineReasonDetail('');
          setIsCatalogPickerVisible(false);
        }}
        selectedSignId={selectedRemedySign?.id}
        title="Chọn biển báo thay thế từ danh mục"
        visible={isCatalogPickerVisible}
      />

      {/* Review Instruction Modal */}
      <ReviewInstructionModal
        isHelpModalVisible={isHelpModalVisible}
        setIsHelpModalVisible={setIsHelpModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressSection: {
    paddingHorizontal: Spacing.two,
    paddingTop: 4,
    paddingBottom: 4,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  topBarSpacer: {
    width: 36,
    height: 36,
  },
  progressTrackWrapper: {
    flex: 1,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressCounterRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  progressCounterText: {
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.one,
    position: 'relative',
  },
  mainCard: {
    width: '88%',
    maxWidth: 324,
    height: '100%',
    maxHeight: 380,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  mainCardOffset: {
    transform: [{ translateX: -12 }],
  },
  peekCard: {
    position: 'absolute',
    width: '88%',
    maxWidth: 324,
    height: '100%',
    maxHeight: 380,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
    transform: [{ translateX: 22 }, { scale: 0.94 }],
    opacity: 0.82,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  peekDimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInnerPressable: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  focusToggleBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 12,
  },
  focusToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.body,
  },
  zoomFocusToggle: {
    position: 'absolute',
    bottom: 34,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 20,
  },
  zoomFocusToggleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  swipeBadge: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  swipeBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  approveBadge: {
    top: 24,
    left: 20,
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    transform: [{ rotate: '-14deg' }],
  },
  declineBadge: {
    top: 24,
    right: 20,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    transform: [{ rotate: '14deg' }],
  },
  skipBadge: {
    bottom: 24,
    alignSelf: 'center',
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
  },
  reportBadge: {
    top: 24,
    alignSelf: 'center',
    borderColor: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusBadgeLabel: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signInfoBox: {
    width: '88%',
    maxWidth: 324,
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoBoxTitle: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  infoBoxSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 2,
  },
  zoomButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
    width: '100%',
  },
  helpFab: {
    position: 'absolute',
    right: 16,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  helpFabPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.88,
  },
  diamondContainer: {
    width: 168,
    height: 196,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  diamondItem: {
    position: 'absolute',
    width: 54,
    alignItems: 'center',
  },
  diamondButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondTop: {
    top: 0,
    left: 57,
  },
  diamondBottom: {
    top: 114,
    left: 57,
  },
  diamondLeft: {
    left: 0,
    top: 57,
  },
  diamondRight: {
    right: 0,
    top: 57,
  },
  diamondLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    width: 76,
    letterSpacing: 0.2,
  },
  circleButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.88,
  },
  neutralDiamondButton: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  declineButton: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  approveButton: {
    backgroundColor: Colors.primary,
    shadowColor: '#FF4767',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 7,
  },
  undoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  undoText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  undoSpacer: {
    height: 30,
  },
  checkedReviewFooter: {
    gap: 10,
    paddingVertical: Spacing.one,
  },
  reviewedStatusBanner: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  reviewedStatusLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '800',
  },
  checkNavRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkNavBtn: {
    flex: 1,
    minHeight: 44,
  },
  completeState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  completeIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    marginBottom: Spacing.one,
  },
  completeTitle: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  completeCopy: {
    maxWidth: 320,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  completeSummaryButton: {
    minWidth: 200,
    marginTop: Spacing.two,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheetPositioner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: Rounded.lg,
    borderTopRightRadius: Rounded.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 34,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    marginTop: Spacing.one,
  },
  sheetHeader: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.half,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
  },
  sheetCloseButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sheetBody: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  sheetBodyScroll: {
    flexShrink: 1,
  },
  sheetHelper: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  reasonList: {
    gap: 6,
  },
  reasonOption: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
  },
  reasonLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  radio: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonInputGroup: {
    gap: Spacing.half,
  },
  inputLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  reasonInput: {
    height: 88,
    minHeight: 88,
    maxHeight: 88,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  reportHelper: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: Spacing.one,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
  sheetFooterButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
  },
  skeletonContainer: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  skeletonBlock: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonCard: {
    width: '88%',
    maxWidth: 324,
    height: 300,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  skeletonInfoBox: {
    height: 48,
    width: '88%',
    maxWidth: 324,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginVertical: 6,
  },
  skeletonDiamond: {
    width: 168,
    height: 196,
    position: 'relative',
    alignSelf: 'center',
    marginVertical: Spacing.two,
  },
  skeletonCircleButton: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E2E8F0',
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  zoomSafeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 999,
    elevation: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomedImage: {
    width: '100%',
    height: '85%',
  },
  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  inlineBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '800',
  },
  detectedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 103, 0.08)',
  },
  detectedBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  remediesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    columnGap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  remedyCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  remedyImageWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  remedyImage: {
    width: 56,
    height: 56,
  },
  remedyCheckBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  remedyCode: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  remedyName: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  catalogSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  catalogSelectedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  catalogSelectedBadge: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  catalogChangeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  catalogChangeButtonText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  noOptionContainer: {
    marginTop: 6,
    marginBottom: 16,
    gap: 12,
  },
  noOptionHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  noOptionLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  srOnlyText: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  catalogPickerTriggerButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  declineReasonsSection: {
    marginTop: 4,
    gap: 8,
  },
  declineReasonsTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  declineReasonsList: {
    gap: 6,
  },
  declineReasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  declineReasonChipText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  reasonDetailInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    fontFamily: Fonts.body,
    minHeight: 56,
    marginTop: 4,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    marginTop: 8,
    gap: 12,
  },
  reportRowLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  remedyReportButton: {
    minWidth: 100,
    minHeight: 36,
    borderWidth: 1,
  },
});