import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import type { Asset as MediaLibraryAsset } from 'expo-media-library/legacy';
import type { ImagePickerAsset } from 'expo-image-picker';

import { useQueryClient } from '@tanstack/react-query';
import {
  CAMERA_PERMISSION_REQUIRED_MESSAGE,
  CANNOT_OPEN_CAMERA_MESSAGE,
  CANNOT_OPEN_MEDIA_LIBRARY_MESSAGE,
  CANNOT_READ_SELECTED_FILE_MESSAGE,
  COORDINATES_REQUIRED_EVIDENCE_MESSAGE,
  COULD_NOT_ACQUIRE_GPS_MESSAGE,
  MEDIA_LIBRARY_PERMISSION_REQUIRED_PHOTOS_MESSAGE,
  SUBMIT_EVIDENCE_FAILED_MESSAGE,
  UNABLE_TO_GET_GPS_LOCATION_MESSAGE,
  UNABLE_TO_LOAD_PHOTO_LIBRARY_SIMPLE_MESSAGE,
} from '@/constants/message';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/context/session-provider';
import { extractImageGpsCoordinates, type ImageGpsCoordinates } from '@/feature/upload/utils/image-gps';
import { extractVideoMetadataAsync } from '@/feature/upload/utils/video-gps';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { submitRevalidationEvidence, resolveS3Url } from '@/api/revalidation/revalidation';
import type { RevalidationEvidenceType } from '@/types/revalidationType';

export type InspectRevalidateParams = {
  signId?: string;
  taskId?: string;
  signCode?: string;
  name?: string;
  nameVi?: string;
  nameEn?: string;
  latitude?: string;
  longitude?: string;
  imageUrl?: string;
  actualCropUrl?: string;
  freshnessScore?: string;
  status?: string;
  roadName?: string;
  displayAddress?: string;
  lastVerifiedAt?: string;
};

type SelectedMedia = {
  uri: string;
  type: 'image' | 'video';
  fileName?: string | null;
  mimeType?: string;
  capturedAt?: string;
  duration?: number;
  assetId?: string;
};

const ANDROID_GALLERY_PAGE_SIZE = 60;
const MAX_PROXIMITY_METERS = 50;

/**
 * Calculates surface distance in meters between two lat/lon points using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function isValidGpsCoordinates(
  coords: ImageGpsCoordinates | null | undefined,
): coords is ImageGpsCoordinates {
  return Boolean(
    coords &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    Math.abs(coords.latitude) <= 90 &&
    Math.abs(coords.longitude) <= 180 &&
    !(coords.latitude === 0 && coords.longitude === 0),
  );
}

export type RevalidationSignStatus = RevalidationEvidenceType;

export const REVALIDATION_STATUS_OPTIONS: Array<{
  id: RevalidationEvidenceType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  activeColor: string;
  description: string;
}> = [
  {
    id: 'STILL_ACTIVE',
    label: 'Vẫn hoạt động',
    icon: 'check-circle-outline',
    activeColor: '#16A34A',
    description: 'Biển báo vẫn tồn tại và hoạt động bình thường trên thực địa.',
  },
  {
    id: 'REMOVED',
    label: 'Đã gỡ bỏ',
    icon: 'close-circle-outline',
    activeColor: '#DC2626',
    description: 'Biển báo đã bị tháo dỡ, mất hoặc không còn trên thực địa.',
  },
  {
    id: 'CHANGED',
    label: 'Đã thay đổi',
    icon: 'swap-horizontal',
    activeColor: '#D97706',
    description: 'Biển báo đã được thay thế bằng một loại biển báo khác.',
  },
];

/**
 * Resolves color styling and icon for freshness score:
 * - ≥80%: Healthy (emerald green)
 * - 50–79%: Moderate (warm amber)
 * - 31–49%: Warning (deep orange)
 * - ≤30%: Critical (red)
 */
export function getFreshnessStyle(score: number) {
  if (score >= 80) {
    return {
      bg: '#ECFDF5',
      border: '#6EE7B7',
      text: '#047857',
      icon: 'check-circle-outline' as const,
    };
  }
  if (score >= 50) {
    return {
      bg: '#FFF7ED',
      border: '#FDBA74',
      text: '#C2410C',
      icon: 'clock-alert-outline' as const,
    };
  }
  if (score > 30) {
    return {
      bg: '#FFF1F2',
      border: '#FDA4AF',
      text: '#BE123C',
      icon: 'alert-circle-outline' as const,
    };
  }
  return {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    text: '#B91C1C',
    icon: 'shield-alert-outline' as const,
  };
}

export function InspectRevalidateScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<InspectRevalidateParams>();
  const scrollViewRef = useRef<ScrollView>(null);

  // Carried target sign metadata
  const signId = params.signId || 'sign-target';
  const taskId = params.taskId;
  const signCode = params.signCode || 'Biển báo giao thông';
  const signName = params.name || params.nameVi || params.nameEn || 'Kiểm tra biển báo';
  const targetLat = params.latitude ? parseFloat(params.latitude) : undefined;
  const targetLon = params.longitude ? parseFloat(params.longitude) : undefined;
  const targetImageUrl = params.imageUrl ? resolveS3Url(params.imageUrl) : undefined;
  const targetCropUrl = params.actualCropUrl ? resolveS3Url(params.actualCropUrl) : undefined;
  const rawScore = params.freshnessScore ? parseFloat(params.freshnessScore) : 65;
  const freshnessScore = Number.isFinite(rawScore)
    ? rawScore <= 1
      ? Math.round(rawScore * 100)
      : Math.round(rawScore)
    : 65;
  const freshnessStyle = getFreshnessStyle(freshnessScore);
  const roadName = params.roadName || params.displayAddress || 'Tuyến đường hiện tại';

  // Media selection & GPS state
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia>();
  const [detectedGps, setDetectedGps] = useState<ImageGpsCoordinates | null>(null);
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [pickerError, setPickerError] = useState<string>();

  // Revalidation state directly mapped to Backend evidence_type
  const [evidenceType, setEvidenceType] = useState<RevalidationEvidenceType>('STILL_ACTIVE');
  const [customNote, setCustomNote] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  // Android custom gallery modal state
  const [isAndroidGalleryVisible, setIsAndroidGalleryVisible] = useState(false);
  const [androidGalleryAssets, setAndroidGalleryAssets] = useState<MediaLibraryAsset[]>([]);
  const [androidGalleryCursor, setAndroidGalleryCursor] = useState<string>();
  const [androidGalleryHasNextPage, setAndroidGalleryHasNextPage] = useState(false);
  const [androidGalleryError, setAndroidGalleryError] = useState<string>();
  const [isAndroidGalleryLoading, setIsAndroidGalleryLoading] = useState(false);
  const [selectingAndroidAssetId, setSelectingAndroidAssetId] = useState<string>();
  const isLoadingAndroidGallery = useRef(false);

  // Proximity Calculation
  const distanceFromTarget =
    detectedGps && targetLat !== undefined && targetLon !== undefined
      ? calculateDistanceMeters(
        detectedGps.latitude,
        detectedGps.longitude,
        targetLat,
        targetLon,
      )
      : null;

  const isWithinProximity =
    distanceFromTarget !== null ? distanceFromTarget <= MAX_PROXIMITY_METERS : null;

  // Validation rules: Note is required when sign is reported REMOVED
  const isLocationValid = Boolean(detectedGps && isWithinProximity === true);
  const isNoteValid = evidenceType !== 'REMOVED' || customNote.trim().length > 0;
  const isSubmitDisabled =
    !selectedMedia ||
    !isLocationValid ||
    !isNoteValid ||
    isSubmitting ||
    isOpeningGallery;

  // Dynamic submit button label based on current validation state
  let submitButtonLabel = 'Gửi bằng chứng tái thẩm định';
  if (isSubmitting) {
    submitButtonLabel = 'Đang gửi bằng chứng…';
  } else if (!selectedMedia) {
    submitButtonLabel = 'Tải lên ảnh hoặc video bằng chứng';
  } else if (!detectedGps) {
    submitButtonLabel = 'Cần vị trí (Đóng dấu GPS thiết bị)';
  } else if (isWithinProximity === false) {
    submitButtonLabel = `Vị trí quá xa (${distanceFromTarget}m > 50m)`;
  } else if (!isNoteValid) {
    submitButtonLabel = 'Cần nhập ghi chú khi chọn "Đã gỡ bỏ"';
  }

  /**
   * Top navigation Back button:
   * Navigates back to the revalidation map and explicitly snaps to the selected sign coordinate!
   */
  const handleNavigateBack = useCallback(() => {
    if (targetLat !== undefined && targetLon !== undefined) {
      router.replace({
        pathname: '/work/revalidation-map',
        params: {
          selectedSignId: signId,
          snapLon: String(targetLon),
          snapLat: String(targetLat),
          snapRequestId: String(Date.now()),
        },
      });
    } else {
      router.back();
    }
  }, [router, signId, targetLat, targetLon]);

  // Use live GPS position as fallback when camera strips EXIF GPS
  const handleUseCurrentLocation = async () => {
    setIsLocatingDevice(true);
    setPickerError(undefined);
    try {
      const pos = await fetchFreshGpsPosition();
      if (pos) {
        setDetectedGps({
          latitude: pos[1],
          longitude: pos[0],
        });
      } else {
        setPickerError(COULD_NOT_ACQUIRE_GPS_MESSAGE);
      }
    } catch {
      setPickerError(UNABLE_TO_GET_GPS_LOCATION_MESSAGE);
    } finally {
      setIsLocatingDevice(false);
    }
  };

  // Android media library pagination loader
  const loadAndroidGalleryPage = async (after?: string) => {
    if (isLoadingAndroidGallery.current) return;
    isLoadingAndroidGallery.current = true;
    setIsAndroidGalleryLoading(true);
    setAndroidGalleryError(undefined);

    try {
      const page = await LegacyMediaLibrary.getAssetsAsync({
        after,
        first: ANDROID_GALLERY_PAGE_SIZE,
        mediaType: [LegacyMediaLibrary.MediaType.photo, LegacyMediaLibrary.MediaType.video],
        sortBy: [[LegacyMediaLibrary.SortBy.creationTime, false]],
      });

      setAndroidGalleryAssets((current) =>
        after ? [...current, ...page.assets] : page.assets,
      );
      setAndroidGalleryCursor(page.endCursor);
      setAndroidGalleryHasNextPage(page.hasNextPage);
    } catch (error) {
      console.warn('[InspectRevalidate] Unable to load Android gallery:', error);
      setAndroidGalleryError(UNABLE_TO_LOAD_PHOTO_LIBRARY_SIMPLE_MESSAGE);
    } finally {
      isLoadingAndroidGallery.current = false;
      setIsAndroidGalleryLoading(false);
    }
  };

  const openAndroidGallery = async () => {
    const permission = await LegacyMediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
    if (permission.status !== 'granted') {
      setPickerError(MEDIA_LIBRARY_PERMISSION_REQUIRED_PHOTOS_MESSAGE);
      return;
    }
    setAndroidGalleryAssets([]);
    setAndroidGalleryCursor(undefined);
    setAndroidGalleryHasNextPage(false);
    setAndroidGalleryError(undefined);
    setIsAndroidGalleryVisible(true);
    await loadAndroidGalleryPage();
  };

  const handleSelectAndroidAsset = async (asset: MediaLibraryAsset) => {
    if (selectingAndroidAssetId) return;
    setSelectingAndroidAssetId(asset.id);
    setAndroidGalleryError(undefined);

    try {
      const assetInfo = await LegacyMediaLibrary.getAssetInfoAsync(asset);
      const isVideo = asset.mediaType === LegacyMediaLibrary.MediaType.video;

      const exif = assetInfo.exif as Record<string, unknown> | undefined;
      const exifCoordinates = extractImageGpsCoordinates(exif);
      const gpsCoordinates = isValidGpsCoordinates(assetInfo.location)
        ? {
          latitude: assetInfo.location.latitude,
          longitude: assetInfo.location.longitude,
        }
        : exifCoordinates;

      if (isVideo) {
        const videoMeta = await extractVideoMetadataAsync({
          id: asset.id,
          uri: assetInfo.localUri ?? asset.uri,
          filename: asset.filename,
          duration: asset.duration,
          creationTime: asset.creationTime,
          location: gpsCoordinates,
          exif,
        });

        setSelectedMedia({
          uri: assetInfo.localUri ?? asset.uri,
          type: 'video',
          fileName: asset.filename,
          duration: videoMeta.durationSeconds,
          capturedAt: videoMeta.capturedAt,
          assetId: asset.id,
        });
        setDetectedGps(
          videoMeta.hasDeviceGps
            ? {
              latitude: videoMeta.startCoordinate[1],
              longitude: videoMeta.startCoordinate[0],
            }
            : null,
        );
      } else {
        setSelectedMedia({
          uri: assetInfo.localUri ?? asset.uri,
          type: 'image',
          fileName: asset.filename,
          capturedAt:
            asset.creationTime > 0
              ? new Date(asset.creationTime).toISOString()
              : undefined,
          assetId: asset.id,
        });
        setDetectedGps(gpsCoordinates ?? null);
      }

      setIsAndroidGalleryVisible(false);
    } catch (error) {
      console.warn('[InspectRevalidate] Unable to process selected asset:', error);
      setAndroidGalleryError(CANNOT_READ_SELECTED_FILE_MESSAGE);
    } finally {
      setSelectingAndroidAssetId(undefined);
    }
  };

  // Launch camera to snap photo on-site
  const handleLaunchCamera = async () => {
    setPickerError(undefined);
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setPickerError(CAMERA_PERMISSION_REQUIRED_MESSAGE);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset: ImagePickerAsset = result.assets[0];
        const gps = extractImageGpsCoordinates(asset.exif);

        setSelectedMedia({
          uri: asset.uri,
          type: 'image',
          fileName: asset.fileName || 'anh-kiem-tra.jpg',
          mimeType: asset.mimeType,
          capturedAt: new Date().toISOString(),
        });

        if (gps) {
          setDetectedGps(gps);
        } else {
          void handleUseCurrentLocation();
        }
      }
    } catch (err) {
      console.warn('[InspectRevalidate] Camera error:', err);
      setPickerError(CANNOT_OPEN_CAMERA_MESSAGE);
    }
  };

  // Generic Gallery Picker
  const handleOpenGallery = async () => {
    if (isOpeningGallery || isSubmitting) return;
    setIsOpeningGallery(true);
    setPickerError(undefined);

    try {
      if (Platform.OS === 'android') {
        await openAndroidGallery();
        return;
      }

      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        exif: true,
        mediaTypes: ['images', 'videos'],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        const gps = extractImageGpsCoordinates(asset.exif);

        setSelectedMedia({
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          duration: asset.duration ? asset.duration / 1000 : undefined,
          capturedAt: new Date().toISOString(),
        });
        setDetectedGps(gps ?? null);
      }
    } catch (err) {
      console.warn('[InspectRevalidate] Gallery error:', err);
      setPickerError(CANNOT_OPEN_MEDIA_LIBRARY_MESSAGE);
    } finally {
      setIsOpeningGallery(false);
    }
  };

  // Submit Evidence Action
  const handleSubmitEvidence = async () => {
    if (isSubmitDisabled) return;
    setIsSubmitting(true);
    setSubmitError(undefined);

    const lat = detectedGps?.latitude;
    const lon = detectedGps?.longitude;
    const targetTaskId = taskId || signId;

    if (!lat || !lon) {
      setSubmitError(COORDINATES_REQUIRED_EVIDENCE_MESSAGE);
      return;
    }

    try {
      await submitRevalidationEvidence(
        targetTaskId,
        {
          latitude: lat,
          longitude: lon,
          capturedAt: selectedMedia?.capturedAt || new Date().toISOString(),
          note: customNote.trim() || undefined,
          evidenceType,
        },
        selectedMedia
          ? {
            uri: selectedMedia.uri,
            fileName: selectedMedia.fileName || 'evidence.jpg',
            mimeType: selectedMedia.mimeType,
          }
          : undefined,
        session?.accessToken,
      );

      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks-in-bounds'] });
      void queryClient.invalidateQueries({ queryKey: ['all-revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });

      setSubmitSuccess(true);
      setTimeout(() => {
        handleNavigateBack();
      }, 1400);
    } catch (err) {
      console.error('[InspectRevalidate] Submission failed:', err);
      setSubmitError(err instanceof Error ? err.message : SUBMIT_EVIDENCE_FAILED_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* =================================================================== */}
      {/* ANDROID MEDIA LIBRARY BOTTOM SHEET MODAL                            */}
      {/* =================================================================== */}
      <Modal
        animationType="slide"
        onRequestClose={() => setIsAndroidGalleryVisible(false)}
        statusBarTranslucent
        transparent
        visible={isAndroidGalleryVisible}
      >
        <View style={styles.galleryModalRoot}>
          <Pressable
            accessibilityLabel="Đóng thư viện ảnh"
            accessibilityRole="button"
            onPress={() => setIsAndroidGalleryVisible(false)}
            style={styles.galleryBackdrop}
          />
          <SafeAreaView
            edges={['bottom']}
            style={[styles.galleryScreen, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={styles.galleryHandleArea}>
              <View style={[styles.galleryHandle, { backgroundColor: theme.border }]} />
            </View>
            <View style={[styles.galleryHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.galleryHeading}>
                <Text style={[styles.galleryTitle, { color: theme.text }]}>Chọn hình ảnh / video bằng chứng</Text>
                <Text style={[styles.gallerySubtitle, { color: theme.textSecondary }]}>
                  Dữ liệu tọa độ GPS gốc sẽ được kiểm tra đối chiếu
                </Text>
              </View>
              <AppButton
                accessibilityLabel="Đóng"
                label="Đóng"
                onPress={() => setIsAndroidGalleryVisible(false)}
                style={styles.galleryCloseButton}
                variant="ghost"
              />
            </View>

            {androidGalleryError ? (
              <Text accessibilityRole="alert" style={styles.galleryErrorText}>
                {androidGalleryError}
              </Text>
            ) : null}

            <FlatList
              contentContainerStyle={styles.galleryGrid}
              data={[
                { id: '__camera__', isCameraTile: true },
                ...androidGalleryAssets,
              ]}
              keyExtractor={(item) => item.id}
              ListFooterComponent={
                androidGalleryHasNextPage ? (
                  <ActivityIndicator color={theme.primary} style={styles.galleryFooterLoader} />
                ) : null
              }
              numColumns={3}
              onEndReached={() => {
                if (androidGalleryHasNextPage && androidGalleryCursor) {
                  void loadAndroidGalleryPage(androidGalleryCursor);
                }
              }}
              onEndReachedThreshold={0.5}
              renderItem={({ item }) => {
                if ('isCameraTile' in item && item.isCameraTile) {
                  return (
                    <Pressable
                      accessibilityLabel="Mở máy ảnh"
                      accessibilityRole="button"
                      onPress={() => {
                        setIsAndroidGalleryVisible(false);
                        void handleLaunchCamera();
                      }}
                      style={({ pressed }) => [
                        styles.galleryItem,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <View
                        style={[
                          styles.cameraTileInner,
                          {
                            backgroundColor: theme.backgroundElement,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <View style={styles.cameraTileIconBox}>
                          <MaterialCommunityIcons color="#FFFFFF" name="camera" size={22} />
                        </View>
                        <Text style={[styles.cameraTileText, { color: theme.text }]}>Máy ảnh</Text>
                      </View>
                    </Pressable>
                  );
                }

                const asset = item as MediaLibraryAsset;
                const isSelecting = selectingAndroidAssetId === asset.id;
                const isVideo = asset.mediaType === LegacyMediaLibrary.MediaType.video;

                return (
                  <Pressable
                    accessibilityLabel={`Select ${asset.filename}`}
                    accessibilityRole="button"
                    disabled={Boolean(selectingAndroidAssetId)}
                    onPress={() => void handleSelectAndroidAsset(asset)}
                    style={({ pressed }) => [
                      styles.galleryItem,
                      { opacity: pressed || isSelecting ? 0.65 : 1 },
                    ]}
                  >
                    <Image contentFit="cover" source={{ uri: asset.uri }} style={styles.galleryImage} />
                    {isVideo ? (
                      <View style={styles.galleryVideoBadge}>
                        <MaterialCommunityIcons color="#FFFFFF" name="video" size={14} />
                      </View>
                    ) : null}
                    {isSelecting ? (
                      <View style={styles.gallerySelectingOverlay}>
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* MAIN SCREEN WITH KEYBOARD AVOIDING VIEW                             */}
      {/* =================================================================== */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets={true}
            contentContainerStyle={styles.content}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Header Row */}
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Quay lại bản đồ tái thẩm định"
                accessibilityRole="button"
                hitSlop={10}
                onPress={handleNavigateBack}
                style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
              >
                <MaterialCommunityIcons color={theme.text} name="arrow-left" size={20} />
              </Pressable>
              <View style={styles.headerTitleCol}>
                <View style={styles.headerBadgeRow}>
                  <Text style={[styles.title, { color: theme.text }]}>Kiểm tra & Tái thẩm định</Text>
                  <View style={styles.signCodePill}>
                    <Text style={styles.signCodePillText}>{signCode}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  {roadName}
                </Text>
              </View>
            </View>

            {/* =============================================================== */}
            {/* 1. TARGET SIGN CONTEXT CARD (CARRIED DATA)                       */}
            {/* =============================================================== */}
            <View
              style={[
                styles.targetSignCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleCol}>
                  <Text numberOfLines={1} style={[styles.targetSignName, { color: theme.text }]}>
                    {signName}
                  </Text>
                  <Text style={[styles.targetSignMeta, { color: theme.grey }]}>
                    {targetLat && targetLon
                      ? `GPS: ${targetLat.toFixed(5)}, ${targetLon.toFixed(5)}`
                      : 'Đã tải vị trí mục tiêu'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.freshnessBadge,
                    {
                      backgroundColor: freshnessStyle.bg,
                      borderColor: freshnessStyle.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={freshnessStyle.text}
                    name={freshnessStyle.icon}
                    size={12}
                  />
                  <Text
                    style={[
                      styles.freshnessBadgeText,
                      { color: freshnessStyle.text },
                    ]}
                  >
                    {freshnessScore}% Độ tươi mới
                  </Text>
                </View>
              </View>

              {/* Visual Evidence Reference Comparison */}
              <View style={styles.evidenceComparisonRow}>
                <View style={[styles.miniEvidenceBox, { borderColor: theme.border }]}>
                  <View style={styles.miniImgFrame}>
                    {targetImageUrl ? (
                      <Image contentFit="contain" source={{ uri: targetImageUrl }} style={styles.miniImg} />
                    ) : (
                      <MaterialCommunityIcons color={theme.grey} name="traffic-light" size={24} />
                    )}
                  </View>
                </View>

                <MaterialCommunityIcons color="#0671EB" name="swap-horizontal" size={20} />

                <View style={[styles.miniEvidenceBox, { borderColor: '#93C5FD' }]}>
                  <View style={styles.miniImgFrame}>
                    {targetCropUrl ? (
                      <Image contentFit="cover" source={{ uri: targetCropUrl }} style={styles.miniImgCrop} />
                    ) : (
                      <View style={styles.noCropMini}>
                        <MaterialCommunityIcons color={theme.placeholder} name="camera-outline" size={18} />
                        <Text style={[styles.noCropMiniText, { color: theme.placeholder }]}>Không có ảnh crop</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* =============================================================== */}
            {/* 2. MEDIA EVIDENCE UPLOADER & PREVIEW                             */}
            {/* =============================================================== */}
            <Pressable
              accessibilityLabel={
                selectedMedia ? 'Đổi tệp đã chọn' : 'Tải lên ảnh hoặc video'
              }
              accessibilityRole="button"
              disabled={isOpeningGallery || isSubmitting}
              onPress={handleOpenGallery}
              style={[
                styles.uploadPlaceholder,
                {
                  backgroundColor: theme.neutral,
                  borderColor: selectedMedia ? '#0671EB' : theme.border,
                  padding: selectedMedia ? 0 : Spacing.four,
                },
              ]}
            >
              {selectedMedia ? (
                selectedMedia.type === 'video' ? (
                  <View style={styles.videoPreview}>
                    <MaterialCommunityIcons color="#FFFFFF" name="video" size={36} />
                    <Text numberOfLines={2} style={styles.videoFileName}>
                      {selectedMedia.fileName ?? 'Đã chọn video bằng chứng'}
                    </Text>
                  </View>
                ) : (
                  <Image
                    accessibilityLabel="Bằng chứng đã chọn"
                    contentFit="cover"
                    source={{ uri: selectedMedia.uri }}
                    style={styles.selectedImage}
                  />
                )
              ) : (
                <>
                  <SymbolView
                    fallback={
                      <MaterialCommunityIcons color={theme.placeholder} name="image" size={38} />
                    }
                    name={{
                      android: 'image',
                      ios: 'photo',
                      web: 'image',
                    }}
                    size={38}
                    tintColor={theme.placeholder}
                  />
                  <Text style={[styles.uploadLabel, { color: theme.textSecondary }]}>
                    {isOpeningGallery ? 'Đang mở thư viện...' : 'Tải lên ảnh hoặc video'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Helper text matching new survey screen */}
            <Text style={[styles.helperText, { color: theme.placeholder }]}>
              {selectedMedia
                ? 'Nhấn vào ảnh để chọn tệp khác'
                : 'Tải ảnh hoặc video biển báo của bạn tại đây'}
            </Text>

            {pickerError ? (
              <Text accessibilityRole="alert" style={styles.errorAlertText}>
                {pickerError}
              </Text>
            ) : null}

            {/* =============================================================== */}
            {/* 3. REAL-TIME PROXIMITY & GPS GUARDRAIL                          */}
            {/* =============================================================== */}
            <View
              style={[
                styles.gpsGuardrailCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor:
                    isWithinProximity === true
                      ? '#10B981'
                      : isWithinProximity === false
                        ? '#EF4444'
                        : theme.border,
                },
              ]}
            >
              <View style={styles.gpsCardHeader}>
                <MaterialCommunityIcons
                  color={
                    isWithinProximity === true
                      ? '#10B981'
                      : isWithinProximity === false
                        ? '#EF4444'
                        : theme.primary
                  }
                  name={
                    isWithinProximity === true
                      ? 'crosshairs-gps'
                      : isWithinProximity === false
                        ? 'map-marker-distance'
                        : 'crosshairs-question'
                  }
                  size={22}
                />
                <View style={styles.gpsCardTitleCol}>
                  <Text style={[styles.gpsCardTitle, { color: theme.text }]}>
                    {distanceFromTarget !== null
                      ? `Cách biển báo mục tiêu ${distanceFromTarget}m`
                      : detectedGps
                        ? `GPS: ${detectedGps.latitude.toFixed(5)}, ${detectedGps.longitude.toFixed(5)}`
                        : 'Chưa phát hiện tọa độ GPS'}
                  </Text>
                  <Text style={[styles.gpsCardSubtitle, { color: theme.textSecondary }]}>
                    {isWithinProximity === true
                      ? 'Nằm trong bán kính hợp lệ (< 50m). Đạt chuẩn PostGIS.'
                      : isWithinProximity === false
                        ? `Bằng chứng cách xa ${distanceFromTarget}m. Tối đa cho phép 50m.`
                        : 'Chụp ảnh tại hiện trường hoặc nhấn bên dưới để đóng dấu GPS thiết bị.'}
                  </Text>
                </View>
              </View>

              {/* Stamp Live GPS Fallback Button */}
              {!detectedGps || isWithinProximity === false ? (
                <AppButton
                  accessibilityLabel="Sử dụng GPS thiết bị hiện tại"
                  disabled={isLocatingDevice || isSubmitting}
                  onPress={handleUseCurrentLocation}
                  style={styles.stampGpsBtn}
                  variant="surface"
                >
                  {isLocatingDevice ? (
                    <ActivityIndicator color={theme.primary} size="small" />
                  ) : (
                    <MaterialCommunityIcons color={theme.primary} name="crosshairs-gps" size={16} />
                  )}
                  <Text style={[styles.stampGpsBtnText, { color: theme.primary }]}>
                    {isLocatingDevice ? 'Đang lấy tín hiệu GPS…' : 'Đóng dấu GPS thiết bị hiện tại'}
                  </Text>
                </AppButton>
              ) : null}
            </View>

            {/* =============================================================== */}
            {/* 4. REVALIDATION STATUS & NOTES                                  */}
            {/* =============================================================== */}
            <View style={styles.inputLabelRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Kết luận tái thẩm định thực địa</Text>
              <Text style={styles.requiredTag}>* Bắt buộc</Text>
            </View>

            <View style={styles.statusOptionsWrap}>
              {REVALIDATION_STATUS_OPTIONS.map((opt) => {
                const isSelected = evidenceType === opt.id;
                return (
                  <Pressable
                    accessibilityLabel={opt.label}
                    accessibilityRole="button"
                    key={opt.id}
                    onPress={() => setEvidenceType(opt.id)}
                    style={[
                      styles.statusOptionCard,
                      {
                        backgroundColor: isSelected
                          ? `${opt.activeColor}12`
                          : theme.backgroundElement,
                        borderColor: isSelected ? opt.activeColor : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.statusOptionHeader}>
                      <View
                        style={[
                          styles.statusOptionRadio,
                          {
                            borderColor: isSelected ? opt.activeColor : theme.placeholder,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.statusOptionRadioDot,
                              { backgroundColor: opt.activeColor },
                            ]}
                          />
                        )}
                      </View>
                      <MaterialCommunityIcons
                        color={isSelected ? opt.activeColor : theme.placeholder}
                        name={opt.icon}
                        size={20}
                      />
                      <Text
                        style={[
                          styles.statusOptionLabel,
                          {
                            color: isSelected ? opt.activeColor : theme.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.statusOptionDesc,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {opt.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {evidenceType === 'CHANGED' ? (
              <View style={[styles.aiNoticeCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <MaterialCommunityIcons color="#D97706" name="robot-outline" size={18} />
                <Text style={styles.aiNoticeText}>
                  Hệ thống AI sẽ tự động phân tích ảnh thực địa bạn chụp để nhận diện loại biển báo mới.
                </Text>
              </View>
            ) : null}

            {/* Labeled input for additional notes */}
            <View style={styles.inputLabelRow}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Ghi chú chi tiết</Text>
              {evidenceType === 'REMOVED' ? (
                <Text style={styles.requiredTag}>* Bắt buộc khi chọn &quot;Đã gỡ bỏ&quot;</Text>
              ) : (
                <Text style={[styles.optionalTag, { color: theme.grey }]}>Không bắt buộc</Text>
              )}
            </View>

            <TextInput
              accessibilityLabel="Ghi chú của người kiểm tra"
              multiline
              numberOfLines={3}
              onChangeText={setCustomNote}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 250);
              }}
              placeholder={
                evidenceType === 'REMOVED'
                  ? 'Mô tả hiện trạng vị trí (ví dụ: cột đã bị tháo, công trình đang thi công gỡ bỏ)...'
                  : evidenceType === 'CHANGED'
                    ? 'Ghi chú thêm về biển báo mới (ví dụ: biển hạn chế tốc độ mới thay thế)...'
                    : 'Ghi chú bổ sung (ví dụ: biển còn rõ ràng, quan sát tốt)...'
              }
              placeholderTextColor={theme.placeholder}
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor:
                    evidenceType === 'REMOVED' && !customNote.trim()
                      ? '#EF4444'
                      : theme.border,
                  color: theme.text,
                },
              ]}
              value={customNote}
            />

            {evidenceType === 'REMOVED' && !customNote.trim() ? (
              <Text style={styles.noteRequiredError}>
                Vui lòng nhập giải thích lý do biển báo đã bị gỡ bỏ hoặc không còn.
              </Text>
            ) : null}

            {submitError ? (
              <Text accessibilityRole="alert" style={styles.errorAlertText}>
                {submitError}
              </Text>
            ) : null}

            {/* Success Banner */}
            {submitSuccess ? (
              <View style={styles.successBanner}>
                <MaterialCommunityIcons color="#059669" name="check-circle" size={20} />
                <Text style={styles.successBannerText}>
                  Đã gửi bằng chứng! Đang quay lại bản đồ tái thẩm định…
                </Text>
              </View>
            ) : null}

            {/* =============================================================== */}
            {/* 5. SUBMIT EVIDENCE CTA (DISABLED IF LOCATION INVALID)           */}
            {/* =============================================================== */}
            <AppButton
              accessibilityLabel={submitButtonLabel}
              disabled={isSubmitDisabled}
              onPress={handleSubmitEvidence}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: isSubmitDisabled ? '#94A3B8' : '#0671EB',
                  opacity: isSubmitDisabled ? 0.65 : 1,
                },
              ]}
              variant="primary"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons color="#FFFFFF" name="shield-check" size={20} />
              )}
              <Text style={styles.submitBtnText}>{submitButtonLabel}</Text>
            </AppButton>
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
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  signCodePill: {
    backgroundColor: '#0671EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  signCodePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  // Target Sign Card
  targetSignCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleCol: {
    flex: 1,
  },
  targetSignName: {
    fontSize: 15,
    fontWeight: '700',
  },
  targetSignMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  freshnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  freshnessBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  evidenceComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  miniEvidenceBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    width: 120,
    height: 72,
    backgroundColor: '#FFFFFF',
  },
  miniImgFrame: {
    width: 80,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniImg: {
    width: 50,
    height: 50,
  },
  miniImgCrop: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  noCropMini: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  noCropMiniText: {
    fontSize: 9,
  },
  // Section Headings
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  // Redesigned Upload Placeholder (matches survey record screen & user mockup)
  uploadPlaceholder: {
    position: 'relative',
    overflow: 'hidden',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Rounded.lg,
    padding: Spacing.four,
  },
  uploadLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center',
  },
  helperText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: Rounded.lg,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.three,
  },
  videoFileName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraTileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 6,
  },
  cameraTileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0671EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraTileText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // GPS Guardrail
  gpsGuardrailCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  gpsCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  gpsCardTitleCol: {
    flex: 1,
  },
  gpsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  gpsCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  stampGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stampGpsBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Status Options Cards
  statusOptionsWrap: {
    gap: 10,
    marginBottom: Spacing.two,
  },
  statusOptionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  statusOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionLabel: {
    fontSize: 14,
  },
  statusOptionDesc: {
    fontSize: 12,
    paddingLeft: 26,
    lineHeight: 16,
  },
  aiNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.two,
  },
  aiNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '500',
  },
  // Input Label Row & Notes
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  requiredTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '500',
  },
  notesInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  noteRequiredError: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  // Alerts & Messages
  errorAlertText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: Spacing.three,
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  // Submit Button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: Spacing.four,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Gallery Modal Styles
  galleryModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  galleryBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  galleryScreen: {
    height: '80%',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopLeftRadius: Rounded.xlg,
    borderTopRightRadius: Rounded.xlg,
    overflow: 'hidden',
  },
  galleryHandleArea: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  galleryHeading: {
    flex: 1,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  gallerySubtitle: {
    fontSize: 12,
  },
  galleryCloseButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  galleryErrorText: {
    color: '#DC2626',
    padding: Spacing.three,
    fontSize: 12,
    fontWeight: '600',
  },
  galleryGrid: {
    padding: 2,
  },
  galleryEmptyContent: {
    flexGrow: 1,
  },
  galleryEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  galleryEmptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  galleryItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  galleryVideoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 4,
    padding: 2,
  },
  gallerySelectingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryFooterLoader: {
    padding: Spacing.three,
  },
});
