import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Octicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UpdateStatus } from '@/hooks/use-app-update';
import type { ReleaseInfo } from '@/services/update-service';

interface UpdateModalProps {
  visible: boolean;
  status: UpdateStatus;
  releaseInfo: ReleaseInfo | null;
  errorMessage: string | null;
  currentVersion: string;
  currentCommit?: string;
  onClose: () => void;
  onRetry: () => void;
}

export function UpdateModal({
  visible,
  status,
  releaseInfo,
  errorMessage,
  currentVersion,
  onClose,
  onRetry,
}: UpdateModalProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyError = async () => {
    if (!errorMessage) return;
    await Clipboard.setStringAsync(errorMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = () => {
    const url = releaseInfo?.apkAsset?.downloadUrl || releaseInfo?.htmlUrl;
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleOpenGitHub = () => {
    if (releaseInfo?.htmlUrl) {
      Linking.openURL(releaseInfo.htmlUrl);
    }
  };

  const displayTitle = releaseInfo?.name
    ? releaseInfo.name.replace(/\s*\(.*?\)/g, '').trim()
    : 'Build #9';

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        >
          {status === 'checking' && (
            <View style={styles.checkingBox}>
              <ActivityIndicator color={theme.primary} size="large" />
              <Text style={[styles.checkingText, { color: theme.text }]}>
                Checking for updates...
              </Text>
            </View>
          )}

          {status === 'available' && releaseInfo && (
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.topRow}>
                  <View style={styles.titleGroup}>
                    <Text style={[styles.title, { color: theme.text }]}>{displayTitle}</Text>
                    <View style={[styles.newBadge, { backgroundColor: theme.backgroundSelected }]}>
                      <Text style={[styles.newBadgeText, { color: theme.primary }]}>NEW</Text>
                    </View>
                  </View>

                  {releaseInfo.htmlUrl && (
                    <Pressable
                      accessibilityLabel="View release on GitHub"
                      accessibilityRole="button"
                      onPress={handleOpenGitHub}
                      style={({ pressed }) => [
                        styles.githubBtn,
                        {
                          borderColor: theme.border,
                          backgroundColor: pressed ? theme.backgroundSelected : theme.background,
                        },
                      ]}
                    >
                      <Text style={[styles.githubText, { color: theme.text }]}>View</Text>
                      <Octicons name="mark-github" size={13} color={theme.text} />
                    </Pressable>
                  )}
                </View>

                <Text style={[styles.metaText, { color: theme.placeholder }]}>
                  Released {releaseInfo.publishedAt}
                  {releaseInfo.apkAsset ? ` • ${releaseInfo.apkAsset.sizeFormatted}` : ''}
                </Text>
              </View>

              <View style={styles.actions}>
                <AppButton
                  label="Update"
                  onPress={handleUpdate}
                  variant="primary"
                />
                <AppButton
                  label="Later"
                  onPress={onClose}
                  variant="ghost"
                />
              </View>
            </View>
          )}

          {status === 'up-to-date' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={[styles.newBadge, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.newBadgeText, { color: theme.primary }]}>UP TO DATE</Text>
                </View>
                <Text style={[styles.title, { color: theme.text }]}>You&apos;re up to date!</Text>
                <Text style={[styles.metaText, { color: theme.placeholder }]}>
                  Current version: v{currentVersion}
                </Text>
              </View>

              <Text style={[styles.description, { color: theme.textSecondary }]}>
                You are currently running the latest version of SignTrustMap.
              </Text>

              <View style={styles.actions}>
                <AppButton label="Got it" onPress={onClose} variant="primary" />
              </View>
            </View>
          )}

          {status === 'error' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={[styles.newBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.newBadgeText, { color: '#DC2626' }]}>FAILED</Text>
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Unable to check updates</Text>
              </View>

              <View style={styles.errorContainer}>
                <Text style={[styles.errorLabel, { color: theme.placeholder }]}>Error Details:</Text>
                <TextInput
                  editable={false}
                  multiline
                  value={errorMessage ?? 'Unknown error occurred.'}
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                      color: theme.danger,
                    },
                  ]}
                />
                <AppButton
                  label={copied ? '✓ Copied to clipboard!' : 'Copy Error'}
                  onPress={handleCopyError}
                  variant="surface"
                  style={{ borderColor: theme.border, borderWidth: 1, marginTop: Spacing.two }}
                />
              </View>

              <View style={styles.actions}>
                <AppButton label="Retry" onPress={onRetry} variant="primary" />
                <AppButton label="Close" onPress={onClose} variant="ghost" />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: Math.min(MaxContentWidth, 360),
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  checkingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  checkingText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 600,
  },
  content: {
    gap: Spacing.four,
  },
  header: {
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: 900,
  },
  newBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  newBadgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Rounded.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  githubText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 700,
  },
  metaText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 500,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
  },
  errorContainer: {
    gap: Spacing.one,
  },
  errorLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  errorBox: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    borderWidth: 1,
    borderRadius: Rounded.md,
    padding: Spacing.two,
    minHeight: 70,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
