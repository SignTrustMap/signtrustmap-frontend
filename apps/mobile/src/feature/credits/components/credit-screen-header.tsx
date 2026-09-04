import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CreditScreenHeaderProps = {
  onBack?: () => void;
  rightContent?: ReactNode;
  title: string;
};

export function CreditScreenHeader({ onBack, rightContent, title }: CreditScreenHeaderProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <View style={styles.header}>
        <View style={styles.side}>
          {onBack ? (
            <AppButton
              accessibilityLabel="Go back"
              onPress={onBack}
              style={styles.backButton}
              variant="ghost"
            >
              <Text style={[styles.backIcon, { color: theme.primary }]}>{'‹'}</Text>
            </AppButton>
          ) : null}
        </View>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>
        <View style={[styles.side, styles.rightSide]}>{rightContent}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: 1,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  side: {
    width: 52,
    alignItems: 'flex-start',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  backIcon: {
    fontFamily: Fonts.body,
    fontSize: 36,
    fontWeight: 500,
    lineHeight: 38,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 19,
    fontWeight: 900,
    textAlign: 'center',
  },
});
