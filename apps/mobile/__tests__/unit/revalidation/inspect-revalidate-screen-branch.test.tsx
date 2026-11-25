import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import * as LegacyMediaLibrary from 'expo-media-library/legacy';

const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: any = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-image', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => ReactActual.createElement(View, { testID: 'inspect-img', ...props }),
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

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: { accessToken: 'tok-insp', account: { id: 'surv-1' } } }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    grey: '#64748B',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    neutral: '#F1F5F9',
    border: '#CBD5E1',
    primary: '#0671EB',
  }),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => ({ data: { displayAddress: '45 Nguyễn Huệ, Q1' } }),
}));

const mockFetchFreshGpsLocation = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsLocation: (...args: any[]) => mockFetchFreshGpsLocation(...args),
  fetchFreshGpsPosition: jest.fn(),
}));

const mockEnsureCam = jest.fn();
jest.mock('@/services/camera-permission', () => ({
  ensureCameraPermission: (...args: any[]) => mockEnsureCam(...args),
}));

const mockCompress = jest.fn();
jest.mock('@/feature/upload/utils/survey-image', () => ({
  compressAndResizeSurveyImage: (...args: any[]) => mockCompress(...args),
}));

const mockExtractVideoMeta = jest.fn();
jest.mock('@/feature/upload/utils/video-gps', () => ({
  extractVideoMetadataAsync: (...args: any[]) => mockExtractVideoMeta(...args),
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-media-library/legacy', () => ({
  MediaType: { photo: 'photo', video: 'video' },
  SortBy: { creationTime: 'creationTime' },
  requestPermissionsAsync: jest.fn(),
  getAssetsAsync: jest.fn(),
  getAssetInfoAsync: jest.fn(),
}));

const mockCheckIn = jest.fn();
jest.mock('@/api/revalidation/revalidation', () => ({
  checkInRevalidationTask: (...args: any[]) => mockCheckIn(...args),
  resolveS3Url: (k?: string) => (k ? `https://s3.mock/${k}` : ''),
}));

const mockSubmitReval = jest.fn();
jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetAllRevalidationTasks: () => ({ data: [{ id: 'resolved-task', verifiedSignId: 'sig-1' }] }),
  useSubmitRevalidation: () => ({ mutateAsync: mockSubmitReval }),
}));

import {
  InspectRevalidateScreen,
  calculateDistanceMeters,
  getFreshnessStyle,
  isValidGpsCoordinates,
} from '@/feature/revalidation/pages/inspect-revalidate-screen';

describe('InspectRevalidateScreen Branch Coverage', () => {
  const origPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    mockParams = {
      signId: 'sig-1',
      taskId: 'sign-target',
      signCode: 'P.102',
      nameVi: 'Cấm đi ngược',
      latitude: '10.7700',
      longitude: '106.7000',
      freshnessScore: '0.25',
      imageUrl: 'signs/p102.png',
      actualCropUrl: 'crops/p102.jpg',
    };
    mockCheckIn.mockResolvedValue({
      distanceMeters: 12,
      isWithinProximity: true,
      dailyLimitReached: false,
      remainingSubmissionsToday: 2,
    });
    mockCompress.mockResolvedValue({ uri: 'file:///comp.jpg' });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
  });

  it('covers pure helpers (calculateDistanceMeters, isValidGpsCoordinates, getFreshnessStyle)', () => {
    expect(calculateDistanceMeters(10.77, 106.7, 10.77, 106.7)).toBe(0);
    expect(isValidGpsCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
    expect(isValidGpsCoordinates({ latitude: 10.77, longitude: 106.7 })).toBe(true);
    expect(getFreshnessStyle(90).text).toBe('#047857');
    expect(getFreshnessStyle(60).text).toBe('#C2410C');
    expect(getFreshnessStyle(35).text).toBe('#BE123C');
    expect(getFreshnessStyle(10).text).toBe('#B91C1C');
  });

  it('covers Android gallery camera/video/image pick, proximity check-in, 409/429 submit errors, ambiguous modal, and success', async () => {
    (LegacyMediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const screen = await render(<InspectRevalidateScreen />);

    // Back button snaps back to map with coords
    await fireEvent.press(screen.getByLabelText('Quay lại bản đồ tái thẩm định'));
    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/work/revalidation-map' }));

    // Android permission denied -> error
    await fireEvent.press(screen.getByLabelText('Chọn ảnh từ thư viện.'));
    expect(screen.getByRole('alert')).toBeTruthy();

    // Android gallery opens -> camera denied -> camera success -> photo selected & checked in
    (LegacyMediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    (LegacyMediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValueOnce({
      assets: [
        { id: 'a1', filename: 'p1.png', mediaType: 'photo', uri: 'file:///p1.png', creationTime: 1700000000000, duration: 0 },
        { id: 'v1', filename: 'v1.mp4', mediaType: 'video', uri: 'file:///v1.mp4', creationTime: 1700000000000, duration: 10 },
      ],
      endCursor: 'c1',
      hasNextPage: false,
    });
    await fireEvent.press(screen.getByLabelText('Chọn ảnh từ thư viện.'));
    await waitFor(() => expect(screen.getByLabelText('Select p1.png')).toBeTruthy());

    (LegacyMediaLibrary.getAssetInfoAsync as jest.Mock).mockResolvedValueOnce({
      localUri: 'file:///p1.png',
      location: { latitude: 10.77, longitude: 106.7 },
      exif: null,
    });
    await fireEvent.press(screen.getByLabelText('Select p1.png'));
    await waitFor(() => expect(mockCheckIn).toHaveBeenCalled());

    // Select CHANGED status + enter note
    await fireEvent.press(screen.getByLabelText('Đã thay đổi'));
    await fireEvent.changeText(screen.getByLabelText('Ghi chú của người kiểm tra'), 'Đã đổi biển mới');

    // Submit 409 ambiguous -> opens modal -> tap candidate -> 429 limit -> generic error -> success
    mockSubmitReval.mockRejectedValueOnce({
      status: 409,
      data: {
        error: 'AMBIGUOUS_TARGET_SIGN',
        candidates: [
          { id: 'cand-1', signCode: 'P.102', nameVi: 'Cấm 1', distanceMeters: 8.4, signCropUrl: 'c1.jpg' },
          { id: 'cand-2', nameEn: 'Sign 2' },
        ],
      },
    });
    await fireEvent.press(screen.getByLabelText('Gửi bằng chứng tái thẩm định'));
    await waitFor(() => expect(screen.getByText('Xác nhận biển báo mục tiêu')).toBeTruthy());

    mockSubmitReval.mockRejectedValueOnce({ status: 429 });
    await fireEvent.press(screen.getByText('Cấm 1'));
    await waitFor(() => expect(screen.getByText(/giới hạn 3 lượt nộp/)).toBeTruthy());

    mockSubmitReval.mockRejectedValueOnce({ status: 409 });
    await fireEvent.press(screen.getByLabelText('Gửi bằng chứng tái thẩm định'));
    await waitFor(() => expect(screen.getByText(/đã nộp bằng chứng/)).toBeTruthy());

    mockSubmitReval.mockResolvedValueOnce({ ok: true });
    await fireEvent.press(screen.getByLabelText('Gửi bằng chứng tái thẩm định'));
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/work/submission-complete' })),
    );
  });

  it('covers iOS image picker, GPS location button, and missing target coords back navigation', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    mockParams = { signId: 'sig-2' };
    mockFetchFreshGpsLocation.mockResolvedValueOnce(null).mockResolvedValueOnce({
      latitude: 10.77,
      longitude: 106.7,
      accuracy: 5,
      heading: 180,
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///ios.png', type: 'image', fileName: 'ios.png' }],
    });

    const screen = await render(<InspectRevalidateScreen />);
    await fireEvent.press(screen.getByLabelText('Quay lại bản đồ tái thẩm định'));
    expect(mockBack).toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Chọn ảnh từ thư viện.'));
    await fireEvent.press(screen.getByLabelText('Sử dụng GPS thiết bị hiện tại'));
    await waitFor(() => expect(mockFetchFreshGpsLocation).toHaveBeenCalledTimes(1));

    await fireEvent.press(screen.getByLabelText('Sử dụng GPS thiết bị hiện tại'));
    await waitFor(() => expect(mockFetchFreshGpsLocation).toHaveBeenCalledTimes(2));
  });
});
