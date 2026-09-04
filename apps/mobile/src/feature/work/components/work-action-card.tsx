import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type WorkActionCardProps = {
  count: number;
  label: string;
  onPress?: () => void;
  symbol: SymbolName;
};

export function WorkActionCard({ count, label, onPress, symbol }: WorkActionCardProps) {
  const theme = useTheme();

  return (
    <AppButton
      accessibilityLabel={`${label}, ${count} pending`}
      onPress={onPress}
      pressedOpacity={0.72}
      style={[
        styles.action,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
      variant="surface"
    >
      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
        <Text style={[styles.badgeText, { color: theme.onPrimary }]}>{count}</Text>
      </View>
      <SymbolView name={symbol} size={27} tintColor={theme.primary} />
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </AppButton>
  );
}

const styles = StyleSheet.create({
  action: {
    position: 'relative',
    minHeight: 112,
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Rounded.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    shadowColor: '#0C5963',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  actionLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 21,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 900,
    lineHeight: 14,
  },
});
