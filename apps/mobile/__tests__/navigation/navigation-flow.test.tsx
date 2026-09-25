import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationMapScreen } from '@/feature/navigation/pages/navigation-map-screen';
import { useGetNavigationRoute } from '@/feature/navigation/hooks/use-navigation';
import { ensureLocationPermission, fetchFreshGpsPosition } from '@/feature/navigation/utils/gps';
import { useRouter, useLocalSearchParams } from 'expo-router';

// 1. Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    canGoBack: () => true,
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(),
}));

// 2. Mock vector icons and expo UI modules
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
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
jest.mock('@/feature/navigation/hooks/use-navigation', () => ({
  useGetNavigationRoute: jest.fn(),
}));

jest.mock('@/feature/navigation/hooks/use-signs', () => ({
  useGetSignsAlongRoute: jest.fn(() => ({ data: [] })),
  useGetSignsInBounds: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/feature/navigation/hooks/use-sign-proximity-alert', () => ({
  useSignProximityAlert: jest.fn(() => ({ activeAlert: undefined })),
}));

jest.mock('@/context/navigation-active-provider', () => ({
  useNavigationActive: jest.fn(() => ({ setNavigationActive: jest.fn() })),
}));

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useGetWallet: jest.fn(() => ({ data: undefined })),
}));

jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: jest.fn(() => ({ data: [] })),
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

    const { getAllByText, getByText, queryByText } = await render(<NavigationMapScreen />);

    // 1. Destination card is shown
    expect(getAllByText('Bitexco Financial Tower').length).toBeGreaterThan(0);
    expect(getByText('2 Hai Trieu, Ben Nghe, District 1')).toBeTruthy();
    expect(getByText('Start route')).toBeTruthy();

    // 2. Route planning tabs are NOT shown yet
    expect(queryByText('Bike')).toBeNull();
    expect(queryByText('Car')).toBeNull();

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

    const { getByText } = await render(<NavigationMapScreen />);

    const startRouteButton = getByText('Start route');
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

  it('user clicks "Start route" when GPS permission is denied: redirects to starting point selection screen', async () => {
    (ensureLocationPermission as jest.Mock).mockResolvedValue(false);

    const { getByText } = await render(<NavigationMapScreen />);

    const startRouteButton = getByText('Start route');
    fireEvent.press(startRouteButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/home/start',
        params: {
          destinationId: 'dest-bitexco',
          destinationLat: '10.771674',
          destinationLng: '106.704688',
          destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
          destinationTitle: 'Bitexco Financial Tower',
        },
      });
    });

    // Route API was never called with any origin
    expect(useGetNavigationRoute).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('user clicks "Start route" when GPS fix is unavailable: redirects to starting point selection screen', async () => {
    (ensureLocationPermission as jest.Mock).mockResolvedValue(true);
    (fetchFreshGpsPosition as jest.Mock).mockResolvedValue(null);

    const { getByText } = await render(<NavigationMapScreen />);

    const startRouteButton = getByText('Start route');
    fireEvent.press(startRouteButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/home/start',
        params: {
          destinationId: 'dest-bitexco',
          destinationLat: '10.771674',
          destinationLng: '106.704688',
          destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
          destinationTitle: 'Bitexco Financial Tower',
        },
      });
    });
  });
});
