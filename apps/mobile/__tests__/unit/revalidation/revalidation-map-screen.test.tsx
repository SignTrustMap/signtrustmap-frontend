import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { RevalidationMapScreen } from '@/feature/revalidation/pages/revalidation-map-screen';
import * as navigationGps from '@/feature/navigation/utils/gps';
import * as revalHooks from '@/feature/revalidation/hooks/use-revalidation';
import * as signsHooks from '@/feature/navigation/hooks/use-signs';
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

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const R = require('react');
    return R.createElement('SafeAreaView', props, children);
  },
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(() => ({
      data: [],
      isFetching: false,
    })),
  };
});

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

jest.mock('@/feature/revalidation/components/revalidation-map-view', () => ({
  RevalidationMapView: 'RevalidationMapView',
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetAllRevalidationTasks: jest.fn(),
  useGetRevalidationTasksInBounds: jest.fn(),
  useGetTaskEvidences: jest.fn(() => ({ data: [], isLoading: false })),
}));

jest.mock('@/feature/navigation/hooks/use-signs', () => ({
  useGetSignsInBounds: jest.fn(),
}));

jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: jest.fn(),
}));

describe('RevalidationMapScreen', () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSign = {
    id: 'sign-map-101',
    coordinate: [106.7009, 10.7769],
    signCode: 'P.102',
    name: 'Cấm đi ngược chiều',
    nameVi: 'Cấm đi ngược chiều',
    nameEn: 'No Entry',
    freshnessScore: 0.45,
    status: 'STALE',
    roadName: 'Đường Nguyễn Huệ',
    displayAddress: 'Đường Nguyễn Huệ, Quận 1',
    imageUrl: 'https://cdn.signmap.site/crops/p102.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (revalHooks.useGetAllRevalidationTasks as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'task-1',
          signId: 'sign-map-101',
          targetLatitude: 10.7769,
          targetLongitude: 106.7009,
          freshnessScore: 45,
          status: 'PENDING',
        },
      ],
      isLoading: false,
    });
    (revalHooks.useGetRevalidationTasksInBounds as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (signsHooks.useGetSignsInBounds as jest.Mock).mockReturnValue({
      data: [mockSign],
      isLoading: false,
    });
    (navigationGps.fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.7009, 10.7769]);
  });

  afterEach(async () => {
    cleanup();
  });

  it('renders top search bar and floating action buttons (filter, zoom, current location)', async () => {
    const { getByLabelText, getByPlaceholderText } = await render(<RevalidationMapScreen />);

    expect(getByLabelText('Quay lại Công việc')).toBeTruthy();
    expect(getByPlaceholderText('Tìm vị trí, địa điểm kiểm tra...')).toBeTruthy();
    expect(getByLabelText('Hiển thị bộ lọc mức độ khẩn cấp')).toBeTruthy();
    expect(getByLabelText('Thay đổi mức thu phóng bản đồ')).toBeTruthy();
    expect(getByLabelText('Đến vị trí hiện tại')).toBeTruthy();
  });

  it('navigates back when header back button is pressed', async () => {
    const { getByLabelText } = await render(<RevalidationMapScreen />);

    const backBtn = getByLabelText('Quay lại Công việc');
    await act(async () => {
      fireEvent.press(backBtn);
    });

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('allows user to enter place search query', async () => {
    const { getByPlaceholderText } = await render(<RevalidationMapScreen />);

    const searchInput = getByPlaceholderText('Tìm vị trí, địa điểm kiểm tra...');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Chợ Bến Thành');
    });

    expect(searchInput.props.value).toBe('Chợ Bến Thành');
  });

  it('toggles urgency filter drawer on button press', async () => {
    const { getByLabelText } = await render(<RevalidationMapScreen />);

    const filterBtn = getByLabelText('Hiển thị bộ lọc mức độ khẩn cấp');
    await act(async () => {
      fireEvent.press(filterBtn);
    });

    // After expanding, drawer shows filter options
    expect(getByLabelText('Ẩn bộ lọc')).toBeTruthy();
  });

  it('opens zoom level menu and selects detail threshold', async () => {
    const { getByLabelText } = await render(<RevalidationMapScreen />);

    const zoomBtn = getByLabelText('Thay đổi mức thu phóng bản đồ');
    await act(async () => {
      fireEvent.press(zoomBtn);
    });

    // Zoom options become visible
    const detailOption = getByLabelText('Đặt mức thu phóng thành Chi tiết (17.5x)');
    await act(async () => {
      fireEvent.press(detailOption);
    });

    expect(detailOption).toBeTruthy();
  });

  it('renders sign details card and allows user to navigate to inspect-revalidate screen', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      signJson: JSON.stringify(mockSign),
    });

    const { getByText } = await render(<RevalidationMapScreen />);

    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    expect(getByText('Đường Nguyễn Huệ, Quận 1')).toBeTruthy();

    const inspectBtn = getByText('Kiểm tra thực địa');
    await act(async () => {
      fireEvent.press(inspectBtn);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/work/inspect-revalidate',
        params: expect.objectContaining({
          signId: 'sign-map-101',
          signCode: 'P.102',
        }),
      }),
    );
  });

  it('fetches fresh GPS location and snaps map camera when pressing current location button', async () => {
    const { getByLabelText } = await render(<RevalidationMapScreen />);

    const gpsBtn = getByLabelText('Đến vị trí hiện tại');
    await act(async () => {
      fireEvent.press(gpsBtn);
    });

    expect(navigationGps.fetchFreshGpsPosition).toHaveBeenCalled();
  });
});
