import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { AppButton } from '@/components/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { getProfile, updateProfile } from '@/api/auth/auth';

function getInitials(displayName?: string) {
  if (!displayName) return 'ST';

  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function EditProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, updateAccount } = useSession();

  const [fullName, setFullName] = useState(session?.account.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (session?.accessToken) {
      getProfile(session.accessToken)
        .then((profile) => {
          if (isMounted) {
            if (profile.fullName) setFullName(profile.fullName);
            if (profile.phone) setPhone(profile.phone);
          }
        })
        .catch(() => {
          // Fallback to session details
        })
        .finally(() => {
          if (isMounted) setIsLoadingProfile(false);
        });
    } else {
      setIsLoadingProfile(false);
    }
    return () => {
      isMounted = false;
    };
  }, [session?.accessToken]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thông báo', 'Họ và tên không được để trống.');
      return;
    }

    if (!session?.accessToken) {
      Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateProfile(
        {
          fullName: fullName.trim(),
          phone: phone.trim() ? phone.trim() : undefined,
        },
        session.accessToken,
      );

      const newDisplayName = updated.fullName || fullName.trim();
      await updateAccount?.({ displayName: newDisplayName });

      Alert.alert('Thành công', 'Thông tin tài khoản đã được cập nhật.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const email = session?.account.email ?? '';

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <Pressable
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: theme.text }]}>Chỉnh sửa hồ sơ</Text>
          <View style={styles.topBarRight} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.secondary, borderColor: theme.primary },
                ]}
              >
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {getInitials(fullName || session?.account.displayName)}
                </Text>
              </View>
              <Text style={[styles.avatarHint, { color: theme.grey }]}>
                Ảnh đại diện dựa trên tên tài khoản
              </Text>
            </View>

            {isLoadingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.primary} size="small" />
                <Text style={[styles.loadingText, { color: theme.grey }]}>
                  Đang tải thông tin...
                </Text>
              </View>
            ) : null}

            {/* Form Fields Card */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              {/* Full Name Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Họ và tên</Text>
                  <Text style={[styles.requiredBadge, { color: theme.danger }]}>*</Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={theme.grey}
                    name="account-outline"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    autoCapitalize="words"
                    editable={!isSaving}
                    maxLength={100}
                    onChangeText={setFullName}
                    placeholder="Nhập họ và tên của bạn"
                    placeholderTextColor={theme.placeholder}
                    style={[styles.input, { color: theme.text }]}
                    value={fullName}
                  />
                </View>
              </View>

              {/* Phone Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Số điện thoại</Text>
                <View
                  style={[
                    styles.inputContainer,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={theme.grey}
                    name="phone-outline"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    editable={!isSaving}
                    keyboardType="phone-pad"
                    maxLength={20}
                    onChangeText={setPhone}
                    placeholder="Nhập số điện thoại liên hệ"
                    placeholderTextColor={theme.placeholder}
                    style={[styles.input, { color: theme.text }]}
                    value={phone}
                  />
                </View>
              </View>

              {/* Email (Read-only) Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Email</Text>
                  <Text style={[styles.lockedBadge, { color: theme.grey }]}>
                    (Không thể thay đổi)
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    styles.disabledInputContainer,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={theme.placeholder}
                    name="email-outline"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    editable={false}
                    style={[styles.input, { color: theme.placeholder }]}
                    value={email}
                  />
                  <MaterialCommunityIcons
                    color={theme.placeholder}
                    name="lock-outline"
                    size={16}
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.saveActionContainer}>
              <AppButton
                accessibilityLabel="Lưu thông tin hồ sơ"
                disabled={isSaving || !fullName.trim()}
                onPress={handleSave}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isSaving || !fullName.trim() ? 0.6 : 1,
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={theme.onPrimary} size="small" />
                ) : (
                  <View style={styles.saveButtonContent}>
                    <MaterialCommunityIcons color={theme.onPrimary} name="content-save-outline" size={20} />
                    <Text style={[styles.saveButtonText, { color: theme.onPrimary }]}>
                      Lưu thay đổi
                    </Text>
                  </View>
                )}
              </AppButton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '800',
  },
  topBarRight: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  avatarText: {
    fontFamily: Fonts.title,
    fontSize: 32,
    fontWeight: '700',
  },
  avatarHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  formCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.four,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  requiredBadge: {
    fontSize: 14,
    fontWeight: '700',
  },
  lockedBadge: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    minHeight: 46,
  },
  disabledInputContainer: {
    opacity: 0.8,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingVertical: Spacing.two,
  },
  saveActionContainer: {
    marginTop: Spacing.two,
  },
  saveButton: {
    minHeight: 50,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  saveButtonText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '800',
  },
});
