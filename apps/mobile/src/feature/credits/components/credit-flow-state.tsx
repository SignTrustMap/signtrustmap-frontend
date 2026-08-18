import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CreditFlowStateProps = {
  actionLabel?: string;
  detail?: ReactNode;
  message?: string;
  onAction?: () => void;
  presentation?: 'overlay' | 'page';
  successSymbol?: string;
  title: string;
  variant: 'loading' | 'success';
};

export function CreditFlowState({
  actionLabel,
  detail,
  message,
  onAction,
  presentation = 'page',
  successSymbol = '✓',
  title,
  variant,
}: CreditFlowStateProps) {
  const theme = useTheme();
  const content = (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole={variant === 'loading' ? 'progressbar' : 'summary'}
      style={[
        styles.content,
        presentation === 'overlay' ? styles.overlayCard : undefined,
        { backgroundColor: theme.backgroundElement },
      ]}
    >
      {variant === 'loading' ? (
        <ActivityIndicator color={theme.tertiary} size="large" />
      ) : (
        <View style={[styles.successIcon, { backgroundColor: theme.backgroundSelected }]}>
          <Text style={[styles.successSymbol, { color: theme.tertiary }]}>{successSymbol}</Text>
        </View>
      )}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text> : null}
      {detail}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );

  if (presentation === 'overlay') {
    return <View style={styles.overlay}>{content}</View>;
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.page, { backgroundColor: theme.background }]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 247, 247, 0.88)',
    padding: Spacing.four,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  overlayCard: {
    flex: 0,
    width: 260,
    minHeight: 180,
    borderWidth: 1,
    borderColor: '#D4D8E0',
    borderRadius: Rounded.lg,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  successIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  successSymbol: {
    fontFamily: Fonts.body,
    fontSize: 52,
    fontWeight: 900,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 24,
    fontWeight: 900,
    textAlign: 'center',
  },
  message: {
    maxWidth: 420,
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 22,
    textAlign: 'center',
  },
  action: {
    width: '100%',
    maxWidth: 420,
    marginTop: Spacing.four,
  },
});
