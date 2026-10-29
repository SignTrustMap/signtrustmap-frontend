import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useClaimDailyTaskReward } from '@/feature/work/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';
import type {
  DailyTaskCompletion,
  GenericMissionItem,
  WorkMissionRole,
} from '@/types/dailyTaskType';

export interface MissionCardItemProps {
  completion?: DailyTaskCompletion;
  mission?: GenericMissionItem;
  role?: WorkMissionRole;
}

export function MissionCardItem({ completion, mission, role = 'driver' }: MissionCardItemProps) {
  const theme = useTheme();
  const router = useRouter();
  const claimMutation = useClaimDailyTaskReward();

  // Normalize data from either DailyTaskCompletion or GenericMissionItem
  const taskName = completion?.dailyTask?.name ?? mission?.title ?? 'Nhiệm vụ đóng góp';
  const progressCount = completion ? completion.progress : (mission?.progress ?? 0);
  const targetCount = completion ? completion.dailyTask?.targetCount : (mission?.targetCount ?? 1);
  const target = targetCount && targetCount > 0 ? targetCount : 1;
  const progress = Math.min(progressCount, target);
  const percentage = Math.round((progress / target) * 100);
  const isFinished = Boolean(
    completion?.isCompleted ||
    completion?.claimed ||
    mission?.isCompleted ||
    mission?.claimed ||
    progress >= target
  );
  const isClaimed = Boolean(completion?.claimed || mission?.claimed);
  const canClaim = Boolean(isFinished && !isClaimed && completion?.dailyTaskId);
  const rewardCredits = completion?.dailyTask?.rewardCredits ?? mission?.rewardCredits ?? 10;

  const handleAction = () => {
    if (mission?.actionUrl) {
      router.push(mission.actionUrl as any);
      return;
    }

    const code = (mission?.code || '').toUpperCase();
    if (code === 'VERIFY_3_SIGNS') {
      router.push('/work/submission-review');
      return;
    }
    if (code === 'APPROVED_ANOMALY_REPORT') {
      router.push('/work/recorded-signs');
      return;
    }
    if (code.includes('STREAK')) {
      router.push('/work');
      return;
    }

    const act = (completion?.dailyTask?.activityType || mission?.activityType || '').toUpperCase();
    if (act.includes('SURVEY')) {
      router.push('/work/new-survey');
    } else if (act.includes('REVALIDATION_EVIDENCE') || act.includes('REVAL_MAP')) {
      router.push('/work/revalidation-map');
    } else if (act.includes('REVIEW') || act.includes('CONSENSUS')) {
      router.push('/work/submission-review');
    } else if (act.includes('REVALIDATION_VOTE')) {
      router.push('/work/revalidation-review');
    } else if (act.includes('NAV') || act.includes('DRIVE')) {
      router.push('/home');
    } else if (act.includes('HAZARD') || act.includes('ANOMALY')) {
      router.push('/work/recorded-signs');
    } else {
      // Default route based on role
      if (role === 'surveyor') {
        router.push('/work/new-survey');
      } else if (role === 'reviewer') {
        router.push('/work/submission-review');
      } else {
        router.push('/home');
      }
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      {/* 1. Title Row: Full width, up to 2 lines */}
      <View style={styles.titleRow}>
        <Text
          ellipsizeMode="tail"
          numberOfLines={2}
          style={[styles.title, { color: theme.text }]}
        >
          {taskName}
        </Text>
      </View>

      {/* 2. Middle Row: Progress bar on left, +Reward Xu on right */}
      <View style={styles.progressRow}>
        <View style={styles.progressCol}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressCountText, { color: theme.text }]}>
              {progress}/{target}
            </Text>
            <Text style={[styles.progressPercentText, { color: theme.grey }]}>
              {percentage}%
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: isFinished ? '#10B981' : theme.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Reward badge next to progress bar */}
        <View style={[styles.rewardPill, { backgroundColor: '#F59E0B1A' }]}>
          <MaterialCommunityIcons color="#D97706" name="hand-coin-outline" size={13} />
          <Text style={styles.rewardText}>+{rewardCredits} Xu</Text>
        </View>
      </View>

      {/* 3. Bottom Row: Claim / Completed / Action button */}
      {canClaim ? (
        <Pressable
          accessibilityLabel={`Nhận ${rewardCredits} Xu thưởng cho nhiệm vụ ${taskName}`}
          accessibilityRole="button"
          disabled={claimMutation.isPending}
          onPress={() => claimMutation.mutate(completion!.dailyTaskId)}
          style={({ pressed }) => [
            styles.claimButton,
            {
              backgroundColor: pressed ? '#D97706' : '#F59E0B',
              opacity: claimMutation.isPending ? 0.7 : 1,
            },
          ]}
        >
          {claimMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons color="#FFFFFF" name="hand-coin" size={16} />
              <Text style={styles.claimButtonText}>Nhận thưởng +{rewardCredits} Xu</Text>
            </>
          )}
        </Pressable>
      ) : isClaimed ? (
        <View
          accessibilityLabel={`Nhiệm vụ ${taskName} đã nhận thưởng`}
          style={[styles.statusButton, { backgroundColor: '#10B98115', borderColor: '#10B98135' }]}
        >
          <MaterialCommunityIcons color="#10B981" name="check-circle" size={16} />
          <Text style={[styles.statusButtonText, { color: '#10B981' }]}>Đã nhận thưởng</Text>
        </View>
      ) : isFinished ? (
        <View
          accessibilityLabel={`Nhiệm vụ ${taskName} đã hoàn thành`}
          style={[styles.statusButton, { backgroundColor: '#10B98115', borderColor: '#10B98135' }]}
        >
          <MaterialCommunityIcons color="#10B981" name="check-circle" size={16} />
          <Text style={[styles.statusButtonText, { color: '#10B981' }]}>Hoàn thành</Text>
        </View>
      ) : (
        <Pressable
          accessibilityLabel={`Làm ngay nhiệm vụ ${taskName}`}
          accessibilityRole="button"
          onPress={handleAction}
          style={({ pressed }) => [
            styles.actionButton,
            {
              borderColor: theme.border,
              backgroundColor: pressed ? `${theme.primary}18` : `${theme.primary}0C`,
            },
          ]}
        >
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>Làm ngay</Text>
          <MaterialCommunityIcons color={theme.primary} name="chevron-right" size={16} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    width: '100%',
  },
  title: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  progressCol: {
    flex: 1,
    gap: 4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCountText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 12,
  },
  progressPercentText: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: Rounded.round,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Rounded.round,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Rounded.round,
  },
  rewardText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: '#D97706',
  },
  statusButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  statusButtonText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 13,
  },
  actionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  actionButtonText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 13,
  },
  claimButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Rounded.md,
  },
  claimButtonText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
