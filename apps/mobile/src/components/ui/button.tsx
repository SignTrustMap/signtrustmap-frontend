import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppButtonProps = PressableProps & {
  children?: ReactNode;
  label?: string;
  pressedOpacity?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'surface' | 'ghost';
};

export function AppButton({
  children,
  disabled,
  label,
  pressedOpacity = 0.82,
  style,
  textStyle,
  variant = 'primary',
  ...pressableProps
}: AppButtonProps) {
  const theme = useTheme();
  const variantStyle = {
    primary: {
      backgroundColor: theme.tertiary,
    },
    surface: {
      backgroundColor: theme.backgroundElement,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  }[variant];
  const textColor = variant === 'primary' ? theme.onTertiary : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: disabled ? 0.55 : pressed ? pressedOpacity : 1,
        },
        variantStyle,
        style,
      ]}
      {...pressableProps}
    >
      {children ?? <Text style={[styles.buttonText, { color: textColor }, textStyle]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.md,
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  buttonText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
  },
});
