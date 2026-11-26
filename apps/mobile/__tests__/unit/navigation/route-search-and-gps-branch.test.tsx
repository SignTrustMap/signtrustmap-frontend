import React from 'react';
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockSaveRecent = jest.fn();
const mockRefetchSaved = jest.fn().mockResolvedValue(undefined);

let mockParams: Record<string, string | undefined> = {};
let mockSession: any = { accessToken: 'tok-rs', account: { id: 'u-1' } };
let mockSuggestionsState: any = { data: [], isLoading: false, error: undefined };
let mockSavedRoutesList: any[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      cb();
    }, [cb]);
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (p: any) => <View {...p}>{p.children}</View>,
  };
});

jest.mock('expo-symbols', () => {
  const { View } = require('react-native');
  return {
    SymbolView: (p: any) => <View testID="symbol-view" {...p} />,
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (p: any) => <View testID={`ant-${p.name}`} {...p} />;
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    primary: '#2563EB',
  }),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: mockSession }),
}));

jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: () => mockSuggestionsState,
  useSaveRecentPlace: () => ({ mutate: mockSaveRecent }),
}));

jest.mock('@/feature/navigation/hooks/use-saved-routes', () => ({
  useSavedRoutes: () => ({
    savedRoutes: mockSavedRoutesList,
    refetch: mockRefetchSaved,
  }),
}));

const mockAddListener = jest.fn();
const mockRemoveListener = jest.fn();
const mockSetMinDisplacement = jest.fn();
let mockMapLibreGps: any = {
  LocationManager: {
    setMinDisplacement: (...args: any[]) => mockSetMinDisplacement(...args),
    addListener: (...args: any[]) => mockAddListener(...args),
    removeListener: (...args: any[]) => mockRemoveListener(...args),
  },
};
jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => mockMapLibreGps,
}));

const mockEnsurePerm = jest.fn();
const mockFetchPos = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  ensureLocationPermission: (...args: any[]) => mockEnsurePerm(...args),
  fetchFreshGpsPosition: (...args: any[]) => mockFetchPos(...args),
  isValidGpsLocation: (pos: any) => Boolean(pos?.coords?.latitude),
}));

import { RouteSearchScreen } from '@/feature/navigation/pages/route-search-screen';
import { useNativeGps } from '@/feature/navigation/hooks/use-native-gps';

describe('RouteSearchScreen and useNativeGps branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockParams = {};
    mockSession = { accessToken: 'tok-rs', account: { id: 'u-1' } };
    mockSuggestionsState = { data: [], isLoading: false, error: undefined };
    mockSavedRoutesList = [];
    mockMapLibreGps = {
      LocationManager: {
        setMinDisplacement: (...args: any[]) => mockSetMinDisplacement(...args),
        addListener: (...args: any[]) => mockAddListener(...args),
        removeListener: (...args: any[]) => mockRemoveListener(...args),
      },
    };
    mockEnsurePerm.mockResolvedValue(true);
    mockFetchPos.mockResolvedValue([106.7, 10.77]);
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  it('covers RouteSearchScreen saved routes, query clear, loading/error/empty states, same-location toast, and selection', async () => {
    mockParams = { startLat: '10.77', startLng: '106.7' };
    mockSavedRoutesList = [
      {
        id: 'sr-1',
        name: 'Đi làm',
        originName: 'A',
        destinationName: 'B',
        originLatitude: 10.77,
        originLongitude: 106.7,
        destinationLatitude: 10.78,
        destinationLongitude: 106.71,
        vehicleMode: 'MOTORCYCLE',
      },
      {
        id: 'sr-2',
        originName: 'C',
        destinationName: 'D',
        originLatitude: 10.77,
        originLongitude: 106.7,
        destinationLatitude: 10.79,
        destinationLongitude: 106.72,
        vehicleMode: 'CAR',
      },
    ];
    mockSuggestionsState = {
      data: [
        { id: 'p-same', title: 'Trùng điểm xuất phát', address: 'Q1', latitude: 10.77, longitude: 106.7 },
        { id: 'p-nocoord', title: 'No coords', address: 'Q1', latitude: null, longitude: null },
        { id: 'p-ok', title: 'Bến Thành', address: 'Lê Lợi', latitude: 10.772, longitude: 106.698 },
      ],
      isLoading: false,
      error: undefined,
    };

    const screen = await render(<RouteSearchScreen />);
    expect(screen.getByText('TUYẾN ĐƯỜNG YÊU THÍCH (WISHLIST)')).toBeTruthy();
    expect(screen.getByText('C ➔ D')).toBeTruthy();

    // Tap saved route
    await fireEvent.press(screen.getByLabelText('Đi làm'));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/home',
        params: expect.objectContaining({ savedRouteId: 'sr-1', vehicleMode: 'BIKE' }),
      }),
    );

    // Same location warning toast & dismiss
    await fireEvent.press(screen.getByLabelText('Trùng điểm xuất phát'));
    expect(screen.getByText(/Điểm đến trùng với điểm xuất phát|trùng/i)).toBeTruthy();

    // No coordinate item ignored
    await fireEvent.press(screen.getByLabelText('No coords'));

    // Valid destination selection saves recent & replaces route
    await fireEvent.press(screen.getByLabelText('Bến Thành'));
    expect(mockSaveRecent).toHaveBeenCalled();

    // Type query >= 2 and clear it
    await fireEvent.changeText(screen.getByTestId('input-route-search'), 'Quận 1');
    expect(screen.getByText('KẾT QUẢ TÌM KIẾM')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Xóa nội dung tìm kiếm'));
    expect(screen.getByText('GẦN ĐÂY')).toBeTruthy();

    // Loading & error & empty states
    mockSuggestionsState = { data: [], isLoading: true, error: undefined };
    await screen.rerender(<RouteSearchScreen />);
    mockSuggestionsState = { data: [], isLoading: false, error: 'Lỗi tìm kiếm' };
    await screen.rerender(<RouteSearchScreen />);
    expect(screen.getByText('Lỗi tìm kiếm')).toBeTruthy();

    mockSuggestionsState = { data: [], isLoading: false, error: undefined };
    await screen.rerender(<RouteSearchScreen />);
    expect(screen.getByText('Không có điểm đến.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('covers useNativeGps listener lifecycle, location callback validation, permission denied, web guard, and unmount cleanup errors', async () => {
    const h1 = await renderHook(() => useNativeGps());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockAddListener).toHaveBeenCalled();
    const cb = mockAddListener.mock.calls[0][0];
    await act(async () => {
      cb(null);
      cb({ coords: { latitude: 10.78, longitude: 106.71, accuracy: 5 }, timestamp: 1234 });
    });
    expect(h1.result.current.userCoordinate).toEqual([106.71, 10.78]);

    mockRemoveListener.mockImplementationOnce(() => {
      throw new Error('remove error');
    });
    await act(async () => {
      h1.unmount();
    });

    // Permission denied & MapLibre null & listener throw branches
    mockEnsurePerm.mockResolvedValueOnce(false);
    const h2 = await renderHook(() => useNativeGps([106.7, 10.77]));
    await act(async () => {
      await h2.result.current.startGpsListening();
    });

    mockMapLibreGps = null;
    const h3 = await renderHook(() => useNativeGps());
    await act(async () => {
      await h3.result.current.startGpsListening();
    });

    Platform.OS = 'web';
    const h4 = await renderHook(() => useNativeGps());
    await act(async () => {
      await h4.result.current.startGpsListening();
    });
  });
});
