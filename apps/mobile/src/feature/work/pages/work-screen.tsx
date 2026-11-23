import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { ACCOUNT_ROLES, type AccountRole, useSession } from '@/context/session-provider';
import { DriverWork } from '@/feature/work/components/driver-work';
import { ReviewerWork } from '@/feature/work/components/reviewer-work';
import { SurveyorWork, SurveyorFab } from '@/feature/work/components/surveyor-work';
import { OfflineMapModal } from '@/components/offline-map-modal';
import { CreditBalanceCard } from '@/components/credit-balance-card';
import {
  getFallbackMissionsForRole,
  isTaskForRole,
  useGetMyTaskCompletions,
} from '@/feature/work/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';

type CurrentRole = 'driver' | 'surveyor' | 'reviewer';

const roleMeta: Record<
  AccountRole,
  {
    description?: string;
    label: string;
  }
> = {
  driver: {
    label: 'Tài xế',
  },
  surveyor: {
    label: 'Khảo sát',
  },
  reviewer: {
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

  // Missions completions for action badge
  const { data: completionsData } = useGetMyTaskCompletions();

  const incompleteMissionsCount = useMemo(() => {
    const rawList = Array.isArray(completionsData) ? completionsData : [];
    const matched = rawList.filter((item) => isTaskForRole(item.dailyTask, selectedRole));
    const items = matched.length > 0 ? matched : getFallbackMissionsForRole(selectedRole);
    return items.filter((item) => !item.isCompleted && !item.claimed).length;
  }, [completionsData, selectedRole]);

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
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: theme.text }]}
                testID="work-screen-title"
              >
                {roleMeta[selectedRole].label}
              </Text>
            </View>
          </View>

          {/* Role Switcher Tabs */}
          <View
            accessibilityLabel="Vai trò công việc"
            accessibilityRole="tablist"
            style={[
              styles.roleSwitcher,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
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
                  onPress={() => {
                    setActiveRole(role);
                    if (typeof router.setParams === 'function') {
                      router.setParams({ currentRole: role });
                    }
                  }}
                  style={({ pressed }) => [
                    styles.roleTab,
                    isActive && { backgroundColor: theme.primary },
                    !isLast && {
                      borderRightWidth: 1.5,
                      borderRightColor: theme.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[styles.roleTabText, { color: isActive ? theme.onPrimary : theme.text }]}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Role-Specific Work Actions (Section 1: Tính năng khác & Section 2: Nhiệm vụ và tiện ích) */}
          {selectedRole === 'surveyor' ? (
            <SurveyorWork
              incompleteMissionsCount={incompleteMissionsCount}
              onOpenOfflineMap={() => setIsOfflineMapModalOpen(true)}
            />
          ) : selectedRole === 'reviewer' ? (
            <ReviewerWork incompleteMissionsCount={incompleteMissionsCount} />
          ) : (
            <DriverWork incompleteMissionsCount={incompleteMissionsCount} />
          )}

          {/* Credit Balance Card */}
          <CreditBalanceCard />
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
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  roleSwitcher: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Rounded.round,
    borderWidth: 1.5,
    overflow: 'hidden',
    height: 44,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    backgroundColor: 'transparent',
  },
  roleTabText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
  },
  roleSummary: {
    gap: Spacing.half,
  },
  roleDescription: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
