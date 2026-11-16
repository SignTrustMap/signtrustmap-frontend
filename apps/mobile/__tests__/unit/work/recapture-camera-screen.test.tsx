import React from 'react';
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import { Alert, Linking, Platform } from 'react-native';
import { RecaptureCameraScreen } from '@/feature/work/pages/recapture-camera-screen';
import { fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { extractGpsFromImageFile } from '@/feature/upload/utils/image-file-gps';
import { extractImageGpsCoordinates } from '@/feature/upload/utils/image-gps';

const mockBack = jest.fn();
let mockSearchParams: Record<string, string | undefined> = {
  candidateId: 'cand-123',
  targetLat: '10.7769',
  targetLon: '106.7009',
  signTitle: 'Biển báo nguy hiểm 201',
  reason: 'BLURRY',
  note: 'Ảnh mờ cần chụp lại',
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
jest.mock('@/feature/review/hooks/use-recapture', () => ({
  useSubmitRecaptureMutation: () => ({
    mutateAsync: mockSubmitRecapture,
    isPending: false,
  }),
}));

jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: jest.fn().mockResolvedValue([106.7009, 10.7769]),
}));

jest.mock('@/feature/upload/utils/image-file-gps', () => ({
  extractGpsFromImageFile: jest.fn(),
}));

jest.mock('@/feature/upload/utils/image-gps', () => ({
  extractImageGpsCoordinates: jest.fn(),
}));

const mockLaunchCameraAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn().mockResolvedValue({ granted: true });
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: () => mockRequestCameraPermissionsAsync(),
  launchCameraAsync: () => mockLaunchCameraAsync(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: () => mockGetDocumentAsync(),
}));

describe('RecaptureCameraScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockSearchParams = {
      candidateId: 'cand-123',
      targetLat: '10.7769',
      targetLon: '106.7009',
      signTitle: 'Biển báo nguy hiểm 201',
      reason: 'BLURRY',
      note: 'Ảnh mờ cần chụp lại',
    };
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['fake-image-bytes'], { type: 'image/jpeg' })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders screen with sign title, instructions, and target coordinates', async () => {
    const { getByText } = await render(<RecaptureCameraScreen />);

    expect(getByText('Yêu cầu chụp lại')).toBeTruthy();
    expect(getByText('Biển báo nguy hiểm 201')).toBeTruthy();
    expect(getByText('Ảnh mờ, rung tay')).toBeTruthy();
  });

  it('opens native directions maps link when user is far (> 100m) from target', async () => {
    // User GPS is far from sign target
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.8009, 10.8769]);
    const spyOpenURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);

    const { getByText, findByText } = await render(<RecaptureCameraScreen />);

    const dirBtn = await findByText('Chỉ đường');
    fireEvent.press(dirBtn);

    expect(spyOpenURL).toHaveBeenCalledWith(expect.stringMatching(/q=10\.7769,106\.7009/));
    spyOpenURL.mockRestore();
  });

  it('captures photo with camera directly at location within geofence', async () => {
    mockLaunchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///data/user/0/cache/photo.jpg',
          fileName: 'captured.jpg',
          mimeType: 'image/jpeg',
          exif: {},
        },
      ],
    });
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.7009, 10.7769]); // same as target

    const { getByLabelText, findByText } = await render(<RecaptureCameraScreen />);

    const cameraBtn = getByLabelText('Chụp ảnh mới tại hiện trường');
    await act(async () => {
      fireEvent.press(cameraBtn);
    });

    const badge = await findByText(/GPS chụp tại chỗ/);
    expect(badge).toBeTruthy();
  });

  it('alerts when camera permission is denied', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');
    mockRequestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });

    const { getByLabelText } = await render(<RecaptureCameraScreen />);

    const cameraBtn = getByLabelText('Chụp ảnh mới tại hiện trường');
    await act(async () => {
      fireEvent.press(cameraBtn);
    });

    expect(spyAlert).toHaveBeenCalledWith(
      'Cần quyền máy ảnh',
      expect.stringContaining('Vui lòng cấp quyền truy cập máy ảnh')
    );
    spyAlert.mockRestore();
  });

  it('picks image from library on Android and checks EXIF GPS', async () => {
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///cache/picked.jpg',
          name: 'picked.jpg',
          mimeType: 'image/jpeg',
        },
      ],
    });
    (extractGpsFromImageFile as jest.Mock).mockResolvedValueOnce({
      latitude: 10.7769,
      longitude: 106.7009,
    });

    const { getByLabelText, findByText } = await render(<RecaptureCameraScreen />);

    const pickBtn = getByLabelText('Chọn ảnh từ thiết bị');
    await act(async () => {
      fireEvent.press(pickBtn);
    });

    const badge = await findByText(/GPS từ metadata ảnh/);
    expect(badge).toBeTruthy();
  });

  it('alerts when picked image has no GPS EXIF metadata', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///cache/nogps.jpg',
          name: 'nogps.jpg',
        },
      ],
    });
    (extractGpsFromImageFile as jest.Mock).mockResolvedValueOnce(null);

    const { getByLabelText } = await render(<RecaptureCameraScreen />);

    const pickBtn = getByLabelText('Chọn ảnh từ thiết bị');
    await act(async () => {
      fireEvent.press(pickBtn);
    });

    expect(spyAlert).toHaveBeenCalledWith(
      'Ảnh không có toạ độ GPS',
      expect.stringContaining('Bức ảnh này không chứa thông tin định vị')
    );
    spyAlert.mockRestore();
  });

  it('submits recapture successfully when photo is within geofence', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');
    mockSubmitRecapture.mockResolvedValueOnce({});

    mockLaunchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///cache/photo.jpg',
          fileName: 'recapture.jpg',
          mimeType: 'image/jpeg',
        },
      ],
    });
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.7009, 10.7769]);

    const { getByLabelText } = await render(<RecaptureCameraScreen />);

    // Take photo
    const cameraBtn = getByLabelText('Chụp ảnh mới tại hiện trường');
    await act(async () => {
      fireEvent.press(cameraBtn);
    });

    // Submit
    const submitBtn = getByLabelText('Nộp ảnh chụp lại');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockSubmitRecapture).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateId: 'cand-123',
        })
      );
      expect(spyAlert).toHaveBeenCalledWith(
        'Nộp thành công',
        expect.any(String),
        expect.any(Array)
      );
    });

    spyAlert.mockRestore();
  });
});
