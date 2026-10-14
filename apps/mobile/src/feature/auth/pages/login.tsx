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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useLogin } from '@/feature/auth/hooks/use-login';
import { useTheme } from '@/hooks/use-theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THEME_TEAL = '#007B8B';
const TEAL_ACCENT = '#5EEAD4';

export default function LoginScreen() {
  const loginMutation = useLogin();
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string>();
  const [showDevLogin, setShowDevLogin] = useState(true);

  const isSubmitting = loginMutation.isPending;
  const displayedLoginError = loginError ?? loginMutation.error?.message;

  const handleLogIn = async () => {
    if (isSubmitting) return;
    const nextErrors = {
      email: EMAIL_PATTERN.test(email.trim()) ? undefined : 'Email không hợp lệ.',
      password: password.length > 1 ? undefined : 'Mật khẩu phải có từ 2 ký tự trở lên.',
    };

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setLoginError(undefined);
    try {
      await loginMutation.mutateAsync({ email: email.trim(), password });
      router.replace('/');
    } catch {
      // The mutation exposes request and session-storage errors to the form.
    }
  };

  const handleGoogleLogIn = () => {
    setLoginError('Đăng nhập Google hiện chưa khả dụng trên ứng dụng di động.');
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    if (isSubmitting) return;
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrors({});
    setLoginError(undefined);
    loginMutation.reset();
    try {
      await loginMutation.mutateAsync({ email: quickEmail, password: quickPass });
      router.replace('/');
    } catch {}
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
            {/* Subtle decorative curved background motifs */}
            <View style={styles.decorCircleLarge} />
            <View style={styles.decorCircleSmall} />
            <View style={styles.decorRoadCurve} />

            <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroGreeting}>SignTrustMap</Text>
                <Text style={styles.heroHeadline}>
                  Đăng nhập để{' '}
                  <Text style={styles.heroHeadlineAccent}>nắm bắt</Text>
                  {'\n'}mọi nhiệm vụ và dự án.
                </Text>
              </View>
            </SafeAreaView>
          </View>

          {/* Bottom Card Section */}
          <View style={styles.bottomCardContainer}>
            <View style={styles.bottomCard}>
              {/* Form Title & Subtitle */}
              <View style={styles.titleArea}>
                <Text style={styles.cardTitle}>Đăng nhập</Text>
                <View style={styles.subtitleRow}>
                  <Text style={styles.subtitleMuted}>Chưa có tài khoản?</Text>
                  <Pressable
                    accessibilityLabel="Đăng ký"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => router.push('/register')}
                  >
                    <Text style={styles.subtitleLink}> Đăng ký</Text>
                  </Pressable>
                </View>
              </View>

              {/* Form Inputs */}
              <View style={styles.formGroup}>
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
                      placeholder="demo@stm.dev"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (!isSubmitting) loginMutation.reset();
                        setLoginError(undefined);
                        setErrors((curr) => ({ ...curr, email: undefined }));
                      }}
                    />
                  </View>
                  {errors.email ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {errors.email}
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
                      placeholder="Nhập mật khẩu của bạn"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (!isSubmitting) loginMutation.reset();
                        setLoginError(undefined);
                        setErrors((curr) => ({ ...curr, password: undefined }));
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

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                    hitSlop={6}
                    onPress={() => setRememberMe((prev) => !prev)}
                    style={styles.rememberMeContainer}
                  >
                    <Ionicons
                      color={rememberMe ? THEME_TEAL : '#CBD5E1'}
                      name={rememberMe ? 'checkbox' : 'square-outline'}
                      size={20}
                    />
                    <Text style={styles.rememberMeText}>Ghi nhớ đăng nhập</Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Quên mật khẩu?"
                    accessibilityRole="button"
                    hitSlop={6}
                  >
                    <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                  </Pressable>
                </View>
              </View>

              {/* Global Error Banner */}
              {displayedLoginError ? (
                <View style={styles.errorBanner}>
                  <Ionicons color="#DC2626" name="alert-circle-outline" size={18} />
                  <Text accessibilityRole="alert" style={styles.errorBannerText}>
                    {displayedLoginError}
                  </Text>
                </View>
              ) : null}

              {/* Main Submit Button */}
              <Pressable
                accessibilityLabel="Đăng nhập"
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleLogIn}
                style={({ pressed }) => [
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                  pressed && styles.submitButtonPressed,
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
                accessibilityLabel="Đăng nhập với Google"
                accessibilityRole="button"
                onPress={handleGoogleLogIn}
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

              {/* Dev Quick Login Section */}
              {__DEV__ ? (
                <View style={styles.devContainer}>
                  <View style={styles.devHeaderRow}>
                    <Text style={styles.devHeader}>ĐĂNG NHẬP NHANH (DEV)</Text>
                    <Pressable
                      accessibilityLabel={showDevLogin ? 'Ẩn Mock' : 'Hiện Mock'}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => setShowDevLogin((prev) => !prev)}
                      style={styles.devToggleBtn}
                    >
                      <Ionicons
                        color="#64748B"
                        name={showDevLogin ? 'eye-off-outline' : 'eye-outline'}
                        size={14}
                      />
                      <Text style={styles.devToggleText}>
                        {showDevLogin ? 'Ẩn Mock' : 'Hiện Mock'}
                      </Text>
                    </Pressable>
                  </View>

                  {showDevLogin ? (
                    <>
                      <View style={styles.devButtonsRow}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={isSubmitting}
                          onPress={() => handleQuickLogin('demo@stm.dev', 'Demo@123')}
                          style={({ pressed }) => [
                            styles.devChip,
                            pressed && { opacity: 0.7 },
                          ]}
                        >
                          <Text style={styles.devChipText}>Demo (All roles)</Text>
                        </Pressable>
                      </View>

                      <Text style={styles.devSubheader}>Reviewer (TEST ĐỒNG THUẬN)</Text>
                      <View style={styles.reviewerGrid}>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <Pressable
                            key={num}
                            accessibilityRole="button"
                            disabled={isSubmitting}
                            onPress={() => handleQuickLogin(`reviewer${num}@stm.dev`, 'Reviewer@123')}
                            style={({ pressed }) => [
                              styles.reviewerChip,
                              pressed && { opacity: 0.7 },
                            ]}
                          >
                            <Text style={styles.reviewerChipText}>Reviewer {num}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  ) : null}
                </View>
              ) : null}
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
    backgroundColor: THEME_TEAL,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  /* Hero Section */
  heroSection: {
    minHeight: 220,
    backgroundColor: THEME_TEAL,
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    justifyContent: 'flex-end',
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
  },
  decorCircleSmall: {
    position: 'absolute',
    top: 60,
    right: 80,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorRoadCurve: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
  },
  heroSafeArea: {
    paddingTop: Platform.OS === 'android' ? 24 : 8,
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
    flex: 1,
    backgroundColor: THEME_TEAL,
  },
  bottomCard: {
    flex: 1,
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
    color: THEME_TEAL,
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
    justifyContent: 'space-between',
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
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_TEAL,
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
    backgroundColor: THEME_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    shadowColor: THEME_TEAL,
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

  /* Dev Section */
  devContainer: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: Spacing.two,
  },
  devHeader: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  devHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  devToggleText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  devButtonsRow: {
    flexDirection: 'row',
  },
  devChip: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devChipText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  devSubheader: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  reviewerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewerChip: {
    minWidth: '28%',
    flexGrow: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerChipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
});
