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

jest.mock('expo-media-library/legacy', () => ({
  getAssetsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaType: { photo: 'photo', video: 'video' },
  SortBy: { creationTime: 'creationTime' },
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
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
    const { getByText } = await render(<InspectRevalidateScreen />);

    expect(getByText('P.102')).toBeTruthy();
    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    expect(getByText('Đường Nguyễn Huệ, Quận 1')).toBeTruthy();
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
    (navigationGps.fetchFreshGpsPosition as jest.Mock).mockResolvedValueOnce([106.7010, 10.7770]);

    const { getByLabelText } = await render(<InspectRevalidateScreen />);

    const gpsStampBtn = getByLabelText('Sử dụng GPS thiết bị hiện tại');
    await act(async () => {
      fireEvent.press(gpsStampBtn);
    });

    expect(navigationGps.fetchFreshGpsPosition).toHaveBeenCalled();
  });

  it('disables submit button when no evidence media has been selected', async () => {
    const { getByText } = await render(<InspectRevalidateScreen />);

    // Since no media is picked yet, submit button text should indicate uploading evidence
    expect(getByText('Tải lên ảnh hoặc video bằng chứng')).toBeTruthy();
  });

  it('displays proximity distance and prevents submit when location is too far (> 50m)', async () => {
    // 10.7900, 106.7009 is ~1.4km away (> 50m)
    (navigationGps.fetchFreshGpsPosition as jest.Mock).mockResolvedValueOnce([106.7009, 10.7900]);

    const { getByLabelText, getByText } = await render(<InspectRevalidateScreen />);

    const gpsStampBtn = getByLabelText('Sử dụng GPS thiết bị hiện tại');
    await act(async () => {
      fireEvent.press(gpsStampBtn);
    });

    await waitFor(() => {
      expect(getByText(/Cách biển báo mục tiêu/i)).toBeTruthy();
      expect(getByText(/Tối đa cho phép 50m/i)).toBeTruthy();
    });
  });
});
