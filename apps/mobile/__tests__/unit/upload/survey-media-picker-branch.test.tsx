import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';
import { act, renderHook } from '@testing-library/react-native';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
}));
jest.mock('expo-image-picker', () => ({
  UIImagePickerPresentationStyle: { PAGE_SHEET: 'pageSheet' },
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-media-library/legacy', () => ({
  requestPermissionsAsync: jest.fn(),
}));

const mockExtractGpx = jest.fn();
jest.mock('@/feature/upload/utils/gpx', () => ({
  extractGpxGpsData: (...args: any[]) => mockExtractGpx(...args),
}));
const mockExtractVideoMeta = jest.fn();
jest.mock('@/feature/upload/utils/video-gps', () => ({
  extractVideoMetadataAsync: (...args: any[]) => mockExtractVideoMeta(...args),
}));
const mockExtractSelectedAsset = jest.fn();
jest.mock('@/feature/upload/utils/selected-asset-gps', () => ({
  captureTimeFromExif: jest.fn(() => undefined),
  extractSelectedAssetGps: (...args: any[]) => mockExtractSelectedAsset(...args),
}));
const mockGetVideoSize = jest.fn();
jest.mock('@/feature/upload/utils/video-processor', () => ({
  MAX_SURVEY_GPX_SIZE_BYTES: 10000,
  MAX_SURVEY_IMAGE_SIZE_BYTES: 50000,
  MAX_SURVEY_VIDEO_SIZE_BYTES: 100000,
  getVideoFileSizeBytes: (...args: any[]) => mockGetVideoSize(...args),
}));

import { useSurveyMediaPicker } from '@/feature/upload/hooks/use-survey-media-picker';

describe('useSurveyMediaPicker Branch Coverage', () => {
  const origPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    mockExtractSelectedAsset.mockResolvedValue({ latitude: 10.77, longitude: 106.7 });
    mockExtractVideoMeta.mockResolvedValue({
      startCoordinate: [106.7, 10.77],
      durationSeconds: 30,
      capturedAt: '2026-01-01T00:00:00Z',
      hasDeviceGps: false,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
  });

  it('covers Android permission denied/granted gallery open and iOS ImagePicker multi-asset, size limits, and errors', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    (LegacyMediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const { result } = await renderHook(() => useSurveyMediaPicker());

    await act(async () => {
      await result.current.openGallery();
    });
    expect(result.current.pickerError).toBeDefined();

    (LegacyMediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    await act(async () => {
      await result.current.openGallery();
    });
    expect(result.current.isAndroidGalleryVisible).toBe(true);

    await act(async () => {
      await result.current.handleConfirmAndroidAssets([
        { uri: 'file:///v1.mp4', type: 'video', gps: null },
      ]);
      result.current.closeAndroidGallery();
    });
    expect(result.current.isAndroidGalleryVisible).toBe(false);
    expect(result.current.isVideoMissingGpx).toBe(true);

    // iOS Picker with oversized image, oversized video, valid video, valid image, then ExponentImagePicker throw
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file:///big.jpg', type: 'image', fileSize: 99999 },
        { uri: 'file:///big.mp4', type: 'video', fileSize: 999999 },
        { uri: 'file:///ok.mp4', type: 'video', duration: 20000 },
        { uri: 'file:///ok.jpg', type: 'image' },
      ],
    });
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 1000 });
    mockGetVideoSize.mockResolvedValue(1000);

    await act(async () => {
      await result.current.openGallery();
    });
    expect(result.current.selectedAssets).toHaveLength(2);

    // Remove active last asset updates activeAssetIndex
    await act(async () => {
      result.current.setActiveAssetIndex(1);
    });
    await act(async () => {
      result.current.removeAsset(1);
    });
    expect(result.current.activeAssetIndex).toBe(0);

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValueOnce(
      new Error('ExponentImagePicker missing'),
    );
    await act(async () => {
      await result.current.openGallery();
    });
    expect(result.current.pickerError).toBeDefined();
  });

  it('covers pickGpx validation (extension, size, coordinates, exception) and removeGpx', async () => {
    const { result } = await renderHook(() => useSurveyMediaPicker());
    await act(async () => {
      await result.current.handleConfirmAndroidAssets([
        { uri: 'file:///v.mp4', type: 'video', gps: null, hasEmbeddedGps: false },
      ]);
    });

    // Non-gpx file
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ name: 'notes.txt', uri: 'file:///notes.txt', size: 100 }],
    });
    await act(async () => {
      await result.current.pickGpx();
    });
    expect(result.current.gpxPickerError).toBeDefined();

    // Oversized GPX file
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ name: 'huge.gpx', uri: 'file:///huge.gpx', size: 50000 }],
    });
    await act(async () => {
      await result.current.pickGpx();
    });
    expect(result.current.gpxPickerError).toBeDefined();

    // GPX without points
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ name: 'empty.gpx', uri: 'file:///empty.gpx', size: 200 }],
    });
    mockExtractGpx.mockResolvedValueOnce({ coordinates: [] });
    await act(async () => {
      await result.current.pickGpx();
    });
    expect(result.current.gpxPickerError).toBeDefined();

    // Valid GPX enriches active asset and removeGpx clears non-embedded GPS
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ name: 'good.gpx', uri: 'file:///good.gpx', size: 300 }],
    });
    mockExtractGpx.mockResolvedValueOnce({
      firstPoint: { latitude: 10.77, longitude: 106.7 },
      startTime: '2026-01-01T10:00:00Z',
    });
    await act(async () => {
      await result.current.pickGpx();
    });
    expect(result.current.selectedAsset?.gps).toEqual({ latitude: 10.77, longitude: 106.7 });

    await act(async () => {
      result.current.removeGpx();
    });
    expect(result.current.selectedGpxFile).toBeUndefined();
    expect(result.current.selectedAsset?.gps).toBeNull();

    // DocumentPicker throw
    (DocumentPicker.getDocumentAsync as jest.Mock).mockRejectedValueOnce(new Error('Picker crash'));
    await act(async () => {
      await result.current.pickGpx();
    });
    expect(result.current.gpxPickerError).toBeDefined();
  });
});
