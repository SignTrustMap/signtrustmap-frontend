import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BadgeProps {
  /**
   * Numeric count to display. If count <= 0 and showZero is false, the badge is not rendered.
   */
  count?: number;
  /**
   * Explicit label to display instead of formatted count (e.g. '9+', '10+', 'MỚI').
   */
  label?: string;
  /**
   * Max count threshold before suffixing with '+' (e.g. maxCount=9 => '9+').
   */
  maxCount?: number;
  /**
   * Whether to render the badge when count is 0. Defaults to false.
   */
  showZero?: boolean;
  /**
   * Color variant. 'danger' (default) uses the red indicator (#EF4444) with white text.
   */
  variant?: 'danger' | 'primary';
  /**
   * Background color override.
   */
  backgroundColor?: string;
  /**
   * Border color. Defaults to '#FFFFFF'.
   */
  borderColor?: string;
  /**
   * Border width. Defaults to 1.5.
   */
  borderWidth?: number;
  /**
   * Size preset. Defaults to 'md' (20px circle, identical to the map notification indicator).
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional custom container style (e.g. for absolute positioning).
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Optional custom text style.
   */
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({
  count,
  label,
  maxCount,
  showZero = false,
  variant = 'danger',
  backgroundColor,
  borderColor = '#FFFFFF',
  borderWidth = 1.5,
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  const theme = useTheme();

  // If neither label nor count is provided, don't render
  if (label === undefined && count === undefined) {
    return null;
  }

  // If count is 0 or negative and showZero is false, don't render
  if (label === undefined && typeof count === 'number' && count <= 0 && !showZero) {
    return null;
  }

  const displayText =
    label ??
    (typeof count === 'number' && maxCount !== undefined && count > maxCount
      ? `${maxCount}+`
      : String(count ?? ''));

  const bg =
    backgroundColor ??
    (variant === 'primary' ? theme.primary : '#EF4444');

  const sizeContainerStyle =
    size === 'sm'
      ? styles.containerSm
      : size === 'lg'
        ? styles.containerLg
        : styles.containerMd;

  const sizeTextStyle =
    size === 'sm'
      ? styles.textSm
      : size === 'lg'
        ? styles.textLg
        : styles.textMd;

  return (
    <View
      style={[
        styles.baseContainer,
        sizeContainerStyle,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
        },
        style,
      ]}
    >
      <Text style={[styles.baseText, sizeTextStyle, textStyle]}>
        {displayText}
      </Text>
    </View>
  );
}

export { Badge as NotificationBadge, Badge as CountBadge };

const styles = StyleSheet.create({
  baseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sans,
    fontWeight: '700',
    textAlign: 'center',
  },
  containerSm: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
  },
  textSm: {
    fontSize: 10,
    lineHeight: 12,
  },
  containerMd: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  textMd: {
    fontSize: 11,
    lineHeight: 13,
  },
  containerLg: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 5,
  },
  textLg: {
    fontSize: 12,
    lineHeight: 15,
  },
});
