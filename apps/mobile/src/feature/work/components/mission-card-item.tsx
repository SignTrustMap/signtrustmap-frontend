import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DailyTaskCompletion, WorkMissionRole } from '@/types/dailyTaskType';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MissionCardItemProps {
  completion: DailyTaskCompletion;
  role: WorkMissionRole;
}

function getIconForActivity(
  activityType: string,
  role: WorkMissionRole,
): MaterialIconName {
  const act = (activityType || '').toUpperCase();

  if (act.includes('SURVEY')) {
    return 'camera-outline';
  }
  if (act.includes('REVALIDATION')) {
    return 'map-marker-check-outline';
  }
  if (act.includes('REVIEW') || act.includes('CONSENSUS')) {
    return 'shield-check-outline';
  }
  if (act.includes('VOTE')) {
    return 'vote-outline';
  }
  if (act.includes('NAV')) {
    return 'navigation-variant-outline';
  }
  if (act.includes('HAZARD')) {
    return 'alert-decagram-outline';
  }

  // Role defaults
  if (role === 'surveyor') return 'camera-outline';
  if (role === 'reviewer') return 'shield-check-outline';
  return 'car-outline';
}

export function MissionCardItem({ completion, role }: MissionCardItemProps) {
  const theme = useTheme();
  const router = useRouter();

  const task = completion.dailyTask;
  const progress = Math.min(completion.progress, task.targetCount);
  const target = task.targetCount || 1;
  const percentage = Math.round((progress / target) * 100);
  const isFinished = completion.isCompleted || progress >= target || completion.claimed;

  const icon = getIconForActivity(task.activityType, role);
  const accentColor = theme.primary;

  const handleAction = () => {
    // Quick navigation based on mission type
    const act = (task.activityType || '').toUpperCase();
    if (act.includes('SURVEY')) {
      router.push('/work/new-survey');
    } else if (act.includes('REVALIDATION_EVIDENCE')) {
      router.push('/work/revalidation-map');
    } else if (act.includes('REVIEW')) {
      router.push('/work/submission-review');
    } else if (act.includes('REVALIDATION_VOTE')) {
      router.push('/work/revalidation-review');
    } else if (act.includes('NAV')) {
      router.push('/home');
    } else if (act.includes('HAZARD')) {
      router.push('/work/recorded-signs');
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: isFinished ? '#10B98140' : theme.border,
          borderLeftColor: accentColor,
          borderLeftWidth: 5,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
          <MaterialCommunityIcons color={accentColor} name={icon} size={22} />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
              {task.name}
            </Text>
            <View style={[styles.rewardPill, { backgroundColor: '#F59E0B1A' }]}>
              <MaterialCommunityIcons color="#D97706" name="hand-coin-outline" size={14} />
              <Text style={styles.rewardText}>+{task.rewardCredits} Xu</Text>
            </View>
          </View>

          {task.description ? (
            <Text numberOfLines={2} style={[styles.description, { color: theme.grey }]}>
              {task.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Progress Bar & Actions */}
      <View style={styles.bottomRow}>
        <View style={styles.progressCol}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressCountText, { color: theme.text }]}>
              Tiến độ: <Text style={{ fontFamily: Fonts.sans, fontWeight: '700' }}>{progress}</Text>/{target}
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
                  backgroundColor: isFinished ? '#10B981' : accentColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Action / Completed Status */}
        <View style={styles.actionCol}>
          {isFinished ? (
            <View style={[styles.completedBadge, { backgroundColor: '#10B98118' }]}>
              <MaterialCommunityIcons color="#10B981" name="check-circle" size={16} />
              <Text style={styles.completedText}>Hoàn thành</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleAction}
              style={({ pressed }) => [
                styles.doActionButton,
                {
                  borderColor: theme.border,
                  backgroundColor: pressed ? `${theme.primary}10` : 'transparent',
                },
              ]}
            >
              <Text style={[styles.doActionText, { color: theme.primary }]}>Làm ngay</Text>
              <MaterialCommunityIcons color={theme.primary} name="chevron-right" size={16} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 15,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  rewardText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: '#D97706',
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginTop: 2,
  },
  progressCol: {
    flex: 1,
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCountText: {
    fontFamily: Fonts.body,
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
  actionCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Rounded.md,
  },
  completedText: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    fontSize: 12,
    color: '#10B981',
  },
  doActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  doActionText: {
    fontFamily: Fonts.sans,
    fontWeight: '600',
    fontSize: 12,
  },
});
