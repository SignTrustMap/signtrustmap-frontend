import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const mockBack = jest.fn();
let mockSearchParams: Record<string, string | undefined> = {
  candidateId: 'cand-abc-1234',
  targetLat: '10.7769',
  targetLon: '106.7009',
  signTitle: 'Biển cấm rẽ trái',
  signCode: 'P.123',
  reason: 'BLURRY',
  note: 'Cần chụp rõ hơn',
  oldSignCropUrl: 'https://cdn.example.com/old.jpg',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

const mockSubmitRecapture = jest.fn();
let mockIsPending = false;
jest.mock('@/feature/review/hooks/use-recapture', () => ({
  useSubmitRecaptureMutation: () => ({
    mutateAsync: mockSubmitRecapture,
    isPending: mockIsPending,
  }),
}));

const mockFetchFreshGps = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: (...args: any[]) => mockFetchFreshGps(...args),
}));

const mockExtractGpsFile = jest.fn();
jest.mock('@/feature/upload/utils/image-file-gps', () => ({
  extractGpsFromImageFile: (...args: any[]) => mockExtractGpsFile(...args),
}));

const mockExtractGpsExif = jest.fn();
jest.mock('@/feature/upload/utils/image-gps', () => ({
  extractImageGpsCoordinates: (...args: any[]) => mockExtractGpsExif(...args),
}));

const mockEnsureCameraPermission = jest.fn();
jest.mock('@/services/camera-permission', () => ({
  ensureCameraPermission: (...args: any[]) => mockEnsureCameraPermission(...args),
}));

const mockLaunchCamera = jest.fn();
const mockLaunchLibrary = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: (...args: any[]) => mockLaunchCamera(...args),
  launchImageLibraryAsync: (...args: any[]) => mockLaunchLibrary(...args),
}));

const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: any[]) => mockGetDocumentAsync(...args),
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

import { RecaptureCameraScreen } from '@/feature/work/pages/recapture-camera-screen';

describe('RecaptureCameraScreen branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockIsPending = false;
    mockSearchParams = {
      candidateId: 'cand-abc-1234',
      targetLat: '10.7769',
      targetLon: '106.7009',
      signTitle: 'Biển cấm rẽ trái',
      signCode: 'P.123',
      reason: 'BLURRY',
      note: 'Cần chụp rõ hơn',
      oldSignCropUrl: 'https://cdn.example.com/old.jpg',
    };
    mockEnsureCameraPermission.mockResolvedValue(true);
    mockFetchFreshGps.mockResolvedValue([106.7009, 10.7769]);
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['abc'], { type: 'image/jpeg' })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('covers reason fallbacks, far distance formatting (>1km), iOS directions link, and back button', async () => {
    mockFetchFreshGps.mockResolvedValue([106.75, 10.82]); // > 1km away
    Platform.OS = 'ios';
    mockSearchParams = {
      candidateId: '',
      targetLat: '10.7769',
      targetLon: '106.7009',
      reason: 'CUSTOM_UNKNOWN_REASON',
    };
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);

    const screen = await render(<RecaptureCameraScreen />);

    expect(screen.getByText('CUSTOM_UNKNOWN_REASON')).toBeTruthy();
    expect(screen.getByText('Biển báo mới đề xuất')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByText(/km/).length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Chỉ đường tới biển báo'));
    });
    expect(openSpy).toHaveBeenCalledWith('maps://0,0?q=10.7769,106.7009');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Quay lại danh sách chụp lại'));
    });
    expect(mockBack).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('covers camera fallback to exif, missing GPS alert, launch error alert, and iOS library flows', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    Platform.OS = 'ios';

    // 1. Camera succeeds via EXIF fallback when freshGps returns null during capture
    mockFetchFreshGps
      .mockResolvedValueOnce([106.7009, 10.7769]) // initial mount GPS
      .mockResolvedValueOnce(null); // capture GPS
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///cam1.jpg', exif: { GPSLatitude: 10.7769 } }],
    });
    mockExtractGpsExif.mockReturnValueOnce({ latitude: 10.7769, longitude: 106.7009 });

    const screen = await render(<RecaptureCameraScreen />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Chụp ảnh mới tại hiện trường'));
    });
    expect(screen.getByText(/GPS chụp tại chỗ/)).toBeTruthy();

    // 2. Retake fails with no GPS anywhere (exif null, currentPosition null)
    mockLaunchCamera.mockRejectedValueOnce(new Error('cam hw crash'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Chụp lại ảnh'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Lỗi', 'Không thể mở máy ảnh trên thiết bị.');

    // 3. iOS library pick without GPS in EXIF falls back to file GPS, then shows alert if both missing
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///ios-lib.jpg', exif: {} }],
    });
    mockExtractGpsExif.mockReturnValueOnce(null);
    mockExtractGpsFile.mockResolvedValueOnce({ latitude: 10.7769, longitude: 106.7009 });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Đổi ảnh khác'));
    });
    expect(screen.getByText(/GPS từ metadata ảnh/)).toBeTruthy();

    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///ios-no-gps.jpg', exif: {} }],
    });
    mockExtractGpsExif.mockReturnValueOnce(null);
    mockExtractGpsFile.mockResolvedValueOnce(null);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Đổi ảnh khác'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Ảnh không có toạ độ GPS', expect.any(String));

    mockLaunchLibrary.mockRejectedValueOnce(new Error('ios lib err'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Đổi ảnh khác'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Lỗi', 'Không thể chọn ảnh từ thiết bị.');

    alertSpy.mockRestore();
  });

  it('covers geofence error, uriToBlob FileSystem fallback, successful submit Alert -> router.back, and failed submit', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    // Photo picked outside 100m geofence
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///far.jpg', name: 'far.jpg' }],
    });
    mockExtractGpsFile.mockResolvedValueOnce({ latitude: 10.9, longitude: 106.9 });

    const screen = await render(<RecaptureCameraScreen />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Chọn ảnh từ thiết bị'));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Nộp ảnh chụp lại'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Không đủ điều kiện khoảng cách', expect.any(String));

    // Pick near photo & force fetch failure so uriToBlob falls back to FileSystem.readAsStringAsync
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///near.jpg', name: 'near.jpg' }],
    });
    mockExtractGpsFile.mockResolvedValueOnce({ latitude: 10.7769, longitude: 106.7009 });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Đổi ảnh khác'));
    });

    (globalThis as any).fetch = jest.fn().mockRejectedValueOnce(new Error('fetch local fail'));
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
      Buffer.from('hello').toString('base64'),
    );
    mockSubmitRecapture.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Nộp ảnh chụp lại'));
    });

    expect(mockSubmitRecapture).toHaveBeenCalledTimes(1);
    const successCall = alertSpy.mock.calls.find((c) => c[0] === 'Nộp thành công');
    expect(successCall).toBeTruthy();
    const okBtn = (successCall?.[2] as any)?.[0];
    okBtn?.onPress?.();
    expect(mockBack).toHaveBeenCalled();

    // Failed submission error alert
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
      blob: () => Promise.resolve(new Blob(['abc'], { type: 'text/plain' })),
    });
    mockSubmitRecapture.mockRejectedValueOnce(new Error('Upload rejected'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Nộp ảnh chụp lại'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Nộp thất bại', 'Upload rejected');

    alertSpy.mockRestore();
  });
});
