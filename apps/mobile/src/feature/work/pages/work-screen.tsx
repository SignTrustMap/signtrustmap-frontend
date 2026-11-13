import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Colors, Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { ACCOUNT_ROLES, type AccountRole, useSession } from '@/context/session-provider';
import { DriverWork } from '@/feature/work/components/driver-work';
import { ReviewerWork } from '@/feature/work/components/reviewer-work';
import { SurveyorWork, SurveyorFab } from '@/feature/work/components/surveyor-work';
import { WorkActionCard } from '@/feature/work/components/work-action-card';
import { OfflineMapModal } from '@/components/offline-map-modal';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type CurrentRole = 'driver' | 'surveyor' | 'reviewer';

const roleMeta: Record<
  AccountRole,
  {
    description: string;
    label: string;
  }
> = {
  driver: {
    description: 'Xác minh biển báo giao thông và báo cáo tình trạng đường trên lộ trình của bạn.',
    label: 'Tài xế',
  },
  surveyor: {
    description: 'Đóng góp biển báo giao thông cho cộng đồng cùng sử dụng.',
    label: 'Khảo sát',
  },
  reviewer: {
    description: 'Cùng kiểm tra biển báo được gửi lên và bỏ phiếu trước khi đưa vào bản đồ.',
    label: 'Thẩm định',
  },
};

const driverOnlyRoles: AccountRole[] = ['driver'];

export function WorkScreen({ currentRole }: { currentRole: CurrentRole }) {
  const router = useRouter();
  const { session } = useSession();
  const theme = useTheme();

  const userRoles = session
    ? ACCOUNT_ROLES.filter((role) => session.account.roles.includes(role))
    : driverOnlyRoles;
  const availableRoles = userRoles.length > 0 ? userRoles : driverOnlyRoles;

  const [activeRole, setActiveRole] = useState<AccountRole>(currentRole);
  const [prevCurrentRole, setPrevCurrentRole] = useState<CurrentRole>(currentRole);
  const [isOfflineMapModalOpen, setIsOfflineMapModalOpen] = useState(false);

  if (prevCurrentRole !== currentRole) {
    setPrevCurrentRole(currentRole);
    setActiveRole(currentRole);
  }

  const selectedRole = availableRoles.includes(activeRole) ? activeRole : 'driver';

  // Missions completions for action card badge
  const { data: completionsData } = useGetMyTaskCompletions();

  const incompleteMissionsCount = useMemo(() => {
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, selectedRole));
    const items = matched.length > 0 ? matched : getFallbackMissionsForRole(selectedRole);
    return items.filter((item) => !item.isCompleted && !item.claimed).length;
  }, [completionsData, selectedRole]);

  const activeIndex = availableRoles.indexOf(selectedRole);
  const [switcherWidth, setSwitcherWidth] = useState<number>(0);
  const slideAnimation = useRef(new Animated.Value(activeIndex >= 0 ? activeIndex : 0)).current;

  const hasMultipleRoles = availableRoles.length > 1;

  const tabWidth =
    switcherWidth > 0 && availableRoles.length > 0 ? switcherWidth / availableRoles.length : 0;
  const translateX = slideAnimation.interpolate({
    inputRange: hasMultipleRoles ? availableRoles.map((_, i) => i) : [0, 1],
    outputRange: hasMultipleRoles ? availableRoles.map((_, i) => i * tabWidth) : [0, 0],
  });

  useEffect(() => {
    if (hasMultipleRoles && activeIndex >= 0) {
      Animated.spring(slideAnimation, {
        toValue: activeIndex,
        useNativeDriver: true,
        bounciness: 4,
        speed: 18,
      }).start();
    }
  }, [activeIndex, hasMultipleRoles]);

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
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Công việc</Text>
            </View>
            <AppButton
              accessibilityLabel="Bản đồ ngoại tuyến"
              accessibilityRole="button"
              variant="surface"
              hitSlop={8}
              onPress={() => setIsOfflineMapModalOpen(true)}
              style={[
                styles.headerOfflineBtn,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <MaterialCommunityIcons color={theme.primary} name="map-marker-down" size={20} />
            </AppButton>
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

            {availableRoles.map((role, index) => {
              const isActive = selectedRole === role;
              const isLast = index === availableRoles.length - 1;
              const meta = roleMeta[role];

              return (
                <Pressable
                  accessibilityLabel={`Vai trò ${meta.label}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={role}
                  onPress={() => setActiveRole(role)}
                  style={({ pressed }) => [
                    styles.roleTab,
                    !isLast && {
                      borderRightWidth: 1,
                      borderRightColor: theme.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.roleTabText, { color: isActive ? '#FFFFFF' : theme.text }]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Role Summary */}
          <View style={styles.roleSummary}>
            <Text style={[styles.roleDescription, { color: theme.text }]}>
              {roleMeta[selectedRole].description}
            </Text>
          </View>

          {/* Mission Feature Action Card */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhiệm vụ</Text>
            </View>
          </View>

          <View style={styles.actionList}>
            <WorkActionCard
              accentColor={theme.primary}
              count={incompleteMissionsCount > 0 ? incompleteMissionsCount : undefined}
              icon="trophy-outline"
              label="Nhiệm vụ đóng góp"
              onPress={() =>
                router.push({
                  pathname: '/work/missions',
                  params: { role: selectedRole },
                })
              }
              subtitle="Đóng góp cho cộng đồng và nhận phần thưởng."
            />
          </View>

          {/* Section Title: Role-Specific Features / Actions */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Tính năng khác</Text>
            </View>
          </View>

          {/* Role-Specific Work Actions */}
          {selectedRole === 'surveyor' ? (
            <SurveyorWork onOpenOfflineMap={() => setIsOfflineMapModalOpen(true)} />
          ) : selectedRole === 'reviewer' ? (
            <ReviewerWork />
          ) : (
            <DriverWork />
          )}
        </ScrollView>

        {/* Surveyor Floating Action Button */}
        {selectedRole === 'surveyor' ? <SurveyorFab /> : null}

        <OfflineMapModal
          accessToken={session?.accessToken}
          onClose={() => setIsOfflineMapModalOpen(false)}
          visible={isOfflineMapModalOpen}
        />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerOfflineBtn: {
    width: 40,
    height: 40,
    borderRadius: Rounded.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
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
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  roleTabText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
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
  actionList: {
    gap: Spacing.three,
  },
});
