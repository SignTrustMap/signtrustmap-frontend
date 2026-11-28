import React from 'react';
import { Animated } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="verify-card-img" {...props} />,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('@/hooks/use-back-button', () => ({ useBackButton: jest.fn() }));
jest.mock('@/hooks/use-work-route', () => ({ useWorkRoute: () => '/work' }));
jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: { accessToken: 'tok-hist', account: { id: 'u-1' } } }),
}));

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
    onPrimary: '#FFFFFF',
    danger: '#EF4444',
  }),
}));

let mockSessionsQuery: any = {
  data: { items: [], total: 0, totalPages: 1 },
  isLoading: false,
  isFetching: false,
  isRefetching: false,
  error: null,
  refetch: jest.fn(),
};
jest.mock('@/feature/navigation/hooks/use-navigation', () => ({
  useGetNavigationSessions: () => mockSessionsQuery,
}));

const mockResolveLocation = jest.fn();
jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: (...args: any[]) => mockResolveLocation(...args),
  formatResolvedLocationTitle: (r: any) => r?.roadName ?? null,
}));

const mockCreateRoute = jest.fn();
const mockUpdateRoute = jest.fn();
jest.mock('@/feature/saved-routes/hooks/use-saved-routes', () => ({
  useCreateSavedRoute: () => ({ mutateAsync: mockCreateRoute }),
  useUpdateSavedRoute: () => ({ mutateAsync: mockUpdateRoute }),
}));

import {
  NavigationHistoryScreen,
  extractCoordinate,
} from '@/feature/navigation/pages/navigation-history-screen';
import { BookmarkRouteModal } from '@/feature/navigation/components/bookmark-route-modal';
import { NavigationSignVerifyCard } from '@/components/navigation-sign-verify-card';

describe('NavigationHistory, BookmarkRouteModal & SignVerifyCard Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveLocation.mockResolvedValue({
      roadName: 'Đường Lê Lợi',
      displayAddress: 'Đường Lê Lợi, Quận 1, TP.HCM',
    });
    mockSessionsQuery = {
      data: { items: [], total: 0, totalPages: 1 },
      isLoading: false,
      isFetching: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    };
  });

  describe('NavigationHistoryScreen & extractCoordinate', () => {
    it('extracts coordinates across GeoJSON, tuple, object, flat fields, and invalid inputs', () => {
      expect(extractCoordinate({ coordinates: [106.7, 10.77] })).toEqual({ latitude: 10.77, longitude: 106.7 });
      expect(extractCoordinate([106.71, 10.78])).toEqual({ latitude: 10.78, longitude: 106.71 });
      expect(extractCoordinate({ lat: 10.79, lng: 106.72 })).toEqual({ latitude: 10.79, longitude: 106.72 });
      expect(extractCoordinate(undefined, '10.8', '106.8')).toEqual({ latitude: 10.8, longitude: 106.8 });
      expect(extractCoordinate(undefined, NaN, NaN)).toBeNull();
    });

    it('covers loading, error retry, empty CTA, items with various vehicles/durations, and pagination', async () => {
      mockSessionsQuery = { ...mockSessionsQuery, isLoading: true };
      const screen = await render(<NavigationHistoryScreen />);
      expect(screen.getByLabelText('Đang tải lịch sử di chuyển')).toBeTruthy();

      mockSessionsQuery = { ...mockSessionsQuery, isLoading: false, error: new Error('fail') };
      await screen.rerender(<NavigationHistoryScreen />);
      await fireEvent.press(screen.getByText('Thử lại'));
      expect(mockSessionsQuery.refetch).toHaveBeenCalled();

      mockSessionsQuery = { ...mockSessionsQuery, error: null, data: { items: [], total: 0, totalPages: 1 } };
      await screen.rerender(<NavigationHistoryScreen />);
      await fireEvent.press(screen.getByText('Bắt đầu điều hướng'));
      expect(mockPush).toHaveBeenCalledWith('/(authenticated)/(tabs)/home');

      mockSessionsQuery = {
        ...mockSessionsQuery,
        data: {
          items: [
            {
              id: 's1',
              origin: { coordinates: [106.7, 10.77] },
              destination: { coordinates: [106.72, 10.79] },
              originName: 'Điểm xuất phát',
              destinationName: 'Chợ Bến Thành',
              vehicleType: 'TRUCK',
              distanceMeters: 2500,
              durationSeconds: 3720,
              creditsDeducted: 5,
              createdAt: new Date().toISOString(),
            },
            {
              id: 's2',
              originLatitude: 10.75,
              originLongitude: 106.68,
              originName: 'Q5',
              destinationName: 'Không toạ độ',
              vehicleMode: 'WALKING',
              durationSeconds: 300,
              createdAt: 'invalid-date',
            },
          ],
          total: 25,
          totalPages: 2,
        },
      };
      await screen.rerender(<NavigationHistoryScreen />);

      await waitFor(() => expect(screen.getByText('Trang 1 / 2')).toBeTruthy());
      await fireEvent.press(screen.getByText('Sau'));
      expect(screen.getByText('Trang 2 / 2')).toBeTruthy();
      await fireEvent.press(screen.getByText('Trước'));

      // Tap item with coordinates vs without destination coordinates
      await fireEvent.press(screen.getAllByText('Đi lại')[0]);
      expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/(authenticated)/(tabs)/home' }));
      await fireEvent.press(screen.getAllByText('Đi lại')[1]);
    });
  });

  describe('BookmarkRouteModal', () => {
    it('covers create, validation error, min-1 category guard, update, and error fallback', async () => {
      mockCreateRoute.mockResolvedValueOnce({ id: 'created-1' });
      const onClose = jest.fn();
      const onSaved = jest.fn();
      const onShowToast = jest.fn();
      const refetchPresets = jest.fn().mockResolvedValue(undefined);
      const setActivePresetId = jest.fn().mockResolvedValue(undefined);

      const baseProps: any = {
        visible: true,
        onClose,
        onSaved,
        isRouteBookmarked: false,
        plannedRouteOrigin: [106.7, 10.77],
        selectedDestination: { id: 'd1', coordinate: [106.72, 10.79], title: 'Chợ' },
        routeStartTitle: 'Vị trí hiện tại',
        vehicleMode: 'CYCLING',
        isMotorcycleMode: false,
        routeCoordinates: [[106.7, 10.77], [106.72, 10.79]],
        routeDistance: 1500,
        routeDuration: 300,
        sessionAccessToken: 'tok-bm',
        onShowToast,
        refetchPresets,
        setActivePresetId,
      };

      const screen = await render(<BookmarkRouteModal {...baseProps} />);

      // Empty title validation error
      await fireEvent.changeText(screen.getByLabelText('Tên lộ trình'), '   ');
      await fireEvent.press(screen.getByLabelText('Lưu lộ trình'));
      expect(screen.getByText('Vui lòng nhập tên cho lộ trình.')).toBeTruthy();

      // Restore title & create
      await fireEvent.changeText(screen.getByLabelText('Tên lộ trình'), 'Vị trí hiện tại ➔ Chợ');
      await fireEvent.press(screen.getByLabelText('Lưu lộ trình'));
      expect(mockCreateRoute).toHaveBeenCalled();
      expect(onSaved).toHaveBeenCalledWith('created-1');

      // Update mode + toggle categories to trigger 1-category minimum guard + save error
      mockUpdateRoute.mockRejectedValueOnce(new Error('Update boom'));
      await screen.rerender(
        <BookmarkRouteModal
          {...baseProps}
          activeSavedRouteId="saved-1"
          isRouteBookmarked={true}
          savedRouteData={{
            id: 'saved-1',
            title: 'Đã lưu',
            filterRules: { categories: ['P'] },
          }}
        />,
      );
      await fireEvent.press(screen.getByLabelText(/Biển báo cấm/));
      expect(screen.getByText('Chọn ít nhất một danh mục biển báo.')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Lưu lộ trình'));
      await waitFor(() => expect(screen.getByText('Update boom')).toBeTruthy());
    });
  });

  describe('NavigationSignVerifyCard', () => {
    it('covers rendering null, photo inspection modal, present/absent verify, and dismiss', async () => {
      jest.useFakeTimers();
      jest.spyOn(Animated, 'parallel').mockImplementation(() => ({ start: (cb?: any) => cb?.() }) as any);

      const onVerify = jest.fn();
      const onDismiss = jest.fn();

      const screen = await render(
        <NavigationSignVerifyCard distanceMeters={60} onDismiss={onDismiss} onVerify={onVerify} sign={null} />,
      );
      expect(screen.toJSON()).toBeNull();

      const sign: any = {
        id: 's1',
        name: 'Cấm rẽ trái',
        signCode: 'P.123a',
        actualCropUrl: 'https://cdn/crop.jpg',
        roadName: 'Lê Lợi',
      };
      await screen.rerender(
        <NavigationSignVerifyCard distanceMeters={45} onDismiss={onDismiss} onVerify={onVerify} sign={sign} />,
      );

      await fireEvent.press(screen.getByLabelText('Tap to view full verification photo'));
      await fireEvent.press(screen.getByLabelText('Có, biển báo vẫn có trên đường'));
      expect(onVerify).toHaveBeenCalledWith(sign, 'present');

      // New sign id resets responded state -> test absent + dismiss
      const sign2: any = { id: 's2', signCode: 'W.201', imageUrl: 'https://cdn/w.jpg' };
      await screen.rerender(
        <NavigationSignVerifyCard distanceMeters={30} onDismiss={onDismiss} onVerify={onVerify} sign={sign2} />,
      );
      await fireEvent.press(screen.getByLabelText('Không, không thấy biển báo'));
      expect(onVerify).toHaveBeenCalledWith(sign2, 'absent');

      await fireEvent.press(screen.getByLabelText('Bỏ qua xác minh biển báo'));
      expect(onDismiss).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
