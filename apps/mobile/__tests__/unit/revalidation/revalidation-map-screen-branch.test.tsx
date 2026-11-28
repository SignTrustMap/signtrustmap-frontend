import React from 'react';
import { Animated } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockParams: any = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 10, bottom: 16, left: 0, right: 0 }),
  };
});

jest.mock('@/hooks/use-back-button', () => ({ useBackButton: jest.fn() }));
jest.mock('@/hooks/use-work-route', () => ({ useWorkRoute: () => '/work' }));
jest.mock('@/hooks/use-debounce', () => ({ useDebounce: (v: string) => v }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    grey: '#64748B',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFF6FF',
    border: '#CBD5E1',
    primary: '#0671EB',
  }),
}));

const mockSearchPlaces = jest.fn();
jest.mock('@/api/navigation/places', () => ({
  searchPlaces: (...args: any[]) => mockSearchPlaces(...args),
}));

const mockFetchGps = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: (...args: any[]) => mockFetchGps(...args),
}));

jest.mock('@/feature/navigation/hooks/use-signs', () => ({
  useGetSignsInBounds: () => ({
    data: [
      { id: 's-stale', signCode: 'P.102', name: 'Cấm ngược chiều', roadName: 'Lê Lợi', coordinate: [106.7, 10.77], freshnessScore: 0.2 },
      { id: 's-mod', signCode: 'W.201', name: 'Đường cong', coordinate: [106.71, 10.78], freshnessScore: 0.6 },
      { id: 's-fresh', signCode: 'I.401', name: 'Ưu tiên', coordinate: [106.72, 10.79], freshnessScore: 0.95 },
    ],
  }),
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetAllRevalidationTasks: () => ({
    data: [{ id: 't-stale', verifiedSignId: 's-stale', signCode: 'P.102', name: 'Cấm ngược chiều', latitude: 10.77, longitude: 106.7, freshnessScore: 0.2 }],
    isLoading: false,
  }),
  useGetRevalidationTasksInBounds: () => ({ data: [] }),
}));

let capturedMapProps: any = {};
jest.mock('@/feature/revalidation/components/revalidation-map-view', () => ({
  RevalidationMapView: (props: any) => {
    capturedMapProps = props;
    const ReactActual = require('react');
    const { View } = require('react-native');
    return ReactActual.createElement(View, { testID: 'mock-reval-map' });
  },
}));

jest.mock('@/feature/revalidation/components/revalidation-sign-details-card', () => ({
  RevalidationSignDetailsCard: ({ sign, onRevalidate, onClose }: any) => {
    const ReactActual = require('react');
    const { Pressable, Text, View } = require('react-native');
    return ReactActual.createElement(
      View,
      { testID: 'mock-details-card' },
      ReactActual.createElement(Text, null, sign.signCode),
      ReactActual.createElement(Pressable, { testID: 'trigger-reval', onPress: () => onRevalidate(sign) }, ReactActual.createElement(Text, null, 'Reval')),
      ReactActual.createElement(Pressable, { testID: 'close-details', onPress: onClose }, ReactActual.createElement(Text, null, 'Close')),
    );
  },
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RevalidationMapScreen } from '@/feature/revalidation/pages/revalidation-map-screen';

describe('RevalidationMapScreen Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMapProps = {};
    mockParams = {};
    mockFetchGps.mockResolvedValue([106.7, 10.77]);
    mockSearchPlaces.mockResolvedValue([
      { id: 'pl-1', title: 'Chợ Bến Thành', address: 'Q1', latitude: 10.772, longitude: 106.698 },
    ]);
    jest.spyOn(Animated, 'spring').mockImplementation(() => ({ start: (cb?: any) => cb?.() }) as any);
  });

  const renderScreen = async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}>
        <RevalidationMapScreen />
      </QueryClientProvider>,
    );
  };

  it('covers search dropdown, urgency filter drawer, zoom threshold menu, sign list panel, snap location, and inspect navigation', async () => {
    const screen = await renderScreen();
    await waitFor(() => expect(capturedMapProps.focusCoordinate).toEqual([106.7, 10.77]));
    expect(screen.queryByTestId('mock-details-card')).toBeNull();

    // Urgency filter drawer toggle & filter tabs
    await fireEvent.press(screen.getByLabelText('Hiển thị bộ lọc mức độ khẩn cấp'));
    await fireEvent.press(screen.getByLabelText(/cần kiểm tra khẩn cấp/));
    await fireEvent.press(screen.getByLabelText(/mức độ trung bình/));
    await fireEvent.press(screen.getByLabelText(/biển báo tươi mới/));
    await fireEvent.press(screen.getByLabelText(/Lọc tất cả/));
    await fireEvent.press(screen.getByLabelText('Ẩn bộ lọc'));

    // Zoom popover open & select threshold
    await fireEvent.press(screen.getByLabelText('Thay đổi mức thu phóng bản đồ'));
    await fireEvent.press(screen.getByLabelText(/Đặt mức thu phóng thành Toàn cảnh/));

    // Snap current location
    await fireEvent.press(screen.getByLabelText('Đến vị trí hiện tại'));

    // Sign list panel open, select sign, then revalidate CTA
    await fireEvent.press(screen.getByLabelText(/Hiển thị danh sách/));
    await waitFor(() => expect(screen.getAllByLabelText(/Đến biển báo/).length).toBeGreaterThan(0));
    await fireEvent.press(screen.getAllByLabelText(/Đến biển báo/)[0]);
    await waitFor(() => expect(screen.getByTestId('trigger-reval')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('trigger-reval'));
    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/work/inspect-revalidate' }));

    // Search input matching signs & places + clear button
    await fireEvent.changeText(screen.getByLabelText('Tìm kiếm vị trí trên bản đồ tái thẩm định'), 'P.102');
    await waitFor(() => expect(screen.getByLabelText(/Chọn địa điểm Chợ Bến Thành/)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(/Chọn địa điểm Chợ Bến Thành/));
    await fireEvent.press(screen.getByLabelText('Xóa tìm kiếm'));

    await fireEvent.press(screen.getByLabelText('Quay lại Công việc'));
  });
});
