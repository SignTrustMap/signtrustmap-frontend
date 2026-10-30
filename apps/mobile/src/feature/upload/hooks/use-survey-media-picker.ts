import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import {
  CANNOT_OPEN_DOCUMENT_PICKER_MESSAGE,
  CANNOT_OPEN_PHOTO_LIBRARY_MESSAGE,
  GALLERY_DEV_BUILD_REQUIRED_MESSAGE,
  GPX_NO_VALID_COORDINATES_MESSAGE,
  GPX_SIZE_EXCEEDED_MESSAGE,
  IMAGE_SIZE_EXCEEDED_MESSAGE,
  MEDIA_LIBRARY_PERMISSION_REQUIRED_MESSAGE,
  SELECT_VALID_GPX_FILE_MESSAGE,
  VIDEO_SIZE_EXCEEDED_MESSAGE,
} from '@/constants/message';
import { extractGpxGpsData } from '@/feature/upload/utils/gpx';
import { extractVideoMetadataAsync } from '@/feature/upload/utils/video-gps';
import {
  MAX_SURVEY_GPX_SIZE_BYTES,
  MAX_SURVEY_IMAGE_SIZE_BYTES,
  MAX_SURVEY_VIDEO_SIZE_BYTES,
  getVideoFileSizeBytes,
} from '@/feature/upload/utils/video-processor';
import {
  isValidGpsCoordinates,
  type SelectedGpxFile,
  type SelectedSurveyMedia,
} from '../types/survey-media';
import {
  captureTimeFromExif,
  extractSelectedAssetGps,
} from '../utils/selected-asset-gps';

export function useSurveyMediaPicker() {
  const [selectedAssets, setSelectedAssets] = useState<SelectedSurveyMedia[]>([]);
  const [activeAssetIndex, setActiveAssetIndex] = useState<number>(0);
  const [selectedGpxFile, setSelectedGpxFile] = useState<SelectedGpxFile>();
  const [showAdvancedGpx, setShowAdvancedGpx] = useState(false);
  const [pickerError, setPickerError] = useState<string>();
  const [gpxPickerError, setGpxPickerError] = useState<string>();
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);
  const [isAndroidGalleryVisible, setIsAndroidGalleryVisible] = useState(false);

  const selectedAsset = selectedAssets[activeAssetIndex];
  const selectedGps = selectedAsset?.gps ?? null;
  const hasValidGps = isValidGpsCoordinates(selectedGps);
  const isVideoAsset = selectedAsset?.type === 'video';
  const isVideoMissingGpx = isVideoAsset && !hasValidGps && !selectedGpxFile;
  const hasAnyVideoWithoutGps = selectedAssets.some(
    (a) => a.type === 'video' && !isValidGpsCoordinates(a.gps),
  );
  const isAnyVideoMissingGpx = hasAnyVideoWithoutGps && !selectedGpxFile;

  const openGallery = useCallback(async () => {
    if (isOpeningGallery) return;

    setIsOpeningGallery(true);
    setPickerError(undefined);

    try {
      if (Platform.OS === 'android') {
        const permission = await LegacyMediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);

        console.log('[Surveyor] Media permission before gallery:', {
          accessPrivileges: permission.accessPrivileges,
          status: permission.status,
        });

        if (permission.status !== 'granted') {
          setPickerError(MEDIA_LIBRARY_PERMISSION_REQUIRED_MESSAGE);
          return;
        }

        setIsAndroidGalleryVisible(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: 3,
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

          // Validate file size against system limits
          let fileSize = typeof asset.fileSize === 'number' && asset.fileSize > 0 ? asset.fileSize : 0;
          if (!fileSize && Platform.OS !== 'web' && asset.uri) {
            try {
              const info = await FileSystem.getInfoAsync(asset.uri);
              if (info.exists && typeof info.size === 'number') {
                fileSize = info.size;
              }
            } catch { }
          }
          if (!fileSize && assetType === 'video' && asset.uri) {
            fileSize = await getVideoFileSizeBytes(asset.uri).catch(() => 0);
          }

          if (assetType === 'video' && fileSize > MAX_SURVEY_VIDEO_SIZE_BYTES) {
            setPickerError(VIDEO_SIZE_EXCEEDED_MESSAGE);
            continue;
          }
          if (assetType === 'image' && fileSize > MAX_SURVEY_IMAGE_SIZE_BYTES) {
            setPickerError(IMAGE_SIZE_EXCEEDED_MESSAGE);
            continue;
          }

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
              hasEmbeddedGps: videoMeta.hasDeviceGps,
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
          setSelectedAssets(processed.slice(0, 3));
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
  }, [isOpeningGallery]);

  const closeAndroidGallery = useCallback(() => {
    setIsAndroidGalleryVisible(false);
  }, []);

  const handleConfirmAndroidAssets = useCallback((assets: SelectedSurveyMedia[]) => {
    if (assets.length > 0) {
      setSelectedAssets(assets.slice(0, 3));
      setActiveAssetIndex(0);
      setSelectedGpxFile(undefined);
      setGpxPickerError(undefined);
      setIsAndroidGalleryVisible(false);
    }
  }, []);

  const removeAsset = useCallback((indexToRemove: number) => {
    setSelectedAssets((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      setActiveAssetIndex((current) => {
        if (current >= updated.length) {
          return Math.max(0, updated.length - 1);
        }
        return current;
      });
      return updated;
    });
  }, []);

  const pickGpx = useCallback(async () => {
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

        let gpxSize = typeof file.size === 'number' && file.size > 0 ? file.size : 0;
        if (!gpxSize && Platform.OS !== 'web' && file.uri) {
          try {
            const info = await FileSystem.getInfoAsync(file.uri);
            if (info.exists && typeof info.size === 'number') {
              gpxSize = info.size;
            }
          } catch { }
        }
        if (gpxSize > MAX_SURVEY_GPX_SIZE_BYTES) {
          setGpxPickerError(GPX_SIZE_EXCEEDED_MESSAGE);
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
        } else {
          setGpxPickerError(GPX_NO_VALID_COORDINATES_MESSAGE);
          return;
        }
      }
    } catch (error) {
      setGpxPickerError(CANNOT_OPEN_DOCUMENT_PICKER_MESSAGE);
      console.log('[Surveyor] Unable to open document picker:', error);
    }
  }, [activeAssetIndex]);

  const removeGpx = useCallback(() => {
    setSelectedGpxFile(undefined);
    setGpxPickerError(undefined);
    setSelectedAssets((prev) =>
      prev.map((asset, idx) => {
        if (idx !== activeAssetIndex) return asset;
        return {
          ...asset,
          gps: asset.hasEmbeddedGps ? asset.gps : null,
        };
      }),
    );
  }, [activeAssetIndex]);

  return {
    selectedAssets,
    setSelectedAssets,
    activeAssetIndex,
    setActiveAssetIndex,
    selectedAsset,
    selectedGps,
    hasValidGps,
    isVideoAsset,
    selectedGpxFile,
    isVideoMissingGpx,
    hasAnyVideoWithoutGps,
    isAnyVideoMissingGpx,
    showAdvancedGpx,
    setShowAdvancedGpx,
    pickerError,
    setPickerError,
    gpxPickerError,
    setGpxPickerError,
    isOpeningGallery,
    isAndroidGalleryVisible,
    openGallery,
    closeAndroidGallery,
    handleConfirmAndroidAssets,
    removeAsset,
    pickGpx,
    removeGpx,
  };
}
