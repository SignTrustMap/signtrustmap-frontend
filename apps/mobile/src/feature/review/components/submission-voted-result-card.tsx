import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/button';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ReviewActionType } from '../context/review-workflow-provider';

export type SubmissionVotedResultCardProps = {
  displayedReviewAction?: ReviewActionType;
  onFixResult: () => void;
  onKeepResult: () => void;
  testIDPrefix?: string;
};

export function SubmissionVotedResultCard({
  displayedReviewAction = 'skipped',
  onFixResult,
  onKeepResult,
  testIDPrefix = '',
}: SubmissionVotedResultCardProps) {
  const theme = useTheme();

  const isApproved = displayedReviewAction === 'approved';
  const isDeclined = displayedReviewAction === 'declined';
  const isReported =
    displayedReviewAction === 'reported' || displayedReviewAction === 'reported_new_sign';

  const actionColor = isApproved
    ? '#16803A'
    : isDeclined
      ? Colors.danger
      : isReported
        ? Colors.warning
        : Colors.placeholder;

  const bgAlpha = isApproved
    ? 'rgba(22, 128, 58, 0.12)'
    : isDeclined
      ? 'rgba(239, 68, 68, 0.12)'
      : isReported
        ? 'rgba(245, 158, 11, 0.12)'
        : 'rgba(100, 116, 139, 0.12)';

  const iconName: keyof typeof MaterialCommunityIcons.glyphMap = isApproved
    ? 'check-circle'
    : isDeclined
      ? 'close-circle'
      : isReported
        ? 'alert-circle'
        : 'arrow-up-circle';

  const title = isApproved
    ? 'ĐÃ PHÊ DUYỆT'
    : isDeclined
      ? 'ĐÃ TỪ CHỐI'
      : isReported
        ? 'ĐÃ BÁO CÁO'
        : 'ĐÃ BỎ QUA';

  const description = isApproved
    ? 'Biển báo hợp lệ, sẵn sàng đưa vào bản đồ biển báo tin cậy.'
    : isDeclined
      ? 'Biển báo không chính xác hoặc bị từ chối kiểm tra chất lượng.'
      : isReported
        ? 'Đã gửi báo cáo biển báo cho quản trị viên xem xét.'
        : 'Đã bỏ qua do không thể nhận diện được biển báo.';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: actionColor,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: bgAlpha }]}>
            <MaterialCommunityIcons color={actionColor} name={iconName} size={28} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
              Kết quả đã thẩm định
            </Text>
            <Text style={[styles.title, { color: actionColor }]}>{title}</Text>
          </View>
        </View>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>{description}</Text>
      </View>

      <View style={styles.actionsRow}>
        <AppButton
          accessibilityLabel="Sửa lại kết quả thẩm định"
          label="Sửa kết quả"
          onPress={onFixResult}
          style={styles.actionButton}
          testID={`${testIDPrefix}fix-result-button`}
          variant="primary"
        />
        <AppButton
          accessibilityLabel="Giữ nguyên kết quả và chuyển tiếp"
          label="Giữ nguyên"
          onPress={onKeepResult}
          style={styles.actionButton}
          testID={`${testIDPrefix}keep-result-button`}
          variant="surface"
        />
      </View>
    </View>
  );
}

export type SubmissionEditingBannerProps = {
  onCancel: () => void;
  testID?: string;
};

export function SubmissionEditingBanner({
  onCancel,
  testID = 'cancel-edit-button',
}: SubmissionEditingBannerProps) {
  const theme = useTheme();

  return (
    <View style={styles.banner}>
      <View style={styles.bannerLeft}>
        <MaterialCommunityIcons color={theme.primary} name="pencil" size={16} />
        <Text style={[styles.bannerText, { color: theme.text }]}>
          Chọn kết quả thẩm định mới bên dưới
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Hủy sửa kết quả"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onCancel}
        style={styles.cancelButton}
        testID={testID}
      >
        <Text style={[styles.cancelText, { color: theme.primary }]}>Hủy sửa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: Rounded.lg,
    padding: Spacing.two,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  subLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 16,
    fontWeight: '800',
  },
  desc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    marginBottom: Spacing.one,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bannerText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
});
