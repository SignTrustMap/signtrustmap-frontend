import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  extractImageGpsCoordinates,
  type ImageGpsCoordinates,
} from '@/feature/upload/utils/image-gps';
import { useTheme } from '@/hooks/use-theme';

function isValidGpsCoordinates(
  coordinates: ImageGpsCoordinates | null | undefined,
): coordinates is ImageGpsCoordinates {
  return Boolean(
    coordinates &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    Math.abs(coordinates.latitude) <= 90 &&
    Math.abs(coordinates.longitude) <= 180,
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

  if (asset.type !== 'image' || Platform.OS === 'web') {
    console.log('[Surveyor] Extracted image GPS data:', null);
    return null;
  }

  try {
    const MediaLibrary = await import('expo-media-library');
    const permission = await MediaLibrary.requestPermissionsAsync(false, ['photo']);

    console.log('[Surveyor] Media location permission:', {
      accessPrivileges: permission.accessPrivileges,
      status: permission.status,
    });

    if (permission.status !== 'granted') {
      console.log('[Surveyor] Extracted image GPS data:', null);
      return null;
    }

    let location: ImageGpsCoordinates | null | undefined;
    let originalExif: Record<string, unknown> | null | undefined;
    let mediaAssetId = asset.assetId;

    if (mediaAssetId && Platform.OS === 'android' && !mediaAssetId.startsWith('content://')) {
      const LegacyMediaLibrary = await import('expo-media-library/legacy');
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

    console.log('[Surveyor] Original media-library EXIF:', originalExif ?? null);

    if (isValidGpsCoordinates(location)) {
      const coordinates = {
        latitude: location.latitude,
        longitude: location.longitude,
      } satisfies ImageGpsCoordinates;

      console.log('[Surveyor] Extracted image GPS data:', {
        ...coordinates,
        source: 'media-library-original',
      });
      return coordinates;
    }

    const mediaLibraryExifCoordinates = extractImageGpsCoordinates(originalExif);

    console.log(
      '[Surveyor] Extracted image GPS data:',
      mediaLibraryExifCoordinates
        ? { ...mediaLibraryExifCoordinates, source: 'media-library-exif' }
        : null,
    );
    return mediaLibraryExifCoordinates;
  } catch (error) {
    console.warn('[Surveyor] Unable to read original image GPS metadata:', error);
    console.log('[Surveyor] Extracted image GPS data:', null);
    return null;
  }
}

export function NewSurveyRecordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);
  const [pickerError, setPickerError] = useState<string>();
  const [selectedAsset, setSelectedAsset] = useState<ImagePickerAsset>();
  const [selectedGps, setSelectedGps] = useState<ImageGpsCoordinates | null>(null);

  const handleOpenGallery = async () => {
    if (isOpeningGallery) return;

    setIsOpeningGallery(true);
    setPickerError(undefined);

    try {
      const ImagePicker = await import('expo-image-picker');

      if (Platform.OS === 'android') {
        try {
          const MediaLibrary = await import('expo-media-library');
          const permission = await MediaLibrary.requestPermissionsAsync(false, ['photo']);

          console.log('[Surveyor] Media permission before picker:', {
            accessPrivileges: permission.accessPrivileges,
            status: permission.status,
          });
        } catch (error) {
          console.warn('[Surveyor] Unable to request media permission before picker:', error);
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        defaultTab: 'photos',
        exif: true,
        mediaTypes: ['images', 'videos'],
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.PAGE_SHEET,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const gpsCoordinates = await extractSelectedAssetGps(asset);

        setSelectedAsset(asset);
        setSelectedGps(gpsCoordinates);
      }
    } catch (error) {
      setPickerError(
        error instanceof Error && error.message.includes('ExponentImagePicker')
          ? 'Gallery support requires a rebuilt development app.'
          : 'Unable to open your photo library. Please try again.',
      );
    } finally {
      setIsOpeningGallery(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AppButton
              accessibilityLabel="Back to surveyor work"
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
            <Text style={[styles.title, { color: theme.text }]}>New Survey Record</Text>
          </View>

          <AppButton
            accessibilityLabel={
              selectedAsset ? 'Change selected photo or video' : 'Choose a photo or video from gallery'
            }
            disabled={isOpeningGallery}
            onPress={handleOpenGallery}
            pressedOpacity={0.78}
            style={[
              styles.uploadPlaceholder,
              {
                backgroundColor: theme.neutral,
                borderColor: theme.border,
              },
            ]}
            variant="surface"
          >
            {selectedAsset?.type === 'image' ? (
              <Image
                accessibilityLabel="Selected survey media"
                contentFit="cover"
                source={{ uri: selectedAsset.uri }}
                style={styles.selectedImage}
              />
            ) : (
              <>
                <SymbolView
                  fallback={
                    <Text style={[styles.imageFallback, { color: theme.placeholder }]}>IMG</Text>
                  }
                  name={{
                    android: selectedAsset ? 'video_library' : 'image',
                    ios: selectedAsset ? 'video' : 'photo',
                    web: selectedAsset ? 'video_library' : 'image',
                  }}
                  size={38}
                  tintColor={theme.placeholder}
                />
                <Text style={[styles.uploadLabel, { color: theme.textSecondary }]}>
                  {isOpeningGallery
                    ? 'Opening gallery...'
                    : selectedAsset?.fileName ?? 'Upload photo / video'}
                </Text>
              </>
            )}
          </AppButton>

          <Text style={[styles.helperText, { color: theme.placeholder }]}>
            {selectedAsset ? 'Tap the preview to choose a different file' : 'Upload your image / video here'}
          </Text>

          {pickerError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {pickerError}
            </Text>
          ) : null}

          <AppButton
            label="Submit Record"
            onPress={() =>
              router.push({
                pathname: '/work/new-survey/details',
                params: {
                  ...(selectedAsset
                    ? {
                      imageType: selectedAsset.type ?? 'image',
                      imageUri: selectedAsset.uri,
                    }
                    : {}),
                  ...(selectedGps
                    ? {
                      latitude: String(selectedGps.latitude),
                      longitude: String(selectedGps.longitude),
                    }
                    : {}),
                },
              })
            }
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
    minHeight: 176,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Rounded.lg,
    padding: Spacing.four,
  },
  selectedImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
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
  },
});
