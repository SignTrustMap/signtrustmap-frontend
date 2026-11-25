import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import { View } from 'react-native';

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

const mockSetStop = jest.fn();

const mockMapLibre = {
  Map: ({ children, testID = 'maplibre-map', ...props }: any) => (
    <View testID={testID} {...props}>
      {children}
    </View>
  ),
  Camera: React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      setStop: mockSetStop,
    }));
    return <View testID="maplibre-camera" {...props} />;
  }),
  GeoJSONSource: ({ children, testID = 'maplibre-geojson-source', ...props }: any) => (
    <View testID={testID} {...props}>
      {children}
    </View>
  ),
  Layer: (props: any) => <View testID={`maplibre-layer-${props.id}`} {...props} />,
  Marker: ({ children, testID, id, ...props }: any) => (
    <View testID={testID || `maplibre-marker-${id || 'default'}`} {...props}>
      {children}
    </View>
  ),
  UserLocation: (props: any) => <View testID="maplibre-user-location" {...props} />,
};

jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => mockMapLibre,
  isMapLibreAvailable: () => true,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
}));

let mockActiveOfflinePack: any = null;
jest.mock('@/services/offline-map-service', () => ({
  offlineMapService: {
    getActiveOfflinePack: jest.fn(() => Promise.resolve(mockActiveOfflinePack)),
    subscribeToMetadata: jest.fn(() => () => {}),
    subscribeToProgress: jest.fn(() => () => {}),
  },
}));

let mockTaskEvidences: any[] = [];
let mockSignEvidences: any[] = [];
jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetTaskEvidences: () => ({ data: mockTaskEvidences }),
  useGetSignEvidences: () => ({ data: mockSignEvidences }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
  }),
}));

import { NavigationMapView, getSignFreshness } from '@/feature/navigation/components/navigation-map-view';
import type { RouteSign } from '@/api/navigation/navigation';

describe('NavigationMapView Component with Native MapLibre', () => {
  const sampleSigns: RouteSign[] = [
    {
      id: 'sign-1',
      coordinate: [106.701, 10.777],
      name: 'Biển cấm đỗ',
      signCode: 'P.131',
      freshnessScore: 0.9,
      status: 'VERIFIED',
      imageUrl: 'https://example.com/sign1.png',
      actualCropUrl: 'https://example.com/crop1.png',
    },
    {
      id: 'sign-2',
      coordinate: [106.702, 10.778],
      name: 'Biển nguy hiểm',
      signCode: 'W.201',
      freshnessScore: 0.3,
      status: 'NEEDS_REVALIDATION',
      imageUrl: 'https://example.com/sign2.png',
    },
  ];

  beforeEach(() => {
    mockActiveOfflinePack = null;
    mockTaskEvidences = [];
    mockSignEvidences = [];
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
    jest.clearAllMocks();
  });

  it('renders Map and Camera focused on destination coordinate', async () => {
    const screen = await render(
      <NavigationMapView
        destination={{
          id: 'dest-1',
          title: 'Chợ Bến Thành',
          subtitle: 'Quận 1',
          category: 'recent',
          coordinate: [106.6983, 10.7725],
        }}
        showFocusPin
      />
    );

    expect(screen.getByTestId('maplibre-map')).toBeTruthy();
    expect(screen.getByTestId('maplibre-camera')).toBeTruthy();
    expect(screen.getByTestId('map-destination-pin')).toBeTruthy();
  });

  it('renders route polylines and GeoJSONSource when routeCoordinates are provided', async () => {
    const routeCoords: [number, number][] = [
      [106.7009, 10.7769],
      [106.7015, 10.7775],
      [106.7025, 10.7785],
    ];

    const screen = await render(
      <NavigationMapView
        routeCoordinates={routeCoords}
        routeStart={[106.7009, 10.7769]}
        vehicleMode="MOTORCYCLE"
      />
    );

    expect(screen.getByTestId('maplibre-map')).toBeTruthy();
    expect(screen.getByTestId('maplibre-geojson-source')).toBeTruthy();
    expect(screen.getByTestId('maplibre-layer-selected-route-line-motorcycle')).toBeTruthy();
    expect(screen.getByTestId('maplibre-layer-selected-route-casing-motorcycle')).toBeTruthy();
  });

  it('renders traffic signs and selects a sign to show callout with destination present', async () => {
    const onSignSelect = jest.fn();
    const screen = await render(
      <NavigationMapView
        destination={{
          id: 'dest-1',
          title: 'Điểm đến',
          subtitle: 'Địa chỉ',
          category: 'recent',
          coordinate: [106.705, 10.78],
        }}
        onSignSelect={onSignSelect}
        signs={sampleSigns}
      />
    );

    const signButton = screen.getByLabelText('Xem chi tiết cho Biển cấm đỗ');
    expect(signButton).toBeTruthy();

    await act(async () => {
      fireEvent.press(signButton);
    });

    expect(onSignSelect).toHaveBeenCalledWith(sampleSigns[0]);
    expect(screen.getByText('Biển cấm đỗ')).toBeTruthy();
  });

  it('opens non-modal SignDetailsBottomSheet when sign is selected without destination, previews image, and closes', async () => {
    mockSignEvidences = [
      { id: 'ev-1', mediaUrl: 'https://example.com/ev1.jpg', createdAt: '2026-03-01T10:00:00Z' },
    ];

    const screen = await render(
      <NavigationMapView
        signs={sampleSigns}
      />
    );

    const signButton = screen.getByLabelText('Xem chi tiết cho Biển cấm đỗ');
    await act(async () => {
      fireEvent.press(signButton);
    });

    expect(screen.getByText(/Biển cấm đỗ/)).toBeTruthy();

    // Tap on image in carousel to open fullscreen preview
    const previewThumbnail = screen.getByLabelText('Xem ảnh Ảnh tái thẩm định');
    await act(async () => {
      fireEvent.press(previewThumbnail);
    });

    const closePreviewBtn = screen.getByLabelText('Đóng xem ảnh');
    expect(closePreviewBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(closePreviewBtn);
    });

    // Close bottom sheet
    const closeBtn = screen.getByTestId('mc-icon-close');
    await act(async () => {
      fireEvent.press(closeBtn);
    });
  });

  it('renders empty carousel message when sign has no verified images', async () => {
    const signWithoutImages: RouteSign = {
      id: 'sign-no-img',
      coordinate: [106.7, 10.7],
      name: 'Biển lạ',
      signCode: 'OTHER',
      imageUrl: '',
    };

    const screen = await render(
      <NavigationMapView
        signs={[signWithoutImages]}
      />
    );

    const signButton = screen.getByLabelText('Xem chi tiết cho Biển lạ');
    await act(async () => {
      fireEvent.press(signButton);
    });

    expect(screen.getByText('Chưa có ảnh thực địa được xác thực')).toBeTruthy();
  });

  it('renders UserLocation during active navigation with live location', async () => {
    const screen = await render(
      <NavigationMapView
        hasLiveLocation={true}
        navigationActive={true}
        routeCoordinates={[[106.7, 10.7], [106.71, 10.71]]}
        userCoordinate={[106.7, 10.7]}
      />
    );

    expect(screen.getByTestId('maplibre-user-location')).toBeTruthy();
  });

  it('renders custom start pin and locationPin when requested', async () => {
    const screen = await render(
      <NavigationMapView
        isCustomStart={true}
        locationPin={[106.703, 10.779]}
        locationPinColor="#3B82F6"
        routeStart={[106.7, 10.7]}
        showCurrentLocation={true}
        userCoordinate={[106.7009, 10.7769]}
      />
    );

    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByTestId('map-location-pin')).toBeTruthy();
  });

  it('displays offline pack indicator badge when active pack is present', async () => {
    mockActiveOfflinePack = { id: 'pack-hcm', name: 'TP. Hồ Chí Minh' };

    let screen: any;
    await act(async () => {
      screen = await render(
        <NavigationMapView
          focusCoordinate={[106.7, 10.7]}
        />
      );
    });

    expect(await screen.findByText('Offline: TP. Hồ Chí Minh')).toBeTruthy();
  });

  it('reports bounds on region change and clears selected sign on map press', async () => {
    const onBoundsChange = jest.fn();
    const onSignSelect = jest.fn();

    const screen = await render(
      <NavigationMapView
        onBoundsChange={onBoundsChange}
        onSignSelect={onSignSelect}
        signs={sampleSigns}
      />
    );

    const map = screen.getByTestId('maplibre-map');

    // 1. Region change reports bounds
    await act(async () => {
      fireEvent(map, 'regionDidChange', {
        nativeEvent: { bounds: [106.6, 10.7, 106.8, 10.8] },
      });
    });

    expect(onBoundsChange).toHaveBeenCalledWith({
      minLon: 106.6,
      minLat: 10.7,
      maxLon: 106.8,
      maxLat: 10.8,
    });

    // 2. Select a sign first
    const signButton = screen.getByLabelText('Xem chi tiết cho Biển cấm đỗ');
    await act(async () => {
      fireEvent.press(signButton);
    });
    expect(screen.getByText(/Biển cấm đỗ/)).toBeTruthy();

    // 3. Wait 500ms to avoid sign press debounce, then map press clears selected sign
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    await act(async () => {
      fireEvent(map, 'press');
    });

    expect(onSignSelect).toHaveBeenCalledWith(null);
  });

  it('correctly calculates getSignFreshness helper', () => {
    const fresh = getSignFreshness(0.85, 'VERIFIED');
    expect(fresh).toHaveProperty('label');
    expect(fresh).toHaveProperty('color');

    const outdated = getSignFreshness(0.2, 'NEEDS_REVALIDATION');
    expect(outdated).toHaveProperty('label');
  });

  it('locks camera heading on straight navigation and updates only on sharp turns or reroutes', async () => {
    jest.useFakeTimers();
    mockSetStop.mockClear();

    // L-shaped route: heading North (~0 deg) first, then turning East (~90 deg)
    const initialRoute: [number, number][] = [
      [106.7000, 10.7700],
      [106.70008, 10.7705], // slight ~9 deg drift
      [106.7000, 10.7710],  // straight North
      [106.7010, 10.7710],  // turn East (~90 deg)
    ];

    const screen = await render(
      <NavigationMapView
        hasLiveLocation={true}
        navigationActive={true}
        routeCoordinates={initialRoute}
        routeStart={[106.7000, 10.7700]}
        userCoordinate={[106.7000, 10.7700]}
      />,
    );

    // Advance mount readiness timer so cameraReadyRef becomes true
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(mockSetStop).toHaveBeenCalled();
    const initialBearing = mockSetStop.mock.calls[mockSetStop.mock.calls.length - 1][0].bearing;
    mockSetStop.mockClear();

    // Small heading deviation along straight path (~10 deg, > 3m movement) -> keeps locked bearing
    await screen.rerender(
      <NavigationMapView
        hasLiveLocation={true}
        navigationActive={true}
        routeCoordinates={initialRoute}
        routeStart={[106.7000, 10.7700]}
        userCoordinate={[106.70008, 10.7705]}
      />,
    );

    expect(mockSetStop).toHaveBeenCalled();
    expect(mockSetStop.mock.calls[mockSetStop.mock.calls.length - 1][0].bearing).toBe(initialBearing);
    mockSetStop.mockClear();

    // Turn corner onto Eastbound segment (~90 deg) -> rotates camera bearing
    await screen.rerender(
      <NavigationMapView
        hasLiveLocation={true}
        navigationActive={true}
        routeCoordinates={initialRoute}
        routeStart={[106.7000, 10.7700]}
        userCoordinate={[106.7000, 10.7710]}
      />,
    );

    const turnedBearing = mockSetStop.mock.calls[mockSetStop.mock.calls.length - 1][0].bearing;
    expect(turnedBearing).toBeGreaterThanOrEqual(80);
    expect(turnedBearing).toBeLessThanOrEqual(100);

    // Reroute arrives with brand-new coordinates -> GeoJSONSource updates in place with new polyline
    const reroutedCoords: [number, number][] = [
      [106.7005, 10.7712],
      [106.7005, 10.7730],
    ];
    await screen.rerender(
      <NavigationMapView
        hasLiveLocation={true}
        navigationActive={true}
        routeCoordinates={reroutedCoords}
        routeStart={[106.7005, 10.7712]}
        userCoordinate={[106.7005, 10.7712]}
      />,
    );

    const source = screen.getByTestId('maplibre-geojson-source');
    expect(source.props.data.geometry.coordinates).toEqual(reroutedCoords);
    jest.useRealTimers();
  });

  it('renders fallback icon badge when sign has missing or failing imageUrl', async () => {
    const signsWithMissingImage: RouteSign[] = [
      {
        id: 'sign-missing',
        coordinate: [106.705, 10.779],
        name: 'Biển chỉ dẫn',
        signCode: 'I.401',
        freshnessScore: 0.95,
        status: 'VERIFIED',
        imageUrl: '',
      },
    ];

    const screen = await render(
      <NavigationMapView
        routeSigns={signsWithMissingImage}
      />,
    );

    expect(screen.getByLabelText('Xem chi tiết cho Biển chỉ dẫn')).toBeTruthy();
  });
});
