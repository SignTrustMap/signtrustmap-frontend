import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock('expo-image', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => ReactActual.createElement(View, { testID: 'gallery-img', ...props }),
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: (props: any) => props.fallback ?? null,
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
  };
});

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
}));

jest.mock('expo-media-library/legacy', () => ({
  MediaType: { photo: 'photo', video: 'video' },
  SortBy: { modificationTime: 'modificationTime' },
  getAlbumsAsync: jest.fn(),
  getAssetsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  getAssetInfoAsync: jest.fn(),
}));

const mockEnsureCam = jest.fn();
jest.mock('@/services/camera-permission', () => ({
  ensureCameraPermission: (...args: any[]) => mockEnsureCam(...args),
}));

const mockFetchGps = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsLocation: (...args: any[]) => mockFetchGps(...args),
}));

const mockExtractImageFile = jest.fn();
jest.mock('@/feature/upload/utils/image-file-gps', () => ({
  extractGpsFromImageFile: (...args: any[]) => mockExtractImageFile(...args),
}));

const mockCompress = jest.fn();
jest.mock('@/feature/upload/utils/survey-image', () => ({
  compressAndResizeSurveyImage: (...args: any[]) => mockCompress(...args),
}));

const mockExtractVideoMeta = jest.fn();
jest.mock('@/feature/upload/utils/video-gps', () => ({
  extractVideoMetadataAsync: (...args: any[]) => mockExtractVideoMeta(...args),
}));

jest.mock('@/feature/upload/utils/video-processor', () => ({
  MAX_SURVEY_IMAGE_SIZE_BYTES: 50000,
  MAX_SURVEY_VIDEO_SIZE_BYTES: 100000,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    backgroundElement: '#FFFFFF',
    border: '#CBD5E1',
    primary: '#0671EB',
  }),
}));

import { AndroidGalleryModal } from '@/feature/upload/components/android-gallery-modal';

describe('AndroidGalleryModal Branch Coverage', () => {
  const origPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    (LegacyMediaLibrary.getAlbumsAsync as jest.Mock).mockResolvedValue([
      { id: 'alb-1', title: 'Camera', assetCount: 4 },
      { id: 'alb-empty', title: 'Empty', assetCount: 0 },
    ]);
    (LegacyMediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue({
      assets: [
        { id: 'img-1', filename: 'shot_heading_90.png', mediaType: 'photo', uri: 'file:///img1.png', creationTime: 1700000000000, duration: 0 },
        { id: 'img-big', filename: 'big.jpg', mediaType: 'photo', uri: 'file:///big.jpg', creationTime: 0, modificationTime: 1700000000000, duration: 0 },
        { id: 'vid-1', filename: 'vid.mp4', mediaType: 'video', uri: 'file:///vid.mp4', creationTime: 1700000000000, duration: 15 },
        { id: 'vid-big', filename: 'bigvid.mp4', mediaType: 'video', uri: 'file:///bigvid.mp4', creationTime: 1700000000000, duration: 20 },
      ],
      endCursor: 'cur-1',
      hasNextPage: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
  });

  it('covers album switching, camera permission/capture, selection limits (3 max), size checks, compression, video GPS & confirm', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    const screen = await render(
      <AndroidGalleryModal
        currentSelectedAssets={[{ assetId: 'existing-1', uri: 'file:///ex.jpg', type: 'image' } as any]}
        initialSelectedAssetIds={['existing-1']}
        onClose={onClose}
        onConfirm={onConfirm}
        visible={true}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Album Camera')).toBeTruthy());

    // Switch album & back to all
    await fireEvent.press(screen.getByLabelText('Album Camera'));
    await fireEvent.press(screen.getByLabelText('Album Camera')); // same album no-op
    await fireEvent.press(screen.getByLabelText('Tất cả ảnh và video'));

    // Camera denied -> then granted + capture with EXIF & freshGps fallback
    mockEnsureCam.mockResolvedValueOnce(false);
    await fireEvent.press(screen.getByLabelText('Chụp ảnh mới'));
    expect(screen.getByText('Ứng dụng cần quyền camera để chụp ảnh.')).toBeTruthy();

    mockEnsureCam.mockResolvedValueOnce(true);
    mockFetchGps.mockResolvedValueOnce({ latitude: 10.77, longitude: 106.7, heading: 45, accuracy: 5 });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///cam.jpg', width: 1080, height: 1920, fileName: 'cam.jpg' }],
    });
    (LegacyMediaLibrary.createAssetAsync as jest.Mock).mockRejectedValueOnce(new Error('save warn'));
    await fireEvent.press(screen.getByLabelText('Chụp ảnh mới'));

    // Select 2 more (now 4 max limit triggers alert text), deselect img-big
    await fireEvent.press(screen.getByLabelText('Chọn shot_heading_90.png'));
    await fireEvent.press(screen.getByLabelText('Chọn vid.mp4'));
    await fireEvent.press(screen.getByLabelText('Chọn big.jpg')); // > 3 max guard

    // Confirm selected assets: img-1 (bearing from filename + png->jpg compress) & vid-1
    (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ localUri: 'file:///img1.png', location: { latitude: 10.77, longitude: 106.7, bearing: 75 } })
      .mockResolvedValueOnce({ localUri: 'file:///vid.mp4', location: null, exif: null });
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 1000 });
    mockCompress.mockResolvedValueOnce({ uri: 'file:///comp.jpg' });
    mockExtractVideoMeta.mockResolvedValueOnce({
      capturedAt: '2026-01-01T00:00:00Z',
      durationSeconds: 15,
      hasDeviceGps: true,
      startCoordinate: [106.7, 10.77],
    });

    await fireEvent.press(screen.getByLabelText(/Xác nhận chọn/));
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });

  it('covers library load error fallback and camera launch exception', async () => {
    (LegacyMediaLibrary.getAlbumsAsync as jest.Mock).mockRejectedValueOnce(new Error('albums fail'));
    (LegacyMediaLibrary.getAssetsAsync as jest.Mock).mockRejectedValueOnce(new Error('assets fail'));
    mockEnsureCam.mockRejectedValueOnce(new Error('cam crash'));

    const screen = await render(
      <AndroidGalleryModal onClose={jest.fn()} onConfirm={jest.fn()} visible={true} />,
    );
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Chụp ảnh mới'));
    expect(screen.getByText('Không thể mở camera trên thiết bị.')).toBeTruthy();
  });
});
