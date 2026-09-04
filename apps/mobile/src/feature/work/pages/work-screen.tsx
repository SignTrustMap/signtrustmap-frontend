import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { ACCOUNT_ROLES, type AccountRole, useSession } from '@/context/session-provider';
import { ReviewerWorkPanel } from '@/feature/review/components/reviewer-work-panel';
import { SurveyorWorkPanel } from '@/feature/upload/components/surveyor-work-panel';
import { useTheme } from '@/hooks/use-theme';

type WorkItem = {
  action: string;
  location: string;
  title: string;
};

const roleLabels: Record<AccountRole, string> = {
  driver: 'Driver',
  reviewer: 'Reviewer',
  surveyor: 'Surveyor',
};

type CurrentRole = 'driver' | 'surveyor' | 'reviewer';

const roleDescriptions: Record<AccountRole, string> = {
  driver: 'Complete driving jobs and verify signs along your assigned route.',
  reviewer: 'Check submitted sign records before they enter the trusted map.',
  surveyor: 'Capture road sign condition and location data from the field.',
};

const driverOnlyRoles: AccountRole[] = ['driver'];

// Temporary local data until the role-specific work APIs are connected.
const demoWork: Record<AccountRole, WorkItem[]> = {
  driver: [
    {
      action: 'Open driving job',
      location: 'District 1 corridor',
      title: 'Verify signs on assigned route',
    },
  ],
  surveyor: [
    {
      action: 'Open survey',
      location: 'Nguyen Hue walking street',
      title: 'Survey roadside signs',
    },
  ],
  reviewer: [
    {
      action: 'Open review',
      location: 'Submitted field records',
      title: 'Review sign observations',
    },
  ],
};

export function WorkScreen({ currentRole }: { currentRole: CurrentRole }) {
  const router = useRouter();
  const { session } = useSession();
  const theme = useTheme();
  const availableRoles = session
    ? ACCOUNT_ROLES.filter((role) => session.account.roles.includes(role))
    : driverOnlyRoles;
  const [activeRole, setActiveRole] = useState<AccountRole>(currentRole);
  const selectedRole = availableRoles.includes(activeRole) ? activeRole : 'driver';
  const workItems = demoWork[selectedRole];

  useEffect(() => {
    // might be redundant, but ensures that the active role is updated if the currentRole prop changes
    setActiveRole(currentRole);
  }, [currentRole]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Work</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Choose a role to view its assigned jobs.
            </Text>
          </View>

          <View
            accessibilityLabel="Work role"
            accessibilityRole="tablist"
            style={[styles.roleSwitcher, { backgroundColor: theme.backgroundElement }]}
          >
            {availableRoles.map((role) => {
              const isActive = selectedRole === role;

              return (
                <AppButton
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={role}
                  label={roleLabels[role]}
                  onPress={() => setActiveRole(role)}
                  style={[
                    styles.roleButton,
                    isActive ? { backgroundColor: theme.primary } : undefined,
                  ]}
                  textStyle={{ color: isActive ? theme.onPrimary : theme.text }}
                  variant="ghost"
                />
              );
            })}
          </View>

          <View style={styles.roleSummary}>
            <Text style={[styles.roleTitle, { color: theme.text }]}>{roleLabels[selectedRole]} jobs</Text>
            <Text style={[styles.roleDescription, { color: theme.textSecondary }]}>
              {roleDescriptions[selectedRole]}
            </Text>
          </View>

          {selectedRole === 'surveyor' ? (
            <SurveyorWorkPanel />
          ) : selectedRole === 'reviewer' ? (
            <ReviewerWorkPanel />
          ) : (
            <View style={[styles.workList, { borderColor: theme.border }]}>
              {workItems.map((item) => (
                <View key={item.title} style={styles.workItem}>
                  <View style={styles.workCopy}>
                    <Text style={[styles.workTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.workLocation, { color: theme.textSecondary }]}>
                      {item.location}
                    </Text>
                  </View>
                  <AppButton label={item.action} style={styles.workAction} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        {selectedRole === 'surveyor' ? (
          <AppButton
            accessibilityLabel="Create new survey record"
            onPress={() => router.push('/work/new-survey')}
            pressedOpacity={0.72}
            style={styles.floatingAction}
          >
            <SymbolView
              fallback={<Text style={[styles.floatingActionFallback, { color: theme.onPrimary }]}>+</Text>}
              name={{ android: 'add', ios: 'plus', web: 'add' }}
              size={26}
              tintColor={theme.onPrimary}
            />
          </AppButton>
        ) : null}
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
    paddingBottom: 96,
  },
  header: {
    gap: Spacing.half,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
  },
  roleSwitcher: {
    flexDirection: 'row',
    gap: Spacing.half,
    borderRadius: Rounded.lg,
    padding: Spacing.half,
  },
  roleButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.one,
  },
  roleSummary: {
    gap: Spacing.half,
  },
  roleTitle: {
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 26,
  },
  roleDescription: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
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
    fontWeight: 800,
    lineHeight: 22,
  },
  workLocation: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 18,
  },
  workAction: {
    alignSelf: 'flex-start',
  },
  floatingAction: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    width: 56,
    height: 56,
    minHeight: 56,
    borderRadius: Rounded.lg,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: '#0C5963',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingActionFallback: {
    fontFamily: Fonts.body,
    fontSize: 30,
    fontWeight: 500,
    lineHeight: 32,
  },
});
