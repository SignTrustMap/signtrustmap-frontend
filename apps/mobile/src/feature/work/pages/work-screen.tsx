import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Badge } from '@/components/badge';
import { Colors, Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { ACCOUNT_ROLES, type AccountRole, useSession } from '@/context/session-provider';
import { useGetMyReviewerStats, useGetReviewQueue } from '@/feature/review/hooks/use-review';
import { useGetNavigationSessions } from '@/feature/navigation/hooks/use-navigation';
import {
  useGetMyPendingSubmissions,
  useGetMySubmissions,
  useGetMySurveyStats,
} from '@/feature/upload/hooks/use-survey-submission';
import { fetchFirstRevalidationSign } from '@/api/revalidation/revalidation';
import {
  useGetFirstRevalidationSign,
  useGetRevalidationEvidenceQueue,
} from '@/feature/revalidation/hooks/use-revalidation';
import { WorkActionCard } from '@/feature/work/components/work-action-card';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyMissions,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type CurrentRole = 'driver' | 'surveyor' | 'reviewer';

const roleMeta: Record<
  AccountRole,
  {
    description: string;
    icon: MaterialIconName;
    label: string;
  }
> = {
  driver: {
    description: 'Xác minh biển báo giao thông và báo cáo tình trạng đường trên lộ trình của bạn.',
    icon: 'car-outline',
    label: 'Tài xế',
  },
  surveyor: {
    description: 'Thu thập tình trạng biển báo giao thông và dữ liệu đo đạc GPS thực địa.',
    icon: 'camera-outline',
    label: 'Khảo sát',
  },
  reviewer: {
    description: 'Kiểm tra hồ sơ biển báo được gửi lên và bỏ phiếu đồng thuận trước khi đưa vào bản đồ tin cậy.',
    icon: 'shield-check-outline',
    label: 'Thẩm định',
  },
};

const driverOnlyRoles: AccountRole[] = ['driver'];


export function WorkScreen({ currentRole }: { currentRole: CurrentRole }) {
  const router = useRouter();
  const { session } = useSession();
  const theme = useTheme();

  const availableRoles = session
    ? ACCOUNT_ROLES.filter((role) => session.account.roles.includes(role))
    : driverOnlyRoles;

  const [activeRole, setActiveRole] = useState<AccountRole>(currentRole);
  const [prevCurrentRole, setPrevCurrentRole] = useState<CurrentRole>(currentRole);

  if (prevCurrentRole !== currentRole) {
    setPrevCurrentRole(currentRole);
    setActiveRole(currentRole);
  }

  const selectedRole = availableRoles.includes(activeRole) ? activeRole : 'driver';

  const isDriverActive = Boolean(session && selectedRole === 'driver');
  const isSurveyorActive = Boolean(session && selectedRole === 'surveyor');
  const isReviewerActive = Boolean(session && selectedRole === 'reviewer');

  // Live queries for driver, surveyor and reviewer counts run only for their active section
  const { data: driverSessions } = useGetNavigationSessions({ page: 1, pageSize: 1 }, isDriverActive);
  const { data: reviewerStats } = useGetMyReviewerStats(isReviewerActive);
  const { data: pendingData } = useGetMyPendingSubmissions(isSurveyorActive);
  const { data: reviewQueue } = useGetReviewQueue({ page: '1', pageSize: '20' }, isReviewerActive);
  const { data: revalEvidenceQueue } = useGetRevalidationEvidenceQueue(
    { page: 1, pageSize: 1 },
    isReviewerActive,
  );
  const { data: surveyStats } = useGetMySurveyStats(isSurveyorActive);
  const { data: firstRevalSign } = useGetFirstRevalidationSign(undefined, isSurveyorActive);

  const driverSessionsTotal = driverSessions?.total ?? 0;
  const draftCount = pendingData?.countsByStatus?.DRAFT ?? 0;
  const pendingSurveyCount = pendingData?.pending ?? 0;
  const reviewQueueTotal = reviewQueue?.total ?? 0;
  const revalEvidenceCount = revalEvidenceQueue?.total ?? 0;
  const revalidationTaskCount = surveyStats?.revalidationAvailable ?? 0;

  // Missions queries for action card badge and streak indicator
  const { data: completionsData } = useGetMyTaskCompletions();
  const { data: missionsData } = useGetMyMissions();
  const streak = missionsData?.dailyStreak ?? missionsData?.streak?.currentDays ?? 0;

  const incompleteMissionsCount = useMemo(() => {
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, selectedRole));
    const items = matched.length > 0 ? matched : getFallbackMissionsForRole(selectedRole);
    return items.filter((item) => !item.isCompleted && !item.claimed).length;
  }, [completionsData, selectedRole]);

  const activeIndex = availableRoles.indexOf(selectedRole);
  const [switcherWidth, setSwitcherWidth] = useState<number>(0);
  const slideAnimation = useRef(new Animated.Value(activeIndex >= 0 ? activeIndex : 0)).current;

  const tabWidth = switcherWidth > 0 && availableRoles.length > 0
    ? switcherWidth / availableRoles.length
    : 0;
  const translateX = slideAnimation.interpolate({
    inputRange: availableRoles.map((_, i) => i),
    outputRange: availableRoles.map((_, i) => i * tabWidth),
  });

  const handleOpenRevalidationMap = async () => {
    let targetSign = firstRevalSign;
    if (!targetSign) {
      try {
        targetSign = await fetchFirstRevalidationSign();
      } catch {
        targetSign = null;
      }
    }

    if (targetSign) {
      router.push({
        pathname: '/work/revalidation-map',
        params: {
          autoSelectFirst: 'true',
          selectedSignId: targetSign.id,
          snapLon: String(targetSign.coordinate[0]),
          snapLat: String(targetSign.coordinate[1]),
          snapRequestId: String(Date.now()),
          signJson: JSON.stringify(targetSign),
        },
      });
    } else {
      router.push({
        pathname: '/work/revalidation-map',
        params: {
          autoSelectFirst: 'true',
          snapRequestId: String(Date.now()),
        },
      });
    }
  };

  const { data: mySubmissionsData } = useGetMySubmissions(
    { page: '1', pageSize: '10' },
    isSurveyorActive,
  );

  const pendingSubmissionsList = useMemo(() => {
    return (mySubmissionsData?.items ?? []).filter(
      (item) => !['COMPLETED', 'DRAFT'].includes(item.status),
    );
  }, [mySubmissionsData?.items]);

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

  const onSwitcherLayout = (e: LayoutChangeEvent) => {
    setSwitcherWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Clean Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Công việc</Text>
          </View>

          {/* Role Switcher Tabs */}
          <View
            accessibilityLabel="Vai trò công việc"
            accessibilityRole="tablist"
            onLayout={onSwitcherLayout}
            style={[
              styles.roleSwitcher,
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

            {availableRoles.map((role) => {
              const isActive = selectedRole === role;
              const meta = roleMeta[role];
              const badgeCount =
                role === 'surveyor'
                  ? draftCount + pendingSurveyCount
                  : role === 'reviewer'
                    ? reviewQueueTotal
                    : undefined;

              return (
                <Pressable
                  accessibilityLabel={`Vai trò ${meta.label}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={role}
                  onPress={() => setActiveRole(role)}
                  style={({ pressed }) => [
                    styles.roleTab,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={isActive ? "#FFFFFF" : theme.grey}
                    name={meta.icon}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      { color: isActive ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {meta.label}
                  </Text>

                  <Badge
                    count={badgeCount}
                    maxCount={9}
                    size="sm"
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Role Summary */}
          <View style={styles.roleSummary}>
            <Text style={[styles.roleTitle, { color: theme.text }]}>
              Vai trò: {roleMeta[selectedRole].label}
            </Text>
            <Text style={[styles.roleDescription, { color: theme.text }]}>
              {roleMeta[selectedRole].description}
            </Text>
          </View>

          {/* Mission Feature Action Card */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <MaterialCommunityIcons color={theme.primary} name="trophy-outline" size={22} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhiệm vụ</Text>
            </View>
          </View>

          <View style={styles.actionList}>
            <WorkActionCard
              accentColor={theme.primary}
              count={incompleteMissionsCount > 0 ? incompleteMissionsCount : undefined}
              icon="trophy-outline"
              label="Nhiệm vụ & Thử thách"
              onPress={() =>
                router.push({
                  pathname: '/work/missions',
                  params: { role: selectedRole },
                })
              }
              subtitle="Nhiệm vụ hàng ngày, hàng tuần & toàn hệ thống để nhận Xu thưởng"
            />
          </View>

          {/* Section Title: Role-Specific Features / Actions */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <MaterialCommunityIcons color={theme.primary} name="view-grid-outline" size={22} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Chức năng</Text>
            </View>
          </View>

          {/* Role-Specific Work Actions */}
          {selectedRole === 'surveyor' ? (
            <View style={styles.actionList}>
              {/* Standout Action: Pending Submissions */}
              <WorkActionCard
                accentColor={theme.primary}
                count={pendingSurveyCount}
                icon="cloud-upload-outline"
                label="Lịch sử khảo sát"
                onPress={() => {
                  if (pendingSubmissionsList.length === 1) {
                    router.push({
                      pathname: '/work/survey-submission-details',
                      params: { id: pendingSubmissionsList[0].id },
                    });
                  } else {
                    router.push({
                      pathname: '/work/survey-history',
                      params: { filter: 'pending' },
                    });
                  }
                }}
                subtitle={'Lịch sử ghi nhận biển báo đã nộp, duyệt, từ chối'}
              />
              {/* Standout Action: Revalidation Map */}
              <WorkActionCard
                accentColor={theme.primary}
                count={revalidationTaskCount}
                icon="map-search-outline"
                label="Tái xác nhận biển báo"
                onPress={handleOpenRevalidationMap}
                subtitle="Xem bản đồ để kiểm tra các biển báo cần xác nhận lại"
              />
            </View>
          ) : selectedRole === 'reviewer' ? (
            <View style={styles.actionList}>
              {/* Standout Hero Action for Reviewer: Pending Reviews */}
              <AppButton
                accessibilityLabel="Thẩm định các hồ sơ chờ xử lý"
                onPress={() => router.push('/work/submission-review')}
                pressedOpacity={0.9}
                style={styles.heroActionCard}
                variant="primary"
              >
                <View style={styles.heroLeft}>
                  <View style={styles.heroIconCircle}>
                    <MaterialCommunityIcons color={theme.primary} name="shield-check" size={26} />
                  </View>
                  <View style={styles.heroText}>
                    <View style={styles.heroTitleRow}>
                      <Text style={styles.heroTitle}>Thẩm định chờ duyệt</Text>
                      {reviewQueueTotal > 0 ? (
                        <View style={styles.heroBadge}>
                          <Text style={styles.heroBadgeText}>{reviewQueueTotal} MỚI</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.heroSubtitle}>
                      {reviewQueueTotal > 0
                        ? `${reviewQueueTotal} biển báo cần bạn xác minh`
                        : 'Không có biển báo cần xác minh'}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons color={theme.onPrimary} name="chevron-right" size={24} />
              </AppButton>

              {/* Action Card: Pending Revalidation Evidence */}
              <WorkActionCard
                accentColor={theme.primary}
                count={revalEvidenceCount}
                icon="clipboard-check-outline"
                label="Tái thẩm định"
                onPress={() => router.push('/work/revalidation-review')}
                subtitle="Thẩm định minh chứng thực địa từ khảo sát viên và bỏ phiếu đồng thuận"
              />

              {/* Action Card: Reviewer Stats */}
              <WorkActionCard
                accentColor={theme.primary}
                count={reviewerStats?.totalReviews}
                icon="chart-timeline-variant-shimmer"
                label="Thống kê của bạn"
                onPress={() => router.push('/work/reviewer-stats')}
                subtitle={
                  reviewerStats
                    ? `Độ tin cậy: ${Math.round((reviewerStats.reliabilityScore ?? 0) * 100)}% · Tỷ lệ chính xác: ${Math.round((reviewerStats.accuracyRate ?? 0) * 100)}%`
                    : 'Xem độ tin cậy, tỷ lệ chính xác và lịch sử thẩm định của bạn'
                }
              />

              {/* Secondary Standout Action: Sign Catalog */}
              <WorkActionCard
                accentColor={theme.primary}
                icon="database-search-outline"
                label="Tra cứu biển báo giao thông"
                onPress={() => router.push('/work/sign-catalog')}
                subtitle="Tra cứu mã hiệu và phân loại biển báo chuẩn Quy chuẩn Việt Nam"
              />
            </View>
          ) : (
            <View style={styles.actionList}>
              {/* Standout Action: Driver Navigation History */}
              <WorkActionCard
                accentColor={theme.primary}
                count={driverSessionsTotal}
                icon="map-clock-outline"
                label="Lịch sử di chuyển"
                onPress={() => router.push('/work/navigation-history')}
                subtitle="Xem lại các lộ trình và chuyến đi bạn đã điều hướng"
              />

              <WorkActionCard
                accentColor={theme.primary}
                icon="video-outline"
                label="Biển báo đã ghi nhận"
                onPress={() => router.push('/work/recorded-signs')}
                subtitle="Xem lại các biển báo được ghi nhận từ phiên phát trực tiếp của bạn"
              />
            </View>
          )}
        </ScrollView >

        {/* Clean Surveyor Floating Action Button */}
        {
          selectedRole === 'surveyor' ? (
            <AppButton
              accessibilityLabel="Tạo bản ghi khảo sát mới"
              onPress={() => router.push('/work/new-survey')}
              pressedOpacity={0.75}
              style={styles.floatingAction}
            >
              <MaterialCommunityIcons color={theme.onPrimary} name="plus" size={28} />
            </AppButton>
          ) : null
        }
      </SafeAreaView >
    </View >
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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: 110,
  },
  header: {
    gap: Spacing.half,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  roleSwitcher: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.round,
    borderWidth: 1,
    overflow: 'hidden',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: Rounded.round,
    zIndex: 0,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    paddingHorizontal: Spacing.one,
    borderRadius: Rounded.round,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  roleTabText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  tabBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '800',
  },
  roleSummary: {
    gap: Spacing.half,
  },
  roleTitle: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  roleDescription: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionTitle: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    fontSize: 18,
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
  actionList: {
    gap: Spacing.three,
  },
  heroActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Rounded.lg,
    shadowColor: '#0671eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  heroTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  heroSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  heroBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.round,
  },
  heroBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '800',
    color: '#854D0E',
  },
  floatingAction: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0671eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  workList: {
    borderTopWidth: 1,
  },
  workItem: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  workCopy: {
    gap: Spacing.half,
  },
  workTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  workLocation: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  workAction: {
    alignSelf: 'flex-start',
  },
  driverSection: {
    gap: Spacing.three,
  },
  recordedSignsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  recordedSignsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  recordedSignsIcon: {
    width: 48,
    height: 48,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordedSignsCopy: {
    flex: 1,
    gap: 2,
  },
  recordedSignsLabel: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  recordedSignsSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  pendingPreviewSection: {
    gap: Spacing.one,
    marginTop: Spacing.half,
    marginBottom: Spacing.one,
  },
  pendingPreviewTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: Spacing.half,
  },
  pendingPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  pendingPreviewIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPreviewText: {
    flex: 1,
    gap: 2,
  },
  pendingPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  pendingPreviewName: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  pendingPreviewStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  pendingPreviewStatusText: {
    color: '#2563EB',
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '700',
  },
  pendingPreviewSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
});
