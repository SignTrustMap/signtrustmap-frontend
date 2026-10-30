import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  useForgotPassword,
  useResendOtp,
  useResetPassword,
  useVerifyOtp,
} from '@/feature/auth/hooks/use-forgot-password';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAL_ACCENT = '#5EEAD4';
const RESEND_COOLDOWN_SECONDS = 60;

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const forgotPasswordMutation = useForgotPassword();
  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();
  const resetPasswordMutation = useResetPassword();

  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation errors
  const [emailError, setEmailError] = useState<string>();
  const [otpError, setOtpError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [generalError, setGeneralError] = useState<string>();

  // Cooldown for resend OTP
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Track virtual keyboard visibility to prevent covering the form
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsKeyboardVisible(false);
      },
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const changeStep = (nextStep: Step) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGeneralError(undefined);
    setStep(nextStep);
  };

  // Step 1: Send OTP
  const handleRequestOtp = async () => {
    if (forgotPasswordMutation.isPending) return;

    const trimmed = email.trim();
    if (!trimmed || !EMAIL_PATTERN.test(trimmed)) {
      setEmailError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setEmailError(undefined);
    setGeneralError(undefined);

    try {
      const res = await forgotPasswordMutation.mutateAsync({ email: trimmed });
      if (res.otp) {
        setDevOtp(res.otp);
      }
      setCountdown(RESEND_COOLDOWN_SECONDS);
      changeStep('OTP');
    } catch (err: any) {
      setGeneralError(err?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại sau.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (verifyOtpMutation.isPending) return;

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setOtpError('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }
    setOtpError(undefined);
    setGeneralError(undefined);

    try {
      await verifyOtpMutation.mutateAsync({
        email: email.trim(),
        otp: trimmedOtp,
      });
      changeStep('NEW_PASSWORD');
    } catch (err: any) {
      setGeneralError(err?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resendOtpMutation.isPending) return;

    setGeneralError(undefined);
    setOtpError(undefined);
    try {
      const res = await resendOtpMutation.mutateAsync({ email: email.trim() });
      if (res.otp) {
        setDevOtp(res.otp);
      }
      setCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setGeneralError(err?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    }
  };

  // Step 3: Reset Password
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleResetPassword = async () => {
    if (resetPasswordMutation.isPending) return;

    let hasErr = false;
    if (!hasMinLength) {
      setPasswordError('Mật khẩu phải có từ 8 ký tự trở lên.');
      hasErr = true;
    } else if (!hasNumber) {
      setPasswordError('Mật khẩu phải chứa ít nhất một chữ số.');
      hasErr = true;
    } else {
      setPasswordError(undefined);
    }

    if (!passwordsMatch) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      hasErr = true;
    } else {
      setConfirmPasswordError(undefined);
    }

    if (hasErr) return;

    setGeneralError(undefined);
    try {
      await resetPasswordMutation.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: password,
      });
      changeStep('SUCCESS');
    } catch (err: any) {
      setGeneralError(err?.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại OTP.');
    }
  };

  // Subtitle per step
  const getStepSubtitle = () => {
    switch (step) {
      case 'EMAIL':
        return 'Khôi phục quyền truy cập tài khoản';
      case 'OTP':
        return 'Nhập mã xác thực đã gửi về email';
      case 'NEW_PASSWORD':
        return 'Tạo mật khẩu an toàn mới';
      case 'SUCCESS':
        return 'Khôi phục tài khoản thành công';
    }
  };

  const isPending =
    forgotPasswordMutation.isPending ||
    verifyOtpMutation.isPending ||
    resendOtpMutation.isPending ||
    resetPasswordMutation.isPending;

  return (
    <View style={styles.screenContainer}>
      {/* Decorative ambient background motifs across the screen */}
      <View pointerEvents="none" style={styles.decorCircleLarge} />
      <View pointerEvents="none" style={styles.decorCircleMedium} />
      <View pointerEvents="none" style={styles.decorCircleSmall} />
      <View pointerEvents="none" style={styles.decorCircleFloat} />
      <View pointerEvents="none" style={styles.decorCircleDot} />
      <View pointerEvents="none" style={styles.decorCircleDot2} />
      <View pointerEvents="none" style={styles.decorRoadCurve} />

      {/* Top Bar with Back Button and Brand */}
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <View style={styles.topBar}>
          {step !== 'SUCCESS' ? (
            <Pressable
              accessibilityLabel="Quay lại"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                if (step === 'OTP') changeStep('EMAIL');
                else if (step === 'NEW_PASSWORD') changeStep('OTP');
                else router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons color="#FFFFFF" name="arrow-back" size={24} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.topGreeting}>SignTrustMap</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(Spacing.four, insets.bottom + 16),
            },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContainer}>
            {/* Header: Title + Subtitle */}
            <View style={[styles.headerSection, isKeyboardVisible && styles.headerSectionCompact]}>
              <Text style={[styles.heroHeadline, isKeyboardVisible && styles.heroHeadlineCompact]}>
                Quên <Text style={styles.heroHeadlineAccent}>Mật khẩu</Text>
              </Text>
              {!isKeyboardVisible ? (
                <Text style={styles.heroSubtitleText}>{getStepSubtitle()}</Text>
              ) : null}

              {/* Step indicator bar centered on screen (1 - 2 - 3) */}
              {!isKeyboardVisible && step !== 'SUCCESS' ? (
                <View style={styles.stepIndicatorContainer}>
                  <View style={styles.stepIndicatorRow}>
                    <View style={[styles.stepDot, styles.stepDotActive]}>
                      <Text style={styles.stepDotText}>1</Text>
                    </View>
                    <View
                      style={[
                        styles.stepLine,
                        (step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepLineActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.stepDot,
                        (step === 'OTP' || step === 'NEW_PASSWORD') && styles.stepDotActive,
                      ]}
                    >
                      <Text style={styles.stepDotText}>2</Text>
                    </View>
                    <View
                      style={[
                        styles.stepLine,
                        step === 'NEW_PASSWORD' && styles.stepLineActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.stepDot,
                        step === 'NEW_PASSWORD' && styles.stepDotActive,
                      ]}
                    >
                      <Text style={styles.stepDotText}>3</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Centered White Container Card */}
            <View style={styles.centerCard}>
              {/* General Error Banner */}
              {generalError ? (
                <View style={styles.errorBanner}>
                  <Ionicons color="#DC2626" name="alert-circle-outline" size={18} />
                  <Text accessibilityRole="alert" style={styles.errorBannerText}>
                    {generalError}
                  </Text>
                </View>
              ) : null}

              {/* STEP 1: Enter Email */}
              {step === 'EMAIL' ? (
                <View style={styles.stepContent}>
                  <Text style={styles.cardTitle}>Khôi phục mật khẩu</Text>
                  <Text style={styles.cardDesc}>
                    Nhập địa chỉ email tài khoản của bạn để nhận mã OTP gồm 6 chữ số giúp xác thực bảo mật.
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>EMAIL ĐĂNG KÝ</Text>
                    <View
                      style={[
                        styles.inputPill,
                        emailError ? styles.inputPillError : null,
                      ]}
                    >
                      <Ionicons
                        color={emailError ? '#EF4444' : Colors.primary}
                        name="mail-outline"
                        size={18}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        accessibilityLabel="Email đăng ký"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        onChangeText={(txt) => {
                          setEmail(txt);
                          if (emailError) setEmailError(undefined);
                          if (generalError) setGeneralError(undefined);
                        }}
                        placeholder="vidu@domain.com"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        value={email}
                      />
                    </View>
                    {emailError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {emailError}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    accessibilityLabel="Gửi mã xác nhận"
                    accessibilityRole="button"
                    disabled={isPending}
                    onPress={handleRequestOtp}
                    style={({ pressed }) => [
                      styles.submitButton,
                      isPending && styles.submitButtonDisabled,
                      pressed && styles.submitButtonPressed,
                    ]}
                  >
                    {forgotPasswordMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Gửi mã xác nhận</Text>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Quay lại đăng nhập"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => router.replace('/login')}
                    style={styles.backToLoginRow}
                  >
                    <Ionicons color={Colors.primary} name="arrow-back-outline" size={16} />
                    <Text style={styles.backToLoginText}>Quay lại Đăng nhập</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* STEP 2: Enter OTP */}
              {step === 'OTP' ? (
                <View style={styles.stepContent}>
                  <Text style={styles.cardTitle}>Xác thực mã OTP</Text>
                  <Text style={styles.cardDesc}>
                    Mã xác thực 6 chữ số đã được gửi đến email{' '}
                    <Text style={styles.highlightEmail}>{email}</Text>. Vui lòng kiểm tra hộp thư đến hoặc mục thư rác.
                  </Text>

                  {/* Dev OTP Helper */}
                  {devOtp ? (
                    <Pressable
                      onPress={() => {
                        setOtp(devOtp);
                        setOtpError(undefined);
                      }}
                      style={styles.devOtpBadge}
                    >
                      <Ionicons color="#0284C7" name="flash-outline" size={16} />
                      <Text style={styles.devOtpText}>
                        DEV OTP: <Text style={styles.devOtpCode}>{devOtp}</Text> (Chạm để tự điền)
                      </Text>
                    </Pressable>
                  ) : null}

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>MÃ XÁC THỰC (6 CHỮ SỐ)</Text>
                    <View
                      style={[
                        styles.inputPill,
                        otpError ? styles.inputPillError : null,
                      ]}
                    >
                      <Ionicons
                        color={otpError ? '#EF4444' : Colors.primary}
                        name="key-outline"
                        size={18}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        accessibilityLabel="Mã OTP"
                        keyboardType="number-pad"
                        maxLength={6}
                        onChangeText={(txt) => {
                          setOtp(txt);
                          if (otpError) setOtpError(undefined);
                          if (generalError) setGeneralError(undefined);
                        }}
                        placeholder="••••••"
                        placeholderTextColor="#94A3B8"
                        style={[styles.textInput, styles.otpTextInput]}
                        value={otp}
                      />
                    </View>
                    {otpError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {otpError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Resend OTP Row */}
                  <View style={styles.resendRow}>
                    <Text style={styles.resendLabel}>Chưa nhận được mã?</Text>
                    <Pressable
                      accessibilityLabel="Gửi lại mã OTP"
                      accessibilityRole="button"
                      disabled={countdown > 0 || resendOtpMutation.isPending}
                      hitSlop={6}
                      onPress={handleResendOtp}
                    >
                      <Text
                        style={[
                          styles.resendLink,
                          countdown > 0 && styles.resendLinkDisabled,
                        ]}
                      >
                        {countdown > 0
                          ? `Gửi lại sau (${countdown}s)`
                          : resendOtpMutation.isPending
                          ? 'Đang gửi...'
                          : 'Gửi lại mã'}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityLabel="Xác thực mã OTP"
                    accessibilityRole="button"
                    disabled={isPending}
                    onPress={handleVerifyOtp}
                    style={({ pressed }) => [
                      styles.submitButton,
                      isPending && styles.submitButtonDisabled,
                      pressed && styles.submitButtonPressed,
                    ]}
                  >
                    {verifyOtpMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Xác thực & Tiếp tục</Text>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Đổi email khác"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => changeStep('EMAIL')}
                    style={styles.secondaryActionRow}
                  >
                    <Text style={styles.secondaryActionText}>Đổi email nhận mã khác</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* STEP 3: Enter New Password */}
              {step === 'NEW_PASSWORD' ? (
                <View style={styles.stepContent}>
                  <Text style={styles.cardTitle}>Đặt lại mật khẩu</Text>
                  <Text style={styles.cardDesc}>
                    Thiết lập mật khẩu mới an toàn cho tài khoản của bạn.
                  </Text>

                  {/* New Password Input */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>MẬT KHẨU MỚI</Text>
                    <View
                      style={[
                        styles.inputPill,
                        passwordError ? styles.inputPillError : null,
                      ]}
                    >
                      <Ionicons
                        color={passwordError ? '#EF4444' : Colors.primary}
                        name="lock-closed-outline"
                        size={18}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        accessibilityLabel="Mật khẩu mới"
                        autoCapitalize="none"
                        onChangeText={(txt) => {
                          setPassword(txt);
                          if (passwordError) setPasswordError(undefined);
                          if (generalError) setGeneralError(undefined);
                        }}
                        placeholder="Tối thiểu 8 ký tự"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        style={styles.textInput}
                        value={password}
                      />
                      <Pressable
                        hitSlop={8}
                        onPress={() => setShowPassword((prev) => !prev)}
                        style={styles.eyeIconButton}
                      >
                        <Ionicons
                          color="#94A3B8"
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                        />
                      </Pressable>
                    </View>
                    {passwordError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {passwordError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU MỚI</Text>
                    <View
                      style={[
                        styles.inputPill,
                        confirmPasswordError ? styles.inputPillError : null,
                      ]}
                    >
                      <Ionicons
                        color={confirmPasswordError ? '#EF4444' : Colors.primary}
                        name="lock-closed-outline"
                        size={18}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        accessibilityLabel="Xác nhận mật khẩu mới"
                        autoCapitalize="none"
                        onChangeText={(txt) => {
                          setConfirmPassword(txt);
                          if (confirmPasswordError) setConfirmPasswordError(undefined);
                          if (generalError) setGeneralError(undefined);
                        }}
                        placeholder="Nhập lại mật khẩu"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showConfirmPassword}
                        style={styles.textInput}
                        value={confirmPassword}
                      />
                      <Pressable
                        hitSlop={8}
                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                        style={styles.eyeIconButton}
                      >
                        <Ionicons
                          color="#94A3B8"
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                        />
                      </Pressable>
                    </View>
                    {confirmPasswordError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {confirmPasswordError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Password Checklist */}
                  <View style={styles.checklistCard}>
                    <View style={styles.checklistItem}>
                      <Ionicons
                        color={hasMinLength ? '#10B981' : '#CBD5E1'}
                        name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.checklistText,
                          hasMinLength && styles.checklistTextValid,
                        ]}
                      >
                        Tối thiểu 8 ký tự
                      </Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Ionicons
                        color={hasNumber ? '#10B981' : '#CBD5E1'}
                        name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.checklistText,
                          hasNumber && styles.checklistTextValid,
                        ]}
                      >
                        Chứa ít nhất 1 chữ số (0-9)
                      </Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Ionicons
                        color={passwordsMatch ? '#10B981' : '#CBD5E1'}
                        name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.checklistText,
                          passwordsMatch && styles.checklistTextValid,
                        ]}
                      >
                        Mật khẩu xác nhận trùng khớp
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityLabel="Lưu mật khẩu mới"
                    accessibilityRole="button"
                    disabled={isPending || !hasMinLength || !hasNumber || !passwordsMatch}
                    onPress={handleResetPassword}
                    style={({ pressed }) => [
                      styles.submitButton,
                      (isPending || !hasMinLength || !hasNumber || !passwordsMatch) &&
                        styles.submitButtonDisabled,
                      pressed && styles.submitButtonPressed,
                    ]}
                  >
                    {resetPasswordMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Lưu mật khẩu mới</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {/* STEP 4: Success */}
              {step === 'SUCCESS' ? (
                <View style={styles.successContent}>
                  <View style={styles.successIconOuter}>
                    <View style={styles.successIconInner}>
                      <Ionicons color="#FFFFFF" name="checkmark" size={36} />
                    </View>
                  </View>

                  <Text style={styles.successTitle}>Đổi mật khẩu thành công!</Text>
                  <Text style={styles.successDesc}>
                    Mật khẩu của tài khoản{' '}
                    <Text style={styles.highlightEmail}>{email}</Text> đã được cập nhật thành công.
                    Bạn có thể đăng nhập ngay với mật khẩu mới.
                  </Text>

                  <Pressable
                    accessibilityLabel="Đăng nhập ngay"
                    accessibilityRole="button"
                    onPress={() => router.replace('/login')}
                    style={({ pressed }) => [
                      styles.submitButton,
                      styles.successButton,
                      pressed && styles.submitButtonPressed,
                    ]}
                  >
                    <Text style={styles.submitButtonText}>Đăng nhập ngay</Text>
                  </Pressable>
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
    backgroundColor: Colors.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  topSafeArea: {
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGreeting: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: Fonts.sans,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    gap: Spacing.four,
  },
  headerSection: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  headerSectionCompact: {
    gap: 2,
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 33,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  heroHeadlineCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
  heroHeadlineAccent: {
    color: TEAL_ACCENT,
    fontWeight: '800',
  },
  heroSubtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },

  /* Ambient Decorative Shapes */
  decorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircleMedium: {
    position: 'absolute',
    bottom: 30,
    left: -35,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircleSmall: {
    position: 'absolute',
    top: 90,
    right: 60,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorCircleFloat: {
    position: 'absolute',
    top: 140,
    left: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorCircleDot: {
    position: 'absolute',
    top: 80,
    left: 40,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  decorCircleDot2: {
    position: 'absolute',
    bottom: 120,
    right: 40,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  decorRoadCurve: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    borderWidth: 2,
  },

  /* Step Indicator Row */
  stepIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    maxWidth: '85%',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.sans,
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 8,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: TEAL_ACCENT,
  },

  /* Centered White Container Card */
  centerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: Spacing.four + 4,
    paddingVertical: Spacing.four + 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
  },

  stepContent: {
    gap: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Fonts.sans,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
  highlightEmail: {
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Inputs */
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    fontFamily: Fonts.sans,
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
  otpTextInput: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
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

  /* DEV OTP Badge */
  devOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: Rounded.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  devOtpText: {
    fontSize: 12,
    color: '#0369A1',
    fontFamily: Fonts.sans,
  },
  devOtpCode: {
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* Resend Row */
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.sans,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.sans,
  },
  resendLinkDisabled: {
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Password Checklist */
  checklistCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Rounded.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Fonts.sans,
  },
  checklistTextValid: {
    color: '#10B981',
    fontWeight: '600',
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
    marginBottom: 8,
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
    marginTop: 8,
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
    opacity: 0.55,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Fonts.sans,
  },

  /* Back To Login */
  backToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.sans,
  },

  secondaryActionRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Fonts.sans,
    textDecorationLine: 'underline',
  },

  /* Success View */
  successContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  successButton: {
    width: '100%',
    marginTop: 16,
  },
});
