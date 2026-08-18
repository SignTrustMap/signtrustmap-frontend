import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { ACCOUNT_ROLES, type AccountRole, useSession } from '@/context/session-provider';
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

export function WorkScreen() {
  const { session } = useSession();
  const theme = useTheme();
  const availableRoles = session
    ? ACCOUNT_ROLES.filter((role) => session.account.roles.includes(role))
    : driverOnlyRoles;
  const [activeRole, setActiveRole] = useState<AccountRole>('driver');
  const selectedRole = availableRoles.includes(activeRole) ? activeRole : 'driver';
  const workItems = demoWork[selectedRole];

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
                    isActive ? { backgroundColor: theme.tertiary } : undefined,
                  ]}
                  textStyle={{ color: isActive ? theme.onTertiary : theme.text }}
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
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
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
});
