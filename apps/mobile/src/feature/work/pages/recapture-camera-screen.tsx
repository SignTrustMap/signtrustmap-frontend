import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { useSubmitRecaptureMutation } from '@/feature/review/hooks/use-recapture';
import { calculateDistanceMeters } from '@/feature/navigation/utils/geo';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';

interface SelectedPhoto {
  uri: string;
  fileName?: string;
  mimeType?: string;
  gps?: { latitude: number; longitude: number };
}

export function RecaptureCameraScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    candidateId: string;
    targetLat: string;
    targetLon: string;
    signTitle?: string;
    reason?: string;
    note?: string;
    oldSignCropUrl?: string;
  }>();

  const candidateId = params.candidateId;
  const targetLat = Number(params.targetLat);
  const targetLon = Number(params.targetLon);
  const signTitle = params.signTitle || 'Biển báo mới đề xuất';
  const reason = params.reason || 'BLURRY';
  const note = params.note || '';
  const oldSignCropUrl = resolveS3Url(params.oldSignCropUrl);

  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(true);

  // Ảnh chính (Ảnh thực địa / Best Frame)
  const [mainPhoto, setMainPhoto] = useState<SelectedPhoto | null>(null);
  // Ảnh cận cảnh riêng biệt (Tùy chọn, nếu không chụp riêng thì hệ thống dùng mainPhoto)
  const [customCropPhoto, setCustomCropPhoto] = useState<SelectedPhoto | null>(null);
  const [isCustomCropVisible, setIsCustomCropVisible] = useState(false);

  const submitMutation = useSubmitRecaptureMutation();

  // Định kỳ cập nhật toạ độ GPS của thiết bị
  useEffect(() => {
    let isMounted = true;
    async function updateGps() {
      const pos = await fetchFreshGpsPosition(4000);
      if (isMounted) {
        setIsGpsLoading(false);
        if (pos) setCurrentPosition(pos);
      }
    }
    void updateGps();
    const interval = setInterval(updateGps, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Toạ độ hiệu lực: Ưu tiên GPS từ metadata của ảnh; nếu ảnh không có metadata GPS thì dùng GPS thiết bị
  const effectiveCoords: { latitude: number; longitude: number } | null = useMemo(() => {
    if (mainPhoto?.gps) {
      return mainPhoto.gps;
    }
    if (currentPosition) {
      return { latitude: currentPosition[1], longitude: currentPosition[0] };
    }
    return null;
  }, [mainPhoto?.gps, currentPosition]);

  // Khoảng cách tới biển báo
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

  // Xử lý chọn ảnh (Camera hoặc Thư viện)
  const handlePickPhoto = async (target: 'main' | 'crop', source: 'camera' | 'library') => {
    try {
      const ImagePicker = await import('expo-image-picker');

      if (source === 'camera') {
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
          // Trích xuất GPS từ EXIF hoặc fallback dùng GPS máy
          const photoGps =
            extractImageGpsCoordinates(a.exif) ||
            (currentPosition ? { latitude: currentPosition[1], longitude: currentPosition[0] } : undefined);

          const photo: SelectedPhoto = {
            uri: a.uri,
            fileName: a.fileName || `${target}-${Date.now()}.jpg`,
            mimeType: a.mimeType || 'image/jpeg',
            gps: photoGps,
          };
          if (target === 'main') {
            setMainPhoto(photo);
          } else {
            setCustomCropPhoto(photo);
          }
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.9,
          allowsEditing: false,
          mediaTypes: ['images'],
          exif: true,
        });
        if (!result.canceled && result.assets[0]) {
          const a = result.assets[0];
          // Ưu tiên trích xuất metadata GPS từ ảnh thư viện
          const photoGps =
            extractImageGpsCoordinates(a.exif) ||
            (currentPosition ? { latitude: currentPosition[1], longitude: currentPosition[0] } : undefined);

          const photo: SelectedPhoto = {
            uri: a.uri,
            fileName: a.fileName || `${target}-${Date.now()}.jpg`,
            mimeType: a.mimeType || 'image/jpeg',
            gps: photoGps,
          };
          if (target === 'main') {
            setMainPhoto(photo);
          } else {
            setCustomCropPhoto(photo);
          }
        }
      }
    } catch (err) {
      console.error('[Recapture] Photo pick error:', err);
      Alert.alert('Lỗi', 'Không thể mở máy ảnh hoặc thư viện ảnh.');
    }
  };

  const handleSubmit = async () => {
    if (!candidateId) {
      Alert.alert('Lỗi', 'Không tìm thấy mã hồ sơ biển báo.');
      return;
    }
    if (!mainPhoto) {
      Alert.alert('Chưa có ảnh', 'Vui lòng chụp hoặc tải lên ảnh chụp thực địa của biển báo.');
      return;
    }
    if (!effectiveCoords) {
      Alert.alert('Chưa có vị trí', 'Đang xác định toạ độ GPS, vui lòng đợi giây lát hoặc chọn ảnh có metadata GPS.');
      return;
    }
    if (!isWithinGeofence) {
      Alert.alert(
        'Vị trí không hợp lệ',
        `Vị trí hiện tại cách biển báo ${Math.round(distanceMeters ?? 0)}m. Yêu cầu ảnh chụp phải nằm trong bán kính ≤ 100m.`,
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append('latitude', String(effectiveCoords.latitude));
      formData.append('longitude', String(effectiveCoords.longitude));

      // bestFrame: Ảnh toàn cảnh thực địa chính
      formData.append('bestFrame', {
        uri: mainPhoto.uri,
        name: mainPhoto.fileName || 'best-frame.jpg',
        type: mainPhoto.mimeType || 'image/jpeg',
      } as any);

      // signCrop: Dùng ảnh cận cảnh riêng nếu có, nếu không thì dùng chính mainPhoto
      const cropPhoto = customCropPhoto || mainPhoto;
      formData.append('signCrop', {
        uri: cropPhoto.uri,
        name: cropPhoto.fileName || 'sign-crop.jpg',
        type: cropPhoto.mimeType || 'image/jpeg',
      } as any);

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
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            pressedOpacity={0.6}
            style={styles.backButton}
            variant="ghost"
          >
            <MaterialCommunityIcons color={theme.text} name="arrow-left" size={24} />
          </AppButton>

          <View style={styles.topBarTitle}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Chụp lại thực địa</Text>
            <Text style={[styles.screenSubtitle, { color: theme.grey }]}>
              Hồ sơ #{candidateId ? candidateId.slice(0, 8) : ''}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card 1: Target Sign Context */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.infoTop}>
              <View style={[styles.oldImageWrapper, { backgroundColor: theme.neutral }]}>
                {oldSignCropUrl ? (
                  <ExpoImage contentFit="cover" source={{ uri: oldSignCropUrl }} style={styles.oldImage} />
                ) : (
                  <MaterialCommunityIcons color={theme.placeholder} name="image-outline" size={26} />
                )}
              </View>

              <View style={styles.infoText}>
                <Text numberOfLines={1} style={[styles.targetTitle, { color: theme.text }]}>
                  {signTitle}
                </Text>
                <View style={[styles.reasonBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <MaterialCommunityIcons color="#DC2626" name="alert-circle-outline" size={13} />
                  <Text style={styles.reasonBadgeText}>Yêu cầu: {reason}</Text>
                </View>
                {note ? (
                  <Text numberOfLines={2} style={[styles.noteText, { color: theme.textSecondary }]}>
                    {`Hướng dẫn: "${note}"`}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Card 2: GPS & Geofence Status */}
          <View
            style={[
              styles.geofenceCard,
              {
                backgroundColor: isWithinGeofence
                  ? 'rgba(22, 163, 74, 0.08)'
                  : theme.backgroundSelected,
                borderColor: isWithinGeofence ? '#86EFAC' : `${theme.primary}30`,
              },
            ]}
          >
            <View style={styles.geofenceHeader}>
              <MaterialCommunityIcons
                color={isWithinGeofence ? '#16A34A' : theme.primary}
                name={isWithinGeofence ? 'check-circle' : 'crosshairs-gps'}
                size={20}
              />
              <Text
                style={[
                  styles.geofenceTitle,
                  { color: isWithinGeofence ? '#16A34A' : theme.text },
                ]}
              >
                {isWithinGeofence
                  ? `Vị trí hợp lệ (Cách ${Math.round(distanceMeters ?? 0)}m ≤ 100m)`
                  : distanceMeters != null
                    ? `Cách biển báo: ${Math.round(distanceMeters)}m (Quy định: ≤ 100m)`
                    : 'Đang xác định toạ độ...'}
              </Text>
            </View>

            <View style={styles.geofenceMetaRow}>
              <Text style={[styles.gpsSubtext, { color: theme.grey }]}>
                {mainPhoto?.gps
                  ? `📍 Toạ độ từ metadata ảnh: ${mainPhoto.gps.latitude.toFixed(5)}°, ${mainPhoto.gps.longitude.toFixed(5)}°`
                  : currentPosition
                    ? `📍 Toạ độ GPS thiết bị: ${currentPosition[1].toFixed(5)}°, ${currentPosition[0].toFixed(5)}°`
                    : 'Đang đợi tín hiệu GPS...'}
              </Text>
            </View>
          </View>

          {/* Card 3: Main Photo Upload (Ảnh chụp thực địa) */}
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

            {mainPhoto ? (
              <View style={styles.previewContainer}>
                <ExpoImage contentFit="cover" source={{ uri: mainPhoto.uri }} style={styles.mainPreviewImage} />
                <View style={styles.previewOverlayBadge}>
                  <MaterialCommunityIcons color="#16A34A" name="check-circle" size={14} />
                  <Text style={styles.previewBadgeText}>
                    {mainPhoto.gps ? 'Có metadata GPS' : 'Ảnh đã chọn'}
                  </Text>
                </View>

                <View style={styles.previewActionsRow}>
                  <AppButton
                    accessibilityLabel="Đổi ảnh thực địa"
                    onPress={() => handlePickPhoto('main', 'library')}
                    style={styles.actionSmallBtn}
                    variant="surface"
                  >
                    <MaterialCommunityIcons color={theme.text} name="image-edit-outline" size={16} />
                    <Text style={[styles.actionSmallBtnText, { color: theme.text }]}>Đổi ảnh</Text>
                  </AppButton>

                  <AppButton
                    accessibilityLabel="Chụp lại ảnh"
                    onPress={() => handlePickPhoto('main', 'camera')}
                    style={styles.actionSmallBtn}
                    variant="surface"
                  >
                    <MaterialCommunityIcons color={theme.text} name="camera-retake-outline" size={16} />
                    <Text style={[styles.actionSmallBtnText, { color: theme.text }]}>Chụp lại</Text>
                  </AppButton>
                </View>
              </View>
            ) : (
              <View style={[styles.emptyPickBox, { backgroundColor: theme.neutral, borderColor: theme.border }]}>
                <MaterialCommunityIcons color={theme.placeholder} name="camera-plus-outline" size={38} />
                <Text style={[styles.emptyPickLabel, { color: theme.textSecondary }]}>
                  Chưa có ảnh nào được chọn
                </Text>

                <View style={styles.pickButtonsRow}>
                  <AppButton
                    accessibilityLabel="Chụp ảnh mới"
                    onPress={() => handlePickPhoto('main', 'camera')}
                    style={styles.pickButtonPrimary}
                    variant="primary"
                  >
                    <MaterialCommunityIcons color="#FFFFFF" name="camera" size={18} />
                    <Text style={styles.pickButtonPrimaryText}>Chụp ảnh</Text>
                  </AppButton>

                  <AppButton
                    accessibilityLabel="Chọn từ thư viện"
                    onPress={() => handlePickPhoto('main', 'library')}
                    style={styles.pickButtonSurface}
                    variant="surface"
                  >
                    <MaterialCommunityIcons color={theme.text} name="image-multiple-outline" size={18} />
                    <Text style={[styles.pickButtonSurfaceText, { color: theme.text }]}>Thư viện ảnh</Text>
                  </AppButton>
                </View>
              </View>
            )}
          </View>

          {/* Card 4 (Tùy chọn): Ảnh cận cảnh chi tiết */}
          <View
            style={[
              styles.optionalCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.optionalHeader}>
              <View style={styles.optionalTitleCol}>
                <Text style={[styles.optionalTitle, { color: theme.text }]}>
                  Ảnh cận cảnh biển báo (Tùy chọn)
                </Text>
                <Text style={[styles.optionalDesc, { color: theme.grey }]}>
                  Mặc định hệ thống tự động trích xuất từ ảnh thực địa ở trên.
                </Text>
              </View>

              {!isCustomCropVisible && !customCropPhoto ? (
                <AppButton
                  accessibilityLabel="Bổ sung ảnh cận cảnh"
                  onPress={() => setIsCustomCropVisible(true)}
                  style={styles.addCropBtn}
                  variant="ghost"
                >
                  <MaterialCommunityIcons color={theme.primary} name="plus-circle-outline" size={16} />
                  <Text style={[styles.addCropBtnText, { color: theme.primary }]}>Thêm ảnh riêng</Text>
                </AppButton>
              ) : null}
            </View>

            {(isCustomCropVisible || customCropPhoto) && (
              <View style={styles.customCropContent}>
                {customCropPhoto ? (
                  <View style={styles.cropPreviewRow}>
                    <ExpoImage
                      contentFit="cover"
                      source={{ uri: customCropPhoto.uri }}
                      style={styles.cropThumb}
                    />
                    <View style={styles.cropInfoCol}>
                      <Text style={[styles.cropSelectedText, { color: theme.text }]}>
                        Đã chọn ảnh cận cảnh riêng
                      </Text>
                      <View style={styles.cropBtnGroup}>
                        <AppButton
                          onPress={() => handlePickPhoto('crop', 'camera')}
                          style={styles.miniBtn}
                          variant="ghost"
                        >
                          <Text style={[styles.miniBtnText, { color: theme.primary }]}>Chụp lại</Text>
                        </AppButton>
                        <AppButton
                          onPress={() => setCustomCropPhoto(null)}
                          style={styles.miniBtn}
                          variant="ghost"
                        >
                          <Text style={[styles.miniBtnText, { color: '#EF4444' }]}>Xóa</Text>
                        </AppButton>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cropActionRow}>
                    <AppButton
                      onPress={() => handlePickPhoto('crop', 'camera')}
                      style={styles.cropActionBtn}
                      variant="surface"
                    >
                      <MaterialCommunityIcons color={theme.text} name="camera-outline" size={16} />
                      <Text style={[styles.cropActionBtnText, { color: theme.text }]}>Chụp cận cảnh</Text>
                    </AppButton>

                    <AppButton
                      onPress={() => handlePickPhoto('crop', 'library')}
                      style={styles.cropActionBtn}
                      variant="surface"
                    >
                      <MaterialCommunityIcons color={theme.text} name="image-outline" size={16} />
                      <Text style={[styles.cropActionBtnText, { color: theme.text }]}>Từ thư viện</Text>
                    </AppButton>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Submit Button Section */}
          <View style={styles.submitSection}>
            <AppButton
              accessibilityLabel="Nộp lại ảnh chụp thực địa"
              disabled={!mainPhoto || !isWithinGeofence || submitMutation.isPending}
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                (!mainPhoto || !isWithinGeofence) && styles.submitButtonDisabled,
              ]}
              variant="primary"
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons color="#FFFFFF" name="cloud-upload-outline" size={20} />
                  <Text style={styles.submitButtonText}>Nộp lại ảnh chụp thực địa</Text>
                </>
              )}
            </AppButton>

            {!isWithinGeofence && (
              <View style={styles.guardrailNotice}>
                <MaterialCommunityIcons color="#D97706" name="alert-outline" size={15} />
                <Text style={[styles.guardrailNoticeText, { color: theme.grey }]}>
                  {distanceMeters != null
                    ? `Vị trí cách biển báo ${Math.round(distanceMeters)}m. Nút nộp sẽ mở khi trong bán kính ≤ 100m.`
                    : 'Đang đợi vị trí GPS hợp lệ (≤ 100m) để mở nút nộp.'}
                </Text>
              </View>
            )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoTop: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  oldImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: Rounded.md,
    overflow: 'hidden',
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
    gap: 4,
  },
  targetTitle: {
    fontSize: 16,
    fontFamily: Fonts.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Rounded.sm,
  },
  reasonBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
    color: '#DC2626',
  },
  noteText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 16,
  },
  geofenceCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geofenceTitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
    flex: 1,
  },
  geofenceMetaRow: {
    paddingLeft: 26,
  },
  gpsSubtext: {
    fontSize: 11,
    fontFamily: Fonts.mono,
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
  mainPreviewImage: {
    width: '100%',
    height: 180,
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
  },
  previewBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '700',
    color: '#16A34A',
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
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    marginTop: 4,
  },
  emptyPickLabel: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  pickButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    marginTop: 4,
  },
  pickButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: Rounded.md,
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
    minHeight: 42,
    borderRadius: Rounded.md,
  },
  pickButtonSurfaceText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  optionalCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  optionalTitleCol: {
    flex: 1,
    gap: 2,
  },
  optionalTitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  optionalDesc: {
    fontSize: 11,
    fontFamily: Fonts.body,
    lineHeight: 15,
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 0,
    minHeight: 32,
  },
  addCropBtnText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  customCropContent: {
    marginTop: 4,
  },
  cropPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cropThumb: {
    width: 60,
    height: 60,
    borderRadius: Rounded.sm,
  },
  cropInfoCol: {
    flex: 1,
    gap: 2,
  },
  cropSelectedText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontWeight: '600',
  },
  cropBtnGroup: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  miniBtn: {
    paddingHorizontal: 0,
    minHeight: 28,
  },
  miniBtnText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  cropActionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 4,
  },
  cropActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 38,
    borderRadius: Rounded.md,
  },
  cropActionBtnText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  submitSection: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: Rounded.md,
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
  guardrailNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    marginTop: 4,
  },
  guardrailNoticeText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default RecaptureCameraScreen;
