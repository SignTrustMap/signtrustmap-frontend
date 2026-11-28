import React from 'react';
import { render, act, cleanup } from '@testing-library/react-native';

// Mock browser document for .web component in node environment
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      const el: any = {
        style: {},
        appendChild: jest.fn((child) => {
          if (!el.children) el.children = [];
          el.children.push(child);
        }),
        children: [],
        addEventListener: jest.fn(),
        setAttribute: jest.fn(),
        tagName: tag.toUpperCase(),
      };
      return el;
    },
  };
}

const mockRemove = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockOnce = jest.fn();
const mockFlyTo = jest.fn();
const mockEaseTo = jest.fn();
const mockFitBounds = jest.fn();
const mockAddControl = jest.fn();
const mockAddSource = jest.fn();
const mockGetSource = jest.fn();
const mockRemoveSource = jest.fn();
const mockAddLayer = jest.fn();
const mockGetLayer = jest.fn();
const mockRemoveLayer = jest.fn();
const mockSetPaintProperty = jest.fn();
const mockMarkerConstructor = jest.fn();
const mockGetBounds = jest.fn().mockReturnValue({
  getSouth: () => 10.7,
  getWest: () => 106.6,
  getNorth: () => 10.8,
  getEast: () => 106.7,
});

function MockMap(this: any, options: any) {
  this.options = options;
  this.addControl = mockAddControl;
  this.on = mockOn;
  this.off = mockOff;
  this.once = mockOnce;
  this.flyTo = mockFlyTo;
  this.easeTo = mockEaseTo;
  this.fitBounds = mockFitBounds;
  this.getBounds = mockGetBounds;
  this.addSource = mockAddSource;
  this.getSource = mockGetSource;
  this.removeSource = mockRemoveSource;
  this.addLayer = mockAddLayer;
  this.getLayer = mockGetLayer;
  this.removeLayer = mockRemoveLayer;
  this.setPaintProperty = mockSetPaintProperty;
  this.loaded = () => true;
  this.isStyleLoaded = () => true;
  this.remove = mockRemove;
}

function MockMarker(this: any, options?: any) {
  mockMarkerConstructor(options);
  this.options = options;
  this.element = options?.element;
  this.setLngLat = jest.fn().mockReturnThis();
  this.addTo = jest.fn().mockReturnThis();
  this.remove = jest.fn();
}

function MockNavigationControl(this: any, options?: any) {
  this.options = options;
}

jest.mock('maplibre-gl', () => ({
  __esModule: true,
  Map: MockMap,
  Marker: MockMarker,
  NavigationControl: MockNavigationControl,
}), { virtual: true });

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    primary: '#007B8B',
    neutral: '#F1F5F9',
  }),
}));

let mockActiveOfflinePack: any = null;
let metadataSubscriber: ((meta: any) => void) | null = null;

jest.mock('@/services/offline-map-service', () => ({
  offlineMapService: {
    getActiveOfflinePack: jest.fn(() => Promise.resolve(mockActiveOfflinePack)),
    subscribeToMetadata: jest.fn((cb) => {
      metadataSubscriber = cb;
      return () => {
        metadataSubscriber = null;
      };
    }),
  },
}));

import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view.web';

describe('NavigationMapView Web Component', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    mockActiveOfflinePack = null;
    metadataSubscriber = null;
  });

  it('renders web map and registers NavigationControl and cleanup', async () => {
    const { toJSON, unmount } = await render(
      <NavigationMapView
        focusCoordinate={[106.7, 10.77]}
      />
    );

    expect(toJSON()).toBeTruthy();
    expect(mockAddControl).toHaveBeenCalled();

    await act(async () => {
      unmount();
    });
    expect(mockRemove).toHaveBeenCalled();
  });

  it('handles bounds change reporting on load and moveend', async () => {
    const onBoundsChange = jest.fn();
    await render(
      <NavigationMapView
        onBoundsChange={onBoundsChange}
      />
    );

    // Initial check since map.loaded() is true
    expect(onBoundsChange).toHaveBeenCalledWith({
      minLat: 10.7,
      minLon: 106.6,
      maxLat: 10.8,
      maxLon: 106.7,
    });

    // Check registered listeners
    expect(mockOn).toHaveBeenCalledWith('load', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('moveend', expect.any(Function));
  });

  it('renders route signs with different freshness scores and crop fallbacks', async () => {
    const sampleSigns: any[] = [
      {
        id: 'sign-1',
        name: 'Biển Cấm Rẽ',
        signCode: 'P.102',
        coordinate: [106.701, 10.771],
        imageUrl: 'https://example.com/p102.png',
        actualCropUrl: 'https://example.com/p102_crop.png',
        freshnessScore: 0.9, // >= 80 -> green
      },
      {
        id: 'sign-2',
        name: 'Biển Nguy Hiểm',
        signCode: 'W.201',
        coordinate: [106.702, 10.772],
        imageUrl: '',
        actualCropUrl: '',
        freshnessScore: 40, // < 50 -> red
      },
      {
        id: 'sign-3',
        name: 'Biển Hết Cấm',
        signCode: 'DP.135',
        coordinate: [106.703, 10.773],
        imageUrl: 'https://example.com/dp135.png',
        status: 'RETIRED', // retired -> red
        freshnessScore: 70,
      },
      {
        id: 'sign-4',
        name: 'Biển Chỉ Dẫn',
        signCode: 'I.401',
        coordinate: [106.704, 10.774],
        imageUrl: 'https://example.com/i401.png',
        freshnessScore: 65, // 50-79 -> yellow
      },
      // Duplicate coordinate to test deduplication branch
      {
        id: 'sign-4-dup',
        name: 'Biển Chỉ Dẫn Duplicate',
        signCode: 'I.401',
        coordinate: [106.704, 10.774],
        imageUrl: 'https://example.com/i401.png',
        freshnessScore: 85, // higher score replaces earlier
      },
    ];

    await render(
      <NavigationMapView
        routeSigns={sampleSigns}
      />
    );

    // Markers should be added for unique signs
    expect(mockMarkerConstructor).toHaveBeenCalled();
  });

  it('updates driver marker and flies to focusCoordinate when changed', async () => {
    const { rerender } = await render(
      <NavigationMapView
        focusCoordinate={[106.7, 10.77]}
        focusRequestId={1}
      />
    );

    expect(mockFlyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [106.7, 10.77], zoom: 16 })
    );

    // Re-render with new focus coordinate
    await act(async () => {
      rerender(
        <NavigationMapView
          focusCoordinate={[106.71, 10.78]}
          focusRequestId={2}
        />
      );
    });

    expect(mockFlyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [106.71, 10.78] })
    );
  });

  it('renders and updates locationPin marker', async () => {
    const { rerender } = await render(
      <NavigationMapView
        locationPin={[106.75, 10.75]}
        locationPinColor="#3B82F6"
      />
    );

    expect(mockMarkerConstructor).toHaveBeenCalled();

    // Remove location pin
    await act(async () => {
      rerender(
        <NavigationMapView
          locationPin={undefined}
        />
      );
    });
  });

  it('renders destination, polyline route for different vehicle modes, and fits bounds', async () => {
    const routeCoords: [number, number][] = [
      [106.7, 10.77],
      [106.71, 10.775],
      [106.72, 10.78],
    ];

    const destinationSample = {
      id: 'dest-1',
      title: 'Điểm đến Test',
      subtitle: 'Địa chỉ Test',
      category: 'saved' as const,
      coordinate: [106.72, 10.78] as [number, number],
    };

    const { rerender } = await render(
      <NavigationMapView
        destination={destinationSample}
        routeStart={[106.7, 10.77]}
        routeCoordinates={routeCoords}
        vehicleMode="MOTORCYCLE"
      />
    );

    expect(mockAddSource).toHaveBeenCalledWith(
      'selected-route-source',
      expect.objectContaining({ type: 'geojson' })
    );
    expect(mockAddLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'selected-route-line' })
    );
    expect(mockFitBounds).toHaveBeenCalled();

    // Test with existing source: updates data with setData
    const mockSetData = jest.fn();
    mockGetSource.mockImplementation((id: string) => {
      if (id === 'selected-route-source') return { setData: mockSetData };
      return null;
    });
    mockGetLayer.mockImplementation((id: string) => {
      if (id === 'selected-route-line') return { id };
      return null;
    });

    await act(async () => {
      rerender(
        <NavigationMapView
          destination={destinationSample}
          routeStart={[106.7, 10.77]}
          routeCoordinates={routeCoords}
          vehicleMode="CYCLING"
        />
      );
    });

    expect(mockSetData).toHaveBeenCalled();
    expect(mockSetPaintProperty).toHaveBeenCalledWith(
      'selected-route-line',
      'line-color',
      '#F59E0B'
    );

    // Test walking mode
    await act(async () => {
      rerender(
        <NavigationMapView
          destination={destinationSample}
          routeStart={[106.7, 10.77]}
          routeCoordinates={routeCoords}
          vehicleMode="WALKING"
        />
      );
    });

    expect(mockSetPaintProperty).toHaveBeenCalledWith(
      'selected-route-line',
      'line-color',
      '#10B981'
    );

    // Destination without routeStart flies directly to destination
    await act(async () => {
      rerender(
        <NavigationMapView
          destination={destinationSample}
        />
      );
    });
    expect(mockFlyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [106.72, 10.78], zoom: 14 })
    );

    // Removing destination cleans up route layer and source and flies to focusCoordinate
    mockGetLayer.mockReturnValueOnce(true);
    mockGetSource.mockReturnValueOnce(true);
    await act(async () => {
      rerender(
        <NavigationMapView
          destination={undefined}
          focusCoordinate={[106.7, 10.77]}
        />
      );
    });
    expect(mockRemoveLayer).toHaveBeenCalledWith('selected-route-line');
    expect(mockRemoveSource).toHaveBeenCalledWith('selected-route-source');
  });

  it('renders offline indicator badge when active offline map pack is present', async () => {
    mockActiveOfflinePack = { id: 'pack-hcm', name: 'TP. Hồ Chí Minh' };

    const { getByText } = await render(
      <NavigationMapView />
    );

    await act(async () => {
      // Trigger metadata update
      if (metadataSubscriber) {
        metadataSubscriber({
          activePackId: 'pack-hcm',
          installedPacks: {
            'pack-hcm': { id: 'pack-hcm', name: 'TP. Hồ Chí Minh' },
          },
        });
      }
    });

    expect(getByText('Offline: TP. Hồ Chí Minh')).toBeTruthy();
  });
});
