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
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfile, updateProfile } from '@/api/auth/auth';
import { AppButton } from '@/components/button';
import { AppInput } from '@/components/input';
import { PrimaryGradientBackdrop } from '@/components/primary-gradient-backdrop';
import { useSession } from '@/context/session-provider';
import { useTheme } from '@/hooks/use-theme';

import { AddressAutocompleteField } from '../components/address-autocomplete-field';
import { AvatarCropModal } from '../components/avatar-crop-modal';
import { useAddressAutocomplete } from '../hooks/use-address-autocomplete';
import { editProfileSchema, type EditProfileFormData } from '../schemas/edit-profile.schema';
import { styles } from '../styles/edit-profile-screen.styles';

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
    setValue,
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

  const {
    addressInput,
    addressSuggestions,
    focusRequestId,
    handleAddressTextChange,
    handleClearAddress,
    handleMapConfirm,
    handleSelectPlace,
    hydrateFromInitialAddress,
    isLoadingSuggestions,
    isMapPickerOpen,
    isSuggestionsVisible,
    selectedCoordinate,
    setIsMapPickerOpen,
    setIsSuggestionsVisible,
  } = useAddressAutocomplete({
    initialAddress: session?.account.address ?? '',
    onSyncAddress: (addr) =>
      setValue('address', addr, { shouldValidate: true, shouldDirty: true }),
  });

  const fullName = watch('fullName');

  useEffect(() => {
    let isMounted = true;
    if (session?.accessToken) {
      getProfile(session.accessToken)
        .then((profile) => {
          if (isMounted) {
            const initialAddr = profile.address || session?.account.address || '';
            reset({
              fullName: profile.fullName || session?.account.displayName || '',
              phone: profile.phone || '',
              address: initialAddr,
            });
            hydrateFromInitialAddress(initialAddr);

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
  }, [session?.accessToken, reset, hydrateFromInitialAddress]);

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
    <View style={[styles.screen, { backgroundColor: theme.primary }]}>
      <PrimaryGradientBackdrop testIDPrefix="edit-profile" />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.75 },
            ]}
          >
            <MaterialCommunityIcons color="#FFFFFF" name="arrow-left" size={22} />
          </Pressable>
          <Text style={styles.topBarTitle}>Chỉnh sửa hồ sơ</Text>
          <View style={styles.topBarRight} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform?.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Avatar Section */}
            <View style={styles.avatarSection}>
              <Pressable
                accessibilityHint="Chạm để chọn và điều chỉnh ảnh đại diện mới"
                accessibilityLabel="Thay đổi ảnh đại diện"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={handlePickAvatar}
                style={styles.avatarWrapper}
              >
                <View style={styles.avatar}>
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

              <Text style={styles.avatarHint}>
                {tempAvatarUri
                  ? 'Ảnh mới (chưa lưu, nhấn Lưu thay đổi bên dưới)'
                  : 'Chạm vào ảnh để thay đổi ảnh đại diện'}
              </Text>
            </View>

            {isLoadingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
              </View>
            ) : null}

            {/* Login-style Floating White Form Card */}
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
                <Text style={styles.cardSubtitle}>Cập nhật hồ sơ SignTrustMap của bạn</Text>
              </View>

              {/* Full Name Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons color="#64748B" name="account-outline" size={18} />
                  <Text style={styles.fieldLabel}>Họ và tên</Text>
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
                        errors.fullName ? styles.inputContainerError : null,
                      ]}
                      editable={!isSaving}
                      error={errors.fullName?.message}
                      maxLength={100}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Nhập họ và tên của bạn"
                      placeholderTextColor="#94A3B8"
                      value={value}
                    />
                  )}
                />
              </View>

              {/* Phone Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons color="#64748B" name="phone-outline" size={18} />
                  <Text style={styles.fieldLabel}>Số điện thoại</Text>
                </View>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      accessibilityLabel="Số điện thoại"
                      containerStyle={[
                        styles.inputContainer,
                        errors.phone ? styles.inputContainerError : null,
                      ]}
                      editable={!isSaving}
                      error={errors.phone?.message}
                      keyboardType="phone-pad"
                      maxLength={10}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Nhập số điện thoại liên hệ"
                      placeholderTextColor="#94A3B8"
                      type="phone"
                      value={value}
                    />
                  )}
                />
              </View>

              {/* Address Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons color="#64748B" name="map-marker-outline" size={18} />
                  <Text style={styles.fieldLabel}>Địa chỉ</Text>
                </View>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AddressAutocompleteField
                      addressInput={addressInput}
                      addressSuggestions={addressSuggestions}
                      editable={!isSaving}
                      error={errors.address?.message}
                      focusRequestId={focusRequestId}
                      inputContainerStyle={styles.inputContainer}
                      inputErrorStyle={styles.inputContainerError}
                      isLoadingSuggestions={isLoadingSuggestions}
                      isMapPickerOpen={isMapPickerOpen}
                      isSuggestionsVisible={isSuggestionsVisible}
                      onBlur={onBlur}
                      onChangeText={(text) => handleAddressTextChange(text, onChange)}
                      onClear={() => handleClearAddress(onChange)}
                      onCloseMapPicker={() => setIsMapPickerOpen(false)}
                      onConfirmMapPicker={handleMapConfirm}
                      onOpenMapPicker={() => setIsMapPickerOpen(true)}
                      onSelectPlace={(place) => handleSelectPlace(place, onChange)}
                      onSuggestionsVisibilityChange={setIsSuggestionsVisible}
                      selectedCoordinate={selectedCoordinate}
                      value={value}
                    />
                  )}
                />
              </View>

              {/* Email (Read-only) Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons color="#64748B" name="email-outline" size={18} />
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.lockedBadge}>(Không thể thay đổi)</Text>
                </View>
                <AppInput
                  accessibilityLabel="Email"
                  containerStyle={[styles.inputContainer, styles.disabledInputContainer]}
                  editable={false}
                  keyboardType="email-address"
                  style={{ color: '#94A3B8' }}
                  trailingIcon={
                    <MaterialCommunityIcons color="#94A3B8" name="lock-outline" size={16} />
                  }
                  type="email"
                  value={email}
                />
              </View>

              {/* Save Button inside Login-style Card */}
              <View style={styles.saveActionContainer}>
                <AppButton
                  accessibilityLabel="Lưu thông tin hồ sơ"
                  disabled={isSaving || !fullName?.trim()}
                  onPress={handleSave}
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
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
