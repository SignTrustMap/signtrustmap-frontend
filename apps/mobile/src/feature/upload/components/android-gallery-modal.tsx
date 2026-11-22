import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import type { Asset as MediaLibraryAsset } from 'expo-media-library/legacy';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import { AppButton } from '@/components/button';
import {
  IMAGE_SIZE_EXCEEDED_MESSAGE,
  MAX_UPLOAD_FILES_EXCEEDED_MESSAGE,
  UNABLE_TO_LOAD_PHOTO_LIBRARY_MESSAGE,
  UNABLE_TO_READ_FILE_MESSAGE,
  VIDEO_SIZE_EXCEEDED_MESSAGE,
} from '@/constants/message';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { extractGpsFromImageFile } from '@/feature/upload/utils/image-file-gps';
import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';
import { captureTimeFromExif } from '@/feature/upload/utils/selected-asset-gps';
import { compressAndResizeSurveyImage } from '@/feature/upload/utils/survey-image';
import { extractVideoMetadataAsync } from '@/feature/upload/utils/video-gps';
import {
  MAX_SURVEY_IMAGE_SIZE_BYTES,
  MAX_SURVEY_VIDEO_SIZE_BYTES,
} from '@/feature/upload/utils/video-processor';
import { useTheme } from '@/hooks/use-theme';
import {
  isValidGpsCoordinates,
  type SelectedSurveyMedia,
} from '../types/survey-media';

const ANDROID_GALLERY_PAGE_SIZE = 60;
const CAMERA_TILE_ID = '__camera_tile__';

type GalleryGridItem =
  | { id: typeof CAMERA_TILE_ID; isCamera: true }
  | (MediaLibraryAsset & { isCamera?: false });

export type AndroidGalleryModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (assets: SelectedSurveyMedia[]) => void;
  initialSelectedAssetIds?: string[];
  currentSelectedAssets?: SelectedSurveyMedia[];
};

export function AndroidGalleryModal({
  visible,
  onClose,
  onConfirm,
  initialSelectedAssetIds = [],
  currentSelectedAssets = [],
}: AndroidGalleryModalProps) {
  const theme = useTheme();
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [albums, setAlbums] = useState<LegacyMediaLibrary.Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>();
  const [cursor, setCursor] = useState<string>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isLoadingRef = useRef(false);
  const selectedAlbumRef = useRef<string | undefined>(undefined);

  const loadAlbums = async () => {
    try {
      const userAlbums = await LegacyMediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });
      const validAlbums = (userAlbums || []).filter((a) => (a.assetCount ?? 0) > 0);
      setAlbums(validAlbums);
    } catch (err) {
      console.warn('[Surveyor] Unable to load media albums:', err);
    }
  };

  const loadPage = async (after?: string, targetAlbum?: string | null) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(undefined);

    try {
      // If targetAlbum is passed: null means explicitly "Tất cả", string is a specific album.
      // If targetAlbum is undefined (e.g. pagination scroll), read from selectedAlbumRef.current.
      const effectiveAlbum =
        targetAlbum !== undefined
          ? targetAlbum === null
            ? undefined
            : targetAlbum
          : selectedAlbumRef.current;

      const options: LegacyMediaLibrary.AssetsOptions = {
        after,
        first: ANDROID_GALLERY_PAGE_SIZE,
        mediaType: [LegacyMediaLibrary.MediaType.photo, LegacyMediaLibrary.MediaType.video],
        sortBy: [[LegacyMediaLibrary.SortBy.modificationTime, false]],
      };
      if (effectiveAlbum) {
        options.album = effectiveAlbum;
      }

      const page = await LegacyMediaLibrary.getAssetsAsync(options);

      setAssets((currentAssets) =>
        after ? [...currentAssets, ...page.assets] : page.assets,
      );
      setCursor(page.endCursor);
      setHasNextPage(page.hasNextPage);
    } catch (err) {
      console.warn('[Surveyor] Unable to load Android media library:', err);
      setError(UNABLE_TO_LOAD_PHOTO_LIBRARY_MESSAGE);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setAssets([]);
      setCursor(undefined);
      setHasNextPage(false);
      setError(undefined);
      selectedAlbumRef.current = undefined;
      setSelectedAlbumId(undefined);
      setSelectedAssetIds(initialSelectedAssetIds);
      void loadAlbums();
      void loadPage(undefined, null);
    }
  }, [visible]);

  const handleSelectAlbum = (albumId?: string) => {
    if (selectedAlbumRef.current === albumId) return;
    selectedAlbumRef.current = albumId;
    setSelectedAlbumId(albumId);
    setAssets([]);
    setCursor(undefined);
    setHasNextPage(false);
    setError(undefined);
    void loadPage(undefined, albumId ?? null);
  };

  const handleLaunchCamera = async () => {
    if (isProcessing) return;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Ứng dụng cần quyền camera để chụp ảnh.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        exif: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const captured = result.assets[0];
      let newAsset: MediaLibraryAsset | null = null;
      try {
        newAsset = await LegacyMediaLibrary.createAssetAsync(captured.uri);
      } catch (createErr) {
        console.warn('[Surveyor] Unable to save captured photo to media library:', createErr);
      }

      const assetId = newAsset?.id || `camera-${Date.now()}`;
      const exifCoords = extractImageGpsCoordinates(captured.exif as Record<string, unknown> | undefined);

      const cameraAsset: MediaLibraryAsset = newAsset ?? {
        id: assetId,
        filename: captured.fileName || `camera-${Date.now()}.jpg`,
        mediaType: LegacyMediaLibrary.MediaType.photo,
        uri: captured.uri,
        duration: 0,
        creationTime: Date.now(),
        modificationTime: Date.now(),
        width: captured.width,
        height: captured.height,
      };

      if (exifCoords) {
        (cameraAsset as any).location = exifCoords;
      }

      setAssets((current) => [cameraAsset, ...current]);
      setSelectedAssetIds((prev) => {
        if (prev.includes(assetId)) return prev;
        if (prev.length >= 3) {
          setError(MAX_UPLOAD_FILES_EXCEEDED_MESSAGE);
          return prev;
        }
        return [...prev, assetId];
      });
    } catch (err) {
      console.warn('[Surveyor] Error capturing camera photo:', err);
      setError('Không thể mở camera trên thiết bị.');
    }
  };

  const handleToggleAsset = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    setSelectedAssetIds((prev) => {
      if (prev.includes(assetId)) {
        setError(undefined);
        return prev.filter((id) => id !== assetId);
      }

      if (prev.length >= 3) {
        setError(MAX_UPLOAD_FILES_EXCEEDED_MESSAGE);
        return prev;
      }

      setError(undefined);
      return [...prev, assetId];
    });
  };

  const handleConfirm = async () => {
    if (selectedAssetIds.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setError(undefined);

    try {
      const selectedMap = new Map(assets.map((a) => [a.id, a]));
      const chosenIds = selectedAssetIds.slice(0, 3);
      const processed: SelectedSurveyMedia[] = [];

      for (const assetId of chosenIds) {
        // Reuse already processed asset if available from current selection
        const existing = currentSelectedAssets.find((a) => a.assetId === assetId);
        const asset = selectedMap.get(assetId);

        if (existing && !asset) {
          processed.push(existing);
          continue;
        }

        if (!asset) continue;

        try {
          let assetInfo: any;
          try {
            assetInfo = await LegacyMediaLibrary.getAssetInfoAsync(asset);
          } catch {
            assetInfo = {
              localUri: asset.uri,
              location: (asset as any).location,
              exif: null,
            };
          }

          const assetType =
            asset.mediaType === LegacyMediaLibrary.MediaType.video ? 'video' : 'image';

          const targetUri = assetInfo?.localUri ?? asset.uri;
          let fileSize = 0;
          if (Platform.OS !== 'web' && targetUri) {
            try {
              const info = await FileSystem.getInfoAsync(targetUri);
              if (info.exists && typeof info.size === 'number') {
                fileSize = info.size;
              }
            } catch { }
          }

          if (assetType === 'video' && fileSize > MAX_SURVEY_VIDEO_SIZE_BYTES) {
            setError(VIDEO_SIZE_EXCEEDED_MESSAGE);
            continue;
          }
          if (assetType === 'image' && fileSize > MAX_SURVEY_IMAGE_SIZE_BYTES) {
            setError(IMAGE_SIZE_EXCEEDED_MESSAGE);
            continue;
          }

          const exif = assetInfo?.exif as Record<string, unknown> | undefined;
          const exifCoordinates = extractImageGpsCoordinates(exif);
          let gpsCoordinates = isValidGpsCoordinates(assetInfo?.location)
            ? {
              latitude: assetInfo.location.latitude,
              longitude: assetInfo.location.longitude,
            }
            : exifCoordinates;

          if (!gpsCoordinates && assetType === 'image' && targetUri) {
            try {
              const fileGps = await extractGpsFromImageFile(targetUri);
              if (fileGps) {
                gpsCoordinates = fileGps;
              }
            } catch { }
          }

          const capturedTimestamp =
            asset.creationTime > 0
              ? new Date(asset.creationTime).toISOString()
              : (asset as any).modificationTime > 0
                ? new Date((asset as any).modificationTime).toISOString()
                : captureTimeFromExif(exif) || new Date().toISOString();

          if (assetType === 'video') {
            const videoMeta = await extractVideoMetadataAsync({
              id: asset.id,
              uri: targetUri,
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
              uri: targetUri,
              duration: videoMeta.durationSeconds,
              assetId: asset.id,
              hasEmbeddedGps: videoMeta.hasDeviceGps,
              gps: videoMeta.hasDeviceGps
                ? {
                  latitude: videoMeta.startCoordinate[1],
                  longitude: videoMeta.startCoordinate[0],
                }
                : null,
            });
          } else {
            let finalImageUri = targetUri;
            let finalImageName = asset.filename;
            if (targetUri) {
              try {
                const compressed = await compressAndResizeSurveyImage(targetUri);
                if (compressed.uri) {
                  finalImageUri = compressed.uri;
                  if (!finalImageName.toLowerCase().endsWith('.jpg') && !finalImageName.toLowerCase().endsWith('.jpeg')) {
                    finalImageName = `${finalImageName.replace(/\.[^/.]+$/, '')}.jpg`;
                  }
                }
              } catch (compErr) {
                console.warn('[Surveyor] Pre-compression skipped:', compErr);
              }
            }

            processed.push({
              capturedAt: capturedTimestamp,
              fileName: finalImageName,
              type: 'image',
              uri: finalImageUri,
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
        onConfirm(processed);
      }
    } catch (err) {
      console.warn('[Surveyor] Unable to process selected Android assets:', err);
      setError(UNABLE_TO_READ_FILE_MESSAGE);
    } finally {
      setIsProcessing(false);
    }
  };

  const gridItems = useMemo<GalleryGridItem[]>(() => {
    return [{ id: CAMERA_TILE_ID, isCamera: true }, ...assets];
  }, [assets]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.galleryModalRoot}>
        <Pressable
          accessibilityLabel="Đóng thư viện ảnh"
          accessibilityRole="button"
          onPress={onClose}
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
                Tối đa 3 tệp phương tiện (ảnh hoặc video)
              </Text>
            </View>
            <AppButton
              accessibilityLabel="Đóng thư viện ảnh"
              label="Đóng"
              onPress={onClose}
              style={styles.galleryCloseButton}
              variant="ghost"
            />
          </View>

          {/* Album Selector Filter */}
          <View style={[styles.albumFilterContainer, { borderBottomColor: theme.border }]}>
            <ScrollView
              contentContainerStyle={styles.albumFilterList}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Pressable
                accessibilityLabel="Tất cả ảnh và video"
                accessibilityRole="button"
                onPress={() => handleSelectAlbum(undefined)}
                style={[
                  styles.albumPill,
                  {
                    backgroundColor: selectedAlbumId === undefined ? theme.primary : theme.backgroundElement,
                    borderColor: selectedAlbumId === undefined ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.albumPillText,
                    {
                      color: selectedAlbumId === undefined ? '#FFFFFF' : theme.text,
                      fontWeight: selectedAlbumId === undefined ? '700' : '500',
                    },
                  ]}
                >
                  Tất cả
                </Text>
              </Pressable>
              {albums.map((album) => {
                const isSelected = selectedAlbumId === album.id;
                return (
                  <Pressable
                    accessibilityLabel={`Album ${album.title}`}
                    accessibilityRole="button"
                    key={album.id}
                    onPress={() => handleSelectAlbum(album.id)}
                    style={[
                      styles.albumPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.albumPillText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {album.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {error ? (
            <Text accessibilityRole="alert" style={styles.galleryErrorText}>
              {error}
            </Text>
          ) : null}

          <FlatList
            contentContainerStyle={styles.galleryGrid}
            data={gridItems}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              hasNextPage ? (
                <ActivityIndicator color={theme.primary} style={styles.galleryFooterLoader} />
              ) : assets.length === 0 ? (
                <View style={styles.galleryEmptyState}>
                  {isLoading ? (
                    <ActivityIndicator color={theme.primary} size="large" />
                  ) : null}
                  <Text style={[styles.galleryEmptyText, { color: theme.textSecondary }]}>
                    {isLoading ? 'Đang tải tệp phương tiện…' : 'Không tìm thấy ảnh hoặc video nào'}
                  </Text>
                </View>
              ) : null
            }
            numColumns={3}
            onEndReached={() => {
              if (hasNextPage && cursor) {
                void loadPage(cursor);
              }
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => {
              if ('isCamera' in item && item.isCamera) {
                return (
                  <Pressable
                    accessibilityLabel="Chụp ảnh mới"
                    accessibilityRole="button"
                    disabled={isProcessing}
                    onPress={handleLaunchCamera}
                    style={({ pressed }) => [
                      styles.galleryItem,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.cameraTileContent,
                        {
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.cameraIconCircle,
                          { backgroundColor: theme.primary + '18' },
                        ]}
                      >
                        <MaterialCommunityIcons color={theme.primary} name="camera" size={24} />
                      </View>
                      <Text style={[styles.cameraTileText, { color: theme.text }]}>Chụp ảnh</Text>
                    </View>
                  </Pressable>
                );
              }

              const isSelected = selectedAssetIds.includes(item.id);
              const isVideo = item.mediaType === LegacyMediaLibrary.MediaType.video;

              return (
                <Pressable
                  accessibilityLabel={`Chọn ${item.filename}`}
                  accessibilityRole="button"
                  disabled={isProcessing}
                  onPress={() => handleToggleAsset(item.id)}
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
              {selectedAssetIds.length > 0
                ? `Đã chọn ${selectedAssetIds.length} tệp (tối đa 3)`
                : 'Chưa chọn tệp nào'}
            </Text>
            <AppButton
              accessibilityLabel={`Xác nhận chọn ${selectedAssetIds.length} tệp`}
              disabled={selectedAssetIds.length === 0 || isProcessing}
              label={isProcessing ? 'Đang đọc...' : `Xác nhận (${selectedAssetIds.length})`}
              onPress={handleConfirm}
              style={styles.galleryConfirmButton}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  galleryModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  galleryBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
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
    fontWeight: '900',
    lineHeight: 29,
  },
  gallerySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  galleryCloseButton: {
    minHeight: 40,
    borderRadius: Rounded.round,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  albumFilterContainer: {
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
  },
  albumFilterList: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Rounded.round,
    borderWidth: 1,
  },
  albumPillText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  galleryErrorText: {
    color: '#B42318',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '500',
  },
  galleryItem: {
    position: 'relative',
    width: '33.3333%',
    aspectRatio: 1,
    padding: Spacing.half,
  },
  cameraTileContent: {
    width: '100%',
    height: '100%',
    borderRadius: Rounded.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.half,
  },
  cameraIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cameraTileText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: Rounded.md,
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
    fontWeight: '700',
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
  galleryFooterLoader: {
    marginVertical: Spacing.three,
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
    fontWeight: '600',
  },
  galleryConfirmButton: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
});
