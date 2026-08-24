import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Rounded, Spacing } from '@/constants/theme';

type AppToastProps = {
  duration?: number;
  message: string;
  onDismiss?: () => void;
  placement?: 'bottom' | 'center';
  tone?: 'default' | 'success';
};

export function AppToast({
  duration = 3000,
  message,
  onDismiss,
  placement = 'bottom',
  tone = 'default',
}: AppToastProps) {
  useEffect(() => {
    if (!onDismiss) return;

    const timeout = setTimeout(onDismiss, duration);
    return () => clearTimeout(timeout);
  }, [duration, onDismiss]);

  return (
    <SafeAreaView
      edges={placement === 'bottom' ? ['bottom'] : []}
      pointerEvents="none"
      style={[styles.positioner, placement === 'center' ? styles.centerPositioner : undefined]}
    >
      <View
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        style={[styles.toast, tone === 'success' ? styles.successToast : undefined]}
      >
        <Text numberOfLines={2} style={styles.message}>
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.four,
    zIndex: 20,
  },
  centerPositioner: {
    top: 0,
    justifyContent: 'center',
  },
  toast: {
    maxWidth: 520,
    minHeight: 48,
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.md,
    backgroundColor: '#666666',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: Spacing.four,
  },
  successToast: {
    backgroundColor: '#16803A',
  },
  message: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 19,
    textAlign: 'center',
  },
});
