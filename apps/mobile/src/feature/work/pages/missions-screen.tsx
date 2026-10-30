import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  type LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Badge } from '@/components/badge';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { MissionCardItem } from '@/feature/work/components/mission-card-item';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetDailyTasks,
  useGetMyMissions,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';
import type {
  DailyTask,
  DailyTaskCompletion,
  GenericMissionItem,
  WorkMissionRole,
} from '@/types/dailyTaskType';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type MissionTabType = 'daily' | 'weekly' | 'global';

interface TabMeta {
  key: MissionTabType;
  label: string;
  icon: MaterialIconName;
}

const MISSION_TABS: TabMeta[] = [
  {
    key: 'daily',
    label: 'Hàng ngày',
    icon: 'calendar-today',
  },
  {
    key: 'weekly',
    label: 'Hàng tuần',
    icon: 'calendar-week',
  },
  {
    key: 'global',
    label: 'Chung',
    icon: 'earth',
  },
];

interface MissionsScreenProps {
  initialRole?: WorkMissionRole;
}

export function MissionsScreen({ initialRole = 'driver' }: MissionsScreenProps) {
  const router = useRouter();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<MissionTabType>('daily');

  // Queries
  const {
    data: completionsData,
    isLoading: isLoadingCompletions,
    refetch: refetchCompletions,
    isRefetching: isRefetchingCompletions,
  } = useGetMyTaskCompletions();

  const {
    data: dailyTasksData,
    isLoading: isLoadingDailyTasks,
    refetch: refetchDailyTasks,
    isRefetching: isRefetchingDailyTasks,
  } = useGetDailyTasks();

  const {
    data: missionsData,
    isLoading: isLoadingMissions,
    refetch: refetchMissions,
    isRefetching: isRefetchingMissions,
  } = useGetMyMissions();

  const isRefreshing =
    isRefetchingCompletions || isRefetchingDailyTasks || isRefetchingMissions;

  const handleRefresh = () => {
    refetchCompletions();
    refetchDailyTasks();
    refetchMissions();
  };

  const streak = missionsData?.dailyStreak ?? missionsData?.streak?.currentDays ?? 0;

  // Extract all daily tasks defined in BE catalog
  const backendTasks = useMemo<DailyTask[]>(() => {
    if (Array.isArray(dailyTasksData)) {
      return dailyTasksData;
    }
    if (dailyTasksData && Array.isArray((dailyTasksData as any).tasks)) {
      return (dailyTasksData as any).tasks;
    }
    return [];
  }, [dailyTasksData]);

  // Extract task completions from BE
  const backendCompletions = useMemo<DailyTaskCompletion[]>(() => {
    if (Array.isArray(completionsData) && completionsData.length > 0) {
      return completionsData;
    }
    if (dailyTasksData && Array.isArray((dailyTasksData as any).completions)) {
      return (dailyTasksData as any).completions;
    }
    return [];
  }, [completionsData, dailyTasksData]);

  // Merge real BE tasks with user's completion progress for current role
  const dailyRoleTasks = useMemo<DailyTaskCompletion[]>(() => {
    const today = new Date().toISOString().split('T')[0];

    const matchedTasks = backendTasks.filter((task) => isTaskForRole(task, initialRole));
    const matchedCompletions = backendCompletions.filter((item) =>
      item.dailyTask ? isTaskForRole(item.dailyTask, initialRole) : true
    );

    // 1. If BE provides the daily tasks catalog, map each task with its completion status
    if (matchedTasks.length > 0) {
      return matchedTasks.map((task) => {
        const found = matchedCompletions.find((c) => c.dailyTaskId === task.id);
        if (found) {
          return found;
        }
        return {
          id: `task-${task.id}`,
          userId: 'me',
          dailyTaskId: task.id,
          completionDate: today,
          progress: 0,
          isCompleted: false,
          claimed: false,
          claimedAt: null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          dailyTask: task,
        };
      });
    }

    // 2. If completions are provided directly without task catalog
    if (matchedCompletions.length > 0) {
      return matchedCompletions;
    }

    // 3. Graceful fallback when BE data is offline or not yet configured
    return getFallbackMissionsForRole(initialRole);
  }, [backendTasks, backendCompletions, initialRole]);

  // Construct weekly missions from BE
  const weeklyMissions = useMemo<GenericMissionItem[]>(() => {
    // 1. If backend returns an array of weekly missions
    if (Array.isArray(missionsData?.weeklyMissions) && missionsData.weeklyMissions.length > 0) {
      return missionsData.weeklyMissions.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        progress: item.progress,
        targetCount: item.targetCount,
        rewardCredits: item.rewardCredits,
        isCompleted: item.isCompleted,
        claimed: item.claimed,
        periodLabel: 'Hàng tuần',
      }));
    }

    // 2. Standard OpenAPI weekly mission object from GET /daily-tasks/missions/me
    const weeklyBackend = missionsData?.weekly;
    if (weeklyBackend) {
      const completedMissions = weeklyBackend.completedMissions ?? 0;
      const target = weeklyBackend.target ?? 5;
      const isCompleted = weeklyBackend.completed ?? completedMissions >= target;

      return [
        {
          id: 'weekly-main-mission',
          code: 'WEEKLY_GOAL',
          title: weeklyBackend.title || 'Hoàn thành nhiệm vụ tuần',
          description:
            weeklyBackend.description ||
            `Hoàn thành ${target} nhiệm vụ đóng góp hợp lệ từ Thứ Hai đến Chủ Nhật.`,
          progress: completedMissions,
          targetCount: target,
          rewardCredits: weeklyBackend.bonusCredits ?? 50,
          isCompleted,
          claimed: weeklyBackend.bonusGranted,
          activityType: 'DAILY_TASK_REWARD',
          actionUrl: '/work',
          periodLabel: 'Hàng tuần',
        },
      ];
    }

    return [];
  }, [missionsData?.weekly, missionsData?.weeklyMissions]);

  // Construct global / system missions dynamically from BE
  const globalMissions = useMemo<GenericMissionItem[]>(() => {
    const items: GenericMissionItem[] = [];

    // 1. Dynamic missions from backend: missionsData.daily.missions
    const backendDailyMissions = missionsData?.daily?.missions ?? [];
    backendDailyMissions.forEach((m, idx) => {
      items.push({
        id: `be-global-${m.code || idx}`,
        code: m.code,
        title: m.title,
        description: m.description,
        progress: m.progress ?? 0,
        targetCount: m.target ?? 1,
        rewardCredits: m.rewardCredits ?? 10,
        isCompleted: Boolean(m.completed || (m.progress ?? 0) >= (m.target ?? 1)),
        claimed: m.rewardGranted,
        activityType: m.code?.includes('SIGN') || m.code?.includes('VERIFY')
          ? 'REVIEW_VOTE'
          : m.code?.includes('ANOMALY') || m.code?.includes('HAZARD')
            ? 'HAZARD_REPORT'
            : 'DAILY_TASK_REWARD',
        actionUrl: m.code?.includes('SIGN') || m.code?.includes('VERIFY')
          ? '/work/submission-review'
          : m.code?.includes('ANOMALY') || m.code?.includes('HAZARD')
            ? '/work/recorded-signs'
            : '/work',
        periodLabel: 'Chung',
      });
    });

    // 2. Streak milestone from backend: missionsData.streak
    const streakInfo = missionsData?.streak;
    if (streakInfo) {
      const streakDays = streakInfo.currentDays ?? streak;
      const streakTarget = streakInfo.requiredDays ?? 7;

      items.push({
        id: 'global-streak-milestone',
        code: streakInfo.badgeCode || 'STREAK_GOAL',
        title: streakInfo.title || 'Chuỗi đóng góp liên tiếp',
        description:
          streakInfo.description ||
          `Đóng góp liên tục trong ${streakTarget} ngày để nhận huy hiệu danh dự.`,
        progress: Math.min(streakDays, streakTarget),
        targetCount: streakTarget,
        rewardCredits: streakInfo.bonusCredits ?? 50,
        isCompleted: Boolean(streakInfo.badgeEarned || streakDays >= streakTarget),
        activityType: 'DAILY_TASK_REWARD',
        actionUrl: '/work',
        periodLabel: 'Chung',
      });
    }

    return items;
  }, [missionsData, streak]);

  // Tab Badge counts: number of incomplete missions
  const dailyPendingCount = dailyRoleTasks.filter((t) => !t.isCompleted && !t.claimed).length;
  const weeklyPendingCount = weeklyMissions.filter((m) => !m.isCompleted).length;
  const globalPendingCount = globalMissions.filter((m) => !m.isCompleted).length;

  const tabBadgeCounts: Record<MissionTabType, number> = {
    daily: dailyPendingCount,
    weekly: weeklyPendingCount,
    global: globalPendingCount,
  };

  // Animated sliding pill indicator (identical logic to Role Switcher)
  const activeIndex = MISSION_TABS.findIndex((tab) => tab.key === activeTab);
  const [switcherWidth, setSwitcherWidth] = useState<number>(0);
  const [slideAnimation] = useState(() => new Animated.Value(activeIndex >= 0 ? activeIndex : 0));

  const tabWidth =
    switcherWidth > 0 && MISSION_TABS.length > 0 ? switcherWidth / MISSION_TABS.length : 0;

  const translateX = slideAnimation.interpolate({
    inputRange: MISSION_TABS.map((_, i) => i),
    outputRange: MISSION_TABS.map((_, i) => i * tabWidth),
  });

  useEffect(() => {
    if (activeIndex >= 0) {
      Animated.spring(slideAnimation, {
        toValue: activeIndex,
        useNativeDriver: true,
        bounciness: 4,
        speed: 18,
      }).start();
    }
  }, [activeIndex, slideAnimation]);

  // Duolingo-style flame pop animation every time the screen loads
  const [flameScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(100),
      Animated.spring(flameScale, {
        toValue: 1.25,
        friction: 3,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.spring(flameScale, {
        toValue: 1.0,
        friction: 4,
        tension: 30,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [flameScale]);

  const onSwitcherLayout = (e: LayoutChangeEvent) => {
    setSwitcherWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Top Header */}
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <AppButton
            accessibilityLabel="Quay lại trang Công việc"
            onPress={() => router.back()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>
          <View style={styles.topBarCenter}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Nhiệm vụ & Thử thách</Text>
            <Text style={[styles.screenSubtitle, { color: theme.grey }]}>
              Hoàn thành để nhận thêm Xu thưởng vào ví
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[theme.primary]}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Dedicated Duolingo-style Streak Card */}
          <View
            style={[
              styles.streakCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: '#F59E0B40',
              },
            ]}
          >
            <View style={styles.streakTopRow}>
              <View
                style={[
                  styles.flameCircle,
                  { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                ]}
              >
                <Animated.View style={{ transform: [{ scale: flameScale }] }}>
                  <Text style={styles.flameEmoji}>🔥</Text>
                </Animated.View>
              </View>

              <View style={styles.streakTextCol}>
                <View style={styles.streakHeaderRow}>
                  <Text style={[styles.streakNumberTitle, { color: theme.text }]}>
                    Chuỗi {streak} ngày
                  </Text>
                  <View style={[styles.streakBadgePill, { backgroundColor: '#F59E0B18' }]}>
                    <MaterialCommunityIcons color="#D97706" name="shield-star" size={13} />
                    <Text style={styles.streakBadgePillText}>Mục tiêu 7 ngày</Text>
                  </View>
                </View>
                <Text style={[styles.streakSubText, { color: theme.grey }]}>
                  {streak >= 7
                    ? 'Bạn đã đạt mốc 7 ngày liên tiếp! Tiếp tục duy trì để nhận huy hiệu cao hơn.'
                    : 'Đóng góp mỗi ngày để duy trì ngọn lửa và mở khóa phần thưởng lớn!'}
                </Text>
              </View>
            </View>

            {/* Duolingo-style 7-day mini tracker dots */}
            <View style={[styles.weekTracker, { borderTopColor: theme.border }]}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dayLabel, idx) => {
                const currentDayIdx = (new Date().getDay() + 6) % 7; // 0 for Mon, 6 for Sun
                const isPastOrToday = idx <= currentDayIdx;
                const isToday = idx === currentDayIdx;
                const hasStreak = isPastOrToday && currentDayIdx - idx < streak;

                return (
                  <View key={dayLabel} style={styles.dayCol}>
                    <Text
                      style={[
                        styles.dayLabel,
                        {
                          color: isToday ? '#D97706' : theme.grey,
                          fontWeight: isToday ? '700' : '500',
                        },
                      ]}
                    >
                      {dayLabel}
                    </Text>
                    <View
                      style={[
                        styles.dayDot,
                        hasStreak
                          ? { backgroundColor: '#F59E0B', borderColor: '#D97706' }
                          : isToday
                            ? {
                              backgroundColor: '#FEF3C7',
                              borderColor: '#F59E0B',
                              borderWidth: 2,
                            }
                            : { backgroundColor: `${theme.grey}20`, borderColor: 'transparent' },
                      ]}
                    >
                      {hasStreak ? (
                        <MaterialCommunityIcons color="#FFFFFF" name="check" size={11} />
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Tab Filter Switcher (Matching Role Switcher Style) */}
          <View
            accessibilityLabel="Phân loại nhiệm vụ"
            accessibilityRole="tablist"
            onLayout={onSwitcherLayout}
            style={[
              styles.tabSwitcher,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            {/* The Sliding Pill Indicator */}
            {tabWidth > 0 ? (
              <Animated.View
                style={[
                  styles.slidingIndicator,
                  {
                    width: tabWidth,
                    transform: [{ translateX }],
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            ) : null}

            {MISSION_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const pendingCount = tabBadgeCounts[tab.key];

              return (
                <Pressable
                  accessibilityLabel={`Tab ${tab.label}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={({ pressed }) => [
                    styles.tabButton,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={isActive ? '#FFFFFF' : theme.grey}
                    name={tab.icon}
                    size={18}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      { color: isActive ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {tab.label}
                  </Text>

                  <Badge
                    count={pendingCount}
                    size="sm"
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Tab Explanation Banner */}
          <View style={[styles.tabDescriptionRow, { borderColor: theme.border }]}>
            <MaterialCommunityIcons
              color={theme.primary}
              name={
                activeTab === 'daily'
                  ? 'clock-outline'
                  : activeTab === 'weekly'
                    ? 'calendar-check-outline'
                    : 'trophy-award'
              }
              size={18}
            />
            <Text style={[styles.tabDescriptionText, { color: theme.grey }]}>
              {activeTab === 'daily'
                ? 'Nhiệm vụ làm mới vào 00:00 mỗi ngày theo vai trò hiện tại của bạn.'
                : activeTab === 'weekly'
                  ? 'Nhiệm vụ hàng tuần đặt lại vào thứ Hai lúc 00:00 (UTC+7).'
                  : 'Nhiệm vụ toàn hệ thống và các cột mốc chuỗi đóng góp cộng đồng.'}
            </Text>
          </View>

          {/* Mission Card List */}
          <View style={styles.missionList}>
            {activeTab === 'daily' ? (
              isLoadingDailyTasks && dailyRoleTasks.length === 0 ? (
                <View style={[styles.loadingBox, { backgroundColor: theme.backgroundElement }]}>
                  <ActivityIndicator color={theme.primary} size="small" />
                  <Text style={[styles.loadingText, { color: theme.grey }]}>
                    Đang tải nhiệm vụ hàng ngày...
                  </Text>
                </View>
              ) : dailyRoleTasks.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  <MaterialCommunityIcons color={theme.grey} name="checkbox-marked-circle-outline" size={36} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có nhiệm vụ hàng ngày</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                    Hiện chưa có nhiệm vụ nào cho vai trò này.
                  </Text>
                </View>
              ) : (
                dailyRoleTasks.map((item) => (
                  <MissionCardItem
                    completion={item}
                    key={item.id || item.dailyTaskId}
                    role={initialRole}
                  />
                ))
              )
            ) : activeTab === 'weekly' ? (
              isLoadingMissions && weeklyMissions.length === 0 ? (
                <View style={[styles.loadingBox, { backgroundColor: theme.backgroundElement }]}>
                  <ActivityIndicator color={theme.primary} size="small" />
                  <Text style={[styles.loadingText, { color: theme.grey }]}>
                    Đang tải nhiệm vụ tuần...
                  </Text>
                </View>
              ) : weeklyMissions.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}
                >
                  <MaterialCommunityIcons color={theme.grey} name="calendar-blank-outline" size={36} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có nhiệm vụ tuần</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                    Nhiệm vụ tuần mới sẽ mở vào thứ Hai tuần tới.
                  </Text>
                </View>
              ) : (
                weeklyMissions.map((item) => (
                  <MissionCardItem key={item.id} mission={item} role={initialRole} />
                ))
              )
            ) : isLoadingMissions && globalMissions.length === 0 ? (
              <View style={[styles.loadingBox, { backgroundColor: theme.backgroundElement }]}>
                <ActivityIndicator color={theme.primary} size="small" />
                <Text style={[styles.loadingText, { color: theme.grey }]}>
                  Đang tải nhiệm vụ chung...
                </Text>
              </View>
            ) : globalMissions.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <MaterialCommunityIcons color={theme.grey} name="earth" size={36} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có nhiệm vụ chung</Text>
                <Text style={[styles.emptySubtitle, { color: theme.grey }]}>
                  Bạn đã hoàn thành tất cả nhiệm vụ hệ thống.
                </Text>
              </View>
            ) : (
              globalMissions.map((item) => (
                <MissionCardItem key={item.id} mission={item} role={initialRole} />
              ))
            )}
          </View>
        </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  backButton: {
    padding: Spacing.one,
  },
  topBarCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  screenTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: '700',
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  streakCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  streakTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flameCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameEmoji: {
    fontSize: 28,
  },
  streakTextCol: {
    flex: 1,
    gap: 2,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakNumberTitle: {
    fontFamily: Fonts.title,
    fontSize: 17,
    fontWeight: '800',
  },
  streakBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Rounded.round,
  },
  streakBadgePillText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  streakSubText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  weekTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: 2,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dayLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11,
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: Rounded.round,
    padding: 4,
    borderWidth: 1,
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: Rounded.round,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  tabButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Rounded.round,
    overflow: 'hidden',
  },
  tabBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '800',
  },
  tabDescriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  tabDescriptionText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
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
  emptyBox: {
    padding: Spacing.six,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
});
