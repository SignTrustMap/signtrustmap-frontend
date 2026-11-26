import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';

const mockSetStop = jest.fn();
const mockProject = jest.fn();
const mockGetBounds = jest.fn();

let mockMapLibreAvailable = true;
let mockActiveOfflinePack: any = null;
let mockOfflineSubscriber: ((meta: any) => void) | null = null;
let mockTaskEvidences: any[] = [];
let mockSignEvidences: any[] = [];

jest.mock('@/services/maplibre', () => {
  const buildModule = () => {
    if (!mockMapLibreAvailable) return null;
    const React = require('react');
    const { View: RNView } = require('react-native');
    const Camera = React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        setStop: mockSetStop,
      }));
      return <RNView testID="maplibre-camera" {...props} />;
    });
    const Map = React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        project: mockProject,
        getBounds: mockGetBounds,
      }));
      return (
        <RNView testID="maplibre-map" {...props}>
          {props.children}
        </RNView>
      );
    });
    return {
      Camera,
      GeoJSONSource: (props: any) => (
        <RNView testID="maplibre-geojson-source" {...props}>
          {props.children}
        </RNView>
      ),
      Layer: (props: any) => <RNView testID={`maplibre-layer-${props.id}`} {...props} />,
      Map,
      Marker: (props: any) => (
        <RNView testID={`maplibre-marker-${props.id}`} {...props}>
          {props.children}
        </RNView>
      ),
      UserLocation: (props: any) => <RNView testID="maplibre-user-location" {...props} />,
    };
  };
  return {
    getMapLibre: buildModule,
    loadMapLibre: buildModule,
  };
});

jest.mock('@/services/offline-map-service', () => ({
  offlineMapService: {
    getActiveOfflinePack: () => Promise.resolve(mockActiveOfflinePack),
    subscribeToMetadata: (cb: (meta: any) => void) => {
      mockOfflineSubscriber = cb;
      return jest.fn();
    },
  },
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetTaskEvidences: () => ({ data: mockTaskEvidences }),
  useGetSignEvidences: () => ({ data: mockSignEvidences }),
}));

jest.mock('expo-image', () => {
  const { View: RNView } = require('react-native');
  return {
    Image: (props: any) => <RNView testID="expo-image" {...props} />,
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View: RNView } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => (
      <RNView testID={`mc-icon-${props.name}`} {...props} />
    ),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    primary: '#2563EB',
  }),
}));

import {
  NavigationMapView,
  getSignFreshness,
} from '@/feature/navigation/components/navigation-map-view';
import type { RouteSign } from '@/api/navigation/navigation';

describe('NavigationMapView branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMapLibreAvailable = true;
    mockActiveOfflinePack = null;
    mockOfflineSubscriber = null;
    mockTaskEvidences = [];
    mockSignEvidences = [];
    mockGetBounds.mockResolvedValue([106.6, 10.7, 106.8, 10.8]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders native build fallback when MapLibre is unavailable', async () => {
    mockMapLibreAvailable = false;
    const screen = await render(<NavigationMapView />);
    expect(screen.queryByTestId('maplibre-map')).toBeNull();
  });

  it('covers WALKING and CYCLING route colors, close-point padded routeBounds, focus pin, and onDidFinishLoadingMap', async () => {
    const onBoundsChange = jest.fn();
    mockGetBounds.mockResolvedValueOnce([106.61, 10.71, 106.81, 10.81]);

    const screen = await render(
      <NavigationMapView
        focusCoordinate={[106.7, 10.77]}
        onBoundsChange={onBoundsChange}
        routeCoordinates={[
          [106.7, 10.77],
          [106.70001, 10.77001],
        ]}
        showFocusPin
        vehicleMode="WALKING"
      />,
    );

    expect(screen.getByTestId('maplibre-layer-selected-route-line-walking').props.style.lineColor).toBe(
      '#10B981',
    );
    await act(async () => {
      fireEvent(screen.getByTestId('maplibre-map'), 'didFinishLoadingMap');
    });
    expect(onBoundsChange).toHaveBeenCalledWith({
      minLon: 106.61,
      minLat: 10.71,
      maxLon: 106.81,
      maxLat: 10.81,
    });

    // Reject getBounds branch & CYCLING mode without focusCoordinate (uses padded routeBounds Camera)
    mockGetBounds.mockRejectedValueOnce(new Error('not ready'));
    await screen.rerender(
      <NavigationMapView
        onBoundsChange={onBoundsChange}
        routeCoordinates={[
          [106.7, 10.77],
          [106.70001, 10.77001],
        ]}
        vehicleMode="CYCLING"
      />,
    );
    expect(screen.getByTestId('maplibre-layer-selected-route-line-cycling').props.style.lineColor).toBe(
      '#F59E0B',
    );
    await act(async () => {
      fireEvent(screen.getByTestId('maplibre-map'), 'didFinishLoadingMap');
    });

    // Update offline pack via subscription callback
    await act(async () => {
      mockOfflineSubscriber?.({
        activePackId: 'p2',
        installedPacks: { p2: { id: 'p2', name: 'Hà Nội' } },
      });
    });
    expect(screen.getByText('Offline: Hà Nội')).toBeTruthy();
  });

  it('covers map pixel hit test, fallback geographic distance hit test, sign deduplication, and SignDetailsBottomSheet evidences', async () => {
    const signs: RouteSign[] = [
      {
        id: 's-low',
        coordinate: [106.701, 10.777],
        name: 'Biển 1',
        signCode: 'P.102',
        freshnessScore: 0.2,
        status: 'VERIFIED',
        imageUrl: 'https://cdn.example.com/s-low.jpg',
      },
      {
        id: 's-high',
        coordinate: [106.701, 10.777],
        name: 'Biển 1',
        signCode: 'P.102',
        freshnessScore: 0.9,
        status: 'VERIFIED',
        imageUrl: 'https://cdn.example.com/s-high.jpg',
        actualCropUrl: 'https://cdn.example.com/crop-high.jpg',
        actualFrameUrl: 'https://cdn.example.com/frame-high.jpg',
        revalidationTaskId: 'task-99',
      } as RouteSign & { revalidationTaskId: string },
    ];
    mockTaskEvidences = [
      { id: 'te1', evidenceUrl: 'https://cdn.example.com/te1.jpg', createdAt: '2026-04-01T00:00:00Z' },
    ];
    mockSignEvidences = [
      { id: 'se1', mediaUrl: 'https://cdn.example.com/se1.jpg', createdAt: '2026-05-01T00:00:00Z' },
    ];

    const onSignSelect = jest.fn();
    mockProject.mockResolvedValue([100, 100]);

    const screen = await render(
      <NavigationMapView onSignSelect={onSignSelect} signs={signs} />,
    );

    const map = screen.getByTestId('maplibre-map');

    // Screen-pixel hit within 38dp selects s-high
    await act(async () => {
      await fireEvent(map, 'press', {
        nativeEvent: { point: [102, 85], lngLat: [106.701, 10.777] },
      });
    });
    expect(onSignSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 's-high' }));

    // Open preview modal from bottom sheet
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Xem ảnh Ảnh tái thẩm định'));
    });
    expect(screen.getByLabelText('Đóng xem ảnh')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Xem ảnh Ảnh thực địa'));
    });
    expect(screen.getByLabelText('Đóng xem ảnh')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Đóng xem ảnh'));
    });

    // Press close button on bottom sheet to verify onClose clears selection
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Đóng thông tin biển báo'));
    });
    expect(onSignSelect).toHaveBeenLastCalledWith(null);
  });

  it('covers map pixel hit test miss and geographic distance fallback on project error', async () => {
    const signs: RouteSign[] = [
      {
        id: 's-geo',
        coordinate: [106.701, 10.777],
        name: 'Biển Geo',
        signCode: 'W.205',
        freshnessScore: 0.7,
        status: 'VERIFIED',
        imageUrl: 'https://cdn.example.com/geo.jpg',
      },
    ];
    const onSignSelect = jest.fn();
    mockProject.mockRejectedValueOnce(new Error('project fail'));

    const screen = await render(
      <NavigationMapView onSignSelect={onSignSelect} signs={signs} />,
    );
    const map = screen.getByTestId('maplibre-map');

    await act(async () => {
      await fireEvent(map, 'press', {
        nativeEvent: { point: [100, 100], lngLat: [106.701, 10.777] },
      });
    });

    await waitFor(() => {
      expect(onSignSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 's-geo' }));
    });
  });

  it('covers auto-dismiss callout with destination and medium turn confirmation (2 updates >= 25 deg)', async () => {
    jest.useFakeTimers();
    const onSignSelect = jest.fn();
    const route: [number, number][] = [
      [106.7, 10.77],
      [106.7, 10.771],
      [106.7006, 10.7717], // ~32 deg turn from North
      [106.7012, 10.7724],
    ];

    const screen = await render(
      <NavigationMapView
        destination={{
          id: 'd1',
          title: 'Đích',
          subtitle: 'Sub',
          category: 'recent',
          coordinate: [106.7012, 10.7724],
        }}
        hasLiveLocation={false}
        isCustomStart
        navigationActive
        onSignSelect={onSignSelect}
        routeCoordinates={route}
        routeStart={[106.7, 10.77]}
        signs={[
          {
            id: 's-dest',
            coordinate: [106.7, 10.7705],
            name: 'Biển đường',
            signCode: 'W.202',
            freshnessScore: 0.6,
            status: 'VERIFIED',
            imageUrl: 'https://cdn.example.com/sign.jpg',
          },
        ]}
        userCoordinate={[106.7, 10.77]}
      />,
    );

    // Custom start pin shown when hasLiveLocation is false even during active nav
    expect(screen.getByText('S')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    // Select sign then wait 4000ms auto-dismiss
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Xem chi tiết cho Biển đường'));
    });
    await act(async () => {
      jest.advanceTimersByTime(4100);
    });
    expect(onSignSelect).toHaveBeenLastCalledWith(null);

    // Medium turn step 1 & step 2
    mockSetStop.mockClear();
    await screen.rerender(
      <NavigationMapView
        navigationActive
        routeCoordinates={route}
        routeStart={[106.7, 10.77]}
        userCoordinate={[106.7, 10.7709]}
      />,
    );
    // Jitter (< 3m) ignored
    mockSetStop.mockClear();
    await screen.rerender(
      <NavigationMapView
        navigationActive
        routeCoordinates={route}
        routeStart={[106.7, 10.77]}
        userCoordinate={[106.7, 10.770905]}
      />,
    );
    expect(mockSetStop).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('covers getSignFreshness status & score thresholds', () => {
    expect(getSignFreshness(null, 'NEED_VERIFY').label).toBeTruthy();
    expect(getSignFreshness(undefined, 'PENDING').label).toBeTruthy();
    expect(getSignFreshness(0.55, 'VERIFIED').label).toBeTruthy();
  });

  it('covers locationPin, routeStart+destination bounds fallback, destination-only camera, and navigationActive reroute signature change', async () => {
    jest.useFakeTimers();

    // 1. locationPin camera without focusCoordinate + pin suppression when matching destination
    const screen = await render(
      <NavigationMapView
        locationPin={[106.705, 10.775]}
        locationPinColor="#10B981"
      />,
    );
    expect(screen.getByTestId('map-location-pin')).toBeTruthy();

    // 2. routeBounds fallback from routeStart + destination (no routeCoordinates)
    await screen.rerender(
      <NavigationMapView
        destination={{
          id: 'd-bounds',
          title: 'Đích',
          subtitle: 'Sub',
          category: 'recent',
          coordinate: [106.705, 10.775],
        }}
        routeStart={[106.7, 10.77]}
      />,
    );
    expect(screen.getByTestId('maplibre-camera').props.bounds).toBeTruthy();

    // 3. destination-only cameraCenter
    await screen.rerender(
      <NavigationMapView
        destination={{
          id: 'd-only',
          title: 'Đích',
          subtitle: 'Sub',
          category: 'recent',
          coordinate: [106.705, 10.775],
        }}
      />,
    );
    expect(screen.getByTestId('maplibre-camera').props.center).toEqual([106.705, 10.775]);

    // 4. navigationActive with no coords (initialViewState undefined) then reroute signature change
    await screen.rerender(<NavigationMapView navigationActive />);
    expect(screen.getByTestId('maplibre-camera').props.initialViewState).toBeUndefined();

    await screen.rerender(
      <NavigationMapView
        navigationActive
        routeCoordinates={[
          [106.7, 10.77],
          [106.702, 10.77],
        ]}
        userCoordinate={[106.7, 10.77]}
      />,
    );
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    mockSetStop.mockClear();
    await screen.rerender(
      <NavigationMapView
        navigationActive
        routeCoordinates={[
          [106.7, 10.77],
          [106.705, 10.775],
          [106.708, 10.778],
        ]}
        userCoordinate={[106.7, 10.77]}
      />,
    );
    expect(mockSetStop).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('keeps sign marker order and renders preview callout in a dedicated overlay marker when tapped', async () => {
    const signs: RouteSign[] = [
      {
        id: 'sig-low',
        coordinate: [106.701, 10.771],
        name: 'Biển 1',
        signCode: 'P.102',
        freshnessScore: 0.4,
        status: 'VERIFIED',
        imageUrl: 'https://cdn.example.com/1.jpg',
      },
      {
        id: 'sig-high',
        coordinate: [106.702, 10.772],
        name: 'Biển 2',
        signCode: 'W.205',
        freshnessScore: 0.9,
        status: 'VERIFIED',
        imageUrl: 'https://cdn.example.com/2.jpg',
      },
    ];

    const screen = await render(
      <NavigationMapView
        destination={{
          id: 'dest-1',
          title: 'Đích',
          subtitle: 'Sub',
          category: 'recent',
          coordinate: [106.705, 10.775],
        }}
        routeCoordinates={[
          [106.7, 10.77],
          [106.705, 10.775],
        ]}
        routeStart={[106.7, 10.77]}
        signs={signs}
      />,
    );

    const beforeMarkers = screen
      .getAllByTestId(/^maplibre-marker-/)
      .map((node) => node.props.id);
    expect(beforeMarkers.slice(0, 2)).toEqual(['route-sign-sig-low', 'route-sign-sig-high']);

    await fireEvent.press(screen.getByLabelText('Xem chi tiết cho Biển 1'));

    const afterMarkers = screen
      .getAllByTestId(/^maplibre-marker-/)
      .map((node) => node.props.id);
    // Marker order stays identical and callout renders as its own separate marker
    expect(afterMarkers.slice(0, 2)).toEqual(['route-sign-sig-low', 'route-sign-sig-high']);
    expect(afterMarkers).toContain('route-sign-callout-sig-low');
  });
});
