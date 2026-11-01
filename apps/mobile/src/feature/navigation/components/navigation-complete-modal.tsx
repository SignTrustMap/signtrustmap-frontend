import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS } from '@/constants/const';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type NavigationCompleteModalProps = {
  destinationTitle?: string;
  onDismiss: () => void;
  visible: boolean;
};

export function NavigationCompleteModal({
  destinationTitle,
  onDismiss,
  visible,
}: NavigationCompleteModalProps) {
  const theme = useTheme();

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onDismiss}
      statusBarTranslucent
      testID="navigation-complete-modal"
      transparent
      visible={visible}
    >
      <Pressable onPress={onDismiss} style={styles.backdrop} testID="navigation-complete-backdrop">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
          testID="navigation-complete-card"
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons color="#16A34A" name="check-circle" size={48} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Hành trình đã hoàn tất</Text>

          {destinationTitle ? (
            <Text numberOfLines={2} style={[styles.subtitle, { color: theme.textSecondary }]}>
              {destinationTitle}
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Bạn đã kết thúc điều hướng an toàn.
            </Text>
          )}

          <View style={[styles.autoDismissIndicator, { backgroundColor: theme.neutral }]}>
            <MaterialCommunityIcons color={theme.textSecondary} name="timer-sand" size={14} />
            <Text style={[styles.autoDismissText, { color: theme.textSecondary }]}>
              Tự động quay về trang chủ...
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Rounded.xlg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.half,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  autoDismissIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Rounded.round,
  },
  autoDismissText: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
});
