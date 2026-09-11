import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
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

import { AppButton } from '@/components/ui/button';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import {
  extractImageGpsCoordinates,
  type ImageGpsCoordinates,
} from '@/feature/upload/utils/image-gps';
import { useTheme } from '@/hooks/use-theme';
import { SurveyScanModal } from '@/feature/upload/components/survey-scan-modal';

type SelectedSurveyMedia = {
  capturedAt?: string;
  fileName?: string | null;
  mimeType?: string;
  type: 'image' | 'video';
  uri: string;
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

      console.log('[Surveyor] Extracted image GPS data:', {
        ...coordinates,
        source: 'media-library-original',
      });
      return coordinates;
    }

    const mediaLibraryExifCoordinates = extractImageGpsCoordinates(originalExif);
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
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const saveDraft = useSaveSurveyDraft();
  const isFocused = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const scanFinished = useRef(false);
  const savedDraftId = useRef<string | undefined>(undefined);
  const [isOpeningGallery, setIsOpeningGallery] = useState(false);
  const [pickerError, setPickerError] = useState<string>();
  const [selectedAsset, setSelectedAsset] = useState<SelectedSurveyMedia>();
  const [selectedGps, setSelectedGps] = useState<ImageGpsCoordinates | null>(null);
  const [selectedGpxFile, setSelectedGpxFile] = useState<SelectedGpxFile>();
  const [gpxPickerError, setGpxPickerError] = useState<string>();
  const [isScanning, setIsScanning] = useState(false);
  const scanInProgress = useRef(false);
  const [isAndroidGalleryVisible, setIsAndroidGalleryVisible] = useState(false);
  const [androidGalleryAssets, setAndroidGalleryAssets] = useState<MediaLibraryAsset[]>([]);
  const [androidGalleryCursor, setAndroidGalleryCursor] = useState<string>();
  const [androidGalleryHasNextPage, setAndroidGalleryHasNextPage] = useState(false);
  const [androidGalleryError, setAndroidGalleryError] = useState<string>();
  const [isAndroidGalleryLoading, setIsAndroidGalleryLoading] = useState(false);
  const [selectingAndroidAssetId, setSelectingAndroidAssetId] = useState<string>();
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
      setAndroidGalleryError('Unable to load your photo library. Please try again.');
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
      setPickerError('Media library permission is required to select photos and videos.');
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
      const assetType = asset.mediaType === LegacyMediaLibrary.MediaType.video ? 'video' : 'image';

      const exif = assetInfo.exif as Record<string, unknown> | undefined;
      const exifCoordinates = assetType === 'image' ? extractImageGpsCoordinates(exif) : null;
      const gpsCoordinates = assetType === 'image' && isValidGpsCoordinates(assetInfo.location)
        ? {
          latitude: assetInfo.location.latitude,
          longitude: assetInfo.location.longitude,
        }
        : exifCoordinates;

      console.log('[Surveyor] Selected MediaStore asset:', {
        assetId: asset.id,
        fileName: asset.filename,
        mediaType: asset.mediaType,
        location: assetInfo.location ?? null,
      });
      console.log(
        '[Surveyor] Extracted image GPS data:',
        gpsCoordinates ? { ...gpsCoordinates, source: 'media-library-original' } : null,
      );

      setSelectedAsset({
        capturedAt: asset.creationTime > 0 ? new Date(asset.creationTime).toISOString() : undefined,
        fileName: asset.filename,
        type: assetType,
        uri: assetInfo.localUri ?? asset.uri,
      });
      setSelectedGps(gpsCoordinates ?? null);
      setSelectedGpxFile(undefined);
      setGpxPickerError(undefined);
      setIsAndroidGalleryVisible(false);
    } catch (error) {
      console.warn('[Surveyor] Unable to read selected MediaStore asset:', error);
      setAndroidGalleryError('Unable to read that file. Please choose another one.');
    } finally {
      setSelectingAndroidAssetId(undefined);
    }
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

      const ImagePicker = await import('expo-image-picker');

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
        const assetType = asset.type === 'video' ? 'video' : 'image';
        const gpsCoordinates = assetType === 'image' ? await extractSelectedAssetGps(asset) : null;

        setSelectedAsset({
          capturedAt: captureTimeFromExif(asset.exif),
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          type: assetType,
          uri: asset.uri,
        });
        setSelectedGps(gpsCoordinates);
        setSelectedGpxFile(undefined);
        setGpxPickerError(undefined);
      }
    } catch (error) {
      setPickerError(
        error instanceof Error && error.message.includes('ExponentImagePicker')
          ? 'Gallery support requires a rebuilt development app.'
          : 'Unable to open your photo library. Please try again.',
      );
      console.log('[Surveyor] Unable to open image picker:', error);
    } finally {
      setIsOpeningGallery(false);
    }
  };

  const handlePickGpx = async () => {
    setGpxPickerError(undefined);
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/gpx+xml', 'application/octet-stream', '*/*'],
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const name = file.name ?? '';
        if (!name.toLowerCase().endsWith('.gpx')) {
          setGpxPickerError('Please select a valid GPX file (.gpx).');
          return;
        }
        setSelectedGpxFile({ name, uri: file.uri, mimeType: file.mimeType ?? undefined });
      }
    } catch (error) {
      setGpxPickerError('Unable to open file picker. Please try again.');
      console.log('[Surveyor] Unable to open document picker:', error);
    }
  };


  const openSavedDraft = () => {
    if (!isFocused.current || !scanFinished.current || !savedDraftId.current) return;
    router.replace({ pathname: '/work/new-survey/details', params: { submissionId: savedDraftId.current } });
  };

  const handleSubmitRecord = async () => {
    if (!selectedAsset || isOpeningGallery || scanInProgress.current) return;
    scanInProgress.current = true;
    scanFinished.current = false;
    savedDraftId.current = undefined;
    setPickerError(undefined);
    setIsSaving(true);
    setIsScanning(true);
    try {
      savedDraftId.current = await saveDraft({ ...selectedAsset, fileName: selectedAsset.fileName ?? undefined }, {
        submissionType: 'SINGLE_IMAGE',
        capturedAt: selectedAsset.capturedAt ?? new Date().toISOString(),
        coordinateSource: 'IMAGE_EXIF',
        ...(selectedGps ?? {}),
      }, draftId);
      openSavedDraft();
    } catch (error) {
      console.warn('[Survey or] Unable to save survey draft:', error);
      setPickerError(error instanceof Error ? error.message : 'Unable to save the draft. Please retry.');
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
            accessibilityLabel="Close media library"
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
                <Text style={[styles.galleryTitle, { color: theme.text }]}>Choose a photo or video</Text>
                <Text style={[styles.gallerySubtitle, { color: theme.textSecondary }]}>
                  Original location metadata will be preserved
                </Text>
              </View>
              <AppButton
                accessibilityLabel="Close media library"
                label="Close"
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
                    {isAndroidGalleryLoading ? 'Loading your media…' : 'No photos or videos found'}
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
                const isSelecting = selectingAndroidAssetId === item.id;
                const isVideo = item.mediaType === LegacyMediaLibrary.MediaType.video;

                return (
                  <Pressable
                    accessibilityLabel={`Select ${item.filename}`}
                    accessibilityRole="button"
                    disabled={Boolean(selectingAndroidAssetId)}
                    onPress={() => void handleSelectAndroidAsset(item)}
                    style={({ pressed }) => [
                      styles.galleryItem,
                      { opacity: pressed || isSelecting ? 0.65 : 1 },
                    ]}
                  >
                    <Image contentFit="cover" source={{ uri: item.uri }} style={styles.galleryImage} />
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
              selectedAsset ? 'Change selected photo' : 'Choose a photo from gallery'
            }
            disabled={isOpeningGallery || isScanning}
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
            {selectedAsset ? (
              selectedAsset.type === 'video' ? (
                <View style={styles.videoPreview}>
                  <SymbolView
                    fallback={<Text style={[styles.imageFallback, { color: theme.onPrimary }]}>VID</Text>}
                    name={{ android: 'videocam', ios: 'video.fill', web: 'videocam' }}
                    size={36}
                    tintColor={theme.onPrimary}
                  />
                  <Text numberOfLines={2} style={[styles.videoFileName, { color: theme.onPrimary }]}>
                    {selectedAsset.fileName ?? 'Video selected'}
                  </Text>
                </View>
              ) : (
                <Image
                  accessibilityLabel="Selected survey media"
                  contentFit="cover"
                  source={{ uri: selectedAsset.uri }}
                  style={styles.selectedImage}
                />
              )
            ) : (
              <>
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
                    ? 'Opening gallery...'
                    : 'Upload photo or video'}
                </Text>
              </>
            )}
          </AppButton>

          <Text style={[styles.helperText, { color: theme.placeholder }]}>
            {selectedAsset ? 'Tap the preview to choose a different file' : 'Upload your sign image or video here'}
          </Text>

          {pickerError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {pickerError}
            </Text>
          ) : null}

          {selectedAsset?.type === 'video' ? (
            <>
              <AppButton
                accessibilityLabel={selectedGpxFile ? 'Change GPX file' : 'Upload GPX file'}
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
                  {selectedGpxFile ? selectedGpxFile.name : 'Upload your GPX file'}
                </Text>
              </AppButton>

              <Text style={[styles.helperText, { color: theme.placeholder }]}>
                {selectedGpxFile ? 'Tap to choose a different GPX file' : 'Accepts .gpx files only'}
              </Text>

              {gpxPickerError ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {gpxPickerError}
                </Text>
              ) : null}
            </>
          ) : null}

          <AppButton
            disabled={!selectedAsset || isOpeningGallery || isScanning || isSaving}
            label={isSaving ? "Saving draft..." : "Submit Record"}
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
});
