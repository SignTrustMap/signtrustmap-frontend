import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfile, updateProfile } from '@/api/auth/auth';
import { AppButton } from '@/components/button';
import { AppInput } from '@/components/input';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';

import { AvatarCropModal } from '../components/avatar-crop-modal';
import { editProfileSchema, type EditProfileFormData } from '../schemas/edit-profile.schema';

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

  const [avatarUrl, setAvatarUrl] = useState<string | null>(session?.account.avatarUrl ?? null);
  const [tempAvatarUri, setTempAvatarUri] = useState<string | null>(null);
  const [selectedPickerUri, setSelectedPickerUri] = useState<string | null>(null);
  const [isCropModalVisible, setIsCropModalVisible] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: session?.account.displayName ?? '',
      phone: '',
      address: session?.account.address ?? '',
    },
  });

  const fullName = watch('fullName');

  useEffect(() => {
    let isMounted = true;
    if (session?.accessToken) {
      getProfile(session.accessToken)
        .then((profile) => {
          if (isMounted) {
            reset({
              fullName: profile.fullName || session?.account.displayName || '',
              phone: profile.phone || '',
              address: profile.address || session?.account.address || '',
            });
            if (profile.avatarUrl !== undefined) {
              setAvatarUrl(profile.avatarUrl ?? null);
              if (profile.avatarUrl && profile.avatarUrl !== session.account.avatarUrl) {
                void updateAccount?.({
                  avatarUrl: profile.avatarUrl,
                  ...(profile.address ? { address: profile.address } : {}),
                });
              }
            }
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
  }, [session?.accessToken, reset]);

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Quyền truy cập thư viện',
          'Vui lòng cấp quyền truy cập thư viện ảnh để cập nhật ảnh đại diện.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedPickerUri(result.assets[0].uri);
        setIsCropModalVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh: ' + (err.message || ''));
    }
  };

  const handleCropConfirm = (croppedUri: string) => {
    setTempAvatarUri(croppedUri);
    setIsCropModalVisible(false);
    setSelectedPickerUri(null);
  };

  const handleCropCancel = () => {
    setIsCropModalVisible(false);
    setSelectedPickerUri(null);
  };

  const handleSave = handleSubmit(async (formData: EditProfileFormData) => {
    if (!session?.accessToken) {
      Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ.');
      return;
    }

    setIsSaving(true);
    try {
      const finalAvatar = tempAvatarUri !== null ? tempAvatarUri : (avatarUrl ?? undefined);
      // 1. Update database record via backend API
      const updated = await updateProfile(
        {
          fullName: formData.fullName.trim(),
          phone: formData.phone?.trim() ? formData.phone.trim() : undefined,
          address: formData.address?.trim() ? formData.address.trim() : undefined,
          avatarUrl: finalAvatar,
        },
        session.accessToken,
      );

      // 2. Synchronize returned updates with local session storage
      const newDisplayName = updated.fullName || formData.fullName.trim();
      const newAvatarUrl = updated.avatarUrl !== undefined ? updated.avatarUrl : finalAvatar;
      const newAddress =
        updated.address !== undefined
          ? updated.address
          : formData.address?.trim()
            ? formData.address.trim()
            : undefined;
      await updateAccount?.({
        displayName: newDisplayName,
        avatarUrl: newAvatarUrl,
        address: newAddress,
      });

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
  });

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
              <Pressable
                accessibilityHint="Chạm để chọn và điều chỉnh ảnh đại diện mới"
                accessibilityLabel="Thay đổi ảnh đại diện"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={handlePickAvatar}
                style={styles.avatarWrapper}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.secondary, borderColor: theme.primary },
                  ]}
                >
                  {tempAvatarUri || avatarUrl ? (
                    <Image
                      resizeMode="cover"
                      source={{ uri: tempAvatarUri || avatarUrl! }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {getInitials(fullName || session?.account.displayName)}
                    </Text>
                  )}
                </View>

                {/* White plus icon in black circular background at bottom right of avatar */}
                <View style={styles.plusBadge}>
                  <MaterialCommunityIcons color="#FFFFFF" name="plus" size={16} />
                </View>
              </Pressable>

              <Text style={[styles.avatarHint, { color: theme.grey }]}>
                {tempAvatarUri
                  ? 'Ảnh mới (chưa lưu, nhấn Lưu thay đổi bên dưới)'
                  : 'Chạm vào ảnh để thay đổi ảnh đại diện'}
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
                  <MaterialCommunityIcons color={theme.grey} name="account-outline" size={20} />
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Họ và tên</Text>
                  <Text style={[styles.requiredBadge, { color: theme.danger }]}>*</Text>
                </View>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      accessibilityLabel="Họ và tên"
                      autoComplete="name"
                      autoCapitalize="words"
                      containerStyle={[
                        styles.inputContainer,
                        { borderColor: errors.fullName ? theme.danger : '#666', backgroundColor: theme.surface },
                      ]}
                      editable={!isSaving}
                      error={errors.fullName?.message}
                      maxLength={100}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Nhập họ và tên của bạn"
                      placeholderTextColor={theme.placeholder}
                      value={value}
                    />
                  )}
                />
              </View>

              {/* Phone Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons color={theme.grey} name="phone-outline" size={20} />
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Số điện thoại</Text>
                </View>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      accessibilityLabel="Số điện thoại"
                      containerStyle={[
                        styles.inputContainer,
                        { borderColor: errors.phone ? theme.danger : '#666', backgroundColor: theme.surface },
                      ]}
                      editable={!isSaving}
                      error={errors.phone?.message}
                      keyboardType="phone-pad"
                      maxLength={20}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Nhập số điện thoại liên hệ"
                      placeholderTextColor={theme.placeholder}
                      type="phone"
                      value={value}
                    />
                  )}
                />
              </View>

              {/* Address Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons color={theme.grey} name="map-marker-outline" size={20} />
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Địa chỉ</Text>
                </View>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      accessibilityLabel="Địa chỉ"
                      autoCapitalize="sentences"
                      containerStyle={[
                        styles.inputContainer,
                        { borderColor: errors.address ? theme.danger : '#666', backgroundColor: theme.surface },
                      ]}
                      editable={!isSaving}
                      error={errors.address?.message}
                      maxLength={200}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Nhập địa chỉ của bạn"
                      placeholderTextColor={theme.placeholder}
                      value={value}
                    />
                  )}
                />
              </View>

              {/* Email (Read-only) Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons color={theme.grey} name="email-outline" size={20} />
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Email</Text>
                  <Text style={[styles.lockedBadge, { color: theme.grey }]}>
                    (Không thể thay đổi)
                  </Text>
                </View>
                <AppInput
                  accessibilityLabel="Email"
                  containerStyle={[
                    styles.inputContainer,
                    styles.disabledInputContainer,
                    { borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  editable={false}
                  keyboardType="email-address"
                  style={{ color: theme.placeholder }}
                  trailingIcon={
                    <MaterialCommunityIcons
                      color={theme.placeholder}
                      name="lock-outline"
                      size={16}
                    />
                  }
                  type="email"
                  value={email}
                />
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.saveActionContainer}>
              <AppButton
                accessibilityLabel="Lưu thông tin hồ sơ"
                disabled={isSaving || !fullName?.trim()}
                onPress={handleSave}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isSaving || !fullName?.trim() ? 0.6 : 1,
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={theme.onPrimary} size="small" />
                ) : (
                  <View style={styles.saveButtonContent}>
                    <MaterialCommunityIcons
                      color={theme.onPrimary}
                      name="content-save-outline"
                      size={20}
                    />
                    <Text style={[styles.saveButtonText, { color: theme.onPrimary }]}>
                      Lưu thay đổi
                    </Text>
                  </View>
                )}
              </AppButton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <AvatarCropModal
          imageUri={selectedPickerUri}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          visible={isCropModalVisible}
        />
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
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.two,
    alignSelf: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
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
    borderRadius: Rounded.lg,
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
