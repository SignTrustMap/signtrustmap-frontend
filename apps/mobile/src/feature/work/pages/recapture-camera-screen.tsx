import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
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

interface SelectedPhoto {
  uri: string;
  fileName?: string;
  mimeType?: string;
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

  const [signCropPhoto, setSignCropPhoto] = useState<SelectedPhoto | null>(null);
  const [bestFramePhoto, setBestFramePhoto] = useState<SelectedPhoto | null>(null);

  const submitMutation = useSubmitRecaptureMutation();

  // Fetch / update current GPS coordinates
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

  const distanceMeters = useMemo(() => {
    if (!currentPosition || Number.isNaN(targetLat) || Number.isNaN(targetLon)) {
      return null;
    }
    return calculateDistanceMeters(currentPosition, [targetLon, targetLat]);
  }, [currentPosition, targetLat, targetLon]);

  const isWithinGeofence = distanceMeters != null && distanceMeters <= 100;

  // Image picking helper
  const handlePickPhoto = async (type: 'signCrop' | 'bestFrame', source: 'camera' | 'library') => {
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
        });
        if (!result.canceled && result.assets[0]) {
          const a = result.assets[0];
          const photo: SelectedPhoto = {
            uri: a.uri,
            fileName: a.fileName || `${type}-${Date.now()}.jpg`,
            mimeType: a.mimeType || 'image/jpeg',
          };
          if (type === 'signCrop') setSignCropPhoto(photo);
          else setBestFramePhoto(photo);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.9,
          allowsEditing: false,
          mediaTypes: ['images'],
        });
        if (!result.canceled && result.assets[0]) {
          const a = result.assets[0];
          const photo: SelectedPhoto = {
            uri: a.uri,
            fileName: a.fileName || `${type}-${Date.now()}.jpg`,
            mimeType: a.mimeType || 'image/jpeg',
          };
          if (type === 'signCrop') setSignCropPhoto(photo);
          else setBestFramePhoto(photo);
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
    if (!currentPosition) {
      Alert.alert('Chưa có GPS', 'Đang xác định vị trí của bạn, vui lòng đợi giây lát.');
      return;
    }
    if (!isWithinGeofence) {
      Alert.alert(
        'Vị trí không hợp lệ',
        `Bạn đang cách biển báo ${Math.round(distanceMeters ?? 0)}m. Yêu cầu phải đứng trong bán kính ≤ 100m để nộp ảnh hợp lệ.`,
      );
      return;
    }
    if (!signCropPhoto) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh cận cảnh biển báo (Sign Crop).');
      return;
    }
    if (!bestFramePhoto) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh toàn cảnh vị trí biển báo (Best Frame).');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('latitude', String(currentPosition[1]));
      formData.append('longitude', String(currentPosition[0]));

      // React Native FormData append
      formData.append('signCrop', {
        uri: signCropPhoto.uri,
        name: signCropPhoto.fileName || 'sign-crop.jpg',
        type: signCropPhoto.mimeType || 'image/jpeg',
      } as any);

      formData.append('bestFrame', {
        uri: bestFramePhoto.uri,
        name: bestFramePhoto.fileName || 'best-frame.jpg',
        type: bestFramePhoto.mimeType || 'image/jpeg',
      } as any);

      await submitMutation.mutateAsync({
        candidateId,
        formData,
      });

      Alert.alert(
        'Nộp thành công!',
        'Ảnh chụp lại đã được gửi đến Thẩm định viên. Trạng thái biển báo đã chuyển sang Chờ sơ thẩm với hình ảnh mới.',
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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Chụp lại thực địa</Text>
            <Text style={[styles.headerSubtitle, { color: theme.grey }]}>
              Hồ sơ #{candidateId ? candidateId.slice(0, 8) : ''}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Target Sign Info Card */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.infoTop}>
              {oldSignCropUrl ? (
                <Image source={{ uri: oldSignCropUrl }} style={styles.oldImage} resizeMode="cover" />
              ) : (
                <View style={[styles.oldImagePlaceholder, { backgroundColor: theme.border }]}>
                  <MaterialCommunityIcons name="image-outline" size={24} color={theme.grey} />
                </View>
              )}
              <View style={styles.infoText}>
                <Text style={[styles.targetTitle, { color: theme.text }]}>{signTitle}</Text>
                <View style={styles.reasonTag}>
                  <Text style={styles.reasonTagText}>Yêu cầu: {reason}</Text>
                </View>
                {note ? (
                  <Text style={[styles.noteText, { color: theme.grey }]}>
                    {`Hướng dẫn: "${note}"`}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Live Geofence Tracker Card */}
          <View
            style={[
              styles.geofenceCard,
              {
                backgroundColor: isWithinGeofence
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                borderColor: isWithinGeofence
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)',
              },
            ]}
          >
            <View style={styles.geofenceHeader}>
              <MaterialCommunityIcons
                name={isWithinGeofence ? 'shield-check-outline' : 'crosshairs-gps'}
                size={22}
                color={isWithinGeofence ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.geofenceTitle,
                  { color: isWithinGeofence ? '#10B981' : '#EF4444' },
                ]}
              >
                {isGpsLoading
                  ? 'Đang xác định GPS...'
                  : isWithinGeofence
                    ? 'Vị trí hợp lệ (Trong bán kính ≤ 100m)'
                    : 'Chưa đủ điều kiện khoảng cách'}
              </Text>
            </View>

            <View style={styles.geofenceBody}>
              <Text style={[styles.distanceLabel, { color: theme.text }]}>
                Khoảng cách đến biển báo:{' '}
                <Text style={styles.boldDistance}>
                  {distanceMeters != null ? `${Math.round(distanceMeters)}m` : '---'}
                </Text>{' '}
                (Quy định: ≤ 100m)
              </Text>

              {currentPosition ? (
                <Text style={[styles.gpsSubtext, { color: theme.grey }]}>
                  GPS của bạn: {currentPosition[1].toFixed(5)}°, {currentPosition[0].toFixed(5)}°
                </Text>
              ) : null}
            </View>
          </View>

          {/* Photo Slot 1: Sign Crop (Cận cảnh) */}
          <View
            style={[
              styles.slotCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.slotHeader}>
              <View style={styles.slotTitleRow}>
                <Text style={[styles.slotTitle, { color: theme.text }]}>
                  1. Ảnh cận cảnh biển báo (Sign Crop) <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <Text style={[styles.slotDesc, { color: theme.grey }]}>
                Chụp chính diện, rõ nét chi tiết ký hiệu và không bị mờ/nghiêng.
              </Text>
            </View>

            {signCropPhoto ? (
              <View style={styles.photoPreviewWrapper}>
                <Image source={{ uri: signCropPhoto.uri }} style={styles.photoPreview} />
                <Pressable
                  onPress={() => setSignCropPhoto(null)}
                  style={styles.removePhotoButton}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoActions}>
                <AppButton
                  onPress={() => handlePickPhoto('signCrop', 'camera')}
                  style={styles.actionBtn}
                  variant="primary"
                >
                  <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Chụp ảnh</Text>
                </AppButton>
                <AppButton
                  onPress={() => handlePickPhoto('signCrop', 'library')}
                  style={[styles.actionBtn, { borderColor: theme.border }]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons name="image" size={16} color={theme.text} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Thư viện</Text>
                </AppButton>
              </View>
            )}
          </View>

          {/* Photo Slot 2: Best Frame (Toàn cảnh bối cảnh) */}
          <View
            style={[
              styles.slotCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <View style={styles.slotHeader}>
              <View style={styles.slotTitleRow}>
                <Text style={[styles.slotTitle, { color: theme.text }]}>
                  2. Ảnh toàn cảnh tuyến đường (Best Frame) <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <Text style={[styles.slotDesc, { color: theme.grey }]}>
                Chụp góc rộng thể hiện biển báo nằm trên làn đường/vỉa hè thực tế.
              </Text>
            </View>

            {bestFramePhoto ? (
              <View style={styles.photoPreviewWrapper}>
                <Image source={{ uri: bestFramePhoto.uri }} style={styles.photoPreview} />
                <Pressable
                  onPress={() => setBestFramePhoto(null)}
                  style={styles.removePhotoButton}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoActions}>
                <AppButton
                  onPress={() => handlePickPhoto('bestFrame', 'camera')}
                  style={styles.actionBtn}
                  variant="primary"
                >
                  <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Chụp ảnh</Text>
                </AppButton>
                <AppButton
                  onPress={() => handlePickPhoto('bestFrame', 'library')}
                  style={[styles.actionBtn, { borderColor: theme.border }]}
                  variant="ghost"
                >
                  <MaterialCommunityIcons name="image" size={16} color={theme.text} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Thư viện</Text>
                </AppButton>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <AppButton
              disabled={
                !signCropPhoto ||
                !bestFramePhoto ||
                !isWithinGeofence ||
                submitMutation.isPending
              }
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                (!signCropPhoto || !bestFramePhoto || !isWithinGeofence) && styles.submitBtnDisabled,
              ]}
              variant="primary"
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="cloud-upload" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Nộp lại ảnh chụp thực địa</Text>
                </>
              )}
            </AppButton>

            {!isWithinGeofence && (
              <Text style={styles.warningText}>
                ⚠️ Nút nộp sẽ sáng lên khi bạn đứng cách biển báo ≤ 100m.
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.half,
    marginLeft: -Spacing.half,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: Spacing.half,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.body,
    marginTop: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  infoCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  infoTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  oldImage: {
    width: 68,
    height: 68,
    borderRadius: Rounded.md,
  },
  oldImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  targetTitle: {
    fontSize: 15,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
  },
  reasonTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.sm,
  },
  reasonTagText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    fontWeight: '600',
    color: '#DC2626',
  },
  noteText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    fontStyle: 'italic',
  },
  geofenceCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.half,
  },
  geofenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geofenceTitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
  },
  geofenceBody: {
    gap: 2,
  },
  distanceLabel: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  boldDistance: {
    fontFamily: Fonts.body,
    fontWeight: 'bold',
  },
  gpsSubtext: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  slotCard: {
    borderRadius: Rounded.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  slotHeader: {
    gap: 2,
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
  },
  required: {
    color: '#EF4444',
  },
  slotDesc: {
    fontSize: 12,
    fontFamily: Fonts.body,
    lineHeight: 16,
  },
  photoPreviewWrapper: {
    position: 'relative',
    height: 160,
    borderRadius: Rounded.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Rounded.md,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    fontWeight: '600',
    color: '#fff',
  },
  submitSection: {
    marginTop: Spacing.sm,
    gap: Spacing.half,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Rounded.md,
    backgroundColor: '#10B981',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: Fonts.body,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: '#D97706',
    textAlign: 'center',
  },
});
export default RecaptureCameraScreen;
