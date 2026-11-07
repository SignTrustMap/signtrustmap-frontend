import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      canGoBack: mockCanGoBack,
    }),
    useLocalSearchParams: () => ({
      destinationId: 'dest-1',
      destinationLat: '10.7769',
      destinationLng: '106.7009',
      destinationTitle: 'Chợ Bến Thành',
      destinationSubtitle: 'Quận 1, TP.HCM',
    }),
    useFocusEffect: (cb: any) => {
      React.useEffect(() => {
        cb();
      }, []);
    },
  };
});

jest.mock('expo-symbols', () => {
  const { View } = require('react-native');
  return {
    SymbolView: (props: any) => <View testID="symbol-view" {...props} />,
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`ant-icon-${props.name}`} {...props} />;
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'u-1' },
    },
  }),
  useOptionalSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'u-1' },
    },
  }),
}));

jest.mock('@/feature/navigation/hooks/use-navigation', () => ({
  useGetNavigationSessions: () => ({
    data: {
      items: [
        {
          id: 'session-1',
          originName: 'Nhà',
          destinationName: 'Công ty',
          origin: { coordinates: [106.7, 10.7] },
          destination: { coordinates: [106.71, 10.78] },
          distanceMeters: 2500,
          durationSeconds: 600,
          vehicleMode: 'MOTORCYCLE',
          status: 'COMPLETED',
        },
      ],
      total: 1,
      totalPages: 1,
    },
    isLoading: false,
    isFetching: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: () => ({
    data: [
      { id: 'p-1', title: 'Địa điểm 1', address: '123 Đường ABC', longitude: 106.7, latitude: 10.7 },
      { id: 'p-2', title: 'Địa điểm 2', address: '456 Đường XYZ', longitude: 106.8, latitude: 10.8 },
    ],
    isLoading: false,
    error: null,
  }),
  useSaveRecentPlace: () => ({
    mutate: jest.fn(),
  }),
}));

jest.mock('@/feature/navigation/hooks/use-saved-routes', () => ({
  useSavedRoutes: () => ({
    savedRoutes: [
      {
        id: 'sr-1',
        originName: 'Nhà',
        destinationName: 'Công ty',
        originLatitude: 10.7,
        originLongitude: 106.7,
        destinationLatitude: 10.78,
        destinationLongitude: 106.71,
        vehicleMode: 'MOTORCYCLE',
      },
    ],
    refetch: jest.fn(),
  }),
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetSignEvidences: () => ({ data: [], isLoading: false }),
  useGetTaskEvidences: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: jest.fn().mockResolvedValue({ title: 'Vị trí đã định vị' }),
  formatResolvedLocationTitle: jest.fn().mockReturnValue('Vị trí đã định vị'),
}));

jest.mock('@/services/offline-map-service', () => ({
  offlineMapService: {
    loadMetadata: jest.fn().mockResolvedValue({ installedPacks: {}, activePackId: null }),
    fetchAvailablePacks: jest.fn().mockResolvedValue([]),
    subscribeToProgress: jest.fn(() => () => {}),
    subscribeToMetadata: jest.fn(() => () => {}),
    deleteMapPack: jest.fn().mockResolvedValue(undefined),
    setActivePack: jest.fn().mockResolvedValue(undefined),
    getActiveOfflinePack: jest.fn().mockResolvedValue(null),
  },
  formatBytes: (bytes: number) => `${bytes} B`,
}));

jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => null,
  isMapLibreAvailable: () => false,
}));

jest.mock('maplibre-gl', () => {
  const mockRemove = jest.fn();
  const mockOn = jest.fn();
  const mockOff = jest.fn();
  const mockFlyTo = jest.fn();
  const mockEaseTo = jest.fn();
  const mockAddControl = jest.fn();
  const mockGetBounds = jest.fn().mockReturnValue({
    getSouth: () => 10.7,
    getWest: () => 106.6,
    getNorth: () => 10.8,
    getEast: () => 106.7,
  });

  class MockMap {
    addControl = mockAddControl;
    on = mockOn;
    off = mockOff;
    flyTo = mockFlyTo;
    easeTo = mockEaseTo;
    getBounds = mockGetBounds;
    loaded = () => true;
    isStyleLoaded = () => true;
    once = jest.fn();
    fitBounds = jest.fn();
    remove = mockRemove;
    getLayer = jest.fn().mockReturnValue(null);
    getSource = jest.fn().mockReturnValue(null);
    addLayer = jest.fn();
    addSource = jest.fn();
    removeLayer = jest.fn();
    removeSource = jest.fn();
  }

  class MockMarker {
    setLngLat = jest.fn().mockReturnThis();
    addTo = jest.fn().mockReturnThis();
    remove = jest.fn();
  }

  class MockNavigationControl {}

  return {
    Map: MockMap,
    Marker: MockMarker,
    NavigationControl: MockNavigationControl,
  };
}, { virtual: true });

// Mock browser document for .web component in node environment
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: (tag: string) => ({
      style: {},
      appendChild: jest.fn(),
      addEventListener: jest.fn(),
      setAttribute: jest.fn(),
      tagName: tag.toUpperCase(),
    }),
  };
}

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
    grey: '#94A3B8',
    greyLight: '#F1F5F9',
  }),
}));

jest.mock('@/hooks/use-work-route', () => ({
  useWorkRoute: () => ({
    driverWorkRoute: '/work/driver',
  }),
}));

jest.mock('@/hooks/use-back-button', () => ({
  useBackButton: jest.fn(),
}));

import {
  NavigationHistoryScreen,
  extractCoordinate,
} from '@/feature/navigation/pages/navigation-history-screen';
import { NavigationStartScreen } from '@/feature/navigation/pages/navigation-start-screen';
import { RouteSearchScreen } from '@/feature/navigation/pages/route-search-screen';
import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view';
import { NavigationMapView as NavigationMapViewWeb } from '@/feature/navigation/components/navigation-map-view.web';

describe('Navigation Screens and Map Views', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NavigationHistoryScreen & extractCoordinate', () => {
    it('extractCoordinate handles various coordinate inputs correctly', () => {
      expect(extractCoordinate(null)).toBeNull();
      expect(extractCoordinate({ coordinates: [106.7, 10.7] })).toEqual({
        longitude: 106.7,
        latitude: 10.7,
      });
      expect(extractCoordinate([106.7, 10.7])).toEqual({
        longitude: 106.7,
        latitude: 10.7,
      });
      expect(extractCoordinate({ latitude: 10.7, longitude: 106.7 })).toEqual({
        latitude: 10.7,
        longitude: 106.7,
      });
      expect(extractCoordinate(undefined, 10.7, 106.7)).toEqual({
        latitude: 10.7,
        longitude: 106.7,
      });
      expect(extractCoordinate(undefined, 'invalid', 'invalid')).toBeNull();
    });

    it('renders NavigationHistoryScreen with trip card and allows re-navigation', async () => {
      const { getByText, getByLabelText } = await render(<NavigationHistoryScreen />);

      expect(getByText('Lịch sử di chuyển')).toBeTruthy();
      expect(getByText('1 chuyến đi đã ghi nhận')).toBeTruthy();
      expect(getByText('Xe máy')).toBeTruthy();

      const tripCard = getByLabelText(/Lộ trình từ .* đến .*\. Nhấn để mở lộ trình/);
      fireEvent.press(tripCard);

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(authenticated)/(tabs)/home',
          params: expect.objectContaining({
            destinationLat: '10.78',
            destinationLng: '106.71',
            vehicleMode: 'BIKE',
          }),
        })
      );
    });
  });

  describe('NavigationStartScreen', () => {
    it('renders NavigationStartScreen with header, destination, and place suggestions', async () => {
      const { getByText, getByPlaceholderText } = await render(<NavigationStartScreen />);

      expect(getByText('Chợ Bến Thành')).toBeTruthy();
      expect(getByPlaceholderText('Chọn điểm xuất phát...')).toBeTruthy();
      expect(getByText('Vị trí hiện tại')).toBeTruthy();
      expect(getByText('Địa điểm 1')).toBeTruthy();
    });
  });

  describe('RouteSearchScreen', () => {
    it('renders RouteSearchScreen with search input, suggested places, and saved routes', async () => {
      const { getByText, getByPlaceholderText, getAllByText } = await render(<RouteSearchScreen />);

      expect(getByPlaceholderText('Bạn muốn đi đâu?')).toBeTruthy();
      expect(getByText('Địa điểm 1')).toBeTruthy();
      expect(getAllByText('Nhà ➔ Công ty').length).toBeGreaterThan(0);

      // Tap saved route item
      const savedRouteItem = getAllByText('Nhà ➔ Công ty')[0];
      fireEvent.press(savedRouteItem);

      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/home',
          params: expect.objectContaining({
            savedRouteId: 'sr-1',
            vehicleMode: 'BIKE',
          }),
        })
      );
    });
  });

  describe('NavigationMapView (Native & Web)', () => {
    it('renders fallback in NavigationMapView when native MapLibre binary is unavailable', async () => {
      const { getByText } = await render(
        <NavigationMapView focusCoordinate={[106.7009, 10.7769]} />
      );

      expect(getByText('Yêu cầu bản build ứng dụng hỗ trợ bản đồ')).toBeTruthy();
    });

    it('renders NavigationMapViewWeb on web platform', async () => {
      const { toJSON } = await render(
        <NavigationMapViewWeb
          focusCoordinate={[106.7009, 10.7769]}
          routeCoordinates={[[106.7, 10.7], [106.8, 10.8]]}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });
});
