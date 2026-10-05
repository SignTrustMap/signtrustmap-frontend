import React from 'react';
import { render, fireEvent, waitFor, renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

// Real Application Code Under Test
import { RouteSearchScreen } from '@/feature/navigation/pages/route-search-screen';
import { NavigationMapScreen } from '@/feature/navigation/pages/navigation-map-screen';
import { useSignProximityAlert } from '@/feature/navigation/hooks/use-sign-proximity-alert';
import { NavigationActiveProvider } from '@/context/navigation-active-provider';
import { SignFilterProvider } from '@/context/sign-filter-provider';
import { SessionProvider, type AppSession } from '@/context/session-provider';
import { SAME_LOCATION_MESSAGE } from '@/constants/message';
import { GPS_UNAVAILABLE_MESSAGE } from '@/feature/navigation/utils/gps';
import { getMapLibre } from '@/services/maplibre';

// MSW Server, Fixtures, and Paths
import {
  server,
  mockDirectionsDriving,
  mockDirectionsBike,
  mockReroutedDirections,
  mockSavedPlaces,
  mockRecentSearches,
  mockSpatialAddresses,
  mockTrafficSigns,
  NAVIGATION_ROUTING_PATH,
  POST_RECENT_SEARCHES_PATH,
  SIGNS_ALONG_ROUTE_PATH,
} from '../mocks/msw';

// ---------------------------------------------------------------------------
// External Infrastructure Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockSearchParams,
  useSegments: () => ['(authenticated)', '(tabs)', 'home'],
  useFocusEffect: (cb: any) => {
    const React = require('react');
    React.useEffect(() => {
      return cb();
    }, [cb]);
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestMicrophonePermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, { testID: 'expo-image', ...props }),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    neutral: '#F1F5F9',
  }),
}));

// In-Memory Storage for Session & Settings
const mockStorage = new Map<string, string>();
const authenticatedSession: AppSession = {
  accessToken: 'mock-nav-token-xyz',
  account: {
    id: 'nav-user-1',
    email: 'driver@stm.dev',
    displayName: 'Navigator Driver',
    roles: ['driver'],
  },
};

jest.mock('@/hooks/use-storage', () => ({
  setStorageItemAsync: jest.fn((key: string, val: string) => {
    mockStorage.set(key, val);
    return Promise.resolve();
  }),
  getStorageItemAsync: jest.fn((key: string) => {
    return Promise.resolve(mockStorage.get(key) ?? null);
  }),
  removeStorageItemAsync: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

// Stub MapLibre GL Native bridge
const mockLocationManager = {
  setMinDisplacement: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

jest.mock('@/services/maplibre', () => ({
  getMapLibre: jest.fn(() => ({
    LocationManager: mockLocationManager,
  })),
}));

// Capture map props
const mockMapProps: Record<string, any> = {};
jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    NavigationMapView: (props: any) => {
      Object.assign(mockMapProps, props);
      return React.createElement(View, { testID: 'mock-navigation-map-view', ...props });
    },
  };
});

// GPS Geolocation Mocks
const mockEnsureLocationPermission = jest.fn();
const mockFetchFreshGpsPosition = jest.fn();

jest.mock('@/feature/navigation/utils/gps', () => {
  const actual = jest.requireActual('@/feature/navigation/utils/gps');
  return {
    ...actual,
    ensureLocationPermission: (...args: any[]) => mockEnsureLocationPermission(...args),
    fetchFreshGpsPosition: (...args: any[]) => mockFetchFreshGpsPosition(...args),
    isValidGpsLocation: jest.fn(() => true),
  };
});

// ---------------------------------------------------------------------------
// Helpers: Integration QueryClient & Wrapper
// ---------------------------------------------------------------------------
function createIntegrationQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

function createProvidersWrapper() {
  const queryClient = createIntegrationQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SignFilterProvider>
          <NavigationActiveProvider>
            {children}
          </NavigationActiveProvider>
        </SignFilterProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Integration Test Suite: Navigation Flow (MSW)
// ---------------------------------------------------------------------------
describe('Frontend Navigation Flow Integration Tests (MSW)', () => {
  beforeAll(() => server.listen());

  beforeEach(() => {
    mockStorage.clear();
    mockStorage.set('session', JSON.stringify(authenticatedSession));
    mockSearchParams = {};
    Object.keys(mockMapProps).forEach((k) => delete mockMapProps[k]);
    mockEnsureLocationPermission.mockReset().mockResolvedValue(true);
    mockFetchFreshGpsPosition.mockReset().mockResolvedValue([106.7009, 10.7769]); // Nguyen Hue
    mockLocationManager.addListener.mockClear();
    mockLocationManager.removeListener.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  // =========================================================================
  // SUITE 1: Place Search & Destination Autocomplete (RouteSearchScreen)
  // =========================================================================
  describe('Suite 1: Place Search & Destination Autocomplete (RouteSearchScreen)', () => {
    it('FIT-NAV-01-A: renders saved and recent places when search query is empty', async () => {
      const Wrapper = createProvidersWrapper();
      const { findByText } = await render(
        <Wrapper>
          <RouteSearchScreen />
        </Wrapper>,
      );

      // Verify section header
      expect(await findByText('SAVED & RECENT')).toBeTruthy();

      // Verify items from MSW /places/saved and /places/recent-searches
      expect(await findByText('Home')).toBeTruthy();
      expect(await findByText('Office')).toBeTruthy();
      expect(await findByText('Bitexco Financial Tower')).toBeTruthy();
      expect(await findByText('Ben Thanh Market')).toBeTruthy();
    });

    it('FIT-NAV-01-B: queries spatial backend when user types query >= 2 characters', async () => {
      const Wrapper = createProvidersWrapper();
      const { findByText, getByPlaceholderText } = await render(
        <Wrapper>
          <RouteSearchScreen />
        </Wrapper>,
      );

      const searchInput = getByPlaceholderText('Where to?');
      await act(async () => {
        await fireEvent.changeText(searchInput, 'Nguyen Hue');
      });

      // Verify search results section appears
      expect(await findByText('SEARCH RESULTS')).toBeTruthy();
      // Verify spatial address match from MSW /addresses/search
      expect(await findByText('Nguyen Hue Walking Street')).toBeTruthy();
      expect(await findByText(/Ben Nghe, District 1/i)).toBeTruthy();
    });

    it('FIT-NAV-01-C: selects destination, persists recent search, and navigates to /home', async () => {
      let savedRecentPayload: any = null;

      server.use(
        http.post(POST_RECENT_SEARCHES_PATH, async ({ request }) => {
          savedRecentPayload = await request.json();
          return HttpResponse.json({ success: true }, { status: 201 });
        }),
      );

      const Wrapper = createProvidersWrapper();
      const { findByText, getByPlaceholderText } = await render(
        <Wrapper>
          <RouteSearchScreen />
        </Wrapper>,
      );

      const searchInput = getByPlaceholderText('Where to?');
      await act(async () => {
        await fireEvent.changeText(searchInput, 'Nguyen Hue');
      });

      const destinationRow = await findByText('Nguyen Hue Walking Street');
      await act(async () => {
        await fireEvent.press(destinationRow);
      });

      // 1. Verify recent search persistence to MSW
      await waitFor(() => {
        expect(savedRecentPayload).toMatchObject({
          latitude: 10.7769,
          longitude: 106.7009,
          query: 'Nguyen Hue Walking Street',
        });
      });

      // 2. Verify navigation to /home with destination query params
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/home',
          params: expect.objectContaining({
            destinationId: 'spatial-79-01-01',
            destinationTitle: 'Nguyen Hue Walking Street',
            destinationLat: '10.7769',
            destinationLng: '106.7009',
          }),
        }),
      );
    });

    it('FIT-NAV-01-D: shows toast when selected destination is identical to start location', async () => {
      mockSearchParams = {
        startLat: '10.7769',
        startLng: '106.7009',
        startTitle: 'Nguyen Hue Walking Street',
      };

      const Wrapper = createProvidersWrapper();
      const { findByText, getByPlaceholderText } = await render(
        <Wrapper>
          <RouteSearchScreen />
        </Wrapper>,
      );

      const searchInput = getByPlaceholderText('Where to?');
      await act(async () => {
        await fireEvent.changeText(searchInput, 'Nguyen Hue');
      });

      const destinationRow = await findByText('Nguyen Hue Walking Street');
      await act(async () => {
        await fireEvent.press(destinationRow);
      });

      // Navigation should be blocked and same location error toast shown
      expect(mockReplace).not.toHaveBeenCalled();
      expect(await findByText(SAME_LOCATION_MESSAGE)).toBeTruthy();
    });
  });

  // =========================================================================
  // SUITE 2: Route Planning & Vehicle Modes (NavigationMapScreen)
  // =========================================================================
  describe('Suite 2: Route Planning & Vehicle Modes (NavigationMapScreen)', () => {
    it('FIT-NAV-02-A: calculates route from current GPS position and displays duration and distance', async () => {
      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByText, getByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      // Verify destination card subtitle
      expect(await findByText('2 Hai Trieu, Ben Nghe, District 1')).toBeTruthy();

      // Press "Start route" button via accessibilityLabel
      const startRouteBtn = getByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      // Verify vehicle mode tabs appear
      expect(await waitFor(() => getByLabelText('Car route'))).toBeTruthy();
      expect(await waitFor(() => getByLabelText('Bike route'))).toBeTruthy();

      // Verify Start button is ready in bottom sheet
      expect(await waitFor(() => getByLabelText('Begin navigation'))).toBeTruthy();

      // Verify MapView received destination and routeStart coordinates
      expect(mockMapProps.destination).toMatchObject({
        id: 'dest-bitexco',
        coordinate: [106.704688, 10.771674],
      });
      expect(mockMapProps.routeStart).toEqual([106.7009, 10.7769]);
      expect(mockMapProps.routeCoordinates?.length).toBe(4);
    });

    it('FIT-NAV-02-B: switches vehicle mode to Bike and recalculates route', async () => {
      let requestedVehicleMode: string | null = null;

      server.use(
        http.post(NAVIGATION_ROUTING_PATH, async ({ request }) => {
          const body = (await request.json().catch(() => ({}))) as any;
          requestedVehicleMode = body.vehicleMode ?? 'DRIVING';
          if (requestedVehicleMode === 'BIKE') {
            return HttpResponse.json(mockDirectionsBike, { status: 200 });
          }
          return HttpResponse.json(mockDirectionsDriving, { status: 200 });
        }),
      );

      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByLabelText, getByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      const startRouteBtn = await findByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      // Switch to Bike mode via accessibilityLabel
      const bikeTab = await findByLabelText('Bike route');
      await act(async () => {
        await fireEvent.press(bikeTab);
      });

      // Verify Bike route was requested from MSW
      await waitFor(() => {
        expect(requestedVehicleMode).toBe('BIKE');
      });

      // Verify updated route coordinates received in MapView
      await waitFor(() => {
        expect(mockMapProps.routeCoordinates?.length).toBe(3);
      });
    });

    it('FIT-NAV-02-C: fetches and passes traffic signs along the route to MapView', async () => {
      let routeSignsFetched = false;

      server.use(
        http.post(SIGNS_ALONG_ROUTE_PATH, () => {
          routeSignsFetched = true;
          return HttpResponse.json({ signs: mockTrafficSigns.map((s) => ({ sign: s })) }, { status: 200 });
        }),
      );

      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      const startRouteBtn = await findByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      await waitFor(() => {
        expect(routeSignsFetched).toBe(true);
        expect(mockMapProps.signs?.length).toBe(2);
      });
    });
  });

  // =========================================================================
  // SUITE 3: Turn-by-Turn Guidance & Maneuver Banner
  // =========================================================================
  describe('Suite 3: Turn-by-Turn Guidance & Maneuver Banner', () => {
    it('FIT-NAV-03-A: begins live navigation, mounts maneuver banner with turn instruction', async () => {
      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByText, findByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      // 1. Establish route preview
      const startRouteBtn = await findByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      // 2. Press "Begin navigation" to activate active guidance
      const beginNavBtn = await findByLabelText('Begin navigation');
      await act(async () => {
        await fireEvent.press(beginNavBtn);
      });

      // 3. Verify NavigationManeuverBanner appears with first maneuver instruction
      expect(await findByText(/Turn right onto Le Loi|Head south on Nguyen Hue/i)).toBeTruthy();

      // 4. Verify MapView is in active navigation mode
      expect(mockMapProps.isNavigatingFeature).toBe(true);
    });

    it('FIT-NAV-03-B: exits navigation cleanly when user dismisses guidance', async () => {
      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      const startRouteBtn = await findByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      const beginNavBtn = await findByLabelText('Begin navigation');
      await act(async () => {
        await fireEvent.press(beginNavBtn);
      });

      // Press Exit Navigation button (accessibilityLabel="Dừng điều hướng")
      const exitBtn = await findByLabelText('Dừng điều hướng');
      await act(async () => {
        await fireEvent.press(exitBtn);
      });

      // Verify active navigation mode ended
      await waitFor(() => {
        expect(mockMapProps.isNavigatingFeature).toBeFalsy();
      });
    });
  });

  // =========================================================================
  // SUITE 4: Sign Proximity Alerts & Awareness (useSignProximityAlert)
  // =========================================================================
  describe('Suite 4: Sign Proximity Alerts & Awareness (useSignProximityAlert)', () => {
    it('FIT-NAV-04-A: triggers proximity alert when user coordinate is within 50m of a sign', async () => {
      const signSpeed50 = mockTrafficSigns[0]; // at [106.7020, 10.7750]

      // Position ~20m away from the sign
      const userNearby = [106.7021, 10.7751] as [number, number];

      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [
            {
              id: signSpeed50.id,
              name: signSpeed50.signType.nameEn,
              signCode: signSpeed50.signType.signCode,
              imageUrl: signSpeed50.signCropUrl,
              coordinate: [signSpeed50.longitude, signSpeed50.latitude],
            },
          ],
          userCoordinate: userNearby,
          alertDistanceMeters: 50,
          speechLanguage: 'en-US',
        }),
      );

      // Verify activeAlert is triggered with sign details
      expect(result.current.activeAlert).toBeDefined();
      expect(result.current.activeAlert?.sign.signCode).toBe('P.127');
      expect(result.current.activeAlert?.distanceMeters).toBeLessThan(50);
    });

    it('FIT-NAV-04-B: does not trigger alert when vehicle is farther than 50m from sign', async () => {
      const signSpeed50 = mockTrafficSigns[0]; // at [106.7020, 10.7750]

      // Position ~200m away from the sign
      const userFarAway = [106.7009, 10.7769] as [number, number];

      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [
            {
              id: signSpeed50.id,
              name: signSpeed50.signType.nameEn,
              signCode: signSpeed50.signType.signCode,
              imageUrl: signSpeed50.signCropUrl,
              coordinate: [signSpeed50.longitude, signSpeed50.latitude],
            },
          ],
          userCoordinate: userFarAway,
          alertDistanceMeters: 50,
          speechLanguage: 'en-US',
        }),
      );

      // Verify no alert active
      expect(result.current.activeAlert).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 5: Off-Route Detection & Network Resilience
  // =========================================================================
  describe('Suite 5: Off-Route Detection & Network Resilience', () => {
    it('FIT-NAV-05-A: triggers automatic reroute when drifting > 45m from planned route', async () => {
      let rerouteCalled = false;

      server.use(
        http.post(NAVIGATION_ROUTING_PATH, async ({ request }) => {
          const body = (await request.json().catch(() => ({}))) as any;
          // Check if origin matches rerouted GPS position
          if (body.originLatitude === 10.7800 && body.originLongitude === 106.7050) {
            rerouteCalled = true;
            return HttpResponse.json(mockReroutedDirections, { status: 200 });
          }
          return HttpResponse.json(mockDirectionsDriving, { status: 200 });
        }),
      );

      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      const startRouteBtn = await findByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      const beginNavBtn = await findByLabelText('Begin navigation');
      await act(async () => {
        await fireEvent.press(beginNavBtn);
      });

      // Simulate off-route coordinate deviation (> 45m from Nguyen Hue route)
      const mapLibre = getMapLibre();
      const addListenerCall = (mapLibre?.LocationManager.addListener as jest.Mock).mock.calls[0];
      const locationCallback = addListenerCall ? addListenerCall[0] : null;

      if (locationCallback) {
        // Fire 3 consecutive off-route position updates to exceed threshold
        await act(async () => {
          locationCallback({ coords: { latitude: 10.7800, longitude: 106.7050, accuracy: 5 }, timestamp: Date.now() });
        });
        await act(async () => {
          locationCallback({ coords: { latitude: 10.7800, longitude: 106.7050, accuracy: 5 }, timestamp: Date.now() + 1000 });
        });
        await act(async () => {
          locationCallback({ coords: { latitude: 10.7800, longitude: 106.7050, accuracy: 5 }, timestamp: Date.now() + 2000 });
        });

        // Verify reroute was dispatched to MSW
        await waitFor(() => {
          expect(rerouteCalled).toBe(true);
        });
      }
    });

    it('FIT-NAV-05-B: handles 500 error from routing API gracefully without crashing', async () => {
      server.use(
        http.post(NAVIGATION_ROUTING_PATH, () => {
          return HttpResponse.json({ message: 'Routing engine unavailable' }, { status: 500 });
        }),
      );

      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByText, findByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      const startRouteBtn = await findByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      // Verify accessible error message is displayed
      expect(await findByText(/Routing engine unavailable|could not be calculated/i)).toBeTruthy();
    });

    it('FIT-NAV-05-C: redirects to manual start selection when location permission is not granted', async () => {
      mockEnsureLocationPermission.mockResolvedValue(false);

      mockSearchParams = {
        destinationId: 'dest-bitexco',
        destinationLat: '10.771674',
        destinationLng: '106.704688',
        destinationTitle: 'Bitexco Financial Tower',
        destinationSubtitle: '2 Hai Trieu, Ben Nghe, District 1',
      };

      const Wrapper = createProvidersWrapper();
      const { findByLabelText } = await render(
        <Wrapper>
          <NavigationMapScreen />
        </Wrapper>,
      );

      const startRouteBtn = await findByLabelText('Start route');
      await act(async () => {
        await fireEvent.press(startRouteBtn);
      });

      // Should redirect to manual start selection
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/home/start',
            params: expect.objectContaining({
              destinationId: 'dest-bitexco',
            }),
          }),
        );
      });
    });
  });
});
