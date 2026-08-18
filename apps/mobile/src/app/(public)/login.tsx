import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { AppButton } from '@/components/ui/button';
import { AppInput } from '@/components/ui/input';
import { useSession } from '@/context/session-provider';
import { createFakeSession } from '@/feature/auth/data/fake-session';
import { useTheme } from '@/hooks/use-theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { logIn } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogIn = async () => {
    const nextErrors = {
      email: EMAIL_PATTERN.test(email.trim()) ? undefined : 'Must be a valid email address.',
      password: password.length > 1 ? undefined : 'Password must be greater than 1 character.',
    };

    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    await logIn(createFakeSession(email.trim()));
    router.replace('/');
  };

  const handleGoogleLogIn = async () => {
    await logIn(createFakeSession());
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.tertiary }]}>
            <View style={[styles.imageGlyph, { borderColor: theme.onTertiary }]}>
              <View style={[styles.imageMountain, { borderColor: theme.onTertiary }]} />
            </View>
          </View>

          <ThemedText style={styles.title}>SignTrustMap</ThemedText>
          <ThemedText type="small" style={styles.subtitle}>
            Welcome back. Please enter your details.
          </ThemedText>

          <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
            <AppInput
              autoCorrect={false}
              error={errors.email}
              label="Email Address"
              onChangeText={(value) => {
                setEmail(value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="driver@example.com"
              type="email"
              value={email}
            />
            <AppInput
              error={errors.password}
              label="Password"
              onChangeText={(value) => {
                setPassword(value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="Enter your password"
              type="password"
              value={password}
            />
            <Pressable accessibilityRole="button" style={styles.forgotPassword}>
              <Text style={[styles.linkText, { color: theme.tertiary }]}>Forgot Password?</Text>
            </Pressable>
            <AppButton label="Login" onPress={handleLogIn} style={styles.loginButton} />
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.googleButton,
                { borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={handleGoogleLogIn}
            >
              <Image
                accessibilityIgnoresInvertColors
                source={require('../../../assets/brand/google-g.png')}
                style={styles.googleIcon}
              />
              <Text style={[styles.googleText, { color: theme.text }]}>Log in with google</Text>
            </Pressable>
          </ThemedView>

          <View style={styles.signupRow}>
            <Text style={[styles.footerText, { color: theme.text }]}>Don&apos;t have an account?</Text>
            <Pressable accessibilityRole="button">
              <Text style={[styles.linkText, { color: theme.tertiary }]}> Sign Up</Text>
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  imageGlyph: {
    width: 28,
    height: 24,
    borderWidth: 2,
    borderRadius: Rounded.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  imageMountain: {
    width: 18,
    height: 18,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: '45deg' }, { translateX: 5 }, { translateY: 5 }],
  },
  title: {
    textAlign: 'center',
    fontFamily: Fonts.title,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 38,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  card: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: Rounded.lg,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  linkText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 700,
  },
  loginButton: {
    alignSelf: 'stretch',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.one,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  googleButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Rounded.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  googleText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 700,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
});
