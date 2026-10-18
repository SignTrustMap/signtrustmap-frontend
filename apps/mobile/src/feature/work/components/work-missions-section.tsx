import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyMissions,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';
import type { DailyTaskCompletion, WorkMissionRole } from '@/types/dailyTaskType';
import { MissionCardItem } from './mission-card-item';

interface WorkMissionsSectionProps {
  role: WorkMissionRole;
}

export function WorkMissionsSection({ role }: WorkMissionsSectionProps) {
  const theme = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: completionsData, isLoading: isLoadingCompletions } = useGetMyTaskCompletions();
  const { data: missionsData } = useGetMyMissions();

  const streak = missionsData?.dailyStreak ?? 1;

  // Filter tasks matching current role, with fallback when empty
  const roleCompletions = useMemo<DailyTaskCompletion[]>(() => {
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, role));

    if (matched.length > 0) {
      return matched;
    }

    // Graceful fallback for initial user experience or when backend has not seeded tasks for the day
    return getFallbackMissionsForRole(role);
  }, [completionsData, role]);

  const completedCount = roleCompletions.filter((item) => item.isCompleted || item.claimed).length;
  const totalCount = roleCompletions.length;

  return (
    <View style={styles.container}>
      {/* Collapsible Header Row */}
      <Pressable
        accessibilityLabel="Thu gọn hoặc mở rộng danh sách nhiệm vụ hôm nay"
        accessibilityRole="button"
        accessibilityState={{ expanded: !isCollapsed }}
        onPress={() => setIsCollapsed((prev) => !prev)}
        style={({ pressed }) => [
          styles.headerRow,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={styles.titleWithIcon}>
          <MaterialCommunityIcons color={theme.primary} name="trophy-outline" size={22} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhiệm vụ hôm nay</Text>
        </View>

        <View style={styles.headerRight}>
          {streak > 0 ? (
            <View style={[styles.streakBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>Chuỗi {streak} ngày</Text>
            </View>
          ) : null}

          <View style={[styles.chevronBox, { backgroundColor: `${theme.primary}12` }]}>
            <MaterialCommunityIcons
              color={theme.primary}
              name={isCollapsed ? 'chevron-down' : 'chevron-up'}
              size={20}
            />
          </View>
        </View>
      </Pressable>

      {/* Subtitle with stats */}
      <View style={styles.subtitleRow}>
        <Text style={[styles.subtitle, { color: theme.grey }]}>
          Hoàn thành để nhận thêm Xu thưởng vào ví
        </Text>
        <Text style={[styles.counterText, { color: theme.primary }]}>
          {completedCount}/{totalCount} Đạt
        </Text>
      </View>

      {/* Body: Collapsible */}
      {!isCollapsed ? (
        isLoadingCompletions && roleCompletions.length === 0 ? (
          <View style={[styles.loadingBox, { backgroundColor: theme.backgroundElement }]}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text style={[styles.loadingText, { color: theme.grey }]}>Đang tải nhiệm vụ...</Text>
          </View>
        ) : (
          <View style={styles.missionList}>
            {roleCompletions.map((item) => (
              <MissionCardItem
                completion={item}
                key={item.id || item.dailyTaskId}
                role={role}
              />
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionTitle: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.round,
    borderWidth: 1,
  },
  streakEmoji: {
    fontSize: 12,
  },
  streakText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: '#B45309',
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  counterText: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 12,
  },
  missionList: {
    gap: Spacing.two,
  },
  loadingBox: {
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
});
