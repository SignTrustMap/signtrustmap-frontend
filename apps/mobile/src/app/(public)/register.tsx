import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/button';
import { AppInput } from '@/components/ui/input';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useRegister } from '@/feature/auth/hooks/use-register';
import { useTheme } from '@/hooks/use-theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = Partial<Record<'email' | 'password' | 'fullName' | 'phone', string>>;

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const registerMutation = useRegister();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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
      email: EMAIL_PATTERN.test(email.trim()) ? undefined : 'Enter a valid email address.',
      fullName: fullName.trim() ? undefined : 'Enter your full name.',
      password: password.length >= 8 ? undefined : 'Use at least 8 characters.',
      phone: phone.trim() ? undefined : 'Enter your phone number.',
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    setFormError(undefined);
    try {
      await registerMutation.mutateAsync({ email, password, fullName, phone });
      router.replace({ pathname: '/login', params: { registered: 'true' } });
    } catch {
      // The mutation exposes backend and connection errors to the form.
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.logo, { backgroundColor: theme.primary }]}>
              <Text style={[styles.logoText, { color: theme.onPrimary }]}>STM</Text>
            </View>
            <ThemedText style={styles.title}>Create your account</ThemedText>
            <ThemedText type="small" style={styles.subtitle}>
              Register to start using SignTrustMap.
            </ThemedText>

            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
              <AppInput
                error={errors.fullName}
                label="Full name"
                onChangeText={(value) => { setFullName(value); clearFieldError('fullName'); }}
                placeholder="Your full name"
                value={fullName}
              />
              <AppInput
                autoCorrect={false}
                error={errors.email}
                label="Email address"
                onChangeText={(value) => { setEmail(value); clearFieldError('email'); }}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
              <AppInput
                error={errors.phone}
                label="Phone number"
                onChangeText={(value) => { setPhone(value); clearFieldError('phone'); }}
                placeholder="Your phone number"
                type="phone"
                value={phone}
              />
              <AppInput
                error={errors.password}
                label="Password"
                onChangeText={(value) => { setPassword(value); clearFieldError('password'); }}
                placeholder="At least 8 characters"
                type="password"
                value={password}
              />
              {displayedError ? <Text accessibilityRole="alert" style={styles.errorText}>{displayedError}</Text> : null}
              <AppButton
                disabled={isSubmitting}
                label={isSubmitting ? 'Creating account...' : 'Create account'}
                onPress={handleRegister}
              />
            </ThemedView>

            <View style={styles.loginRow}>
              <Text style={[styles.footerText, { color: theme.text }]}>Already have an account?</Text>
              <Pressable accessibilityRole="button" onPress={() => router.replace('/login')}>
                <Text style={[styles.linkText, { color: theme.primary }]}> Log in</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
  logo: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: Rounded.lg },
  logoText: { fontFamily: Fonts.title, fontSize: 16, fontWeight: 800 },
  title: { fontFamily: Fonts.title, fontSize: 28, fontWeight: 700, lineHeight: 36, textAlign: 'center' },
  subtitle: { marginBottom: Spacing.two, textAlign: 'center' },
  card: { alignSelf: 'stretch', borderWidth: 1, borderRadius: Rounded.lg, gap: Spacing.three, padding: Spacing.four },
  errorText: { color: '#C62828', fontFamily: Fonts.body, fontSize: 13, fontWeight: 600, lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.two },
  footerText: { fontFamily: Fonts.body, fontSize: 13 },
  linkText: { fontFamily: Fonts.body, fontSize: 13, fontWeight: 700 },
});
