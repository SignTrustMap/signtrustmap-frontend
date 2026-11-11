import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/button';
import { Colors, Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type {
  CompletedRevalidationReview,
  RevalidationReviewAction,
} from '../context/revalidation-workflow-provider';

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
    label: 'Báo cáo vi phạm',
    summary: 'Minh chứng không hợp lệ hoặc bị báo cáo vi phạm.',
    symbol: '!',
    title: 'ĐÃ BÁO CÁO VI PHẠM',
  },
};

export type RevalidationVotedResultCardProps = {
  onFixResult: () => void;
  onKeepResult: () => void;
  review?: CompletedRevalidationReview;
  testIDPrefix?: string;
};

export function RevalidationVotedResultCard({
  onFixResult,
  onKeepResult,
  review,
  testIDPrefix = 'reval-',
}: RevalidationVotedResultCardProps) {
  const theme = useTheme();

  const actionConfig = review ? revalActionDetails[review.action] : undefined;
  const actionColor = actionConfig?.color ?? theme.primary;
  const actionBgAlpha = actionConfig?.bgAlpha ?? 'rgba(22, 163, 74, 0.12)';
  const actionIcon = actionConfig?.icon ?? 'check-circle';
  const actionTitle = actionConfig?.title ?? 'ĐÃ THẨM ĐỊNH';
  const actionSummary = review?.note
    ? `Ghi chú: ${review.note}`
    : (actionConfig?.summary ?? 'Đã ghi nhận kết quả thẩm định trước đó.');

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
          <View style={[styles.iconBox, { backgroundColor: actionBgAlpha }]}>
            <MaterialCommunityIcons color={actionColor} name={actionIcon} size={28} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
              Kết quả đã đánh giá
            </Text>
            <Text style={[styles.title, { color: actionColor }]}>{actionTitle}</Text>
          </View>
        </View>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>{actionSummary}</Text>
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

export type RevalidationEditingBannerProps = {
  onCancel: () => void;
  testID?: string;
};

export function RevalidationEditingBanner({
  onCancel,
  testID = 'reval-cancel-edit-button',
}: RevalidationEditingBannerProps) {
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
