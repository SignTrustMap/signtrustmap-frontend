import type { ImagePickerAsset } from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import { Platform } from 'react-native';
import {
  extractImageGpsCoordinates,
  type ImageGpsCoordinates,
} from '@/feature/upload/utils/image-gps';
import { extractGpsFromVideoFile } from '@/feature/upload/utils/video-file-gps';
import { extractGpsFromImageFile } from '@/feature/upload/utils/image-file-gps';
import { isValidGpsCoordinates } from '../types/survey-media';

export function captureTimeFromExif(exif: ImagePickerAsset['exif']) {
  const value = exif?.DateTimeOriginal ?? exif?.DateTime;
  if (typeof value !== 'string') return undefined;
  const timestamp = Date.parse(value.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T'));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

export async function findOriginalAssetByFileName(
  MediaLib: typeof import('expo-media-library'),
  selectedAsset: ImagePickerAsset,
) {
  if (!selectedAsset.fileName) return undefined;

  const libraryAssets = await new MediaLib.Query()
    .eq(MediaLib.AssetField.MEDIA_TYPE, MediaLib.MediaType.IMAGE)
    .orderBy({ key: MediaLib.AssetField.MODIFICATION_TIME, ascending: false })
    .limit(500)
    .exeForMetadata();
  const fileName = selectedAsset.fileName.toLowerCase();

  const matches = libraryAssets.filter(
    (asset) => asset.filename?.toLowerCase() === fileName,
  );

  if (selectedAsset.width && selectedAsset.height) {
    const exactMatch = matches.find(
      (asset) =>
        asset.width === selectedAsset.width && asset.height === selectedAsset.height,
    );
    if (exactMatch) return exactMatch;
  }

  // Only fall back if there is exactly 1 match in the entire library
  if (matches.length === 1) {
    return matches[0];
  }

  return undefined;
}

export async function extractSelectedAssetGps(asset: ImagePickerAsset): Promise<ImageGpsCoordinates | null> {
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
