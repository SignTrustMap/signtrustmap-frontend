import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import type { Asset as MediaLibraryAsset } from 'expo-media-library/legacy';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { useSaveSurveyDraft } from '@/feature/upload/hooks/use-save-survey-draft';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppButton } from '@/components/button';
import {
  CANNOT_OPEN_DOCUMENT_PICKER_MESSAGE,
  CANNOT_OPEN_PHOTO_LIBRARY_MESSAGE,
  CANNOT_SAVE_DRAFT_MESSAGE,
  GALLERY_DEV_BUILD_REQUIRED_MESSAGE,
  MEDIA_LIBRARY_PERMISSION_REQUIRED_MESSAGE,
  SELECT_VALID_GPX_FILE_MESSAGE,
  UNABLE_TO_LOAD_PHOTO_LIBRARY_MESSAGE,
  UNABLE_TO_READ_FILE_MESSAGE,
} from '@/constants/message';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  extractImageGpsCoordinates,
  type ImageGpsCoordinates,
} from '@/feature/upload/utils/image-gps';
import { useTheme } from '@/hooks/use-theme';
import { SurveyScanModal } from '@/feature/upload/components/survey-scan-modal';
import { extractGpxGpsData } from '@/feature/upload/utils/gpx';
import { extractVideoMetadataAsync } from '@/feature/upload/utils/video-gps';
import { extractGpsFromVideoFile } from '@/feature/upload/utils/video-file-gps';
import { extractGpsFromImageFile } from '@/feature/upload/utils/image-file-gps';


type SelectedSurveyMedia = {
  capturedAt?: string;
  fileName?: string | null;
  mimeType?: string;
  type: 'image' | 'video';
  uri: string;
  duration?: number;
  assetId?: string;
  gps?: ImageGpsCoordinates | null;
};

type SelectedGpxFile = {
  name: string;
  uri: string;
  mimeType?: string;
};

function captureTimeFromExif(exif: ImagePickerAsset['exif']) {
  const value = exif?.DateTimeOriginal ?? exif?.DateTime;
  if (typeof value !== 'string') return undefined;
  const timestamp = Date.parse(value.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T'));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

const ANDROID_GALLERY_PAGE_SIZE = 60;

function isValidGpsCoordinates(
  coordinates: ImageGpsCoordinates | null | undefined,
): coordinates is ImageGpsCoordinates {
  return Boolean(
    coordinates &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    Math.abs(coordinates.latitude) <= 90 &&
    Math.abs(coordinates.longitude) <= 180 &&
    // Reject (0, 0) — it's a sentinel "no GPS" value on many devices
    !(coordinates.latitude === 0 && coordinates.longitude === 0),
  );
}

async function findOriginalAssetByFileName(
  MediaLibrary: typeof import('expo-media-library'),
  selectedAsset: ImagePickerAsset,
) {
  if (!selectedAsset.fileName) return undefined;

  const libraryAssets = await new MediaLibrary.Query()
    .eq(MediaLibrary.AssetField.MEDIA_TYPE, MediaLibrary.MediaType.IMAGE)
    .orderBy({ key: MediaLibrary.AssetField.MODIFICATION_TIME, ascending: false })
    .limit(500)
    .exeForMetadata();
  const fileName = selectedAsset.fileName.toLowerCase();

  const matches = libraryAssets.filter(
    (asset) => asset.filename?.toLowerCase() === fileName,
  );

  return (
    matches.find(
      (asset) =>
        asset.width === selectedAsset.width && asset.height === selectedAsset.height,
    ) ?? matches[0]
  );
}

async function extractSelectedAssetGps(asset: ImagePickerAsset) {
  console.log('[Surveyor] Picker asset metadata:', {
    assetId: asset.assetId,
    exif: asset.exif,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    type: asset.type,
    uri: asset.uri,
  });

  const exifCoordinates = extractImageGpsCoordinates(asset.exif);

  if (exifCoordinates) {
    console.log('[Surveyor] Extracted image GPS data:', {
      ...exifCoordinates,
      source: 'image-picker-exif',
    });
    return exifCoordinates;
  }

  if (Platform.OS === 'web') {
    console.log('[Surveyor] Extracted GPS data:', null);
    return null;
  }

  try {
    const permission = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);

    console.log('[Surveyor] Media location permission:', {
      accessPrivileges: permission.accessPrivileges,
      status: permission.status,
    });

    if (permission.status !== 'granted') {
      console.log('[Surveyor] Extracted GPS data:', null);
      return null;
    }

    let location: ImageGpsCoordinates | null | undefined;
    let originalExif: Record<string, unknown> | null | undefined;
    let mediaAssetId = asset.assetId;

    if (mediaAssetId && Platform.OS === 'android' && !mediaAssetId.startsWith('content://')) {
      const assetInfo = await LegacyMediaLibrary.getAssetInfoAsync(mediaAssetId);

      location = assetInfo.location;
      originalExif = assetInfo.exif as Record<string, unknown> | undefined;
    } else {
      if (!mediaAssetId) {
        const matchingAsset = await findOriginalAssetByFileName(MediaLibrary, asset);
        mediaAssetId = matchingAsset?.id;
        console.log('[Surveyor] Matched MediaStore asset:', matchingAsset ?? null);
      }

      if (mediaAssetId) {
        const originalAsset = new MediaLibrary.Asset(mediaAssetId);
        [location, originalExif] = await Promise.all([
          originalAsset.getLocation(),
          originalAsset.getExif(),
        ]);
      }
    }

    if (isValidGpsCoordinates(location)) {
      const coordinates = {
        latitude: location.latitude,
        longitude: location.longitude,
      } satisfies ImageGpsCoordinates;

      console.log('[Surveyor] Extracted GPS data:', {
        ...coordinates,
        source: 'media-library-original',
      });
      return coordinates;
    }

    const mediaLibraryExifCoordinates = extractImageGpsCoordinates(originalExif);
    if (mediaLibraryExifCoordinates) return mediaLibraryExifCoordinates;

    if (asset.type === 'image') {
      // Android scoped storage can strip GPS from the EXIF object returned by
      // MediaLibrary.getExif() even when ACCESS_MEDIA_LOCATION is granted.
      // Fall back to reading the GPS IFD directly from the raw JPEG bytes.
      const fileGps = await extractGpsFromImageFile(asset.uri);
      if (fileGps) {
        console.log('[Surveyor] Extracted GPS data from image file EXIF:', {
          latitude: fileGps.latitude,
          longitude: fileGps.longitude,
          source: 'image-file-exif',
        });
        return fileGps;
      }
    }

    if (asset.type === 'video') {
      const fileGps = await extractGpsFromVideoFile(asset.uri);
      if (fileGps) {
        console.log('[Surveyor] Extracted GPS data from video file container:', {
          latitude: fileGps.latitude,
          longitude: fileGps.longitude,
          source: fileGps.source,
        });
        return { latitude: fileGps.latitude, longitude: fileGps.longitude };
      }
    }

    return null;
  } catch (error) {
    if (asset.type === 'image') {
      // LegacyMediaLibrary.getAssetInfoAsync can throw for files that are
      // outside the camera roll (e.g. Downloads). Fall back to reading the
      // GPS IFD directly from the raw JPEG bytes, which is never redacted.
      try {
        const fileGps = await extractGpsFromImageFile(asset.uri);
        if (fileGps) {
          console.log('[Surveyor] Extracted GPS data from image file EXIF (catch):', {
            latitude: fileGps.latitude,
            longitude: fileGps.longitude,
            source: 'image-file-exif',
          });
          return fileGps;
        }
      } catch {
        // continue to return null
      }
    }
    if (asset.type === 'video') {
      try {
        const fileGps = await extractGpsFromVideoFile(asset.uri);
        if (fileGps) {
          console.log('[Surveyor] Extracted GPS data from video file container (catch):', {
            latitude: fileGps.latitude,
            longitude: fileGps.longitude,
            source: fileGps.source,
          });
          return { latitude: fileGps.latitude, longitude: fileGps.longitude };
        }
      } catch {
        // continue to return null
      }
    }
    console.warn('[Surveyor] Unable to read original GPS metadata:', error);
    console.log('[Surveyor] Extracted GPS data:', null);
    return null;
  }
}

export function NewSurveyRecordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const saveDraft = useSaveSurveyDraft();
  const isFocused = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const scanFinished = useRef(false);
  const savedDraftId = useRef<string | undefined>(undefined);
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);
  const [pickerError, setPickerError] = useState<string>();
  const [selectedAssets, setSelectedAssets] = useState<SelectedSurveyMedia[]>([]);
  const [activeAssetIndex, setActiveAssetIndex] = useState<number>(0);
  const selectedAsset = selectedAssets[activeAssetIndex];
  const selectedGps = selectedAsset?.gps ?? null;
  const [selectedGpxFile, setSelectedGpxFile] = useState<SelectedGpxFile>();
  const [showAdvancedGpx, setShowAdvancedGpx] = useState(false);
  const [gpxPickerError, setGpxPickerError] = useState<string>();
  const [isScanning, setIsScanning] = useState(false);
  const scanInProgress = useRef(false);
  const [isAndroidGalleryVisible, setIsAndroidGalleryVisible] = useState(false);
  const [androidGalleryAssets, setAndroidGalleryAssets] = useState<MediaLibraryAsset[]>([]);
  const [androidGalleryCursor, setAndroidGalleryCursor] = useState<string>();
  const [androidGalleryHasNextPage, setAndroidGalleryHasNextPage] = useState(false);
  const [androidGalleryError, setAndroidGalleryError] = useState<string>();
  const [isAndroidGalleryLoading, setIsAndroidGalleryLoading] = useState(false);
  const [selectedAndroidAssetIds, setSelectedAndroidAssetIds] = useState<string[]>([]);
  const [isSelectingAndroidAssets, setIsSelectingAndroidAssets] = useState(false);
  const isLoadingAndroidGallery = useRef(false);

  useFocusEffect(useCallback(() => {
    isFocused.current = true;
    return () => { isFocused.current = false; };
  }, []));

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

      setAndroidGalleryAssets((currentAssets) =>
        after ? [...currentAssets, ...page.assets] : page.assets,
      );
      setAndroidGalleryCursor(page.endCursor);
      setAndroidGalleryHasNextPage(page.hasNextPage);
    } catch (error) {
      console.warn('[Surveyor] Unable to load Android media library:', error);
      setAndroidGalleryError(UNABLE_TO_LOAD_PHOTO_LIBRARY_MESSAGE);
    } finally {
      isLoadingAndroidGallery.current = false;
      setIsAndroidGalleryLoading(false);
    }
  };

  const openAndroidMediaLibrary = async () => {
    const permission = await LegacyMediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);

    console.log('[Surveyor] Media permission before gallery:', {
      accessPrivileges: permission.accessPrivileges,
      status: permission.status,
    });

    if (permission.status !== 'granted') {
      setPickerError(MEDIA_LIBRARY_PERMISSION_REQUIRED_MESSAGE);
      return;
    }

    setAndroidGalleryAssets([]);
    setAndroidGalleryCursor(undefined);
    setAndroidGalleryHasNextPage(false);
    setAndroidGalleryError(undefined);
    setSelectedAndroidAssetIds([]);
    setIsAndroidGalleryVisible(true);
    await loadAndroidGalleryPage();
  };

  const handleToggleAndroidAsset = (assetId: string) => {
    setSelectedAndroidAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId],
    );
  };

  const handleConfirmAndroidSelection = async () => {
    if (selectedAndroidAssetIds.length === 0 || isSelectingAndroidAssets) return;
    setIsSelectingAndroidAssets(true);
    setAndroidGalleryError(undefined);

    try {
      const selectedMap = new Map(androidGalleryAssets.map((a) => [a.id, a]));
      const chosen = selectedAndroidAssetIds
        .map((id) => selectedMap.get(id))
        .filter(Boolean) as MediaLibraryAsset[];
      const processed: SelectedSurveyMedia[] = [];

      for (const asset of chosen) {
        try {
          const assetInfo = await LegacyMediaLibrary.getAssetInfoAsync(asset);
          const assetType =
            asset.mediaType === LegacyMediaLibrary.MediaType.video ? 'video' : 'image';

          const exif = assetInfo.exif as Record<string, unknown> | undefined;
          const exifCoordinates = extractImageGpsCoordinates(exif);
          const gpsCoordinates = isValidGpsCoordinates(assetInfo.location)
            ? {
              latitude: assetInfo.location.latitude,
              longitude: assetInfo.location.longitude,
            }
            : exifCoordinates;

          if (assetType === 'video') {
            const videoMeta = await extractVideoMetadataAsync({
              id: asset.id,
              uri: assetInfo.localUri ?? asset.uri,
              filename: asset.filename,
              duration: asset.duration,
              creationTime: asset.creationTime,
              location: gpsCoordinates,
              exif,
            });

            processed.push({
              capturedAt: videoMeta.capturedAt,
              fileName: asset.filename,
              type: 'video',
              uri: assetInfo.localUri ?? asset.uri,
              duration: videoMeta.durationSeconds,
              assetId: asset.id,
              gps: videoMeta.hasDeviceGps
                ? {
                  latitude: videoMeta.startCoordinate[1],
                  longitude: videoMeta.startCoordinate[0],
                }
                : null,
            });
          } else {
            processed.push({
              capturedAt:
                asset.creationTime > 0
                  ? new Date(asset.creationTime).toISOString()
                  : undefined,
              fileName: asset.filename,
              type: 'image',
              uri: assetInfo.localUri ?? asset.uri,
              duration: asset.duration,
              assetId: asset.id,
              gps: gpsCoordinates ?? null,
            });
          }
        } catch (err) {
          console.warn('[Surveyor] Error reading asset info:', err);
        }
      }

      if (processed.length > 0) {
        setSelectedAssets((prev) => [...prev, ...processed]);
        setActiveAssetIndex(0);
        setSelectedGpxFile(undefined);
        setGpxPickerError(undefined);
        setIsAndroidGalleryVisible(false);
        setSelectedAndroidAssetIds([]);
      }
    } catch (error) {
      console.warn('[Surveyor] Unable to process selected Android assets:', error);
      setAndroidGalleryError(UNABLE_TO_READ_FILE_MESSAGE);
    } finally {
      setIsSelectingAndroidAssets(false);
    }
  };

  const handleRemoveAsset = (indexToRemove: number) => {
    setSelectedAssets((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (activeAssetIndex >= updated.length) {
        setActiveAssetIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleOpenGallery = async () => {
    if (isOpeningGallery || isSaving) return;

    setIsOpeningGallery(true);
    setPickerError(undefined);

    try {
      if (Platform.OS === 'android') {
        await openAndroidMediaLibrary();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        defaultTab: 'photos',
        exif: true,
        mediaTypes: ['images', 'videos'],
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.PAGE_SHEET,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const processed: SelectedSurveyMedia[] = [];

        for (const asset of result.assets) {
          const assetType = asset.type === 'video' ? 'video' : 'image';
          const gpsCoordinates = await extractSelectedAssetGps(asset);

          if (assetType === 'video') {
            const videoMeta = await extractVideoMetadataAsync({
              id: asset.assetId ?? undefined,
              uri: asset.uri,
              filename: asset.fileName,
              duration: asset.duration ? asset.duration / 1000 : undefined,
              location: gpsCoordinates
                ? { latitude: gpsCoordinates.latitude, longitude: gpsCoordinates.longitude }
                : null,
              exif: asset.exif as Record<string, unknown> | undefined,
            });

            processed.push({
              capturedAt: videoMeta.capturedAt,
              fileName: asset.fileName,
              mimeType: asset.mimeType,
              type: 'video',
              uri: asset.uri,
              duration: videoMeta.durationSeconds,
              assetId: asset.assetId ?? undefined,
              gps: videoMeta.hasDeviceGps
                ? {
                  latitude: videoMeta.startCoordinate[1],
                  longitude: videoMeta.startCoordinate[0],
                }
                : null,
            });
          } else {
            processed.push({
              capturedAt: captureTimeFromExif(asset.exif),
              fileName: asset.fileName,
              mimeType: asset.mimeType,
              type: 'image',
              uri: asset.uri,
              duration: asset.duration ? asset.duration / 1000 : undefined,
              assetId: asset.assetId ?? undefined,
              gps: gpsCoordinates,
            });
          }
        }

        if (processed.length > 0) {
          setSelectedAssets((prev) => [...prev, ...processed]);
          setActiveAssetIndex(0);
          setSelectedGpxFile(undefined);
          setGpxPickerError(undefined);
        }
      }
    } catch (error) {
      setPickerError(
        error instanceof Error && error.message.includes('ExponentImagePicker')
          ? GALLERY_DEV_BUILD_REQUIRED_MESSAGE
          : CANNOT_OPEN_PHOTO_LIBRARY_MESSAGE,
      );
      console.log('[Surveyor] Unable to open image picker:', error);
    } finally {
      setIsOpeningGallery(false);
    }
  };

  const handlePickGpx = async () => {
    setGpxPickerError(undefined);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/gpx+xml', 'application/octet-stream', '*/*'],
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const name = file.name ?? '';
        if (!name.toLowerCase().endsWith('.gpx')) {
          setGpxPickerError(SELECT_VALID_GPX_FILE_MESSAGE);
          return;
        }
        setSelectedGpxFile({ name, uri: file.uri, mimeType: file.mimeType ?? undefined });
        const gpxData = await extractGpxGpsData(file.uri);
        if (gpxData?.firstPoint) {
          const gpxGps = {
            latitude: gpxData.firstPoint.latitude,
            longitude: gpxData.firstPoint.longitude,
          };
          console.log('[Surveyor] Extracted GPX GPS coordinates:', gpxData.firstPoint);
          setSelectedAssets((prev) =>
            prev.map((asset, idx) =>
              idx === activeAssetIndex
                ? {
                  ...asset,
                  gps: gpxGps,
                  capturedAt: !asset.capturedAt && gpxData.startTime ? gpxData.startTime : asset.capturedAt,
                }
                : asset,
            ),
          );
        }
      }
    } catch (error) {
      setGpxPickerError(CANNOT_OPEN_DOCUMENT_PICKER_MESSAGE);
      console.log('[Surveyor] Unable to open document picker:', error);
    }
  };

  const openSavedDraft = () => {
    if (!isFocused.current || !scanFinished.current || !savedDraftId.current) return;
    router.replace({
      pathname: '/work/new-survey/details',
      params: {
        submissionId: savedDraftId.current,
        ...(selectedGps ? {
          startLat: String(selectedGps.latitude),
          startLon: String(selectedGps.longitude),
        } : {}),
        ...(selectedAsset?.duration ? {
          duration: String(Math.round(selectedAsset.duration)),
        } : {}),
        ...(selectedAsset?.assetId ? {
          assetId: selectedAsset.assetId,
        } : {}),
        ...(selectedGpxFile ? { gpxUri: selectedGpxFile.uri, gpxName: selectedGpxFile.name } : {}),
      },
    });
  };

  const handleSubmitRecord = async () => {
    if (selectedAssets.length === 0 || isOpeningGallery || scanInProgress.current) return;
    scanInProgress.current = true;
    scanFinished.current = false;
    savedDraftId.current = undefined;
    setPickerError(undefined);
    setIsSaving(true);
    setIsScanning(true);

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    try {
      const savedIds: string[] = [];

      for (const asset of selectedAssets) {
        const isVideo = asset.type === 'video';
        const parsedCaptureTime = asset.capturedAt ? Date.parse(asset.capturedAt) : NaN;
        const isCaptureValid =
          !Number.isNaN(parsedCaptureTime) &&
          Date.now() - parsedCaptureTime >= 0 &&
          Date.now() - parsedCaptureTime < THIRTY_DAYS_MS;
        const safeCapturedAt = isCaptureValid ? asset.capturedAt! : new Date().toISOString();

        const id = await saveDraft(
          {
            fileName: asset.fileName ?? undefined,
            mimeType: asset.mimeType,
            type: asset.type,
            uri: asset.uri,
          },
          {
            submissionType: isVideo ? 'VIDEO_GPX' : 'SINGLE_IMAGE',
            capturedAt: safeCapturedAt,
            coordinateSource: isVideo ? 'GPX_FILE' : 'IMAGE_EXIF',
            ...(asset.gps ?? {}),
          },
          draftId && savedIds.length === 0 ? draftId : undefined,
          selectedGpxFile,
        );

        savedIds.push(id);
      }

      savedDraftId.current = savedIds[0];
      openSavedDraft();
    } catch (error) {
      console.warn('[Surveyor] Unable to save survey draft:', error);
      setPickerError(error instanceof Error ? error.message : CANNOT_SAVE_DRAFT_MESSAGE);
      setIsScanning(false);
    } finally {
      setIsSaving(false);
      scanInProgress.current = false;
    }
  };

  const handleScanComplete = () => {
    scanFinished.current = true;
    setIsScanning(false);
    openSavedDraft();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {isScanning && selectedAsset ? (
        <SurveyScanModal
          imageUri={selectedAsset.uri}
          isVideo={selectedAsset.type === 'video'}
          onComplete={handleScanComplete}
          onCancel={() => {
            handleScanComplete();
          }}
        />
      ) : null}
      <Modal
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsAndroidGalleryVisible(false)}
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
                <Text style={[styles.galleryTitle, { color: theme.text }]}>Chọn ảnh hoặc video</Text>
                <Text style={[styles.gallerySubtitle, { color: theme.textSecondary }]}>
                  Dữ liệu vị trí gốc sẽ được giữ nguyên
                </Text>
              </View>
              <AppButton
                accessibilityLabel="Đóng thư viện ảnh"
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
              contentContainerStyle={
                androidGalleryAssets.length === 0 ? styles.galleryEmptyContent : styles.galleryGrid
              }
              data={androidGalleryAssets}
              keyExtractor={(asset) => asset.id}
              ListEmptyComponent={
                <View style={styles.galleryEmptyState}>
                  {isAndroidGalleryLoading ? (
                    <ActivityIndicator color={theme.primary} size="large" />
                  ) : null}
                  <Text style={[styles.galleryEmptyText, { color: theme.textSecondary }]}>
                    {isAndroidGalleryLoading ? 'Đang tải tệp phương tiện…' : 'Không tìm thấy ảnh hoặc video nào'}
                  </Text>
                </View>
              }
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
                const isSelected = selectedAndroidAssetIds.includes(item.id);
                const isVideo = item.mediaType === LegacyMediaLibrary.MediaType.video;

                return (
                  <Pressable
                    accessibilityLabel={`Chọn ${item.filename}`}
                    accessibilityRole="button"
                    disabled={isSelectingAndroidAssets}
                    onPress={() => handleToggleAndroidAsset(item.id)}
                    style={({ pressed }) => [
                      styles.galleryItem,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Image contentFit="cover" source={{ uri: item.uri }} style={styles.galleryImage} />
                    {isSelected ? (
                      <View style={[styles.galleryCheckCircle, { backgroundColor: theme.primary }]}>
                        <MaterialCommunityIcons color="#FFFFFF" name="check" size={13} />
                      </View>
                    ) : (
                      <View style={styles.galleryUncheckCircle} />
                    )}
                    {isVideo ? (
                      <View style={styles.galleryVideoBadge}>
                        <SymbolView
                          fallback={<Text style={styles.galleryVideoBadgeText}>▶</Text>}
                          name={{ android: 'videocam', ios: 'video.fill', web: 'videocam' }}
                          size={12}
                          tintColor="#FFFFFF"
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
            />

            {/* Android Multi-Select Confirmation Footer */}
            <View style={[styles.galleryFooterBar, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.gallerySelectedCountText, { color: theme.text }]}>
                {selectedAndroidAssetIds.length > 0
                  ? `Đã chọn ${selectedAndroidAssetIds.length} tệp`
                  : 'Chưa chọn tệp nào'}
              </Text>
              <AppButton
                accessibilityLabel={`Xác nhận chọn ${selectedAndroidAssetIds.length} tệp`}
                disabled={selectedAndroidAssetIds.length === 0 || isSelectingAndroidAssets}
                label={isSelectingAndroidAssets ? 'Đang đọc...' : `Xác nhận (${selectedAndroidAssetIds.length})`}
                onPress={handleConfirmAndroidSelection}
                style={styles.galleryConfirmButton}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AppButton
              accessibilityLabel="Quay lại công việc khảo sát"
              hitSlop={Spacing.one}
              onPress={() => router.back()}
              pressedOpacity={0.7}
              style={styles.backButton}
              variant="ghost"
            >
              <SymbolView
                fallback={<Text style={[styles.backFallback, { color: theme.text }]}>{'<'}</Text>}
                name={{ android: 'arrow_back', ios: 'chevron.left', web: 'arrow_back' }}
                size={22}
                tintColor={theme.text}
              />
            </AppButton>
            <Text style={[styles.title, { color: theme.text }]}>Ghi nhận khảo sát mới</Text>
          </View>

          {/* Media Carousel Preview or Upload Placeholder */}
          {selectedAssets.length > 0 && selectedAsset ? (
            <View style={styles.carouselContainer}>
              <Pressable
                accessibilityLabel="Đổi hoặc thêm ảnh từ thư viện"
                accessibilityRole="button"
                disabled={isOpeningGallery || isScanning}
                onPress={handleOpenGallery}
                style={[
                  styles.uploadPlaceholder,
                  {
                    backgroundColor: theme.neutral,
                    borderColor: theme.border,
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative',
                  },
                ]}
              >
                {selectedAsset.type === 'video' ? (
                  <View style={styles.videoPreview}>
                    <SymbolView
                      fallback={<Text style={[styles.imageFallback, { color: theme.onPrimary }]}>VID</Text>}
                      name={{ android: 'videocam', ios: 'video.fill', web: 'videocam' }}
                      size={36}
                      tintColor={theme.onPrimary}
                    />
                    <Text numberOfLines={2} style={[styles.videoFileName, { color: theme.onPrimary }]}>
                      {selectedAsset.fileName ?? 'Đã chọn video'}
                    </Text>
                    {selectedAsset.duration ? (
                      <Text style={{ color: theme.onPrimary, fontSize: 12, marginTop: 4 }}>
                        Thời lượng: {Math.round(selectedAsset.duration)}s
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Image
                    accessibilityLabel={`Tệp khảo sát ${activeAssetIndex + 1}`}
                    contentFit="cover"
                    source={{ uri: selectedAsset.uri }}
                    style={styles.selectedImage}
                  />
                )}

                {/* Counter Badge on top-left of image */}
                <View style={styles.carouselBadge}>
                  <Text style={styles.carouselBadgeText}>
                    {selectedAsset.type === 'video' ? 'Video' : 'Ảnh'} {activeAssetIndex + 1}/{selectedAssets.length}
                  </Text>
                </View>

                {/* Remove button on top-right of image */}
                <Pressable
                  accessibilityLabel="Xóa tệp này"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveAsset(activeAssetIndex);
                  }}
                  style={styles.carouselRemoveButton}
                >
                  <MaterialCommunityIcons color="#FFFFFF" name="close" size={16} />
                </Pressable>

                {/* Left Arrow Button */}
                {selectedAssets.length > 1 && activeAssetIndex > 0 ? (
                  <Pressable
                    accessibilityLabel="Xem tệp trước"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveAssetIndex((prev) => Math.max(0, prev - 1));
                    }}
                    style={[styles.carouselArrowButton, styles.carouselArrowLeft]}
                  >
                    <MaterialCommunityIcons color="#FFFFFF" name="chevron-left" size={28} />
                  </Pressable>
                ) : null}

                {/* Right Arrow Button */}
                {selectedAssets.length > 1 && activeAssetIndex < selectedAssets.length - 1 ? (
                  <Pressable
                    accessibilityLabel="Xem tệp tiếp theo"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveAssetIndex((prev) => Math.min(selectedAssets.length - 1, prev + 1));
                    }}
                    style={[styles.carouselArrowButton, styles.carouselArrowRight]}
                  >
                    <MaterialCommunityIcons color="#FFFFFF" name="chevron-right" size={28} />
                  </Pressable>
                ) : null}
              </Pressable>

              {/* Dot Indicators below image */}
              {selectedAssets.length > 1 ? (
                <View style={styles.paginationDotsRow}>
                  {selectedAssets.map((asset, index) => {
                    const isActive = index === activeAssetIndex;
                    return (
                      <Pressable
                        key={`${asset.uri}-${index}`}
                        accessibilityLabel={`Chọn tệp ${index + 1}`}
                        hitSlop={6}
                        onPress={() => setActiveAssetIndex(index)}
                        style={[
                          styles.dotItem,
                          isActive
                            ? [styles.dotItemActive, { backgroundColor: theme.primary }]
                            : { backgroundColor: `${theme.grey}50` },
                        ]}
                      />
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : (
            <AppButton
              accessibilityLabel="Chọn ảnh từ thư viện"
              disabled={isOpeningGallery || isScanning}
              onPress={handleOpenGallery}
              pressedOpacity={0.78}
              style={[
                styles.uploadPlaceholder,
                {
                  backgroundColor: theme.neutral,
                  borderColor: theme.border,
                  padding: Spacing.four,
                },
              ]}
              variant="surface"
            >
              <SymbolView
                fallback={
                  <Text style={[styles.imageFallback, { color: theme.placeholder }]}>IMG</Text>
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
                {isOpeningGallery
                  ? 'Đang mở thư viện...'
                  : 'Tải lên ảnh hoặc video'}
              </Text>
            </AppButton>
          )}

          <Text style={[styles.helperText, { color: theme.placeholder }]}>
            {selectedAssets.length > 0
              ? 'Nhấn vào ảnh để đổi hoặc thêm tệp khác'
              : 'Tải lên hình ảnh hoặc video biển báo tại đây'}
          </Text>

          {pickerError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {pickerError}
            </Text>
          ) : null}

          {selectedAsset?.type === 'video' ? (
            <View style={styles.videoMetaContainer}>
              <View
                style={[
                  styles.videoGpsCard,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: selectedGps ? theme.primary : theme.border,
                  },
                ]}
              >
                <SymbolView
                  fallback={<Text style={{ color: selectedGps ? theme.primary : theme.placeholder }}>GPS</Text>}
                  name={{ android: 'my_location', ios: 'location.fill', web: 'my_location' }}
                  size={22}
                  tintColor={selectedGps ? theme.primary : theme.placeholder}
                />
                <View style={styles.videoGpsText}>
                  <Text style={[styles.videoGpsTitle, { color: theme.text }]}>
                    {selectedGps
                      ? `Đã phát hiện GPS: ${selectedGps.latitude.toFixed(5)}, ${selectedGps.longitude.toFixed(5)}`
                      : 'Không tìm thấy tọa độ GPS trong video'}
                  </Text>
                  <Text style={[styles.videoGpsSubtitle, { color: theme.textSecondary }]}>
                    {selectedGps
                      ? 'Điểm bắt đầu và kết thúc lộ trình sẽ được thể hiện trên bản đồ ở bước tiếp theo'
                      : 'Bạn có thể chọn hoặc xác nhận vị trí trên bản đồ ở bước tiếp theo'}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel="Chuyển đổi tùy chọn tệp GPX ngoài"
                accessibilityRole="button"
                onPress={() => setShowAdvancedGpx((prev) => !prev)}
                style={styles.advancedGpxToggle}
              >
                <Text style={[styles.advancedGpxToggleText, { color: theme.primary }]}>
                  {showAdvancedGpx ? 'Ẩn tùy chọn tệp GPX ngoài' : 'Tùy chọn nâng cao: Đính kèm tệp GPX ngoài (tùy chọn)'}
                </Text>
              </Pressable>

              {showAdvancedGpx ? (
                <>
                  <AppButton
                    accessibilityLabel={selectedGpxFile ? 'Đổi tệp GPX' : 'Tải lên tệp GPX'}
                    disabled={isScanning || isSaving}
                    onPress={handlePickGpx}
                    pressedOpacity={0.78}
                    style={[
                      styles.uploadPlaceholder,
                      styles.gpxPickerButton,
                      {
                        backgroundColor: theme.neutral,
                        borderColor: selectedGpxFile ? theme.primary : theme.border,
                      },
                    ]}
                    variant="surface"
                  >
                    <SymbolView
                      fallback={<Text style={[styles.imageFallback, { color: selectedGpxFile ? theme.primary : theme.placeholder }]}>GPX</Text>}
                      name={{ android: 'route', ios: 'map', web: 'route' }}
                      size={28}
                      tintColor={selectedGpxFile ? theme.primary : theme.placeholder}
                    />
                    <Text style={[styles.uploadLabel, { color: selectedGpxFile ? theme.primary : theme.textSecondary }]}>
                      {selectedGpxFile ? selectedGpxFile.name : 'Chọn tệp .gpx từ thiết bị'}
                    </Text>
                  </AppButton>

                  {gpxPickerError ? (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {gpxPickerError}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : null}

          {/* Secondary Button: Submit another survey */}

          {selectedAssets.length > 2 && (
            <AppButton
              accessibilityLabel="Gửi khảo sát khác"
              disabled={isOpeningGallery || isScanning || isSaving}
              label="Gửi khảo sát khác"
              onPress={handleOpenGallery}
              style={[
                styles.secondarySubmitButton,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
              ]}
              variant="surface"
            />
          )}

          <AppButton
            disabled={selectedAssets.length === 0 || isOpeningGallery || isScanning || isSaving}
            label={
              isSaving
                ? "Đang lưu bản nháp..."
                : selectedAssets.length > 1
                  ? `Tiếp tục ghi nhận (${selectedAssets.length} tệp)`
                  : "Tiếp tục ghi nhận"
            }
            onPress={handleSubmitRecord}
            style={styles.submitButton}
          />
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
  galleryScreen: {
    height: '85%',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopLeftRadius: Rounded.xlg,
    borderTopRightRadius: Rounded.xlg,
    overflow: 'hidden',
    paddingTop: Spacing.one,
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  galleryModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  galleryBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  galleryHandleArea: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  galleryHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  galleryHeader: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  galleryHeading: {
    flex: 1,
  },
  galleryTitle: {
    fontFamily: Fonts.body,
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 29,
  },
  gallerySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 17,
  },
  galleryCloseButton: {
    minHeight: 40,
    borderRadius: Rounded.round,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  galleryErrorText: {
    color: '#B42318',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  galleryGrid: {
    padding: Spacing.two,
  },
  galleryEmptyContent: {
    flexGrow: 1,
  },
  galleryEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  galleryEmptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
  },
  galleryItem: {
    position: 'relative',
    width: '33.3333%',
    aspectRatio: 1,
    padding: Spacing.half,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: Rounded.md,
  },
  gallerySelectingOverlay: {
    position: 'absolute',
    top: Spacing.half,
    right: Spacing.half,
    bottom: Spacing.half,
    left: Spacing.half,
    borderRadius: Rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  galleryVideoBadge: {
    position: 'absolute',
    bottom: Spacing.one,
    right: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    borderRadius: Rounded.sm,
    paddingHorizontal: 5,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryVideoBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700' as const,
  },
  galleryFooterLoader: {
    marginVertical: Spacing.three,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  backFallback: {
    fontFamily: Fonts.body,
    fontSize: 24,
    fontWeight: 700,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.title,
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 32,
  },
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
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: Rounded.lg,
  },
  imageFallback: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
  },
  uploadLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 21,
    textAlign: 'center',
  },
  helperText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 20,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  errorText: {
    color: '#B42318',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 18,
    marginTop: -Spacing.one,
    marginBottom: Spacing.three,
  },
  submitButton: {
    alignSelf: 'stretch',
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  videoPreview: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(9, 35, 60, 0.72)',
    padding: Spacing.three,
  },
  videoFileName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 18,
    textAlign: 'center',
  },
  gpxPickerButton: {
    minHeight: 100,
    marginTop: Spacing.one,
  },
  videoMetaContainer: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  videoGpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  videoGpsText: {
    flex: 1,
    gap: 2,
  },
  videoGpsTitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 18,
  },
  videoGpsSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 16,
  },
  advancedGpxToggle: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
  },
  advancedGpxToggleText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 600,
    textDecorationLine: 'underline',
  },
  galleryCheckCircle: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  galleryUncheckCircle: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  galleryFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
  },
  gallerySelectedCountText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: 600,
  },
  galleryConfirmButton: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  carouselContainer: {
    width: '100%',
    position: 'relative',
  },
  carouselBadge: {
    position: 'absolute',
    top: Spacing.one,
    left: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Rounded.round,
    zIndex: 10,
  },
  carouselBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  carouselRemoveButton: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  carouselArrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  carouselArrowLeft: {
    left: Spacing.one,
  },
  carouselArrowRight: {
    right: Spacing.one,
  },
  paginationDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: Spacing.two,
  },
  dotItem: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotItemActive: {
    width: 22,
    borderRadius: 4,
  },
  secondarySubmitButton: {
    width: '100%',
    marginBottom: Spacing.two,
    borderWidth: 1,
  },
});
