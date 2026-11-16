import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationMapScreen } from '@/feature/navigation/pages/navigation-map-screen';
import { useGetNavigationRoute } from '@/feature/navigation/hooks/use-navigation';
import { ensureLocationPermission, fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { useRouter, useLocalSearchParams } from 'expo-router';

// 1. Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: jest.fn(() => ({
      push: mockPush,
      replace: mockReplace,
      canGoBack: () => true,
      back: jest.fn(),
    })),
    useLocalSearchParams: jest.fn(),
    useFocusEffect: (cb: any) => {
      React.useEffect(() => {
        return cb();
      }, [cb]);
    },
  };
});

// 2. Mock vector icons and expo UI modules
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons/Ionicons', () => {
  const R = require('react');
  const { View } = require('react-native');
  return (props: any) => R.createElement(View, { testID: 'mock-ionicons', ...props });
});
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign',
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'user-1' },
    },
  }),
  useOptionalSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'user-1' },
    },
  }),
}));
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestMicrophonePermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
}));
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// 3. Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      R.createElement('SafeAreaView', props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

// 4. Mock navigation hooks & wallet
const mockInitiateSession = jest.fn().mockResolvedValue({ sessionId: 'mock-session-1' });
jest.mock('@/feature/navigation/hooks/use-navigation', () => ({
  useGetNavigationRoute: jest.fn(),
  useInitiateNavigationSession: jest.fn(() => ({
    mutateAsync: mockInitiateSession,
  })),
}));

const mockConfirmSignPresence = jest.fn().mockResolvedValue({});
jest.mock('@/api/sign-map/sign-map', () => ({
  confirmSignPresence: (...args: any[]) => mockConfirmSignPresence(...args),
}));

jest.mock('@/feature/navigation/hooks/use-signs', () => ({
  useGetSignsAlongRoute: jest.fn(() => ({ data: [] })),
  useGetSignsInBounds: jest.fn(() => ({ data: [] })),
}));

let mockActiveAlert: any = undefined;
jest.mock('@/feature/navigation/hooks/use-sign-proximity-alert', () => ({
  useSignProximityAlert: jest.fn(() => ({ activeAlert: mockActiveAlert })),
}));

jest.mock('@/feature/navigation/hooks/use-saved-routes', () => ({
  useSavedRoutes: jest.fn(() => ({
    savedRoutes: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    saveRoute: jest.fn(),
    isSaving: false,
    updateRoute: jest.fn(),
    isUpdating: false,
    deleteRoute: jest.fn(),
    isDeleting: false,
  })),
}));

jest.mock('@/context/navigation-active-provider', () => ({
  useNavigationActive: jest.fn(() => ({ setNavigationActive: jest.fn() })),
}));

let mockWalletData: any = { wallet: { balance: 100 } };
jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useGetWallet: jest.fn(() => ({ data: mockWalletData, refetch: jest.fn() })),
}));

jest.mock('@/feature/notifications/hooks/use-notifications', () => ({
  useGetUnreadNotificationCount: jest.fn(() => ({ data: 2 })),
}));

jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/feature/saved-routes/hooks/use-saved-routes', () => ({
  useGetSavedRoute: jest.fn(() => ({ data: undefined })),
  useGetSavedRouteSigns: jest.fn(() => ({ data: undefined })),
  useCreateSavedRoute: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useUpdateSavedRoute: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useDeleteSavedRoute: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

// 5. Mock GPS utilities
jest.mock('@/feature/navigation/utils/gps', () => ({
  ensureLocationPermission: jest.fn(),
  fetchFreshGpsPosition: jest.fn(),
  isValidGpsLocation: jest.fn(() => true),
  GPS_UNAVAILABLE_MESSAGE: 'GPS signal unavailable.',
}));

// 6. Mock maplibre native bridge
jest.mock('@/services/maplibre', () => ({
  getMapLibre: jest.fn(() => null),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: jest.fn().mockResolvedValue({
    displayAddress: 'Bitexco Financial Tower',
    roadName: 'Hai Trieu',
  }),
  formatResolvedLocationTitle: jest.fn(() => 'Vị trí hiện tại'),
}));

// 7. Mock NavigationMapView so we can inspect props passed to the map
const mockMapProps: any = {};
jest.mock('@/feature/navigation/components/navigation-map-view', () => ({
  NavigationMapView: (props: any) => {
    Object.assign(mockMapProps, props);
    const R = require('react');
    return R.createElement('NavigationMapView', props);
  },
}));

describe('Navigation Flow: Destination Selection and GPS Start Route', () => {
  const defaultDestinationParams = {
    destinationId: 'dest-bitexco',
    destinationLat: '10.771674',
    destinationLng: '106.704688',
    destinationTitle: 'Bitexco Financial Tower',
    destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockMapProps).forEach((k) => delete mockMapProps[k]);
    (useLocalSearchParams as jest.Mock).mockReturnValue(defaultDestinationParams);
    (useGetNavigationRoute as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it('selects destination: does NOT call route API, passes destination to map without routeStart, and shows Start route button', async () => {
    (ensureLocationPermission as jest.Mock).mockResolvedValue(true);
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.69, 10.76]);

    const { getAllByText, getByText, queryByText, getByLabelText } = await render(<NavigationMapScreen />);

    // 1. Destination card is shown
    expect(getAllByText('Bitexco Financial Tower').length).toBeGreaterThan(0);
    expect(getByText('2 Hai Trieu, Ben Nghe, District 1')).toBeTruthy();
    expect(getByLabelText('Start route')).toBeTruthy();

    // 2. Route planning tabs are NOT shown yet
    expect(queryByText(/Bike|Xe máy/i)).toBeNull();
    expect(queryByText(/Car|Ô tô/i)).toBeNull();

    // 3. Map received destination coordinate, but routeStart is undefined
    expect(mockMapProps.destination).toEqual({
      category: 'recent',
      coordinate: [106.704688, 10.771674],
      id: 'dest-bitexco',
      subtitle: '2 Hai Trieu, Ben Nghe, District 1',
      title: 'Bitexco Financial Tower',
    });
    expect(mockMapProps.routeStart).toBeUndefined();

    // 4. Route API is NOT called with origin
    expect(useGetNavigationRoute).toHaveBeenCalledWith(
      undefined,
      [106.704688, 10.771674],
      'DRIVING',
    );
  });

  it('user clicks "Start route" when GPS is available: sets route origin from GPS and triggers route calculation', async () => {
    (ensureLocationPermission as jest.Mock).mockResolvedValue(true);
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.695, 10.765]);

    const { getByLabelText } = await render(<NavigationMapScreen />);

    const startRouteButton = getByLabelText('Start route');
    fireEvent.press(startRouteButton);

    await waitFor(() => {
      // Route API is called with the GPS position as origin
      expect(useGetNavigationRoute).toHaveBeenCalledWith(
        [106.695, 10.765],
        [106.704688, 10.771674],
        'DRIVING',
      );
    });

    // Map received the GPS coordinates as routeStart
    expect(mockMapProps.routeStart).toEqual([106.695, 10.765]);
    // Did not navigate to starting point screen
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('user clicks "Start route" when GPS permission is denied: requires location permission and does not redirect to start selection', async () => {
    (ensureLocationPermission as jest.Mock).mockResolvedValue(false);

    const { getByLabelText, findAllByText } = await render(<NavigationMapScreen />);

    const startRouteButton = getByLabelText('Start route');
    fireEvent.press(startRouteButton);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/home/start' }),
      );
    });

    const matches = await findAllByText('Cần cấp quyền truy cập vị trí để bắt đầu điều hướng.');
    expect(matches.length).toBeGreaterThan(0);

    // Route API was never called with any origin
    expect(useGetNavigationRoute).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('user clicks "Start route" when GPS fix is unavailable: displays error toast and does not redirect to start selection', async () => {
    (ensureLocationPermission as jest.Mock).mockResolvedValue(true);
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValue(null);

    const { getByLabelText, findAllByText } = await render(<NavigationMapScreen />);

    const startRouteButton = getByLabelText('Start route');
    fireEvent.press(startRouteButton);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/home/start' }),
      );
    });

    const matches = await findAllByText(
      'Không thể lấy vị trí hiện tại của bạn. Vui lòng bật Vị trí/GPS và thử lại.',
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  describe('Vehicle mode switching', () => {
    const mockDrivingRoute = {
      coordinates: [
        [106.698, 10.7725],
        [106.701, 10.772],
        [106.704688, 10.771674],
      ],
      distance: 1200,
      duration: 600,
      steps: [],
      geometry: [],
    };

    const mockBikeRoute = {
      coordinates: [
        [106.698, 10.7725],
        [106.704688, 10.771674],
      ],
      distance: 1000,
      duration: 300,
      steps: [],
      geometry: [],
    };

    it('switches vehicle mode when starting point and destination are selected without GPS: affects routing and estimated time', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...defaultDestinationParams,
        startId: 'start-market',
        startLat: '10.7725',
        startLng: '106.6980',
        startTitle: 'Ben Thanh Market',
      });

      (useGetNavigationRoute as jest.Mock).mockImplementation((origin, dest, mode) => {
        if (!origin || !dest) {
          return { data: undefined, isLoading: false, error: null };
        }
        return {
          data: mode === 'BIKE' ? mockBikeRoute : mockDrivingRoute,
          isLoading: false,
          error: null,
        };
      });

      const { getByLabelText, getAllByText, getByText } = await render(<NavigationMapScreen />);

      // 1. Initial driving route is rendered
      expect(useGetNavigationRoute).toHaveBeenCalledWith(
        [106.698, 10.7725],
        [106.704688, 10.771674],
        'DRIVING',
      );
      expect(mockMapProps.routeStart).toEqual([106.698, 10.7725]);
      expect(mockMapProps.routeCoordinates).toEqual(mockDrivingRoute.coordinates);

      // Initial vehicle tab and header show driving info
      expect(getByText(/Car|Ô tô/i)).toBeTruthy();
      expect(getAllByText(/10 min|10 phút/i).length).toBeGreaterThan(0);
      expect(getByText(/1\.2 km/)).toBeTruthy();

      // 2. Switch vehicle mode to Bike
      const bikeTab = getByLabelText(/Bike route|Tuyến đường xe máy/i);
      fireEvent.press(bikeTab);

      // 3. Route API called with BIKE mode, map coordinates and estimated time update
      await waitFor(() => {
        expect(useGetNavigationRoute).toHaveBeenCalledWith(
          [106.698, 10.7725],
          [106.704688, 10.771674],
          'BIKE',
        );
      });

      expect(mockMapProps.routeCoordinates).toEqual(mockBikeRoute.coordinates);
      expect(getByText(/Bike|Xe máy/i)).toBeTruthy();
      expect(getAllByText(/5 min|5 phút/i).length).toBeGreaterThan(0);
      expect(getByText(/1\.0 km/)).toBeTruthy();

      // 4. Switch back to Car mode
      const carTab = getByLabelText(/Car route|Tuyến đường ô tô/i);
      fireEvent.press(carTab);

      await waitFor(() => {
        expect(useGetNavigationRoute).toHaveBeenCalledWith(
          [106.698, 10.7725],
          [106.704688, 10.771674],
          'DRIVING',
        );
      });

      expect(mockMapProps.routeCoordinates).toEqual(mockDrivingRoute.coordinates);
      expect(getByText(/Car|Ô tô/i)).toBeTruthy();
      expect(getAllByText(/10 min|10 phút/i).length).toBeGreaterThan(0);
    });

    it('switches vehicle mode when starting point and destination are selected with GPS: affects routing and estimated time', async () => {
      (ensureLocationPermission as jest.Mock).mockResolvedValue(true);
      (fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.695, 10.765]);

      (useGetNavigationRoute as jest.Mock).mockImplementation((origin, dest, mode) => {
        if (!origin || !dest) {
          return { data: undefined, isLoading: false, error: null };
        }
        return {
          data: mode === 'BIKE' ? mockBikeRoute : mockDrivingRoute,
          isLoading: false,
          error: null,
        };
      });

      const { getByLabelText, getAllByText, getByText } = await render(<NavigationMapScreen />);

      // Initially route is not calculated until user starts route with GPS
      const startRouteButton = getByLabelText('Start route');
      fireEvent.press(startRouteButton);

      await waitFor(() => {
        expect(useGetNavigationRoute).toHaveBeenCalledWith(
          [106.695, 10.765],
          [106.704688, 10.771674],
          'DRIVING',
        );
      });

      expect(mockMapProps.routeStart).toEqual([106.695, 10.765]);
      expect(mockMapProps.routeCoordinates).toEqual(mockDrivingRoute.coordinates);
      expect(getByText(/Car|Ô tô/i)).toBeTruthy();
      expect(getAllByText(/10 min|10 phút/i).length).toBeGreaterThan(0);
      expect(getByText(/1\.2 km/)).toBeTruthy();

      // Switch vehicle mode to Bike
      const bikeTab = getByLabelText(/Bike route|Tuyến đường xe máy/i);
      fireEvent.press(bikeTab);

      await waitFor(() => {
        expect(useGetNavigationRoute).toHaveBeenCalledWith(
          [106.695, 10.765],
          [106.704688, 10.771674],
          'BIKE',
        );
      });

      expect(mockMapProps.routeCoordinates).toEqual(mockBikeRoute.coordinates);
      expect(getByText(/Bike|Xe máy/i)).toBeTruthy();
      expect(getAllByText(/5 min|5 phút/i).length).toBeGreaterThan(0);
      expect(getByText(/1\.0 km/)).toBeTruthy();
    });
  });

  describe('Navigation Active Session and Interactive Controls', () => {
    const mockActiveRoute = {
      coordinates: [
        [106.698, 10.7725],
        [106.701, 10.772],
        [106.704688, 10.771674],
      ],
      distance: 1200,
      duration: 600,
      steps: [
        {
          maneuver: { type: 'depart', instruction: 'Khởi hành về hướng Đông' },
          instruction: 'Khởi hành về hướng Đông',
          distance: 100,
          duration: 30,
        },
        {
          maneuver: { type: 'turn-right', instruction: 'Rẽ phải vào đường Hai Bà Trưng' },
          instruction: 'Rẽ phải vào đường Hai Bà Trưng',
          distance: 500,
          duration: 150,
        },
      ],
      geometry: [],
    };

    it('starts turn-by-turn navigation, handles map recenter, and stops navigation', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...defaultDestinationParams,
        startId: 'start-market',
        startLat: '10.7725',
        startLng: '106.6980',
        startTitle: 'Ben Thanh Market',
      });
      (ensureLocationPermission as jest.Mock).mockResolvedValue(true);
      (fetchFreshGpsPosition as jest.Mock).mockResolvedValue([106.698, 10.7725]);
      (useGetNavigationRoute as jest.Mock).mockReturnValue({
        data: mockActiveRoute,
        isLoading: false,
        error: null,
      });

      const { getByTestId, queryByTestId } = await render(<NavigationMapScreen />);

      await waitFor(() => {
        expect(getByTestId('btn-start-navigation')).toBeTruthy();
      });

      // 1. Start Navigation
      const startNavBtn = getByTestId('btn-start-navigation');
      await act(async () => {
        fireEvent.press(startNavBtn);
      });

      await waitFor(() => {
        expect(mockInitiateSession).toHaveBeenCalled();
        expect(getByTestId('btn-stop-navigation')).toBeTruthy();
        expect(getByTestId('btn-recenter-map')).toBeTruthy();
      });

      // 2. Press Re-center button
      const recenterBtn = getByTestId('btn-recenter-map');
      await act(async () => {
        fireEvent.press(recenterBtn);
      });

      expect(mockMapProps.focusCoordinate).toBeDefined();

      // 3. Stop Navigation
      const stopNavBtn = getByTestId('btn-stop-navigation');
      await act(async () => {
        fireEvent.press(stopNavBtn);
      });

      await waitFor(() => {
        expect(queryByTestId('btn-stop-navigation')).toBeNull();
        expect(getByTestId('btn-start-navigation')).toBeTruthy();
      });
    });

    it('handles top controls actions: swap route and change destination', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...defaultDestinationParams,
        startId: 'start-market',
        startLat: '10.7725',
        startLng: '106.6980',
        startTitle: 'Ben Thanh Market',
      });
      (useGetNavigationRoute as jest.Mock).mockReturnValue({
        data: mockActiveRoute,
        isLoading: false,
        error: null,
      });

      const { getByTestId, getByLabelText } = await render(<NavigationMapScreen />);

      await waitFor(() => {
        expect(getByTestId('btn-swap-route')).toBeTruthy();
      });

      // Test swap route button
      const swapBtn = getByTestId('btn-swap-route');
      await act(async () => {
        fireEvent.press(swapBtn);
      });

      // Test change destination button
      const changeDestBtn = getByLabelText('Thay đổi điểm đến');
      await act(async () => {
        fireEvent.press(changeDestBtn);
      });

      expect(mockPush).toHaveBeenCalledWith('/home/search');
    });

    it('handles home screen state when no destination is selected', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
      (useGetNavigationRoute as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { getByTestId, getByLabelText } = await render(<NavigationMapScreen />);

      await waitFor(() => {
        expect(getByTestId('btn-search-destination')).toBeTruthy();
      });

      // 1. Search button press
      const searchBtn = getByTestId('btn-search-destination');
      await act(async () => {
        fireEvent.press(searchBtn);
      });
      expect(mockPush).toHaveBeenCalledWith('/home/search');

      // 2. Top-up press
      const topUpBtn = getByLabelText(/Nạp điểm/);
      await act(async () => {
        fireEvent.press(topUpBtn);
      });
      expect(mockPush).toHaveBeenCalledWith('/credits/top-up');

      // 3. Notifications button press
      const notifBtn = getByLabelText(/Thông báo/);
      await act(async () => {
        fireEvent.press(notifBtn);
      });
      expect(mockPush).toHaveBeenCalledWith('/notifications');

      // 4. TTS toggle button press
      const ttsBtn = getByLabelText(/thông báo giọng nói/i);
      await act(async () => {
        fireEvent.press(ttsBtn);
      });

      // 5. Filter card toggle button press
      const filterBtn = getByLabelText(/Mở danh sách lọc biển báo/);
      await act(async () => {
        fireEvent.press(filterBtn);
      });

      // 6. Current location button press
      (fetchFreshGpsPosition as jest.Mock).mockResolvedValueOnce([106.7009, 10.7769]);
      const locationBtn = getByLabelText(/Về vị trí hiện tại/);
      await act(async () => {
        fireEvent.press(locationBtn);
      });
    });

    it('opens bookmark route modal from action sheet', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        ...defaultDestinationParams,
        startId: 'start-market',
        startLat: '10.7725',
        startLng: '106.6980',
        startTitle: 'Ben Thanh Market',
      });
      (useGetNavigationRoute as jest.Mock).mockReturnValue({
        data: mockActiveRoute,
        isLoading: false,
        error: null,
      });

      const { getByTestId } = await render(<NavigationMapScreen />);

      await waitFor(() => {
        expect(getByTestId('btn-bookmark-route')).toBeTruthy();
      });

      const bookmarkBtn = getByTestId('btn-bookmark-route');
      await act(async () => {
        fireEvent.press(bookmarkBtn);
      });
    });
  });
});
