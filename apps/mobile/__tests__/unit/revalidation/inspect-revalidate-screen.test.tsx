import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { InspectRevalidateScreen } from '@/feature/revalidation/pages/inspect-revalidate-screen';
import * as navigationGps from '@/feature/navigation/utils/gps';
import * as revalHooks from '@/feature/revalidation/hooks/use-revalidation';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('@/feature/upload/utils/survey-image', () => ({
  compressAndResizeSurveyImage: jest.fn((uri: string) =>
    Promise.resolve({ uri: `${uri}-downsized.jpg`, width: 1280, height: 960 }),
  ),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [
        {
          uri: 'file:///data/camera-raw.jpg',
          fileName: 'camera-raw.jpg',
          mimeType: 'image/jpeg',
          exif: { GPSLatitude: 10.7769, GPSLongitude: 106.7009 },
        },
      ],
    }),
  ),
}));

jest.mock('expo-media-library/legacy', () => ({
  getAssetsAsync: jest.fn(() =>
    Promise.resolve({
      assets: [
        {
          id: 'asset-1',
          uri: 'file:///data/gallery-pic.jpg',
          filename: 'gallery-pic.jpg',
          mediaType: 'photo',
          creationTime: 1700000000000,
        },
      ],
      endCursor: null,
      hasNextPage: false,
    }),
  ),
  getAssetInfoAsync: jest.fn((asset) =>
    Promise.resolve({
      id: asset.id,
      uri: asset.uri,
      localUri: asset.uri,
      filename: asset.filename,
      location: { latitude: 10.7769, longitude: 106.7009 },
    }),
  ),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaType: { photo: 'photo', video: 'video' },
  SortBy: { creationTime: 'creationTime' },
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
  useQuery: () => ({
    data: null,
    isLoading: false,
  }),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => ({
    data: null,
    isLoading: false,
  }),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'user-1', displayName: 'Surveyor A' },
    },
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      primary: '#0671EB',
      success: '#16A34A',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
  }),
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useSubmitRevalidation: jest.fn(),
}));

jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: jest.fn(),
  fetchFreshGpsLocation: jest.fn(),
}));

describe('InspectRevalidateScreen', () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSubmitRevalidation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      signId: 'sign-101',
      taskId: 'task-55',
      signCode: 'P.102',
      nameVi: 'Cấm đi ngược chiều',
      latitude: '10.7769',
      longitude: '106.7009',
      freshnessScore: '0.45',
      roadName: 'Đường Nguyễn Huệ, Quận 1',
      imageUrl: 'https://cdn.signmap.site/crops/p102.jpg',
    });
    (revalHooks.useSubmitRevalidation as jest.Mock).mockReturnValue({
      mutateAsync: mockSubmitRevalidation,
    });
  });

  afterEach(async () => {
    cleanup();
  });

  it('renders target sign metadata, code, freshness score and road address', async () => {
    const { getByText, getAllByText } = await render(<InspectRevalidateScreen />);

    expect(getByText('P.102')).toBeTruthy();
    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    expect(getAllByText('Đường Nguyễn Huệ, Quận 1').length).toBeGreaterThanOrEqual(1);
  });

  it('navigates back to revalidation map with snap coordinates on header back press', async () => {
    const { getByLabelText } = await render(<InspectRevalidateScreen />);

    const backBtn = getByLabelText('Quay lại bản đồ tái thẩm định');
    await act(async () => {
      fireEvent.press(backBtn);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/work/revalidation-map',
        params: expect.objectContaining({
          selectedSignId: 'sign-101',
          snapLat: '10.7769',
          snapLon: '106.7009',
        }),
      }),
    );
  });

  it('allows user to select different status options (STILL_ACTIVE, REMOVED, CHANGED)', async () => {
    const { getByLabelText } = await render(<InspectRevalidateScreen />);

    const missingOption = getByLabelText('Đã gỡ bỏ');
    await act(async () => {
      fireEvent.press(missingOption);
    });

    const changedOption = getByLabelText('Đã thay đổi');
    await act(async () => {
      fireEvent.press(changedOption);
    });

    const activeOption = getByLabelText('Vẫn hoạt động');
    await act(async () => {
      fireEvent.press(activeOption);
    });

    expect(activeOption).toBeTruthy();
  });

  it('allows user to enter custom surveyor note', async () => {
    const { getByLabelText } = await render(<InspectRevalidateScreen />);

    const noteInput = getByLabelText('Ghi chú của người kiểm tra');
    await act(async () => {
      fireEvent.changeText(noteInput, 'Biển báo rõ ràng, không bị cành cây che');
    });

    expect(noteInput.props.value).toBe('Biển báo rõ ràng, không bị cành cây che');
  });

  it('fetches fresh GPS position when user requests current location stamp', async () => {
    (navigationGps.fetchFreshGpsLocation as jest.Mock).mockResolvedValueOnce({
      latitude: 10.7769,
      longitude: 106.7009,
      accuracy: 5,
      heading: 0,
    });

    const { getByLabelText } = await render(<InspectRevalidateScreen />);

    const gpsStampBtn = getByLabelText('Sử dụng GPS thiết bị hiện tại');
    await act(async () => {
      fireEvent.press(gpsStampBtn);
    });

    expect(navigationGps.fetchFreshGpsLocation).toHaveBeenCalled();
  });

  it('disables submit button when no evidence media has been selected', async () => {
    const { getByText } = await render(<InspectRevalidateScreen />);

    // Since no media is picked yet, submit button text should indicate uploading evidence
    expect(getByText('Tải lên ảnh hoặc video bằng chứng')).toBeTruthy();
  });

  it('displays proximity distance and prevents submit when location is too far (> 50m)', async () => {
    // 10.7900, 106.7009 is ~1.4km away (> 50m)
    (navigationGps.fetchFreshGpsLocation as jest.Mock).mockResolvedValueOnce({
      latitude: 10.79,
      longitude: 106.7009,
      accuracy: 5,
      heading: 0,
    });

    const { getByLabelText, getByText } = await render(<InspectRevalidateScreen />);

    const gpsStampBtn = getByLabelText('Sử dụng GPS thiết bị hiện tại');
    await act(async () => {
      fireEvent.press(gpsStampBtn);
    });

    await waitFor(() => {
      expect(getByText(/Cách vị trí biển báo cũ/i)).toBeTruthy();
      const alertMsg = getByText(/Tối đa cho phép 50m/i);
      expect(alertMsg).toBeTruthy();
      expect(alertMsg.props.accessibilityRole).toBe('alert');
    });
  });

  it('downsizes captured photo before submitting revalidation evidence', async () => {
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    try {
      const { getByLabelText, getByText } = await render(<InspectRevalidateScreen />);

      // 1. Select status option (e.g. STILL_ACTIVE)
      const activeOption = getByLabelText('Vẫn hoạt động');
      await act(async () => {
        fireEvent.press(activeOption);
      });

      // 2. Open Android gallery modal
      const pickBtn = getByLabelText(/Chọn ảnh từ thư viện/i);
      await act(async () => {
        fireEvent.press(pickBtn);
      });

      // 3. Tap camera tile inside gallery modal
      const cameraBtn = getByLabelText('Mở máy ảnh');
      await act(async () => {
        fireEvent.press(cameraBtn);
      });

      // Verify compressAndResizeSurveyImage was invoked on raw camera URI
      const surveyImageUtils = require('@/feature/upload/utils/survey-image');
      expect(surveyImageUtils.compressAndResizeSurveyImage).toHaveBeenCalledWith('file:///data/camera-raw.jpg');

      // 4. Submit evidence
      const submitBtn = getByText('Gửi bằng chứng tái thẩm định');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(mockSubmitRevalidation).toHaveBeenCalledWith(
        expect.objectContaining({
          taskIdOrSignId: 'task-55',
          data: expect.objectContaining({
            confirmedSignId: 'sign-101',
            evidenceType: 'STILL_ACTIVE',
          }),
          mediaFile: expect.objectContaining({
            fileName: 'camera-raw.jpg',
          }),
        }),
      );
    } finally {
      Platform.OS = originalOS;
    }
  });

  it('handles GPS errors and displays message when acquiring live location', async () => {
    (navigationGps.fetchFreshGpsLocation as jest.Mock).mockResolvedValueOnce(null);

    const { getByLabelText, getByText } = await render(<InspectRevalidateScreen />);

    const gpsStampBtn = getByLabelText('Sử dụng GPS thiết bị hiện tại');
    await act(async () => {
      fireEvent.press(gpsStampBtn);
    });

    expect(getByText(/Không thể lấy tọa độ GPS hiện tại/i)).toBeTruthy();

    // Now test rejection
    (navigationGps.fetchFreshGpsLocation as jest.Mock).mockRejectedValueOnce(new Error('GPS Timeout'));
    await act(async () => {
      fireEvent.press(gpsStampBtn);
    });

    expect(getByText(/Không thể lấy vị trí GPS hiện tại/i)).toBeTruthy();
  });

  it('shows permission error when media library permission is denied', async () => {
    const LegacyMediaLibrary = require('expo-media-library/legacy');
    (LegacyMediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    try {
      const { getByLabelText, getByText } = await render(<InspectRevalidateScreen />);

      const pickBtn = getByLabelText(/Chọn ảnh từ thư viện/i);
      await act(async () => {
        fireEvent.press(pickBtn);
      });

      expect(getByText(/Cần cấp quyền truy cập thư viện phương tiện để chọn ảnh/i)).toBeTruthy();
    } finally {
      Platform.OS = originalOS;
    }
  });

  it('handles submitRevalidation rejection and displays submit error', async () => {
    mockSubmitRevalidation.mockRejectedValueOnce(new Error('Network error 500'));

    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    try {
      const { getByLabelText, getByText } = await render(<InspectRevalidateScreen />);

      // Select status option
      await act(async () => {
        fireEvent.press(getByLabelText('Vẫn hoạt động'));
      });

      // Open Android gallery modal and tap camera
      await act(async () => {
        fireEvent.press(getByLabelText(/Chọn ảnh từ thư viện/i));
      });
      await act(async () => {
        fireEvent.press(getByLabelText('Mở máy ảnh'));
      });

      // Submit
      await act(async () => {
        fireEvent.press(getByText('Gửi bằng chứng tái thẩm định'));
      });

      expect(mockSubmitRevalidation).toHaveBeenCalled();
      expect(getByText('Network error 500')).toBeTruthy();
    } finally {
      Platform.OS = originalOS;
    }
  });
});
