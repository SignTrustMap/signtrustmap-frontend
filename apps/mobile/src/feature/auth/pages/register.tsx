import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { Colors, Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useRegister } from '@/feature/auth/hooks/use-register';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAL_ACCENT = '#5EEAD4';

type FormErrors = Partial<Record<'email' | 'password' | 'fullName' | 'phone', string>>;

export default function RegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string>();

  const isSubmitting = registerMutation.isPending;
  const displayedError = formError ?? registerMutation.error?.message;

  const clearFieldError = (field: keyof FormErrors) => {
    if (!isSubmitting) registerMutation.reset();
    setFormError(undefined);
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    const nextErrors: FormErrors = {
      fullName: fullName.trim() ? undefined : 'Nhập họ và tên của bạn.',
      email: EMAIL_PATTERN.test(email.trim()) ? undefined : 'Nhập địa chỉ email hợp lệ.',
      phone: phone.trim() ? undefined : 'Nhập số điện thoại của bạn.',
      password: password.length >= 8 ? undefined : 'Mật khẩu tối thiểu 8 ký tự.',
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    setFormError(undefined);
    try {
      await registerMutation.mutateAsync({ email: email.trim(), password, fullName: fullName.trim(), phone: phone.trim() });
      router.replace({ pathname: '/login', params: { registered: 'true' } });
    } catch {
      // The mutation exposes backend and connection errors to the form.
    }
  };

  const handleGoogleSignUp = () => {
    setFormError('Đăng ký Google hiện chưa khả dụng trên ứng dụng di động.');
  };

  return (
    <View style={styles.screenContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Hero Themed Section */}
          <View style={styles.heroSection}>
            <View pointerEvents="none" style={styles.decorCircleLarge} />
            <View pointerEvents="none" style={styles.decorCircleMedium} />
            <View pointerEvents="none" style={styles.decorCircleSmall} />
            <View pointerEvents="none" style={styles.decorCircleFloat} />
            <View pointerEvents="none" style={styles.decorCircleDot} />
            <View pointerEvents="none" style={styles.decorCircleDot2} />
            <View pointerEvents="none" style={styles.decorRoadCurve} />

            <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroGreeting}>SignTrustMap</Text>
                <Text style={styles.heroHeadline}>
                  Cùng nhau trở thành một {' '}
                  <Text style={styles.heroHeadlineAccent}>SignTrustMapper</Text>
                  {'\n'}để xây dựng một nền tảng đáng tin cậy.
                </Text>
              </View>
            </SafeAreaView>
          </View>

          {/* Bottom Card Section */}
          <View style={styles.bottomCardContainer}>
            <View
              style={[
                styles.bottomCard,
                { paddingBottom: Math.max(Spacing.five, insets.bottom + 16) },
              ]}
            >
              {/* Form Title & Subtitle */}
              <View style={styles.titleArea}>
                <Text style={styles.cardTitle}>Đăng ký</Text>
                <View style={styles.subtitleRow}>
                  <Text style={styles.subtitleMuted}>Đã có tài khoản?</Text>
                  <Pressable
                    accessibilityLabel="Đăng nhập"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => router.replace('/login')}
                  >
                    <Text style={styles.subtitleLink}> Đăng nhập</Text>
                  </Pressable>
                </View>
              </View>

              {/* Form Inputs */}
              <View style={styles.formGroup}>
                {/* Full Name Field */}
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputPill,
                      errors.fullName ? styles.inputPillError : null,
                    ]}
                  >
                    <Ionicons
                      color="#94A3B8"
                      name="person-outline"
                      size={20}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      autoCapitalize="words"
                      autoCorrect={false}
                      placeholder="Họ và tên của bạn"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={fullName}
                      onChangeText={(val) => {
                        setFullName(val);
                        clearFieldError('fullName');
                      }}
                    />
                  </View>
                  {errors.fullName ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {errors.fullName}
                    </Text>
                  ) : null}
                </View>

                {/* Email Field */}
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputPill,
                      errors.email ? styles.inputPillError : null,
                    ]}
                  >
                    <Ionicons
                      color="#94A3B8"
                      name="mail-outline"
                      size={20}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      keyboardType="email-address"
                      placeholder="you@example.com"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        clearFieldError('email');
                      }}
                    />
                  </View>
                  {errors.email ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {errors.email}
                    </Text>
                  ) : null}
                </View>

                {/* Phone Field */}
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputPill,
                      errors.phone ? styles.inputPillError : null,
                    ]}
                  >
                    <Ionicons
                      color="#94A3B8"
                      name="call-outline"
                      size={20}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="phone-pad"
                      placeholder="Số điện thoại của bạn"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val);
                        clearFieldError('phone');
                      }}
                    />
                  </View>
                  {errors.phone ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {errors.phone}
                    </Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View style={styles.inputWrapper}>
                  <View
                    style={[
                      styles.inputPill,
                      errors.password ? styles.inputPillError : null,
                    ]}
                  >
                    <Ionicons
                      color="#94A3B8"
                      name="lock-closed-outline"
                      size={20}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      autoCapitalize="none"
                      autoComplete="password"
                      autoCorrect={false}
                      placeholder="Tối thiểu 8 ký tự"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        clearFieldError('password');
                      }}
                    />
                    <Pressable
                      accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.eyeIconButton}
                    >
                      <Ionicons
                        color="#94A3B8"
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                      />
                    </Pressable>
                  </View>
                  {errors.password ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {errors.password}
                    </Text>
                  ) : null}
                </View>

                {/* Remember Me */}
                <View style={styles.optionsRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                    hitSlop={6}
                    onPress={() => setRememberMe((prev) => !prev)}
                    style={styles.rememberMeContainer}
                  >
                    <Ionicons
                      color={rememberMe ? theme.primary : '#CBD5E1'}
                      name={rememberMe ? 'checkbox' : 'square-outline'}
                      size={20}
                    />
                    <Text style={styles.rememberMeText}>Ghi nhớ đăng nhập</Text>
                  </Pressable>
                </View>
              </View>

              {/* Global Error Banner */}
              {displayedError ? (
                <View style={styles.errorBanner}>
                  <Ionicons color="#DC2626" name="alert-circle-outline" size={18} />
                  <Text accessibilityRole="alert" style={styles.errorBannerText}>
                    {displayedError}
                  </Text>
                </View>
              ) : null}

              {/* Main Submit Button */}
              <Pressable
                accessibilityLabel="Tạo tài khoản"
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleRegister}
                style={({ pressed }) => [
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                  pressed && styles.submitButtonPressed,
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                </Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Button (Google only, Apple removed) */}
              <Pressable
                accessibilityLabel="Đăng ký với Google"
                accessibilityRole="button"
                onPress={handleGoogleSignUp}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  source={require('../../../../assets/brand/google-g.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* Hero Section */
  heroSection: {
    flex: 1,
    minHeight: 180,
    backgroundColor: Colors.primary,
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  decorCircleMedium: {
    position: 'absolute',
    bottom: 20,
    left: -35,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorCircleSmall: {
    position: 'absolute',
    top: 60,
    right: 70,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  decorCircleFloat: {
    position: 'absolute',
    bottom: 35,
    right: 40,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  decorCircleDot: {
    position: 'absolute',
    top: 28,
    left: 24,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  decorCircleDot2: {
    position: 'absolute',
    bottom: 70,
    right: 120,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  decorRoadCurve: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
  },
  heroSafeArea: {
    paddingTop: Platform.OS === 'android' ? 12 : 8,
  },
  heroHeader: {
    gap: 8,
  },
  heroGreeting: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: Fonts.sans,
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 33,
    fontFamily: Fonts.sans,
  },
  heroHeadlineAccent: {
    color: TEAL_ACCENT,
    fontWeight: '800',
  },

  /* Bottom White Card */
  bottomCardContainer: {
    backgroundColor: Colors.primary,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four + 4,
    paddingBottom: Spacing.five,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },

  /* Title Area */
  titleArea: {
    alignItems: 'center',
    marginBottom: Spacing.three,
    gap: 6,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Fonts.sans,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleMuted: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Fonts.sans,
  },
  subtitleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.sans,
  },

  /* Form Elements */
  formGroup: {
    gap: Spacing.two,
  },
  inputWrapper: {
    gap: 4,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.three,
  },
  inputPillError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Fonts.sans,
    paddingVertical: 0,
  },
  eyeIconButton: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    paddingLeft: Spacing.two,
    fontFamily: Fonts.sans,
  },

  /* Options Row */
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.sans,
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: Rounded.md,
    padding: Spacing.two,
    gap: 8,
    marginTop: Spacing.one,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontFamily: Fonts.sans,
  },

  /* Submit Button */
  submitButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.sans,
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: Fonts.sans,
  },

  /* Social Button */
  socialButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: Fonts.sans,
  },
});
