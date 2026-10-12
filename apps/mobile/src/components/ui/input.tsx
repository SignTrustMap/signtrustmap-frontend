import { forwardRef, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type KeyboardTypeOptions,
  type TextInputProps,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppInputKind = 'email' | 'password' | 'phone' | 'search' | 'text';

type AppInputProps =
  Omit<TextInputProps, 'secureTextEntry'> & {
    containerStyle?: StyleProp<ViewStyle>;
    error?: string;
    label?: string;
    type?: AppInputKind;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    callback?: (text: string) => void;
  };

function getInputConfig(type: AppInputKind): {
  autoCapitalize: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  icon?: string;
  keyboardType: KeyboardTypeOptions;
  textContentType?: TextInputProps['textContentType'];
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
    case 'phone':
      return {
        autoCapitalize: 'none',
        autoComplete: 'tel',
        keyboardType: 'phone-pad',
        textContentType: 'telephoneNumber',
      };
    case 'search':
      return {
        autoCapitalize: 'none',
        keyboardType: 'default',
      };
    case 'text':
    default:
      return {
        autoCapitalize: 'sentences',
        keyboardType: 'default',
      };
  }
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    error,
    label,
    containerStyle,
    style,
    leadingIcon,
    trailingIcon,
    type = 'text',
    callback,
    autoCapitalize,
    autoComplete,
    keyboardType,
    textContentType,
    onChangeText,
    ...inputProps
  }: AppInputProps,
  ref,
) {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const config = useMemo(() => getInputConfig(type), [type]);
  const isPassword = type === 'password';

  const handleChangeText = (text: string) => {
    callback?.(text);
    onChangeText?.(text);
  };

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
          containerStyle,
        ]}
      >
        {config.icon ? (
          <Text style={[styles.leadingIcon, { color: theme.textSecondary }]}>{config.icon}</Text>
        ) : null}
        {leadingIcon ? <>{leadingIcon}</> : null}
        <TextInput
          ref={ref}
          autoCapitalize={autoCapitalize ?? config.autoCapitalize}
          autoComplete={autoComplete ?? config.autoComplete}
          keyboardType={keyboardType ?? config.keyboardType}
          placeholderTextColor={theme.placeholder}
          secureTextEntry={isPassword && !passwordVisible}
          style={[styles.input, { color: theme.text }, style]}
          textContentType={textContentType ?? config.textContentType}
          onChangeText={handleChangeText}
          {...inputProps}
        />
        {trailingIcon ? <>{trailingIcon}</> : null}
        {isPassword ? (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            accessibilityRole="button"
            hitSlop={Spacing.one}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.visibilityButton}
          >
            <Text style={[styles.visibilityText, { color: theme.textSecondary }]}>
              {passwordVisible ? 'Ẩn' : 'Hiện'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

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
