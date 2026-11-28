import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { Badge } from '@/components/badge';
import { useTheme } from '@/hooks/use-theme';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type WorkActionBadgeProps = {
  accessibilityLabel?: string;
  accentColor?: string;
  badgeLabel?: string;
  count?: number;
  icon?: MaterialIconName;
  label: string;
  onPress?: () => void;
  subtitle?: string;
  symbol?: SymbolName;
  testID?: string;
  urgent?: boolean;
};

export function WorkActionBadge({
  accessibilityLabel,
  accentColor,
  badgeLabel,
  count,
  icon = 'map-marker',
  label,
  onPress,
  subtitle,
  symbol,
  testID,
  urgent = false,
}: WorkActionBadgeProps) {
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
        testID={testID}
        style={({ pressed }) => [
          styles.actionItem,
          pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
        ]}
      >
        <View
          style={[
            styles.circleContainer,
            {
              backgroundColor: theme.secondary ?? '#E8F4F6',
              borderColor: urgent ? theme.danger ?? '#FF0000' : 'transparent',
              borderWidth: urgent ? 1.5 : 0,
            },
          ]}
        >
          {icon ? (
            <MaterialCommunityIcons color={primaryAccent} name={icon} size={28} />
          ) : symbol ? (
            <SymbolView name={symbol} size={28} tintColor={primaryAccent} />
          ) : (
            <MaterialCommunityIcons color={primaryAccent} name="map-marker" size={28} />
          )}

          {hasBadge ? (
            <Badge
              borderColor={theme.backgroundElement}
              borderWidth={1.5}
              count={badgeLabel ? undefined : count}
              label={badgeLabel}
              maxCount={9}
              size="md"
              style={styles.topRightBadge}
            />
          ) : null}
        </View>

        <Text
          numberOfLines={2}
          style={[styles.label, { color: theme.text }]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

// Backward compatibility alias
export const WorkActionCard = WorkActionBadge;
export type WorkActionCardProps = WorkActionBadgeProps;

const styles = StyleSheet.create({
  outerContainer: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: Spacing.one,
  },
  actionItem: {
    alignItems: 'center',
    width: '100%',
  },
  circleContainer: {
    width: 58,
    height: 58,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  topRightBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    zIndex: 10,
    elevation: 5,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
    minHeight: 32,
  },
});
