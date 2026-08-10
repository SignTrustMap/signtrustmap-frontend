import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppButtonProps = PressableProps & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, disabled, style, ...pressableProps }: AppButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.tertiary,
          opacity: disabled ? 0.55 : pressed ? 0.82 : 1,
        },
        style,
      ]}
      {...pressableProps}
    >
      <Text style={[styles.buttonText, { color: theme.onTertiary }]}>{label}</Text>
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
