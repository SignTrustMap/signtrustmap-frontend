import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useBackButton } from '@/hooks/use-back-button';
import { useTheme } from '@/hooks/use-theme';

export type SubmissionCompleteType =
  | 'upload_submission'
  | 'upload_revalidation'
  | 'review_submission'
  | 'review_revalidation'
  | 'generic';

export type SubmissionCompleteScreenProps = {
  count?: number;
  description?: string;
  submissionId?: string;
  submissionStatus?: string;
  title?: string;
  type?: SubmissionCompleteType;
};

export function SubmissionCompleteScreen({
  count: propCount,
  description: propDescription,
  submissionId: propSubmissionId,
  submissionStatus: propSubmissionStatus,
  title: propTitle,
  type: propType,
}: SubmissionCompleteScreenProps = {}) {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    batchSubmissionIds?: string;
    count?: string;
    description?: string;
    message?: string;
    signCode?: string;
    submissionId?: string;
    submissionStatus?: string;
    taskId?: string;
    title?: string;
    type?: string;
  }>();

  useBackButton('/home');

  const resolvedType = (propType ?? params.type ?? 'generic') as SubmissionCompleteType;
  const count = propCount ?? (params.count ? parseInt(params.count, 10) : undefined);
  const submissionId = propSubmissionId ?? params.submissionId;
  const submissionStatus = propSubmissionStatus ?? params.submissionStatus;
  const taskId = params.taskId;
  const signCode = params.signCode;

  // Context-aware defaults based on which workflow completed
  const getWorkflowConfig = () => {
    switch (resolvedType) {
      case 'upload_submission':
        return {
          title: propTitle ?? params.title ?? 'Đã nộp hồ sơ khảo sát',
          description:
            propDescription ??
            params.description ??
            params.message ??
            'Hình ảnh và dữ liệu khảo sát của bạn đã được tải lên thành công và đang được đưa vào hàng đợi xử lý.',
          secondaryLabel: 'Gửi khảo sát khác',
          onSecondary: () => router.replace('/work/new-survey'),
        };
      case 'upload_revalidation':
        return {
          title: propTitle ?? params.title ?? 'Đã gửi minh chứng tái thẩm định',
          description:
            propDescription ??
            params.description ??
            params.message ??
            'Minh chứng thực địa của bạn đã được ghi nhận thành công và sẽ được đưa vào quy trình thẩm định chéo.',
          secondaryLabel: 'Khảo sát thực địa tiếp',
          onSecondary: () => router.replace('/work/revalidation-map'),
        };
      case 'review_submission':
        return {
          title: propTitle ?? params.title ?? 'Hoàn tất thẩm định hồ sơ',
          description:
            propDescription ??
            params.description ??
            params.message ??
            (count
              ? `Đã gửi kết quả thẩm định cho ${count} biển báo thành công.`
              : 'Đã gửi kết quả thẩm định biển báo thành công.'),
          secondaryLabel: 'Thẩm định thêm biển báo',
          onSecondary: () => router.replace('/work/submission-review'),
        };
      case 'review_revalidation':
        return {
          title: propTitle ?? params.title ?? 'Hoàn tất đánh giá minh chứng',
          description:
            propDescription ??
            params.description ??
            params.message ??
            (count
              ? `Đã đánh giá thành công ${count} minh chứng tái thẩm định thực địa.`
              : 'Đã hoàn tất đánh giá các minh chứng tái thẩm định.'),
          secondaryLabel: 'Đánh giá thêm minh chứng',
          onSecondary: () => router.replace('/work/revalidation-review'),
        };
      case 'generic':
      default:
        return {
          title: propTitle ?? params.title ?? 'Hoàn tất tác vụ',
          description:
            propDescription ??
            params.description ??
            params.message ??
            'Dữ liệu của bạn đã được ghi nhận và xử lý thành công trên hệ thống.',
          secondaryLabel: 'Quay lại công việc',
          onSecondary: () => router.replace('/work'),
        };
    }
  };

  const config = getWorkflowConfig();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Success Checkmark Badge */}
          <View
            accessibilityLabel="Hoàn tất tác vụ thành công"
            accessibilityRole="image"
            style={[styles.iconOuterRing, { backgroundColor: `${theme.primary}14` }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons color={theme.onPrimary} name="check" size={44} />
            </View>
          </View>

          {/* Title & Description */}
          <View style={styles.copy}>
            <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {config.description}
            </Text>
          </View>

          {/* Reference Pill / Meta Card */}
          {submissionId ? (
            <View
              style={[
                styles.metaPill,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Mã tham chiếu:{' '}
                <Text style={[styles.metaHighlight, { color: theme.text }]}>
                  {submissionId.slice(0, 8)}
                </Text>
                {submissionStatus ? ` • ${submissionStatus}` : ''}
              </Text>
            </View>
          ) : taskId ? (
            <View
              style={[
                styles.metaPill,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {signCode ? `Biển báo: ${signCode} • ` : ''}
                Mã nhiệm vụ:{' '}
                <Text style={[styles.metaHighlight, { color: theme.text }]}>
                  {taskId.slice(0, 8)}
                </Text>
              </Text>
            </View>
          ) : count !== undefined && count > 0 ? (
            <View
              style={[
                styles.metaPill,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                Tổng số đã xử lý:{' '}
                <Text style={[styles.metaHighlight, { color: theme.primary }]}>
                  {count} mục
                </Text>
              </Text>
            </View>
          ) : null}

          {/* Action Footer */}
          <View style={styles.actionFooter}>
            {/* Primary Button that navigates back to Home */}
            <AppButton
              accessibilityLabel="Quay về trang chủ"
              label="Về trang chủ"
              onPress={() => router.replace('/home')}
              style={styles.homeButton}
              variant="primary"
            />

            {/* Contextual Secondary Button */}
            <AppButton
              accessibilityLabel={config.secondaryLabel}
              label={config.secondaryLabel}
              onPress={config.onSecondary}
              style={styles.secondaryButton}
              variant="surface"
            />
          </View>
        </View>
      </SafeAreaView>
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
  content: {
    width: '100%',
    maxWidth: 480,
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  iconOuterRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 34,
    textAlign: 'center',
  },
  description: {
    maxWidth: 360,
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 22,
    textAlign: 'center',
  },
  metaPill: {
    borderWidth: 1,
    borderRadius: Rounded.round,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginTop: -Spacing.two,
  },
  metaText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 500,
  },
  metaHighlight: {
    fontFamily: Fonts.mono,
    fontWeight: 700,
  },
  actionFooter: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  homeButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: Rounded.md,
  },
  secondaryButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: Rounded.md,
  },
});
