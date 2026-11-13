import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { Badge } from '@/components/badge';
import { useTheme } from '@/hooks/use-theme';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type WorkActionCardProps = {
  accessibilityLabel?: string;
  accentColor?: string;
  badgeLabel?: string;
  count?: number;
  icon?: MaterialIconName;
  label: string;
  onPress?: () => void;
  subtitle?: string;
  symbol?: SymbolName;
  urgent?: boolean;
};

export function WorkActionCard({
  accessibilityLabel,
  accentColor,
  badgeLabel,
  count,
  icon,
  label,
  onPress,
  subtitle,
  symbol,
  urgent = false,
}: WorkActionCardProps) {
  const theme = useTheme();
  const primaryAccent = accentColor ?? theme.primary;
  const hasBadge = Boolean(badgeLabel) || (count !== undefined && count !== null && count > 0);

  return (
    <View style={styles.outerContainer}>
      <Pressable
        accessibilityLabel={
          accessibilityLabel ?? (count === undefined ? label : `${label}, ${count} items`)
        }
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: urgent ? primaryAccent : theme.border,
            borderLeftColor: primaryAccent,
            borderLeftWidth: 5,
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <View style={styles.contentRow}>
          <View style={[styles.iconContainer]}>
            {icon ? (
              <MaterialCommunityIcons color={primaryAccent} name={icon} size={26} />
            ) : symbol ? (
              <SymbolView name={symbol} size={26} tintColor={primaryAccent} />
            ) : (
              <MaterialCommunityIcons
                color={primaryAccent}
                name="checkbox-marked-circle-outline"
                size={26}
              />
            )}
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {label}
              </Text>
            </View>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.grey }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.rightContainer}>
            {hasBadge ? (
              <Badge
                borderColor={theme.backgroundElement}
                borderWidth={1.5}
                count={badgeLabel ? undefined : count}
                label={badgeLabel}
                maxCount={9}
                size="md"
              />
            ) : null}
            <MaterialCommunityIcons color={theme.grey} name="chevron-right" size={22} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
  },
  actionCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
