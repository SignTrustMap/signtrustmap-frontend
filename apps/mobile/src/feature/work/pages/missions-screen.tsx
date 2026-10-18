import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { MissionCardItem } from '@/feature/work/components/mission-card-item';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyMissions,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';
import type {
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
    label: 'Toàn cầu',
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
  const { data: completionsData, isLoading: isLoadingCompletions } = useGetMyTaskCompletions();
  const { data: missionsData, isLoading: isLoadingMissions } = useGetMyMissions();

  const streak = missionsData?.dailyStreak ?? missionsData?.streak?.currentDays ?? 1;

  // Filter daily completions for current role
  const dailyRoleTasks = useMemo<DailyTaskCompletion[]>(() => {
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, initialRole));
    if (matched.length > 0) {
      return matched;
    }
    return getFallbackMissionsForRole(initialRole);
  }, [completionsData, initialRole]);

  // Construct weekly missions
  const weeklyMissions = useMemo<GenericMissionItem[]>(() => {
    const weeklyBackend = missionsData?.weekly;
    const completedMissions = weeklyBackend?.completedMissions ?? 0;
    const target = weeklyBackend?.target ?? 5;
    const isCompleted = weeklyBackend?.completed ?? completedMissions >= target;

    return [
      {
        id: 'weekly-main-5',
        code: 'WEEKLY_FIVE_MISSIONS',
        title: weeklyBackend?.title ?? 'Hoàn thành 5 nhiệm vụ trong tuần',
        description:
          weeklyBackend?.description ??
          'Hoàn thành 5 nhiệm vụ đóng góp hợp lệ từ Thứ Hai đến Chủ Nhật.',
        progress: completedMissions,
        targetCount: target,
        rewardCredits: weeklyBackend?.bonusCredits ?? 50,
        isCompleted,
        activityType: 'DAILY_TASK_REWARD',
        actionUrl: '/work',
      },
      {
        id: 'weekly-revalidation-3',
        code: 'WEEKLY_REVAL_3',
        title: 'Tái thẩm định 3 minh chứng thực địa trong tuần',
        description: 'Bỏ phiếu đối soát minh chứng hình ảnh do cộng đồng gửi lên.',
        progress: Math.min(completedMissions > 1 ? 2 : 0, 3),
        targetCount: 3,
        rewardCredits: 35,
        isCompleted: false,
        activityType: 'REVALIDATION_VOTE',
        actionUrl: '/work/submission-review',
      },
      {
        id: 'weekly-nav-5',
        code: 'WEEKLY_NAV_5',
        title: 'Thực hiện 5 hành trình điều hướng an toàn',
        description: 'Bật điều hướng và cập nhật tình trạng giao thông khi lái xe.',
        progress: 2,
        targetCount: 5,
        rewardCredits: 40,
        isCompleted: false,
        activityType: 'NAVIGATION_SESSION',
        actionUrl: '/home',
      },
    ];
  }, [missionsData?.weekly]);

  // Construct global / system missions
  const globalMissions = useMemo<GenericMissionItem[]>(() => {
    const backendDailyMissions = missionsData?.daily?.missions ?? [];
    const verify3 = backendDailyMissions.find((m) => m.code === 'VERIFY_3_SIGNS');
    const anomaly1 = backendDailyMissions.find((m) => m.code === 'APPROVED_ANOMALY_REPORT');
    const streakInfo = missionsData?.streak;

    const streakDays = streakInfo?.currentDays ?? streak;
    const streakTarget = streakInfo?.requiredDays ?? 7;

    return [
      {
        id: 'global-verify-3-signs',
        code: 'VERIFY_3_SIGNS',
        title: verify3?.title ?? 'Xác minh 3 biển báo giao thông hợp lệ',
        description:
          verify3?.description ??
          'Tham gia xác minh 3 biển báo được consensus xác nhận trong ngày.',
        progress: verify3?.progress ?? 0,
        targetCount: verify3?.target ?? 3,
        rewardCredits: verify3?.rewardCredits ?? 20,
        isCompleted: Boolean(verify3?.completed || (verify3?.progress ?? 0) >= 3),
        activityType: 'REVIEW_VOTE',
        actionUrl: '/work/submission-review',
      },
      {
        id: 'global-approved-anomaly',
        code: 'APPROVED_ANOMALY_REPORT',
        title: anomaly1?.title ?? 'Gửi báo cáo bất thường kèm bằng chứng',
        description:
          anomaly1?.description ??
          'Báo cáo sự cố kèm hình ảnh/video được xác nhận qua consensus.',
        progress: anomaly1?.progress ?? 0,
        targetCount: anomaly1?.target ?? 1,
        rewardCredits: anomaly1?.rewardCredits ?? 15,
        isCompleted: Boolean(anomaly1?.completed || (anomaly1?.progress ?? 0) >= 1),
        activityType: 'HAZARD_REPORT',
        actionUrl: '/work/recorded-signs',
      },
      {
        id: 'global-streak-7-days',
        code: 'STREAK_7_DAYS',
        title: streakInfo?.title ?? 'Chuỗi đóng góp 7 ngày liên tiếp',
        description:
          streakInfo?.description ??
          'Đóng góp ít nhất 1 lần mỗi ngày trong 7 ngày liên tiếp để nhận huy hiệu.',
        progress: Math.min(streakDays, streakTarget),
        targetCount: streakTarget,
        rewardCredits: streakInfo?.bonusCredits ?? 50,
        isCompleted: Boolean(streakInfo?.badgeEarned || streakDays >= streakTarget),
        activityType: 'DAILY_TASK_REWARD',
        actionUrl: '/work',
      },
    ];
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
  const slideAnimation = useRef(new Animated.Value(activeIndex >= 0 ? activeIndex : 0)).current;

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
  }, [activeIndex]);

  // Duolingo-style flame pop animation every time the screen loads
  const flameScale = useRef(new Animated.Value(1)).current;

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

                  {pendingCount > 0 ? (
                    <View
                      style={[
                        styles.tabBadge,
                        {
                          backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : `${theme.primary}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabBadgeText,
                          { color: isActive ? '#FFFFFF' : theme.primary },
                        ]}
                      >
                        {pendingCount}
                      </Text>
                    </View>
                  ) : null}
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
              isLoadingCompletions && dailyRoleTasks.length === 0 ? (
                <View style={[styles.loadingBox, { backgroundColor: theme.backgroundElement }]}>
                  <ActivityIndicator color={theme.primary} size="small" />
                  <Text style={[styles.loadingText, { color: theme.grey }]}>
                    Đang tải nhiệm vụ hàng ngày...
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
              ) : (
                weeklyMissions.map((item) => (
                  <MissionCardItem key={item.id} mission={item} role={initialRole} />
                ))
              )
            ) : isLoadingMissions && globalMissions.length === 0 ? (
              <View style={[styles.loadingBox, { backgroundColor: theme.backgroundElement }]}>
                <ActivityIndicator color={theme.primary} size="small" />
                <Text style={[styles.loadingText, { color: theme.grey }]}>
                  Đang tải nhiệm vụ toàn cầu...
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
});
