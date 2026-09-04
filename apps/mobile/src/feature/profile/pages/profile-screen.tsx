import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { UpdateModal } from '@/components/update-modal';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  ACCOUNT_ROLES,
  type AccountRole,
  type OptionalAccountRole,
  useSession,
} from '@/context/session-provider';
import { useAppUpdate } from '@/hooks/use-app-update';
import { useTheme } from '@/hooks/use-theme';

const roleLabels: Record<AccountRole, string> = {
  driver: 'Driver',
  reviewer: 'Reviewer',
  surveyor: 'Surveyor',
};

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

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>

          <View style={[styles.accountPanel, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>DF</Text>
            </View>
            <View style={styles.accountCopy}>
              <Text style={[styles.name, { color: theme.text }]}>{session?.account.displayName}</Text>
              <Text style={[styles.email, { color: theme.textSecondary }]}>{session?.account.email}</Text>
            </View>
          </View>

          <View style={styles.rolesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account roles</Text>
            <Text style={[styles.rolesDescription, { color: theme.textSecondary }]}>
              Driver access is included with every account.
            </Text>
            <View style={styles.roleList}>
              {ACCOUNT_ROLES.map((role) => {
                const isEnabled = session?.account.roles.includes(role) ?? role === 'driver';
                const rowStyle = [
                  styles.roleRow,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ];
                const rowContent = (
                  <>
                    <Text style={[styles.roleName, { color: theme.text }]}>{roleLabels[role]}</Text>
                    <Text
                      style={[
                        styles.roleStatus,
                        { color: isEnabled ? theme.primary : theme.placeholder },
                      ]}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </>
                );

                if (role === 'driver') {
                  return (
                    <View key={role} style={rowStyle}>
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
                    style={rowStyle}
                    variant="surface"
                  >
                    {rowContent}
                  </AppButton>
                );
              })}
            </View>
          </View>

          <View style={styles.rolesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Application</Text>
            <View
              style={[
                styles.appInfoCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <View style={styles.appInfoRow}>
                <Text style={[styles.appInfoLabel, { color: theme.text }]}>Current Version</Text>
                <Text style={[styles.appInfoValue, { color: theme.textSecondary }]}>
                  v{currentVersion}
                  {currentCommit ? ` (${currentCommit.slice(0, 7)})` : ''}
                </Text>
              </View>
              <AppButton
                label={status === 'checking' ? 'Checking for updates...' : 'Check for updates'}
                disabled={status === 'checking'}
                onPress={checkForUpdates}
                style={[styles.updateButton, { borderColor: theme.border }]}
                variant="surface"
              />
            </View>
          </View>

          <AppButton label="Log out" onPress={logOut} style={styles.logoutButton} variant="surface" />
        </View>
      </SafeAreaView>

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
    padding: Spacing.four,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 36,
  },
  accountPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Rounded.lg,
    padding: Spacing.four,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.lg,
  },
  avatarText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 900,
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: 900,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 500,
  },
  rolesSection: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 900,
  },
  rolesDescription: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
  },
  roleList: {
    gap: Spacing.one,
  },
  roleRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
  },
  roleName: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  roleStatus: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 800,
  },
  appInfoCard: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appInfoLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
  },
  appInfoValue: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 800,
  },
  updateButton: {
    borderWidth: 1,
  },
  logoutButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
  },
});
