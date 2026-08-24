import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { AppToast } from '@/components/ui/toast';
import { Fonts, Rounded, Spacing, Colors } from '@/constants/theme';
import {
  sampleReviewSubmissions,
  type ReviewSubmission,
} from '@/feature/review/data/sample-submissions';
import { useTheme } from '@/hooks/use-theme';

export type SubmissionReviewState = 'loading' | 'ready' | 'reviewed';

type SubmissionReviewScreenProps = {
  state?: SubmissionReviewState;
};

type ReviewActionType = 'approved' | 'declined' | 'reported';

type CompletedReview = {
  action: ReviewActionType;
  submission: ReviewSubmission;
};

type ReviewSheet = 'decline' | 'report';

const declineReasons = [
  'Poor Image Quality',
  'Incorrect Location',
  'Sign Not Found',
  'Duplicate Submission',
  'Other',
] as const;

type DeclineReason = (typeof declineReasons)[number];


function SkeletonBlock({ style }: { style: object }) {
  return <View style={[styles.skeletonBlock, style]} />;
}

function SubmissionReviewSkeleton() {
  return (
    <View accessibilityLabel="Loading submissions" style={styles.skeletonContent}>
      <SkeletonBlock style={styles.skeletonImage} />
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonTitleRow}>
          <SkeletonBlock style={styles.skeletonTitle} />
          <SkeletonBlock style={styles.skeletonPill} />
        </View>
        <SkeletonBlock style={styles.skeletonLineLong} />
        <SkeletonBlock style={styles.skeletonLineMedium} />
        <SkeletonBlock style={styles.skeletonLineShort} />
      </View>
      <View style={styles.skeletonActions}>
        <View style={styles.skeletonActionRow}>
          <SkeletonBlock style={styles.skeletonThumb} />
          <View style={styles.skeletonActionCopy}>
            <SkeletonBlock style={styles.skeletonLineLong} />
            <SkeletonBlock style={styles.skeletonLineMedium} />
          </View>
        </View>
        <SkeletonBlock style={styles.skeletonDivider} />
        <View style={styles.skeletonActionRow}>
          <SkeletonBlock style={styles.skeletonLargeThumb} />
          <View style={styles.skeletonActionCopy}>
            <SkeletonBlock style={styles.skeletonLineLong} />
            <SkeletonBlock style={styles.skeletonLineMedium} />
          </View>
        </View>
      </View>
    </View>
  );
}

function MetaItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.metaItem}>
      <Text style={[styles.metaLabel, { color: theme.placeholder }]}>{label}</Text>
      <View style={styles.metaValueRow}>
        <Text style={[styles.metaIcon, { color: theme.text }]}>{icon}</Text>
        <Text style={[styles.metaValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function ReviewAction({
  color,
  label,
  onPress,
  style,
  symbol,
  variant = 'outline',
}: {
  color: string;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  symbol: string;
  variant?: 'filled' | 'outline';
}) {
  return (
    <AppButton
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.decisionButton,
        {
          backgroundColor: variant === 'filled' ? color : 'transparent',
          borderColor: color,
        },
        style,
      ]}
      variant="ghost"
    >
      <Text style={[styles.decisionSymbol, { color: variant === 'filled' ? '#FFFFFF' : color }]}>
        {symbol}
      </Text>
      <Text style={[styles.decisionLabel, { color: variant === 'filled' ? '#FFFFFF' : color }]}>
        {label}
      </Text>
    </AppButton>
  );
}

type ReviewBottomSheetProps = {
  declineReason?: DeclineReason;
  declineReasonDetail: string;
  onChangeDeclineReason: (reason: DeclineReason) => void;
  onChangeDeclineReasonDetail: (value: string) => void;
  onChangeReportNote: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  reportNote: string;
  type?: ReviewSheet;
};

function ReviewBottomSheet({
  declineReason,
  declineReasonDetail,
  onChangeDeclineReason,
  onChangeDeclineReasonDetail,
  onChangeReportNote,
  onClose,
  onConfirm,
  reportNote,
  type,
}: ReviewBottomSheetProps) {
  const theme = useTheme();
  const isDecline = type === 'decline';
  const isOther = declineReason === 'Other';
  const canConfirm = isDecline
    ? Boolean(declineReason && (!isOther || declineReasonDetail.trim()))
    : Boolean(reportNote.trim());

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={Boolean(type)}
    >
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close review options" onPress={onClose} style={styles.backdrop} />
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
                {isDecline ? 'Decline Reason' : 'Report Reason'}
              </Text>
              <AppButton
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.sheetCloseButton}
                variant="ghost"
              >
                <Text style={[styles.sheetCloseLabel, { color: theme.text }]}>×</Text>
              </AppButton>
            </View>

            {isDecline ? (
              <ScrollView
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                style={styles.sheetBodyScroll}
              >
                <Text style={[styles.sheetHelper, { color: theme.textSecondary }]}>
                  Please select a reason for declining this submission. This helps improve accuracy.
                </Text>
                <View style={styles.reasonList}>
                  {declineReasons.map((reason) => {
                    const selected = declineReason === reason;

                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        key={reason}
                        onPress={() => onChangeDeclineReason(reason)}
                        style={[
                          styles.reasonOption,
                          {
                            backgroundColor: selected ? theme.backgroundSelected : theme.surface,
                            borderColor: selected ? theme.tertiary : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.reasonLabel, { color: theme.text }]}>{reason}</Text>
                        <View
                          style={[
                            styles.radio,
                            { borderColor: selected ? theme.tertiary : theme.placeholder },
                          ]}
                        >
                          {selected ? <View style={[styles.radioDot, { backgroundColor: theme.tertiary }]} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {isOther ? (
                  <ReasonInput
                    label="Reason"
                    onChangeText={onChangeDeclineReasonDetail}
                    placeholder="Please specify the reason (required)"
                    value={declineReasonDetail}
                  />
                ) : null}
              </ScrollView>
            ) : (
              <ScrollView
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
                style={styles.sheetBodyScroll}
              >
                <ReasonInput
                  label="Note"
                  onChangeText={onChangeReportNote}
                  placeholder="Please specify the reason (required)"
                  value={reportNote}
                />
                <Text style={[styles.reportHelper, { color: theme.placeholder }]}>
                  Your report will be handled by system staff.
                </Text>
              </ScrollView>
            )}

            <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
              <AppButton
                label="Cancel"
                onPress={onClose}
                style={[styles.sheetFooterButton, { borderColor: theme.border }]}
                variant="surface"
              />
              <AppButton
                disabled={!canConfirm}
                label={isDecline ? 'Confirm Decline' : 'Submit Report'}
                onPress={onConfirm}
                style={[
                  styles.sheetFooterButton,
                  { backgroundColor: isDecline ? Colors.danger : theme.tertiary },
                ]}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ReasonInput({
  label,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.reasonInputGroup}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>
        {label} <Text style={{ color: Colors.danger }}>*</Text>
      </Text>
      <TextInput
        accessibilityLabel={`${label}, required`}
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        scrollEnabled
        style={[
          styles.reasonInput,
          { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
        ]}
        textAlignVertical="top"
        value={value}
      />
    </View>
  );
}

export function SubmissionReviewScreen({ state = 'ready' }: SubmissionReviewScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const [pendingSubmissions, setPendingSubmissions] = useState(() =>
    state === 'reviewed' ? sampleReviewSubmissions.slice(1) : sampleReviewSubmissions,
  );
  const [reviewHistory, setReviewHistory] = useState<CompletedReview[]>(() =>
    state === 'reviewed'
      ? [{ action: 'approved', submission: sampleReviewSubmissions[0] }]
      : [],
  );
  const [activeSheet, setActiveSheet] = useState<ReviewSheet>();
  const [declineReason, setDeclineReason] = useState<DeclineReason>();
  const [declineReasonDetail, setDeclineReasonDetail] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'default' | 'success';
  }>();
  const submission = pendingSubmissions[0];
  const reviewPosition = Math.min(
    reviewHistory.length + (submission ? 1 : 0),
    sampleReviewSubmissions.length,
  );

  const completeReview = (action: ReviewActionType) => {
    if (!submission) return;

    setReviewHistory((history) => [...history, { action, submission }]);
    setPendingSubmissions((pending) => pending.slice(1));

    const toastMessages: Record<ReviewActionType, string> = {
      approved: 'Sign approved',
      declined: 'Sign declined',
      reported: 'Sign reported',
    };

    setToast((current) => ({
      id: (current?.id ?? 0) + 1,
      message: toastMessages[action],
      tone: action === 'approved' ? 'success' : 'default',
    }));
  };

  const closeSheet = () => setActiveSheet(undefined);

  const confirmDecline = () => {
    const canDecline = declineReason && (declineReason !== 'Other' || declineReasonDetail.trim());
    if (!canDecline) return;

    completeReview('declined');
    setDeclineReason(undefined);
    setDeclineReasonDetail('');
    closeSheet();
  };

  const confirmReport = () => {
    if (!reportNote.trim()) return;

    completeReview('reported');
    setReportNote('');
    closeSheet();
  };

  const undoLastAction = () => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return;

    setReviewHistory((history) => history.slice(0, -1));
    setPendingSubmissions((pending) => [lastReview.submission, ...pending]);
    setToast(undefined);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border },
          ]}
        >
          <AppButton
            accessibilityLabel="Back to reviewer work"
            hitSlop={Spacing.one}
            onPress={() => router.back()}
            pressedOpacity={0.7}
            style={styles.backButton}
            variant="ghost"
          >
            <SymbolView
              fallback={<Text style={[styles.backFallback, { color: theme.text }]}>{'‹'}</Text>}
              name={{ android: 'arrow_back', ios: 'chevron.left', web: 'arrow_back' }}
              size={22}
              tintColor={theme.text}
            />
          </AppButton>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Submission Review</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: Colors.tertiary,
                width: `${(reviewPosition / sampleReviewSubmissions.length) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={[styles.counterBar, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.counter, { color: theme.textSecondary }]}>
            {submission ? 'REVIEWING' : 'REVIEWED'} {reviewPosition} OF{' '}
            {sampleReviewSubmissions.length}
          </Text>
        </View>

        {state === 'loading' ? (
          <SubmissionReviewSkeleton />
        ) : submission ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.imageCard, { backgroundColor: theme.backgroundElement }]}>
              <Image
                accessibilityLabel={submission.title}
                contentFit="cover"
                source={submission.image}
                style={styles.signImage}
              />
              <AppButton
                accessibilityLabel="Enlarge sign image"
                style={[styles.zoomButton, { backgroundColor: theme.backgroundElement }]}
                variant="surface"
              >
                <SymbolView
                  fallback={<Text style={[styles.zoomFallback, { color: theme.text }]}>+</Text>}
                  name={{ android: 'zoom_in', ios: 'magnifyingglass', web: 'zoom_in' }}
                  size={18}
                  tintColor={theme.text}
                />
              </AppButton>
            </View>

            <View
              style={[
                styles.detailsCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.signTitle, { color: theme.text }]}>{submission.title}</Text>
              <View style={styles.metaGrid}>
                <MetaItem icon="⌖" label="LOCATION" value={submission.location} />
                <MetaItem icon="♙" label="SURVEYOR ID" value={submission.surveyorId} />
                <MetaItem icon="◷" label="CAPTURED" value={submission.captured} />
              </View>
            </View>

            <View style={styles.primaryActions}>
              <ReviewAction
                color={theme.tertiary}
                label="Approve"
                onPress={() => completeReview('approved')}
                symbol="✓"
                variant="filled"
              />
            </View>

            <View style={styles.secondaryActions}>
              <ReviewAction
                color={Colors.danger}
                label="Decline"
                onPress={() => setActiveSheet('decline')}
                style={styles.secondaryButton}
                symbol="×"
              />
              <AppButton
                label="⚑  Report"
                onPress={() => setActiveSheet('report')}
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                textStyle={styles.secondaryButtonLabel}
                variant="surface"
              />
            </View>

            {reviewHistory.length > 0 ? (
              <AppButton
                label="↶  Undo Last Action"
                onPress={undoLastAction}
                style={[styles.undoButton, { borderColor: theme.border }]}
                textStyle={styles.undoLabel}
                variant="surface"
              />
            ) : (
              <Text style={[styles.swipeHint, { color: theme.placeholder }]}>
                SWIPE RIGHT TO APPROVE  •  SWIPE LEFT TO DECLINE
              </Text>
            )}
          </ScrollView>
        ) : (
          <View style={styles.completeState}>
            <View style={[styles.completeIcon, { backgroundColor: theme.backgroundSelected }]}>
              <Text style={[styles.completeIconLabel, { color: theme.tertiary }]}>✓</Text>
            </View>
            <Text style={[styles.completeTitle, { color: theme.text }]}>All reviews completed</Text>
            <Text style={[styles.completeCopy, { color: theme.textSecondary }]}>
              You have reviewed all available sign submissions.
            </Text>
            {reviewHistory.length > 0 ? (
              <AppButton
                label="↶  Undo Last Action"
                onPress={undoLastAction}
                style={[styles.completeUndoButton, { borderColor: theme.border }]}
                textStyle={styles.undoLabel}
                variant="surface"
              />
            ) : null}
          </View>
        )}
      </SafeAreaView>
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
      <ReviewBottomSheet
        declineReason={declineReason}
        declineReasonDetail={declineReasonDetail}
        onChangeDeclineReason={(reason) => {
          setDeclineReason(reason);
          if (reason !== 'Other') setDeclineReasonDetail('');
        }}
        onChangeDeclineReasonDetail={setDeclineReasonDetail}
        onChangeReportNote={setReportNote}
        onClose={closeSheet}
        onConfirm={activeSheet === 'decline' ? confirmDecline : confirmReport}
        reportNote={reportNote}
        type={activeSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.half,
  },
  backButton: {
    width: 48,
    height: 48,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  backFallback: {
    fontFamily: Fonts.body,
    fontSize: 30,
    fontWeight: 500,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 24,
    textAlign: 'center',
  },
  headerSpacer: { width: 48 },
  progressTrack: { height: 3, width: '100%' },
  progressFill: { height: '100%' },
  counterBar: {
    minHeight: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tertiary,
  },
  counter: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    paddingBottom: Spacing.four,
  },
  imageCard: {
    position: 'relative',
    height: 300,
    minHeight: 300,
    maxHeight: 300,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: Rounded.lg,
  },
  signImage: { width: '100%', height: '100%' },
  zoomButton: {
    position: 'absolute',
    right: Spacing.one,
    bottom: Spacing.one,
    width: 38,
    height: 38,
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 3,
  },
  zoomFallback: { fontSize: 20, fontWeight: 700 },
  detailsCard: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    padding: Spacing.three,
  },
  signTitle: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 24,
  },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.three },
  metaItem: { width: '50%', gap: 3, paddingRight: Spacing.one },
  metaLabel: { fontFamily: Fonts.body, fontSize: 9, fontWeight: 800, letterSpacing: 0.65 },
  metaValueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  metaIcon: { width: 12, fontSize: 12, lineHeight: 17 },
  metaValue: { flex: 1, fontFamily: Fonts.body, fontSize: 12, fontWeight: 600, lineHeight: 17 },
  primaryActions: { gap: Spacing.one },
  decisionButton: {
    minHeight: 48,
    flexDirection: 'row',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderRadius: Rounded.md,
    paddingVertical: Spacing.one,
  },
  decisionSymbol: { fontFamily: Fonts.body, fontSize: 19, fontWeight: 800, lineHeight: 21 },
  decisionLabel: { fontFamily: Fonts.body, fontSize: 14, fontWeight: 800 },
  secondaryActions: { flexDirection: 'row', gap: Spacing.one },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    paddingHorizontal: Spacing.half,
    paddingVertical: Spacing.one,
  },
  secondaryButtonLabel: { fontSize: 11, fontWeight: 600 },
  swipeHint: {
    paddingVertical: Spacing.three,
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.65,
  },
  undoButton: { minHeight: 47, borderWidth: 1, marginTop: 2 },
  undoLabel: { fontSize: 13, fontWeight: 700 },
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
  completeIconLabel: { fontFamily: Fonts.body, fontSize: 30, fontWeight: 800 },
  completeTitle: { fontFamily: Fonts.body, fontSize: 20, fontWeight: 800, lineHeight: 26 },
  completeCopy: {
    maxWidth: 320,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
    textAlign: 'center',
  },
  completeUndoButton: {
    width: '100%',
    maxWidth: 360,
    minHeight: 48,
    borderWidth: 1,
    marginTop: Spacing.three,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheetPositioner: { flex: 1, justifyContent: 'flex-end' },
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
  sheetTitle: { flex: 1, fontFamily: Fonts.body, fontSize: 16, fontWeight: 800 },
  sheetCloseButton: {
    width: 44,
    height: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sheetCloseLabel: { fontFamily: Fonts.body, fontSize: 24, fontWeight: 400 },
  sheetBody: { gap: Spacing.three, padding: Spacing.three },
  sheetBodyScroll: { flexShrink: 1 },
  sheetHelper: { fontFamily: Fonts.body, fontSize: 13, fontWeight: 500, lineHeight: 18 },
  reasonList: { gap: 6 },
  reasonOption: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
  },
  reasonLabel: { flex: 1, fontFamily: Fonts.body, fontSize: 13, fontWeight: 700 },
  radio: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  reasonInputGroup: { gap: Spacing.half },
  inputLabel: { fontFamily: Fonts.body, fontSize: 12, fontWeight: 700 },
  reasonInput: {
    height: 92,
    minHeight: 92,
    maxHeight: 92,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  reportHelper: { fontFamily: Fonts.body, fontSize: 11, fontWeight: 500, lineHeight: 16 },
  sheetFooter: {
    flexDirection: 'row',
    gap: Spacing.one,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
  sheetFooterButton: { flex: 1, minHeight: 46, borderWidth: 1 },
  skeletonContent: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  skeletonBlock: { backgroundColor: '#E2E5E8', borderRadius: Rounded.sm },
  skeletonImage: { height: 300, width: '100%', borderRadius: Rounded.lg },
  skeletonCard: {
    height: 132,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: '#D8DEE5',
    borderRadius: Rounded.lg,
    padding: Spacing.three,
  },
  skeletonTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonTitle: { width: '42%', height: 20 },
  skeletonPill: { width: 58, height: 20, borderRadius: 10 },
  skeletonLineLong: { width: '90%', height: 13 },
  skeletonLineMedium: { width: '67%', height: 13 },
  skeletonLineShort: { width: '48%', height: 13 },
  skeletonActions: {
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#D8DEE5',
    borderRadius: Rounded.lg,
    padding: Spacing.three,
  },
  skeletonActionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  skeletonThumb: { width: 24, height: 24 },
  skeletonLargeThumb: { width: 72, height: 72, borderRadius: Rounded.md },
  skeletonActionCopy: { flex: 1, gap: Spacing.one },
  skeletonDivider: { width: '100%', height: 1, borderRadius: 0 },
});
