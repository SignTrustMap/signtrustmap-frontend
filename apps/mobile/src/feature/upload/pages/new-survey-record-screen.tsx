import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
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
  CANNOT_SAVE_DRAFT_MESSAGE,
  VIDEO_NO_GPS_DATA_MESSAGE,
} from '@/constants/message';
import { Fonts, MaxContentWidth, Rounded, Spacing } from '@/constants/theme';
import { AndroidGalleryModal } from '@/feature/upload/components/android-gallery-modal';
import { SurveyScanModal } from '@/feature/upload/components/survey-scan-modal';
import { useSaveSurveyDraft } from '@/feature/upload/hooks/use-save-survey-draft';
import { useSurveyMediaPicker } from '@/feature/upload/hooks/use-survey-media-picker';
import {
  isValidGpsCoordinates,
  type SelectedGpxFile,
  type SelectedSurveyMedia,
} from '@/feature/upload/types/survey-media';
import { useTheme } from '@/hooks/use-theme';

export type { SelectedGpxFile, SelectedSurveyMedia };

export function NewSurveyRecordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const saveDraft = useSaveSurveyDraft();

  const picker = useSurveyMediaPicker();
  const {
    selectedAssets,
    activeAssetIndex,
    setActiveAssetIndex,
    selectedAsset,
    selectedGps,
    isVideoAsset,
    selectedGpxFile,
    isVideoMissingGpx,
    isAnyVideoMissingGpx,
    showAdvancedGpx,
    setShowAdvancedGpx,
    pickerError,
    setPickerError,
    gpxPickerError,
    isOpeningGallery,
    isAndroidGalleryVisible,
    openGallery,
    closeAndroidGallery,
    handleConfirmAndroidAssets,
    removeAsset,
    pickGpx,
    removeGpx,
  } = picker;

  const isFocused = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanInProgress = useRef(false);
  const scanFinished = useRef(false);
  const savedDraftId = useRef<string | undefined>(undefined);
  const savedBatchIds = useRef<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      return () => {
        isFocused.current = false;
      };
    }, []),
  );

  const openSavedDraft = () => {
    if (!isFocused.current || !scanFinished.current || !savedDraftId.current) return;
    setIsScanning(false);
    setIsSaving(false);
    const initialAsset = selectedAssets[0];
    const initialGps = initialAsset?.gps ?? null;
    router.replace({
      pathname: '/work/new-survey/details',
      params: {
        submissionId: savedDraftId.current,
        ...(savedBatchIds.current.length > 1 ? { batchSubmissionIds: savedBatchIds.current.join(',') } : {}),
        ...(initialGps ? {
          startLat: String(initialGps.latitude),
          startLon: String(initialGps.longitude),
        } : {}),
        ...(initialAsset?.duration ? {
          duration: String(Math.round(initialAsset.duration)),
        } : {}),
        ...(initialAsset?.assetId ? {
          assetId: initialAsset.assetId,
        } : {}),
        ...(selectedGpxFile ? { gpxUri: selectedGpxFile.uri, gpxName: selectedGpxFile.name } : {}),
      },
    });
  };

  const handleSubmitRecord = async () => {
    if (selectedAssets.length === 0 || isOpeningGallery || scanInProgress.current) return;

    // Check if any video asset lacks GPX/GPS data before moving to details screen
    for (const asset of selectedAssets) {
      if (asset.type === 'video') {
        const hasAssetGps = isValidGpsCoordinates(asset.gps);
        if (!hasAssetGps && !selectedGpxFile) {
          picker.setGpxPickerError(VIDEO_NO_GPS_DATA_MESSAGE);
          return;
        }
      }
    }

    scanInProgress.current = true;
    scanFinished.current = false;
    savedDraftId.current = undefined;
    savedBatchIds.current = [];
    setPickerError(undefined);
    setIsSaving(true);
    setIsScanning(true);

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    // Call saveDraft for all selected assets concurrently while scan modal is active
    const saveTasks = selectedAssets.map(async (asset, i) => {
      const isVideo = asset.type === 'video';
      const parsedCaptureTime = asset.capturedAt ? Date.parse(asset.capturedAt) : NaN;
      const isCaptureValid =
        !Number.isNaN(parsedCaptureTime) &&
        Date.now() - parsedCaptureTime >= 0 &&
        Date.now() - parsedCaptureTime < THIRTY_DAYS_MS;
      const safeCapturedAt = isCaptureValid ? asset.capturedAt! : new Date().toISOString();

      return saveDraft(
        {
          fileName: asset.fileName ?? undefined,
          mimeType: asset.mimeType,
          type: asset.type,
          uri: asset.uri,
          startLat: asset.gps?.latitude,
          startLon: asset.gps?.longitude,
        },
        {
          submissionType: isVideo ? 'VIDEO_GPX' : 'SINGLE_IMAGE',
          capturedAt: safeCapturedAt,
          coordinateSource: isVideo ? 'GPX_FILE' : 'IMAGE_EXIF',
          ...(asset.gps ?? {}),
        },
        draftId && i === 0 ? draftId : undefined,
        selectedGpxFile,
      );
    });

    Promise.all(saveTasks)
      .then((savedIds) => {
        if (savedIds.length > 0) {
          savedDraftId.current = savedIds[0];
          savedBatchIds.current = savedIds;
          if (scanFinished.current) {
            openSavedDraft();
          }
        }
      })
      .catch((error) => {
        console.warn('[Surveyor] Unable to save survey draft:', error);
        setPickerError(error instanceof Error ? error.message : CANNOT_SAVE_DRAFT_MESSAGE);
        setIsScanning(false);
        setIsSaving(false);
      })
      .finally(() => {
        scanInProgress.current = false;
      });
  };

  const handleScanComplete = () => {
    scanFinished.current = true;
    if (savedDraftId.current) {
      openSavedDraft();
    }
  };

  const selectedAssetIds = selectedAssets
    .map((a) => a.assetId)
    .filter((id): id is string => Boolean(id));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {isScanning && selectedAsset ? (
        <SurveyScanModal
          imageUri={selectedAsset.uri}
          isVideo={selectedAsset.type === 'video'}
          onCancel={() => {
            scanFinished.current = true;
            if (savedDraftId.current) {
              openSavedDraft();
            } else {
              setIsScanning(false);
              setIsSaving(false);
            }
          }}
          onComplete={handleScanComplete}
        />
      ) : null}

      <AndroidGalleryModal
        currentSelectedAssets={selectedAssets}
        initialSelectedAssetIds={selectedAssetIds}
        onClose={closeAndroidGallery}
        onConfirm={handleConfirmAndroidAssets}
        visible={isAndroidGalleryVisible}
      />

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
                onPress={openGallery}
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
                    removeAsset(activeAssetIndex);
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
              onPress={openGallery}
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

          {isVideoAsset || isAnyVideoMissingGpx ? (
            <View style={styles.videoMetaContainer}>
              {isVideoMissingGpx || (!isVideoAsset && isAnyVideoMissingGpx) ? (
                /* Video lacks GPX data -> directly display warning card and GPX upload input */
                <View style={styles.missingGpxContainer}>
                  <View
                    style={[
                      styles.videoGpsCard,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: '#F59E0B',
                      },
                    ]}
                  >
                    <SymbolView
                      fallback={<Text style={{ color: '#F59E0B', fontWeight: '700' }}>!</Text>}
                      name={{ android: 'warning', ios: 'exclamationmark.triangle.fill', web: 'warning' }}
                      size={24}
                      tintColor="#F59E0B"
                    />
                    <View style={styles.videoGpsText}>
                      <Text style={[styles.videoGpsTitle, { color: theme.text }]}>
                        Không tìm thấy dữ liệu GPS trong video
                      </Text>
                      <Text style={[styles.videoGpsSubtitle, { color: theme.textSecondary }]}>
                        Khảo sát bằng video yêu cầu dữ liệu toạ độ hành trình. Vui lòng tải lên tệp .gpx đồng bộ để tiếp tục.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gpxUploadPromptBox}>
                    <Text style={[styles.gpxSectionHeader, { color: theme.text }]}>
                      Tải lên tệp GPX hành trình *
                    </Text>
                    <AppButton
                      accessibilityLabel="Tải lên tệp GPX hành trình"
                      disabled={isScanning || isSaving}
                      onPress={pickGpx}
                      pressedOpacity={0.78}
                      style={[
                        styles.uploadPlaceholder,
                        styles.gpxPickerButton,
                        {
                          backgroundColor: theme.neutral,
                          borderColor: gpxPickerError ? '#EF4444' : theme.primary,
                        },
                      ]}
                      variant="surface"
                    >
                      <SymbolView
                        fallback={<Text style={[styles.imageFallback, { color: theme.primary }]}>GPX</Text>}
                        name={{ android: 'route', ios: 'map', web: 'route' }}
                        size={28}
                        tintColor={theme.primary}
                      />
                      <View style={{ alignItems: 'center', gap: 2 }}>
                        <Text style={[styles.uploadLabel, { color: theme.primary, fontWeight: '700' }]}>
                          Chọn tệp GPX (.gpx) từ thiết bị
                        </Text>
                        <Text style={[styles.gpxHintText, { color: theme.placeholder }]}>
                          Định dạng .gpx (Tối đa 10MB)
                        </Text>
                      </View>
                    </AppButton>
                    {gpxPickerError ? (
                      <Text accessibilityRole="alert" style={styles.errorText}>
                        {gpxPickerError}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : selectedGpxFile ? (
                /* GPX file attached */
                <View style={styles.gpxSuccessContainer}>
                  <View
                    style={[
                      styles.videoGpsCard,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <SymbolView
                      fallback={<Text style={{ color: theme.primary, fontWeight: '700' }}>GPX</Text>}
                      name={{ android: 'route', ios: 'checkmark.circle.fill', web: 'route' }}
                      size={24}
                      tintColor={theme.primary}
                    />
                    <View style={styles.videoGpsText}>
                      <Text style={[styles.videoGpsTitle, { color: theme.text }]}>
                        {`Đã gắn tệp GPX: ${selectedGpxFile.name}`}
                      </Text>
                      <Text style={[styles.videoGpsSubtitle, { color: theme.textSecondary }]}>
                        {selectedGps
                          ? `Toạ độ bắt đầu: ${selectedGps.latitude.toFixed(5)}, ${selectedGps.longitude.toFixed(5)}`
                          : 'Đã sẵn sàng chuyển sang bước nhập chi tiết khảo sát'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gpxActionRow}>
                    <Pressable
                      accessibilityLabel="Đổi tệp GPX khác"
                      accessibilityRole="button"
                      onPress={pickGpx}
                      style={styles.gpxActionBtn}
                    >
                      <Text style={[styles.gpxActionBtnText, { color: theme.primary }]}>
                        Đổi tệp GPX khác
                      </Text>
                    </Pressable>
                    {!selectedAsset?.hasEmbeddedGps ? (
                      <Pressable
                        accessibilityLabel="Gỡ tệp GPX"
                        accessibilityRole="button"
                        onPress={removeGpx}
                        style={styles.gpxActionBtn}
                      >
                        <Text style={[styles.gpxActionBtnText, { color: '#EF4444' }]}>
                          Gỡ tệp GPX
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : (
                /* Video has embedded GPS from device */
                <View style={styles.embeddedGpsContainer}>
                  <View
                    style={[
                      styles.videoGpsCard,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <SymbolView
                      fallback={<Text style={{ color: theme.primary }}>GPS</Text>}
                      name={{ android: 'my_location', ios: 'location.fill', web: 'my_location' }}
                      size={22}
                      tintColor={theme.primary}
                    />
                    <View style={styles.videoGpsText}>
                      <Text style={[styles.videoGpsTitle, { color: theme.text }]}>
                        {`Đã phát hiện GPS từ video: ${selectedGps!.latitude.toFixed(5)}, ${selectedGps!.longitude.toFixed(5)}`}
                      </Text>
                      <Text style={[styles.videoGpsSubtitle, { color: theme.textSecondary }]}>
                        Điểm bắt đầu và kết thúc lộ trình sẽ được thể hiện trên bản đồ ở bước tiếp theo
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
                        accessibilityLabel="Tải lên tệp GPX"
                        disabled={isScanning || isSaving}
                        onPress={pickGpx}
                        pressedOpacity={0.78}
                        style={[
                          styles.uploadPlaceholder,
                          styles.gpxPickerButton,
                          {
                            backgroundColor: theme.neutral,
                            borderColor: theme.border,
                          },
                        ]}
                        variant="surface"
                      >
                        <SymbolView
                          fallback={<Text style={[styles.imageFallback, { color: theme.placeholder }]}>GPX</Text>}
                          name={{ android: 'route', ios: 'map', web: 'route' }}
                          size={28}
                          tintColor={theme.placeholder}
                        />
                        <Text style={[styles.uploadLabel, { color: theme.textSecondary }]}>
                          Chọn tệp .gpx từ thiết bị
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
              )}
            </View>
          ) : null}

          <AppButton
            disabled={
              selectedAssets.length === 0 ||
              isOpeningGallery ||
              isScanning ||
              isSaving ||
              isAnyVideoMissingGpx
            }
            label={
              isSaving
                ? 'Đang lưu bản nháp...'
                : isAnyVideoMissingGpx
                  ? 'Cần tải lên tệp GPX cho video để tiếp tục'
                  : selectedAssets.length > 1
                    ? `Tiếp tục ghi nhận (${selectedAssets.length} tệp)`
                    : 'Tiếp tục ghi nhận'
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
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontFamily: Fonts.title,
    fontSize: 24,
    fontWeight: '700',
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
    fontWeight: '900',
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
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  errorText: {
    color: '#B42318',
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
    lineHeight: 18,
  },
  videoGpsSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  advancedGpxToggle: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
  },
  advancedGpxToggleText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
    fontWeight: '700',
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
  missingGpxContainer: {
    gap: Spacing.two,
  },
  gpxUploadPromptBox: {
    gap: Spacing.one,
  },
  gpxSectionHeader: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: '600',
  },
  gpxHintText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '400',
  },
  gpxSuccessContainer: {
    gap: Spacing.two,
  },
  gpxActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  gpxActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  gpxActionBtnText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  embeddedGpsContainer: {
    gap: Spacing.two,
  },
});
