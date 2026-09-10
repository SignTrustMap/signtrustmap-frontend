import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type KeyboardTypeOptions,
  type TextInputProps,
  View,
  StyleProp,
  ViewStyle
} from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppInputKind = 'email' | 'password' | 'text';


type AppInputProps =
  Omit<TextInputProps, 'keyboardType' | 'secureTextEntry' | 'textContentType'> & {
    containerStyle?: StyleProp<ViewStyle>;
    error?: string;
    label?: string;
    type?: AppInputKind;
    leadingIcon?: React.ReactNode;
    callback?: (text: string) => void;
  };

function getInputConfig(type: AppInputKind): {
  autoCapitalize: TextInputProps['autoCapitalize'];
  autoComplete: TextInputProps['autoComplete'];
  icon?: string;
  keyboardType: KeyboardTypeOptions;
  textContentType: TextInputProps['textContentType'];
} {
  switch (type) {
    case 'email':
      return {
        autoCapitalize: 'none',
        autoComplete: 'email',
        keyboardType: 'email-address',
        textContentType: 'emailAddress',
      };
    case 'password':
      return {
        autoCapitalize: 'none',
        autoComplete: 'password',
        keyboardType: 'default',
        textContentType: 'password',
      };
    case 'text':
    default:
      return {
        autoCapitalize: 'sentences',
        autoComplete: 'off',
        keyboardType: 'default',
        textContentType: 'none',
      };
  }
}

export function AppInput({
  error,
  label,
  containerStyle,
  style,
  leadingIcon,
  type = 'text',
  callback,
  ...inputProps
}: AppInputProps) {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const config = useMemo(() => getInputConfig(type), [type]);
  const isPassword = type === 'password';

  return (
    <View style={styles.field}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: theme.background,
            borderColor: error ? styles.errorText.color : theme.border,
          },
          containerStyle
        ]}
      >
        {config.icon ? (
          <Text style={[styles.leadingIcon, { color: theme.textSecondary }]}>{config.icon}</Text>
        ) : null}
        {leadingIcon ? (
          <>{leadingIcon}</>
        ) : null}
        <TextInput
          autoCapitalize={config.autoCapitalize}
          autoComplete={config.autoComplete}
          keyboardType={config.keyboardType}
          placeholderTextColor={theme.placeholder}
          secureTextEntry={isPassword && !passwordVisible}
          style={[styles.input, { color: theme.text }, style]}
          textContentType={config.textContentType}
          onChangeText={(e) => callback?.(e)}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={Spacing.one}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.visibilityButton}
          >
            <Text style={[styles.visibilityText, { color: theme.textSecondary }]}>
              {passwordVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  inputShell: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingLeft: 1,
  },
  leadingIcon: {
    width: 24,
    fontFamily: Fonts.mono,
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.one,
    paddingVertical: 0,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 20,
  },
  visibilityButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingLeft: Spacing.one,
  },
  visibilityText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 700,
  },
  errorText: {
    color: '#D92D20',
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
});
