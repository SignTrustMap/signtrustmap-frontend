import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forwardRef, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type KeyboardTypeOptions,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppInputDropdownOption = {
  label: string;
  value: string;
  color?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap | string;
  sublabel?: string;
};

export type AppInputKind = 'email' | 'password' | 'phone' | 'search' | 'text' | 'dropdown';

export type AppInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  label?: string;
  type?: AppInputKind;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  callback?: (text: string) => void;
  // Dropdown-specific props
  dropdownOptions?: AppInputDropdownOption[];
  selectedOptionValue?: string;
  onSelectOption?: (option: AppInputDropdownOption) => void;
  dropdownTitle?: string;
  disabled?: boolean;
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
    case 'dropdown':
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
    dropdownOptions,
    selectedOptionValue,
    onSelectOption,
    dropdownTitle,
    disabled = false,
    placeholder,
    value,
    ...inputProps
  }: AppInputProps,
  ref,
) {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Subtle dropdown entrance / exit animation
  const animValue = useRef(new Animated.Value(0)).current;

  const config = useMemo(() => getInputConfig(type), [type]);
  const isPassword = type === 'password';
  const isDropdown = type === 'dropdown' || Boolean(dropdownOptions && dropdownOptions.length > 0);

  const handleChangeText = (text: string) => {
    callback?.(text);
    onChangeText?.(text);
  };

  const handleOpenDropdown = () => {
    if (disabled) return;
    setIsDropdownOpen(true);
    animValue.setValue(0);
    Animated.parallel([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseDropdown = () => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsDropdownOpen(false);
    });
  };

  const handleSelectOption = (opt: AppInputDropdownOption) => {
    onSelectOption?.(opt);
    handleChangeText(opt.value);
    handleCloseDropdown();
  };

  // Determine label to display when dropdown is used
  const displayDropdownText = useMemo(() => {
    if (value) return value;
    if (selectedOptionValue && dropdownOptions) {
      const match = dropdownOptions.find((o) => o.value === selectedOptionValue);
      if (match) return match.label;
    }
    return '';
  }, [value, selectedOptionValue, dropdownOptions]);

  // Dropdown anim styles
  const modalScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const modalTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const chevronRotation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.field}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

      {isDropdown ? (
        <>
          <Pressable
            accessibilityLabel={inputProps.accessibilityLabel || label || placeholder || 'Chọn tùy chọn'}
            accessibilityRole="combobox"
            accessibilityState={{ expanded: isDropdownOpen, disabled }}
            disabled={disabled}
            onPress={handleOpenDropdown}
            style={({ pressed }) => [
              styles.inputShell,
              {
                backgroundColor: disabled ? `${theme.placeholder}10` : theme.background,
                borderColor: error ? styles.errorText.color : theme.border,
                opacity: pressed ? 0.85 : 1,
              },
              containerStyle,
            ]}
          >
            {leadingIcon ? <View style={styles.leadingIconSlot}>{leadingIcon}</View> : null}

            <Text
              numberOfLines={1}
              style={[
                styles.dropdownTriggerText,
                {
                  color: displayDropdownText ? theme.text : theme.placeholder,
                },
                style as any,
              ]}
            >
              {displayDropdownText || placeholder || 'Chọn tùy chọn...'}
            </Text>

            {trailingIcon ? (
              <View style={styles.trailingIconSlot}>{trailingIcon}</View>
            ) : (
              <Animated.View
                style={[
                  styles.trailingIconSlot,
                  { transform: [{ rotate: chevronRotation }] },
                ]}
              >
                <MaterialCommunityIcons
                  color={theme.placeholder}
                  name="chevron-down"
                  size={20}
                />
              </Animated.View>
            )}
          </Pressable>

          {/* Animated Dropdown Modal */}
          <Modal
            animationType="none"
            onRequestClose={handleCloseDropdown}
            transparent
            visible={isDropdownOpen}
          >
            <View style={styles.modalBackdrop}>
              <Pressable
                accessibilityLabel="Đóng menu chọn"
                onPress={handleCloseDropdown}
                style={StyleSheet.absoluteFill}
              />

              <Animated.View
                style={[
                  styles.modalCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                    opacity: animValue,
                    transform: [{ scale: modalScale }, { translateY: modalTranslateY }],
                  },
                ]}
              >
                {/* Header */}
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {dropdownTitle || label || placeholder || 'Chọn phân loại'}
                  </Text>
                  <Pressable
                    accessibilityLabel="Đóng"
                    hitSlop={8}
                    onPress={handleCloseDropdown}
                    style={styles.closeBtn}
                  >
                    <MaterialCommunityIcons color={theme.placeholder} name="close" size={20} />
                  </Pressable>
                </View>

                {/* Options List */}
                <ScrollView
                  contentContainerStyle={styles.optionsListContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={styles.optionsScrollView}
                >
                  {dropdownOptions?.map((opt) => {
                    const isSelected =
                      opt.value === selectedOptionValue ||
                      (Boolean(displayDropdownText) && opt.label === displayDropdownText);

                    return (
                      <Pressable
                        key={opt.value}
                        accessibilityLabel={`${opt.label}, ${isSelected ? 'đã chọn' : 'chưa chọn'}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => handleSelectOption(opt)}
                        style={({ pressed }) => [
                          styles.optionItem,
                          {
                            backgroundColor: isSelected
                              ? theme.backgroundSelected
                              : pressed
                                ? `${theme.primary}10`
                                : 'transparent',
                            borderBottomColor: theme.border,
                          },
                        ]}
                      >
                        {opt.color ? (
                          <View
                            style={[
                              styles.optionColorSquare,
                              { backgroundColor: opt.color },
                            ]}
                          />
                        ) : null}

                        <View style={styles.optionTextWrapper}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.optionLabel,
                              {
                                color: isSelected ? theme.primary : theme.text,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {opt.sublabel ? (
                            <Text
                              numberOfLines={1}
                              style={[styles.optionSublabel, { color: theme.placeholder }]}
                            >
                              {opt.sublabel}
                            </Text>
                          ) : null}
                        </View>

                        {isSelected ? (
                          <MaterialCommunityIcons
                            color={theme.primary}
                            name="check"
                            size={18}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>
        </>
      ) : (
        /* Regular TextInput */
        <View
          style={[
            styles.inputShell,
            inputProps.multiline && styles.inputShellMultiline,
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
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.placeholder}
            secureTextEntry={isPassword && !passwordVisible}
            style={[
              styles.input,
              inputProps.multiline && styles.inputMultiline,
              { color: theme.text },
              style,
            ]}
            textContentType={textContentType ?? config.textContentType}
            value={value}
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
      )}

      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
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
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  inputShellMultiline: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: Spacing.one,
  },
  leadingIcon: {
    width: 24,
    fontFamily: Fonts.mono,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  leadingIconSlot: {
    marginRight: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingIconSlot: {
    marginLeft: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTriggerText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingVertical: 0,
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
  inputMultiline: {
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  visibilityButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingLeft: Spacing.one,
  },
  visibilityText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: '#D92D20',
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  // Dropdown modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '75%',
    borderRadius: Rounded.xlg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.body,
  },
  closeBtn: {
    padding: 4,
  },
  optionsScrollView: {
    maxHeight: 320,
  },
  optionsListContent: {
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  optionColorSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  optionTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  optionSublabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
