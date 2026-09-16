import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { ACCOUNT_ROLES, type AccountRole, useSession } from '@/context/session-provider';
import { useGetReviewQueue } from '@/feature/review/hooks/use-review';
import { useGetMyPendingSubmissions } from '@/feature/upload/hooks/use-survey-submission';
import { WorkActionCard } from '@/feature/work/components/work-action-card';
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
    description: 'Verify traffic signs and report road conditions along your assigned route.',
    icon: 'car-outline',
    label: 'Driver',
  },
  surveyor: {
    description: 'Capture road sign condition and GPS telemetry data from the field.',
    icon: 'camera-outline',
    label: 'Surveyor',
  },
  reviewer: {
    description: 'Check submitted sign records and cast consensus votes before they enter the trusted map.',
    icon: 'shield-check-outline',
    label: 'Reviewer',
  },
};

const driverOnlyRoles: AccountRole[] = ['driver'];

type WorkItem = {
  action: string;
  location: string;
  title: string;
};

const driverJobs: WorkItem[] = [
  {
    action: 'Open driving job',
    location: 'District 1 corridor',
    title: 'Verify signs on assigned route',
  },
];

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

  // Live queries for surveyor and reviewer counts
  const { data: pendingData } = useGetMyPendingSubmissions(Boolean(session));
  const { data: reviewQueue } = useGetReviewQueue({ page: '1', pageSize: '20' }, Boolean(session));

  const draftCount = pendingData?.countsByStatus?.DRAFT ?? 0;
  const pendingSurveyCount = pendingData?.pending ?? 0;
  const reviewQueueTotal = reviewQueue?.total ?? 0;

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
            <Text style={[styles.title, { color: theme.text }]}>Work</Text>
            <Text style={[styles.subtitle, { color: theme.grey }]}>
              Choose a role to view its assigned jobs and tasks.
            </Text>
          </View>

          {/* Role Switcher Tabs */}
          <View
            accessibilityLabel="Work role"
            accessibilityRole="tablist"
            style={[styles.roleSwitcher, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          >
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
                <AppButton
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={role}
                  onPress={() => setActiveRole(role)}
                  pressedOpacity={0.8}
                  style={[
                    styles.roleTab,
                    isActive && [styles.roleTabActive, { borderBottomColor: theme.primary }],
                  ]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons
                    color={isActive ? theme.primary : theme.grey}
                    name={meta.icon}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      { color: isActive ? theme.primary : theme.text },
                    ]}
                  >
                    {meta.label}
                  </Text>

                  {badgeCount !== undefined && badgeCount > 0 ? (
                    <View
                      style={[
                        styles.tabBadge,
                        {
                          backgroundColor: isActive ? theme.primary : `${theme.grey}25`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabBadgeText,
                          { color: isActive ? theme.onPrimary : theme.text },
                        ]}
                      >
                        {badgeCount}
                      </Text>
                    </View>
                  ) : null}
                </AppButton>
              );
            })}
          </View>

          {/* Role Summary */}
          <View style={styles.roleSummary}>
            <Text style={[styles.roleTitle, { color: theme.text }]}>
              {roleMeta[selectedRole].label} Jobs
            </Text>
            <Text style={[styles.roleDescription, { color: theme.grey }]}>
              {roleMeta[selectedRole].description}
            </Text>
          </View>

          {/* Role-Specific Work Actions */}
          {selectedRole === 'surveyor' ? (
            <View style={styles.actionList}>

              <WorkActionCard
                accentColor="#F59E0B"
                count={draftCount}
                icon="file-document-edit-outline"
                label="Draft Submissions"
                onPress={() => router.push('/work/new-survey')}
                subtitle={
                  draftCount > 0
                    ? `${draftCount} recorded sessions on device ready to upload`
                    : 'No pending local recordings'
                }
                urgent={draftCount > 0}
              />

              {/* Standout Action: Pending Submissions */}
              <WorkActionCard
                accentColor="#0671eb"
                count={pendingSurveyCount}
                icon="cloud-upload-outline"
                label="Pending Submissions"
                onPress={() => router.push('/work/survey-history')}
                subtitle={
                  pendingSurveyCount > 0
                    ? `${pendingSurveyCount} sessions awaiting AI processing and detection`
                    : 'All submitted survey recordings processed'
                }
              />

              {/* Standout Action: Revalidation Map */}
              <WorkActionCard
                accentColor="#10B981"
                count={2}
                icon="map-search-outline"
                label="Revalidation Map"
                onPress={() => router.replace('/home')}
                subtitle="View the map to verify reported sign discrepancies"
              />
            </View>
          ) : selectedRole === 'reviewer' ? (
            <View style={styles.actionList}>
              {/* Standout Hero Action for Reviewer: Pending Reviews */}
              <AppButton
                accessibilityLabel="Review pending submissions"
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
                      <Text style={styles.heroTitle}>Pending Reviews</Text>
                      {reviewQueueTotal > 0 ? (
                        <View style={styles.heroBadge}>
                          <Text style={styles.heroBadgeText}>{reviewQueueTotal} NEW</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.heroSubtitle}>
                      {reviewQueueTotal > 0
                        ? `${reviewQueueTotal} candidate signs waiting for your verification vote`
                        : 'Review submitted sign records before they enter the trusted map'}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons color={theme.onPrimary} name="chevron-right" size={24} />
              </AppButton>

              {/* Secondary Standout Action: Sign Catalog */}
              <WorkActionCard
                accentColor="#8B5CF6"
                icon="database-search-outline"
                label="Traffic Sign Catalog"
                onPress={() => router.push('/work/sign-catalog')}
                subtitle="Browse official Vietnamese standard sign codes and classifications"
              />
            </View>
          ) : (
            <View style={styles.driverSection}>
              <View style={[styles.workList, { borderColor: theme.border }]}>
                {driverJobs.map((item) => (
                  <View key={item.title} style={styles.workItem}>
                    <View style={styles.workCopy}>
                      <Text style={[styles.workTitle, { color: theme.text }]}>{item.title}</Text>
                      <Text style={[styles.workLocation, { color: theme.grey }]}>
                        {item.location}
                      </Text>
                    </View>
                    <AppButton
                      label={item.action}
                      onPress={() => router.push('/home')}
                      style={styles.workAction}
                    />
                  </View>
                ))}
              </View>

              {/* Recorded Signs from Livestream */}
              <AppButton
                accessibilityLabel="View signs recorded during livestream"
                onPress={() => router.push('/work/recorded-signs')}
                pressedOpacity={0.88}
                style={[
                  styles.recordedSignsButton,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
                variant="ghost"
              >
                <View style={styles.recordedSignsLeft}>
                  <View style={[styles.recordedSignsIcon, { backgroundColor: '#EF444418' }]}>
                    <MaterialCommunityIcons color="#EF4444" name="video-outline" size={24} />
                  </View>
                  <View style={styles.recordedSignsCopy}>
                    <Text style={[styles.recordedSignsLabel, { color: theme.text }]}>
                      Recorded Signs
                    </Text>
                    <Text style={[styles.recordedSignsSubtitle, { color: theme.grey }]}>
                      Review signs captured from your livestream session
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons color={theme.grey} name="chevron-right" size={22} />
              </AppButton>
            </View>
          )}
        </ScrollView>

        {/* Clean Surveyor Floating Action Button */}
        {selectedRole === 'surveyor' ? (
          <AppButton
            accessibilityLabel="Create new survey record"
            onPress={() => router.push('/work/new-survey')}
            pressedOpacity={0.75}
            style={styles.floatingAction}
          >
            <MaterialCommunityIcons color={theme.onPrimary} name="plus" size={28} />
          </AppButton>
        ) : null}
      </SafeAreaView>
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
    flexDirection: 'row',
    borderRadius: Rounded.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: Spacing.one,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  roleTabActive: {
    backgroundColor: 'rgba(6, 113, 235, 0.05)',
  },
  roleTabText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.round,
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
});
