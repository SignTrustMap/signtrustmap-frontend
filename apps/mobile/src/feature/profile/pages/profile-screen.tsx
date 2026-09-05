import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UpdateModal } from '@/components/update-modal';
import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  ACCOUNT_ROLES,
  type AccountRole,
  type OptionalAccountRole,
  useSession,
} from '@/context/session-provider';
import { useAppUpdate } from '@/hooks/use-app-update';
import { useTheme } from '@/hooks/use-theme';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const roleLabels: Record<AccountRole, string> = {
  driver: 'Driver',
  reviewer: 'Reviewer',
  surveyor: 'Surveyor',
};

const roleIcons: Record<AccountRole, MaterialIconName> = {
  driver: 'car-outline',
  reviewer: 'shield-check-outline',
  surveyor: 'map-marker-path',
};

function getInitials(displayName?: string) {
  if (!displayName) return 'ST';

  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function ProfileScreen() {
  const { logOut, session, setRoleEnabled } = useSession();
  const theme = useTheme();
  const {
    checkForUpdates,
    closeModal,
    currentCommit,
    currentVersion,
    errorMessage,
    isModalOpen,
    releaseInfo,
    status,
  } = useAppUpdate();
  const displayName = session?.account.displayName ?? 'SignTrustMap user';
  const email = session?.account.email ?? '';

  return (
    <View style={[styles.screen, { backgroundColor: theme.primary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <View
            pointerEvents="none"
            style={[styles.heroShapeLarge, { backgroundColor: theme.backgroundSelected }]}
          />
          <View
            pointerEvents="none"
            style={[styles.heroShapeSmall, { backgroundColor: theme.secondary }]}
          />

          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <Text style={[styles.title, { color: theme.onPrimary }]}>Profile</Text>

            <View style={styles.identity}>
              <View
                accessibilityLabel={`${displayName} profile picture`}
                style={[
                  styles.avatar,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.onPrimary },
                ]}
              >
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {getInitials(displayName)}
                </Text>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.avatarBadge,
                    { backgroundColor: theme.secondary, borderColor: theme.primary },
                  ]}
                >
                  <MaterialCommunityIcons color={theme.primary} name="account" size={15} />
                </View>
              </View>

              <Text numberOfLines={1} style={[styles.name, { color: theme.onPrimary }]}>
                {displayName}
              </Text>
              <Text numberOfLines={1} style={[styles.email, { color: theme.onPrimary }]}>
                {email}
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={[styles.overviewPanel, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.panelContent}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account overview</Text>

            <View style={styles.profileSummaryRow}>
              <View style={[styles.iconTile, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialCommunityIcons color={theme.primary} name="account-outline" size={22} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>My profile</Text>
                <Text numberOfLines={1} style={[styles.rowDescription, { color: theme.textSecondary }]}>
                  {email}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.subsectionTitle, { color: theme.text }]}>Account roles</Text>
              <Text style={[styles.subsectionDescription, { color: theme.textSecondary }]}>
                Driver access is always included
              </Text>
            </View>

            <View style={styles.roleList}>
              {ACCOUNT_ROLES.map((role) => {
                const isEnabled = session?.account.roles.includes(role) ?? role === 'driver';
                const rowContent = (
                  <>
                    <View style={[styles.iconTile, { backgroundColor: theme.backgroundSelected }]}>
                      <MaterialCommunityIcons
                        color={theme.primary}
                        name={roleIcons[role]}
                        size={22}
                      />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>{roleLabels[role]}</Text>
                      <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                        {role === 'driver' ? 'Navigation access' : `${roleLabels[role]} tools`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isEnabled ? theme.backgroundSelected : theme.background,
                          borderColor: isEnabled ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: isEnabled ? theme.primary : theme.placeholder },
                        ]}
                      >
                        {isEnabled ? 'On' : 'Off'}
                      </Text>
                    </View>
                  </>
                );

                if (role === 'driver') {
                  return (
                    <View key={role} style={styles.overviewRow}>
                      {rowContent}
                    </View>
                  );
                }

                return (
                  <AppButton
                    accessibilityLabel={`${isEnabled ? 'Disable' : 'Enable'} ${roleLabels[role]} role`}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: isEnabled }}
                    key={role}
                    onPress={() => setRoleEnabled(role as OptionalAccountRole, !isEnabled)}
                    style={styles.overviewRow}
                    variant="ghost"
                  >
                    {rowContent}
                  </AppButton>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Text style={[styles.subsectionTitle, { color: theme.text }]}>Application</Text>
            <AppButton
              accessibilityLabel="Check for application updates"
              disabled={status === 'checking'}
              onPress={checkForUpdates}
              style={styles.overviewRow}
              variant="ghost"
            >
              <View style={[styles.iconTile, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialCommunityIcons color={theme.primary} name="cellphone-arrow-down" size={22} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>App updates</Text>
                <Text style={[styles.rowDescription, { color: theme.textSecondary }]}>
                  {status === 'checking'
                    ? 'Checking for updates…'
                    : `Version ${currentVersion}${currentCommit ? ` · ${currentCommit.slice(0, 7)}` : ''}`}
                </Text>
              </View>
              <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={24} />
            </AppButton>

            <AppButton
              accessibilityLabel="Log out"
              onPress={logOut}
              style={styles.overviewRow}
              variant="ghost"
            >
              <View style={[styles.iconTile, { backgroundColor: theme.background }]}>
                <MaterialCommunityIcons color={theme.danger} name="logout" size={22} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: theme.danger }]}>Log out</Text>
                <Text style={[styles.rowDescription, { color: theme.placeholder }]}>Sign out of this device</Text>
              </View>
              <MaterialCommunityIcons color={theme.placeholder} name="chevron-right" size={24} />
            </AppButton>
          </View>
        </View>
      </ScrollView>

      <UpdateModal
        currentCommit={currentCommit}
        currentVersion={currentVersion}
        errorMessage={errorMessage}
        onClose={closeModal}
        onRetry={checkForUpdates}
        releaseInfo={releaseInfo}
        status={status}
        visible={isModalOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: { minHeight: 276, overflow: 'hidden' },
  heroSafeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  heroShapeLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    right: -52,
    bottom: -60,
    borderRadius: Rounded.round,
    opacity: 0.18,
  },
  heroShapeSmall: {
    position: 'absolute',
    width: 68,
    height: 68,
    left: -22,
    top: 74,
    borderRadius: Rounded.round,
    opacity: 0.16,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 36,
    paddingTop: Spacing.two,
  },
  identity: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.one,
  },
  avatar: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 46,
    borderWidth: 3,
    marginBottom: Spacing.two,
  },
  avatarText: { fontFamily: Fonts.title, fontSize: 28, fontWeight: 700 },
  avatarBadge: {
    position: 'absolute',
    right: -3,
    bottom: 2,
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.round,
    borderWidth: 2,
  },
  name: {
    maxWidth: '90%',
    fontFamily: Fonts.body,
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 26,
  },
  email: {
    maxWidth: '90%',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 20,
    opacity: 0.86,
  },
  overviewPanel: {
    flexGrow: 1,
    marginTop: -26,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },
  panelContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    fontWeight: 700,
    marginBottom: Spacing.three,
  },
  sectionHeadingRow: { paddingTop: Spacing.one, paddingBottom: Spacing.one },
  subsectionTitle: { fontFamily: Fonts.body, fontSize: 15, fontWeight: 900, lineHeight: 21 },
  subsectionDescription: { fontFamily: Fonts.body, fontSize: 12, fontWeight: 500, lineHeight: 18 },
  profileSummaryRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  roleList: { paddingTop: Spacing.half },
  overviewRow: {
    minHeight: 62,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.three,
    borderRadius: Rounded.md,
    paddingHorizontal: 0,
    paddingVertical: Spacing.half,
  },
  iconTile: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.lg,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: Fonts.body, fontSize: 15, fontWeight: 700, lineHeight: 21 },
  rowDescription: { fontFamily: Fonts.body, fontSize: 12, fontWeight: 500, lineHeight: 18 },
  statusPill: {
    minWidth: 42,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.round,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
  },
  statusText: { fontFamily: Fonts.body, fontSize: 11, fontWeight: 900 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.three },
});
