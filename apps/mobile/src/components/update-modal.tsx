import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
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
  currentCommit,
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

  const handleDownload = () => {
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
              <ActivityIndicator color={theme.tertiary} size="large" />
              <Text style={[styles.checkingText, { color: theme.text }]}>
                Checking for updates...
              </Text>
            </View>
          )}

          {status === 'available' && releaseInfo && (
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.badgeText, { color: theme.tertiary }]}>New Version</Text>
                </View>
                <Text style={[styles.title, { color: theme.text }]}>{releaseInfo.name}</Text>
                <Text style={[styles.metaText, { color: theme.placeholder }]}>
                  Tag: {releaseInfo.tagName} • {releaseInfo.publishedAt}
                  {releaseInfo.apkAsset ? ` • ${releaseInfo.apkAsset.sizeFormatted}` : ''}
                </Text>
              </View>

              <View style={[styles.notesCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.notesTitle, { color: theme.text }]}>What&apos;s New:</Text>
                <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator>
                  <Text style={[styles.notesText, { color: theme.text }]}>{releaseInfo.body}</Text>
                </ScrollView>
              </View>

              <View style={styles.actions}>
                {releaseInfo.apkAsset && (
                  <AppButton
                    label={`Download APK (${releaseInfo.apkAsset.sizeFormatted})`}
                    onPress={handleDownload}
                    variant="primary"
                  />
                )}
                <AppButton
                  label="View on GitHub"
                  onPress={handleOpenGitHub}
                  variant="surface"
                  style={{ borderColor: theme.border, borderWidth: 1 }}
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
                <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.badgeText, { color: theme.tertiary }]}>Up to Date</Text>
                </View>
                <Text style={[styles.title, { color: theme.text }]}>You&apos;re up to date!</Text>
                <Text style={[styles.metaText, { color: theme.placeholder }]}>
                  Current version: v{currentVersion}
                  {currentCommit ? ` (${currentCommit.slice(0, 7)})` : ''}
                </Text>
              </View>

              <Text style={[styles.description, { color: theme.text }]}>
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
                <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: '#DC2626' }]}>Check Failed</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: Math.min(MaxContentWidth, 420),
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Rounded.sm,
  },
  badgeText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 800,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: 900,
  },
  metaText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 500,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
  },
  notesCard: {
    borderRadius: Rounded.md,
    borderWidth: 1,
    padding: Spacing.three,
    maxHeight: 180,
    gap: Spacing.one,
  },
  notesTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 800,
  },
  notesScroll: {
    maxHeight: 130,
  },
  notesText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
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
  },
});
