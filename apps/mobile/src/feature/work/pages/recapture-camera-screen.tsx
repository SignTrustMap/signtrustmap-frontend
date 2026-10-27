import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { useSubmitRecaptureMutation } from '@/feature/review/hooks/use-recapture';
import { calculateDistanceMeters } from '@/feature/navigation/utils/geo';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';
import { extractGpsFromImageFile } from '@/feature/upload/utils/image-file-gps';

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

interface SelectedPhoto {
  uri: string;
  fileName?: string;
  mimeType?: string;
  gps?: { latitude: number; longitude: number };
  source: 'camera' | 'library';
  hasExifGps: boolean;
}

const REASON_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  MISSING_TYPE_RECAPTURE_REQUESTED: { label: 'Chụp lại biển lạ', color: '#007b8b', bg: 'rgba(0, 123, 139, 0.12)' },
  BLURRY: { label: 'Ảnh mờ, rung tay', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
  POOR_LIGHTING: { label: 'Ngược sáng, thiếu sáng', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  WRONG_ANGLE: { label: 'Góc chụp nghiêng', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  OCCLUDED: { label: 'Vật cản che khuất', color: '#9333EA', bg: 'rgba(147, 51, 234, 0.1)' },
  MISSING_CONTEXT: { label: 'Thiếu ảnh toàn cảnh', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
  OTHER: { label: 'Lý do khác', color: '#4B5563', bg: 'rgba(75, 85, 99, 0.1)' },
};

/**
 * Chuyển local file URI thành Blob chuẩn tương thích với WinterCG fetch của Expo / React Native
 */
async function uriToBlob(uri: string, mimeType = 'image/jpeg'): Promise<Blob> {
  try {
    const res = await fetch(uri);
    return await res.blob();
  } catch (fetchErr) {
    console.warn('[Recapture] fetch uri to blob failed, falling back to FileSystem:', fetchErr);
    const FileSystem = await import('expo-file-system/legacy');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
}

export function RecaptureCameraScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    candidateId: string;
    targetLat: string;
    targetLon: string;
    signTitle?: string;
    signCode?: string;
    reason?: string;
    note?: string;
    oldSignCropUrl?: string;
  }>();

  const candidateId = params.candidateId;
  const targetLat = Number(params.targetLat);
  const targetLon = Number(params.targetLon);
  const signTitle = params.signTitle || 'Biển báo mới đề xuất';
  const signCode = params.signCode || '';
  const reason = params.reason || 'BLURRY';
  const note = params.note || '';
  const oldSignCropUrl = resolveS3Url(params.oldSignCropUrl);

  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);

  const submitMutation = useSubmitRecaptureMutation();

  // Định kỳ cập nhật toạ độ GPS của thiết bị khi mở app
  useEffect(() => {
    let isMounted = true;
    async function updateGps() {
      const pos = await fetchFreshGpsPosition(4000);
      if (isMounted && pos) {
        setCurrentPosition(pos);
      }
    }
    void updateGps();
    const interval = setInterval(updateGps, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Toạ độ hiệu lực: Chỉ lấy từ chính bức ảnh đã chọn
  // - Nếu chụp từ Camera: GPS thiết bị tại thời điểm chụp
  // - Nếu chọn từ Thư viện: GPS trích xuất từ metadata EXIF của bức ảnh (không dùng GPS thiết bị)
  const effectiveCoords: { latitude: number; longitude: number } | null = useMemo(() => {
    if (photo?.gps) {
      return photo.gps;
    }
    return null;
  }, [photo?.gps]);

  // Khoảng cách từ vị trí ảnh tới vị trí biển báo gốc
  const distanceMeters = useMemo(() => {
    if (!effectiveCoords || Number.isNaN(targetLat) || Number.isNaN(targetLon)) {
      return null;
    }
    return calculateDistanceMeters(
      [effectiveCoords.longitude, effectiveCoords.latitude],
      [targetLon, targetLat],
    );
  }, [effectiveCoords, targetLat, targetLon]);

  const isWithinGeofence = distanceMeters != null && distanceMeters <= 100;

  // Cự ly hiện tại từ vị trí của surveyor đến biển báo
  const deviceDistanceMeters = useMemo(() => {
    if (!currentPosition || Number.isNaN(targetLat) || Number.isNaN(targetLon)) {
      return null;
    }
    return calculateDistanceMeters(currentPosition, [targetLon, targetLat]);
  }, [currentPosition, targetLat, targetLon]);

  const isDeviceNear = deviceDistanceMeters != null && deviceDistanceMeters <= 100;

  const handleOpenDirections = (lat: number, lon: number) => {
    const scheme = Platform.select({
      ios: `maps://0,0?q=${lat},${lon}`,
      android: `geo:0,0?q=${lat},${lon}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    });
    void Linking.openURL(scheme);
  };

  // 1. Chụp ảnh trực tiếp tại hiện trường (bắt buộc mở app chụp để đính kèm GPS thiết bị)
  const handleLaunchCamera = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Cần quyền máy ảnh', 'Vui lòng cấp quyền truy cập máy ảnh để chụp lại biển báo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: false,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        // Chụp tại chỗ: Lấy toạ độ GPS của thiết bị tại thời điểm đứng ở hiện trường
        const freshGps = await fetchFreshGpsPosition(3000);
        const deviceGps = freshGps
          ? { latitude: freshGps[1], longitude: freshGps[0] }
          : extractImageGpsCoordinates(a.exif) ||
            (currentPosition ? { latitude: currentPosition[1], longitude: currentPosition[0] } : undefined);

        if (!deviceGps) {
          Alert.alert(
            'Không lấy được vị trí GPS',
            'Không thể xác định vị trí hiện tại của thiết bị. Vui lòng bật định vị GPS trên điện thoại để chụp ảnh tại hiện trường.',
          );
          return;
        }

        setPhoto({
          uri: a.uri,
          fileName: a.fileName || `recapture-camera-${Date.now()}.jpg`,
          mimeType: a.mimeType || 'image/jpeg',
          gps: deviceGps,
          source: 'camera',
          hasExifGps: false,
        });
      }
    } catch (err) {
      console.error('[Recapture] Camera launch error:', err);
      Alert.alert('Lỗi', 'Không thể mở máy ảnh trên thiết bị.');
    }
  };

  // 2. Chọn ảnh từ thiết bị (Android dùng Storage Access Framework để giữ nguyên 100% EXIF GPS)
  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'android') {
        const DocumentPicker = await import('expo-document-picker');
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/jpeg', 'image/png', 'image/webp', 'image/*'],
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) return;
        const a = result.assets[0];

        const fileGps = await extractGpsFromImageFile(a.uri);
        if (!fileGps) {
          Alert.alert(
            'Ảnh không có toạ độ GPS',
            'Bức ảnh này không chứa thông tin định vị (EXIF metadata). Vui lòng chọn ảnh gốc có lưu vị trí hoặc sử dụng tính năng "Chụp ảnh" trực tiếp tại hiện trường.',
          );
          return;
        }

        setPhoto({
          uri: a.uri,
          fileName: a.name || `recapture-file-${Date.now()}.jpg`,
          mimeType: a.mimeType || 'image/jpeg',
          gps: fileGps,
          source: 'library',
          hasExifGps: true,
        });
        return;
      }

      // iOS: Thư viện ảnh hỗ trợ đầy đủ EXIF
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsEditing: false,
        mediaTypes: ['images'],
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        let exifGps = extractImageGpsCoordinates(a.exif);
        if (!exifGps) {
          exifGps = await extractGpsFromImageFile(a.uri);
        }

        if (!exifGps) {
          Alert.alert(
            'Ảnh không có toạ độ GPS',
            'Bức ảnh này không chứa thông tin định vị (EXIF metadata). Vui lòng chọn ảnh gốc có lưu vị trí hoặc sử dụng tính năng "Chụp ảnh" trực tiếp tại hiện trường.',
          );
          return;
        }

        setPhoto({
          uri: a.uri,
          fileName: a.fileName || `recapture-lib-${Date.now()}.jpg`,
          mimeType: a.mimeType || 'image/jpeg',
          gps: exifGps,
          source: 'library',
          hasExifGps: true,
        });
      }
    } catch (err) {
      console.error('[Recapture] Pick image error:', err);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thiết bị.');
    }
  };

  // 3. Nộp ảnh chụp lại (Kiểm tra điều kiện khi nộp)
  const handleSubmit = async () => {
    if (!candidateId) {
      Alert.alert('Lỗi', 'Không tìm thấy mã hồ sơ biển báo.');
      return;
    }
    if (!photo) {
      Alert.alert('Chưa có ảnh', 'Vui lòng chụp ảnh hoặc chọn ảnh thực địa của biển báo.');
      return;
    }
    if (!effectiveCoords) {
      Alert.alert(
        'Chưa có toạ độ vị trí',
        photo.source === 'library'
          ? 'Ảnh từ thư viện không có metadata GPS. Vui lòng chọn ảnh có lưu toạ độ hoặc chụp ảnh trực tiếp tại hiện trường.'
          : 'Không thể xác định vị trí chụp. Vui lòng bật định vị GPS trên thiết bị.',
      );
      return;
    }
    if (!isWithinGeofence) {
      Alert.alert(
        'Không đủ điều kiện khoảng cách',
        `Vị trí ảnh chụp cách biển báo gốc ${Math.round(distanceMeters ?? 0)}m (Quy định: ≤ 100m). Vui lòng di chuyển đến gần biển báo hoặc chọn ảnh chụp thực địa có lưu toạ độ GPS.`,
      );
      return;
    }

    try {
      const fileName = photo.fileName || 'recapture-evidence.jpg';
      const mimeType = photo.mimeType || 'image/jpeg';
      const fileBlob = await uriToBlob(photo.uri, mimeType);

      const formData = new FormData();
      formData.append('latitude', String(effectiveCoords.latitude));
      formData.append('longitude', String(effectiveCoords.longitude));

      // Backend NestJS FileFieldsInterceptor yêu cầu cả 2 trường: signCrop và bestFrame
      formData.append('signCrop', fileBlob, fileName);
      formData.append('bestFrame', fileBlob, fileName);

      await submitMutation.mutateAsync({
        candidateId,
        formData,
      });

      Alert.alert(
        'Nộp thành công',
        'Ảnh chụp lại đã được gửi đến ban thẩm định. Báo cáo sẽ được chuyển sang trạng thái chờ duyệt.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err: any) {
      console.error('[Recapture] Submit failed:', err);
      Alert.alert('Nộp thất bại', err?.message || 'Có lỗi xảy ra khi nộp ảnh chụp lại.');
    }
  };

  const reasonMeta = REASON_LABELS[reason] || {
    label: reason,
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.1)',
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Top Header */}
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: theme.backgroundElement,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <AppButton
            accessibilityLabel="Quay lại danh sách chụp lại"
            onPress={() => router.back()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={22} />
          </AppButton>

          <View style={styles.topBarTitle}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Yêu cầu chụp lại</Text>
            <Text style={[styles.screenSubtitle, { color: theme.grey }]}>
              Hồ sơ #{candidateId ? candidateId.slice(0, 8) : ''}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card 1: Thông tin biển báo cần chụp lại & Ghi chú thẩm định */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            {/* Header: Ảnh biển bên trái + Thông tin biển bên phải */}
            <View style={styles.infoTop}>
              <View style={[styles.oldImageWrapper, { backgroundColor: theme.neutral, borderColor: theme.border }]}>
                {oldSignCropUrl ? (
                  <ExpoImage contentFit="cover" source={{ uri: oldSignCropUrl }} style={styles.oldImage} />
                ) : (
                  <MaterialCommunityIcons color={theme.placeholder} name="image-outline" size={26} />
                )}
              </View>

              <View style={styles.infoText}>
                {/* Badges: Mã biển + Lý do chụp lại (Tối giản, không icon, không lặp từ) */}
                <View style={styles.badgeRow}>
                  {signCode ? (
                    <View
                      style={[
                        styles.codeBadge,
                        {
                          backgroundColor: theme.secondary,
                          borderColor: `${theme.primary}40`,
                        },
                      ]}
                    >
                      <Text style={[styles.codeBadgeText, { color: theme.primary }]}>
                        {signCode}
                      </Text>
                    </View>
                  ) : null}

                  <View style={[styles.reasonBadge, { backgroundColor: reasonMeta.bg }]}>
                    <Text style={[styles.reasonBadgeText, { color: reasonMeta.color }]}>
                      {reasonMeta.label}
                    </Text>
                  </View>
                </View>

                {/* Tên biển báo (Tối đa 2 dòng) */}
                <Text numberOfLines={2} style={[styles.targetTitle, { color: theme.text }]}>
                  {signTitle}
                </Text>

                {/* Toạ độ GPS & Khoảng cách (Đơn giản, dạng text, không icon gây rối mắt) */}
                <Text style={[styles.coordsDistanceText, { color: theme.grey }]}>
                  {!Number.isNaN(targetLat) && !Number.isNaN(targetLon)
                    ? `${targetLat.toFixed(5)}°, ${targetLon.toFixed(5)}°`
                    : ''}
                  {deviceDistanceMeters != null
                    ? ` • Cách ${formatDistance(deviceDistanceMeters)}`
                    : ''}
                </Text>
              </View>
            </View>

            {/* Hộp Ghi chú của thẩm định viên (Full-width, rõ ràng, không bị che khuất) */}
            {note ? (
              <View
                style={[
                  styles.reviewerNoteBox,
                  {
                    backgroundColor: theme.neutral,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.reviewerNoteText, { color: theme.text }]}>
                  <Text style={[styles.reviewerNoteBold, { color: theme.textSecondary }]}>
                    Ghi chú: {' '}
                  </Text>
                  {note}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Thanh trạng thái cự ly (< 100m) & Nút Chỉ đường */}
          {deviceDistanceMeters != null && (
            <View
              style={[
                styles.proximityCard,
                {
                  backgroundColor: isDeviceNear
                    ? 'rgba(22, 163, 74, 0.08)'
                    : theme.secondary,
                  borderColor: isDeviceNear
                    ? 'rgba(22, 163, 74, 0.25)'
                    : `${theme.primary}30`,
                },
              ]}
            >
              <View style={styles.proximityContent}>
                <Text
                  style={[
                    styles.proximityTitle,
                    { color: isDeviceNear ? '#16A34A' : theme.primary },
                  ]}
                >
                  {isDeviceNear
                    ? `Đủ điều kiện chụp (cách ${formatDistance(deviceDistanceMeters)})`
                    : `Cần đến gần hơn (< 100m) • Hiện cách ${formatDistance(deviceDistanceMeters)}`}
                </Text>
                <Text style={[styles.proximityDesc, { color: theme.grey }]}>
                  {isDeviceNear
                    ? 'Bạn đang trong bán kính 100m quanh biển báo.'
                    : 'Quy định yêu cầu chụp trong bán kính 100m từ vị trí gốc.'}
                </Text>
              </View>

              {!isDeviceNear && (
                <TouchableOpacity
                  accessibilityLabel="Chỉ đường tới biển báo"
                  activeOpacity={0.7}
                  onPress={() => handleOpenDirections(targetLat, targetLon)}
                  style={[
                    styles.directNavButton,
                    { backgroundColor: theme.surface, borderColor: `${theme.primary}40` },
                  ]}
                >
                  <Text style={[styles.directNavButtonText, { color: theme.primary }]}>
                    Chỉ đường
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Card 2: Khu vực tải/chụp 1 ảnh thực địa duy nhất */}
          <View
            style={[
              styles.uploadCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardSectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Ảnh chụp thực địa <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={[styles.sectionDesc, { color: theme.grey }]}>
                Chụp trực tiếp tại hiện trường hoặc chọn ảnh có định vị GPS từ thư viện.
              </Text>
            </View>

            {photo ? (
              <View style={styles.previewContainer}>
                <ExpoImage contentFit="cover" source={{ uri: photo.uri }} style={styles.previewImage} />

                {/* Badge trạng thái toạ độ trên ảnh */}
                <View style={styles.previewOverlayBadge}>
                  <MaterialCommunityIcons
                    color={photo.source === 'library' ? '#16A34A' : theme.primary}
                    name={photo.source === 'library' ? 'check-circle' : 'crosshairs-gps'}
                    size={14}
                  />
                  <Text
                    style={[
                      styles.previewBadgeText,
                      { color: photo.source === 'library' ? '#16A34A' : theme.primary },
                    ]}
                  >
                    {photo.source === 'library'
                      ? `GPS từ metadata ảnh (${photo.gps?.latitude.toFixed(4)}°, ${photo.gps?.longitude.toFixed(4)}°)`
                      : `GPS chụp tại chỗ (${photo.gps?.latitude.toFixed(4)}°, ${photo.gps?.longitude.toFixed(4)}°)`}
                  </Text>
                </View>

                {/* Hàng nút thay đổi ảnh */}
                <View style={styles.previewActionsRow}>
                  <AppButton
                    accessibilityLabel="Chụp lại ảnh"
                    onPress={handleLaunchCamera}
                    style={styles.actionSmallBtn}
                    variant="surface"
                  >
                    <MaterialCommunityIcons color={theme.text} name="camera-retake-outline" size={16} />
                    <Text style={[styles.actionSmallBtnText, { color: theme.text }]}>Chụp lại</Text>
                  </AppButton>

                  <AppButton
                    accessibilityLabel="Đổi ảnh khác"
                    onPress={handlePickImage}
                    style={styles.actionSmallBtn}
                    variant="surface"
                  >
                    <MaterialCommunityIcons color={theme.text} name="image-edit-outline" size={16} />
                    <Text style={[styles.actionSmallBtnText, { color: theme.text }]}>Đổi ảnh</Text>
                  </AppButton>
                </View>
              </View>
            ) : (
              <View style={[styles.emptyPickBox, { backgroundColor: theme.neutral, borderColor: theme.border }]}>
                <MaterialCommunityIcons color={theme.placeholder} name="camera-plus-outline" size={42} />
                <Text style={[styles.emptyPickTitle, { color: theme.text }]}>
                  Chưa có ảnh nào được chọn
                </Text>
                <Text style={[styles.emptyPickDesc, { color: theme.grey }]}>
                  Chụp tại hiện trường hoặc chọn ảnh có toạ độ GPS từ máy.
                </Text>

                <View style={styles.pickButtonsRow}>
                  <AppButton
                    accessibilityLabel="Chụp ảnh mới tại hiện trường"
                    onPress={handleLaunchCamera}
                    style={[styles.pickButtonPrimary, { backgroundColor: theme.primary }]}
                    variant="primary"
                  >
                    <MaterialCommunityIcons color="#FFFFFF" name="camera" size={18} />
                    <Text style={styles.pickButtonPrimaryText}>Chụp ảnh</Text>
                  </AppButton>

                  <AppButton
                    accessibilityLabel="Chọn ảnh từ thiết bị"
                    onPress={handlePickImage}
                    style={[
                      styles.pickButtonSurface,
                      { borderColor: `${theme.primary}50`, backgroundColor: theme.surface },
                    ]}
                    variant="surface"
                  >
                    <MaterialCommunityIcons color={theme.primary} name="image-multiple-outline" size={18} />
                    <Text style={[styles.pickButtonSurfaceText, { color: theme.primary }]}>Chọn ảnh</Text>
                  </AppButton>
                </View>
              </View>
            )}
          </View>

          {/* Card 3: Nút Nộp ảnh */}
          <View style={styles.submitSection}>
            <AppButton
              accessibilityLabel="Nộp ảnh chụp lại"
              disabled={!photo || submitMutation.isPending}
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                { backgroundColor: theme.primary },
                (!photo || submitMutation.isPending) && styles.submitButtonDisabled,
              ]}
              variant="primary"
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons color="#FFFFFF" name="cloud-upload-outline" size={20} />
                  <Text style={styles.submitButtonText}>Nộp ảnh chụp lại</Text>
                </>
              )}
            </AppButton>
          </View>
        </ScrollView>
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: Rounded.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontFamily: Fonts.title,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  infoCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoTop: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  oldImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: Rounded.md,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oldImage: {
    width: '100%',
    height: '100%',
  },
  infoText: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Rounded.sm,
    borderWidth: 1,
  },
  codeBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  reasonBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  reasonBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  targetTitle: {
    fontSize: 15,
    fontFamily: Fonts.body,
    fontWeight: '700',
    lineHeight: 20,
  },
  coordsDistanceText: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    marginTop: 1,
  },
  reviewerNoteBox: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    borderRadius: Rounded.sm,
    borderWidth: 1,
  },
  reviewerNoteText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 17,
  },
  reviewerNoteBold: {
    fontWeight: '700',
  },
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Rounded.lg,
    borderWidth: 1,
  },
  proximityContent: {
    flex: 1,
    gap: 2,
  },
  proximityTitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  proximityDesc: {
    fontSize: 11,
    fontFamily: Fonts.body,
    lineHeight: 15,
  },
  directNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Rounded.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directNavButtonText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  uploadCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  requiredStar: {
    color: '#EF4444',
  },
  sectionDesc: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 16,
  },
  previewContainer: {
    gap: Spacing.two,
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: Rounded.md,
  },
  previewOverlayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Rounded.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    borderRadius: Rounded.md,
  },
  actionSmallBtnText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  emptyPickBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
    marginTop: 4,
  },
  emptyPickTitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyPickDesc: {
    fontSize: 12,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
  },
  pickButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  pickButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: Rounded.md,
    backgroundColor: '#007B8B',
  },
  pickButtonPrimaryText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickButtonSurface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  pickButtonSurfaceText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
    color: '#007B8B',
  },
  submitSection: {
    marginTop: Spacing.two,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: Rounded.md,
    backgroundColor: '#007B8B',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: Fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default RecaptureCameraScreen;
