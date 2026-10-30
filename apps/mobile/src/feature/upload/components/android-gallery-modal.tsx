import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import type { Asset as MediaLibraryAsset } from 'expo-media-library/legacy';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
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
  const [cursor, setCursor] = useState<string>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isLoadingRef = useRef(false);

  const loadPage = async (after?: string) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(undefined);

    try {
      const page = await LegacyMediaLibrary.getAssetsAsync({
        after,
        first: ANDROID_GALLERY_PAGE_SIZE,
        mediaType: [LegacyMediaLibrary.MediaType.photo, LegacyMediaLibrary.MediaType.video],
        sortBy: [[LegacyMediaLibrary.SortBy.creationTime, false]],
      });

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
      setSelectedAssetIds(initialSelectedAssetIds);
      void loadPage();
    }
  }, [visible]);

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
          const assetInfo = await LegacyMediaLibrary.getAssetInfoAsync(asset);
          const assetType =
            asset.mediaType === LegacyMediaLibrary.MediaType.video ? 'video' : 'image';

          const targetUri = assetInfo.localUri ?? asset.uri;
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

          const exif = assetInfo.exif as Record<string, unknown> | undefined;
          const exifCoordinates = extractImageGpsCoordinates(exif);
          let gpsCoordinates = isValidGpsCoordinates(assetInfo.location)
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
        onConfirm(processed);
      }
    } catch (err) {
      console.warn('[Surveyor] Unable to process selected Android assets:', err);
      setError(UNABLE_TO_READ_FILE_MESSAGE);
    } finally {
      setIsProcessing(false);
    }
  };

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

          {error ? (
            <Text accessibilityRole="alert" style={styles.galleryErrorText}>
              {error}
            </Text>
          ) : null}

          <FlatList
            contentContainerStyle={
              assets.length === 0 ? styles.galleryEmptyContent : styles.galleryGrid
            }
            data={assets}
            keyExtractor={(asset) => asset.id}
            ListEmptyComponent={
              <View style={styles.galleryEmptyState}>
                {isLoading ? (
                  <ActivityIndicator color={theme.primary} size="large" />
                ) : null}
                <Text style={[styles.galleryEmptyText, { color: theme.textSecondary }]}>
                  {isLoading ? 'Đang tải tệp phương tiện…' : 'Không tìm thấy ảnh hoặc video nào'}
                </Text>
              </View>
            }
            ListFooterComponent={
              hasNextPage ? (
                <ActivityIndicator color={theme.primary} style={styles.galleryFooterLoader} />
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
