import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

if (typeof document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      const el: any = {
        style: {},
        appendChild: jest.fn((c) => el.children.push(c)),
        children: [],
        addEventListener: jest.fn(),
        setAttribute: jest.fn(),
        innerHTML: '',
        textContent: '',
        src: '',
        alt: '',
        tagName: tag.toUpperCase(),
      };
      return el;
    },
  };
}

let mockStyleLoaded = true;
const mockSetData = jest.fn();
const mockGetSource = jest.fn();
const mockGetLayer = jest.fn();
const mockRemoveLayer = jest.fn();
const mockRemoveSource = jest.fn();
const mockAddSource = jest.fn();
const mockAddLayer = jest.fn();
const mockSetPaintProperty = jest.fn();
const mockFlyTo = jest.fn();
const mockFitBounds = jest.fn();
const mockOn = jest.fn();
const mockOnce = jest.fn();
const mockOff = jest.fn();
const mockCreatedElements: any[] = [];

function MockMap(this: any) {
  this.addControl = jest.fn();
  this.on = mockOn;
  this.off = mockOff;
  this.once = mockOnce;
  this.flyTo = mockFlyTo;
  this.fitBounds = mockFitBounds;
  this.getBounds = () => ({
    getSouth: () => 10.7,
    getWest: () => 106.6,
    getNorth: () => 10.8,
    getEast: () => 106.7,
  });
  this.addSource = mockAddSource;
  this.getSource = mockGetSource;
  this.removeSource = mockRemoveSource;
  this.addLayer = mockAddLayer;
  this.getLayer = mockGetLayer;
  this.removeLayer = mockRemoveLayer;
  this.setPaintProperty = mockSetPaintProperty;
  this.loaded = () => true;
  this.isStyleLoaded = () => mockStyleLoaded;
  this.remove = jest.fn();
}

function MockMarker(this: any, opts?: any) {
  if (opts?.element) mockCreatedElements.push(opts.element);
  this.setLngLat = jest.fn().mockReturnThis();
  this.addTo = jest.fn().mockReturnThis();
  this.remove = jest.fn();
}

jest.mock('maplibre-gl', () => ({
  __esModule: true,
  Map: MockMap,
  Marker: MockMarker,
  NavigationControl: function MockNav() {},
}), { virtual: true });

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ primary: '#0671EB', text: '#0F172A' }),
}));

let mockSubCb: ((meta: any) => void) | undefined;
jest.mock('@/services/offline-map-service', () => ({
  offlineMapService: {
    getActiveOfflinePack: jest.fn().mockResolvedValue({ id: 'p1', name: 'TP.HCM' }),
    subscribeToMetadata: jest.fn((cb: any) => {
      mockSubCb = cb;
      return jest.fn();
    }),
  },
}));

import { NavigationMapView } from '@/feature/navigation/components/navigation-map-view.web';

describe('NavigationMapView Web Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatedElements.length = 0;
    mockStyleLoaded = true;
  });

  afterEach(() => {
    cleanup();
  });

  it('covers sign deduplication/onerror fallback, freshness dots, offline badge, focusCoordinate, locationPin, and all vehicle route colors/layers', async () => {
    const onBoundsChange = jest.fn();
    const screen = await render(
      <NavigationMapView
        focusCoordinate={[106.7, 10.77]}
        focusRequestId={1}
        onBoundsChange={onBoundsChange}
        routeSigns={[
          { id: '1', name: 'Cấm', coordinate: [106.7, 10.77], signCode: 'P.102', imageUrl: 'https://cdn/1.png', actualCropUrl: 'https://cdn/c1.jpg', freshnessScore: 0.4 },
          { id: '2', name: 'Cấm 2', coordinate: [106.7, 10.77], signCode: 'P.102', imageUrl: 'https://cdn/2.png', freshnessScore: 0.9 },
          { id: '3', name: 'Nguy hiểm', coordinate: [106.71, 10.78], signCode: 'W.201', imageUrl: '', freshnessScore: 0.6 },
          { id: '4', name: 'Bad', coordinate: [] as any, signCode: 'BAD', imageUrl: '' },
        ]}
        showFocusPin={true}
      />,
    );

    await waitFor(() => expect(screen.getByText('Offline: TP.HCM')).toBeTruthy());
    expect(onBoundsChange).toHaveBeenCalled();

    // Trigger image onerror first to swap to actualCropUrl, then fallback div
    const signEl = mockCreatedElements.find((el) => el.children?.[1]?.onerror);
    signEl?.children[1]?.onerror?.();
    signEl?.children[1]?.onerror?.();

    // Metadata listener clears offline badge
    mockSubCb?.({ activePackId: null, installedPacks: {} });

    // Destination + route without existing source -> adds source & layer (CYCLING = #F59E0B)
    mockGetLayer.mockReturnValue(true);
    mockGetSource.mockReturnValueOnce(true).mockReturnValueOnce(null);
    await screen.rerender(
      <NavigationMapView
        destination={{ id: 'd1', coordinate: [106.72, 10.79], title: 'Chợ', subtitle: '', category: 'recent' }}
        focusCoordinate={[106.705, 10.775]}
        focusRequestId={2}
        locationPin={[106.71, 10.78]}
        locationPinColor="#10B981"
        routeCoordinates={[[106.7, 10.77], [106.72, 10.79]]}
        routeStart={[106.7, 10.77]}
        vehicleMode="CYCLING"
      />,
    );
    expect(mockAddSource).toHaveBeenCalled();
    expect(mockFitBounds).toHaveBeenCalled();

    // Update existing route source -> setData & setPaintProperty (WALKING & BIKE, < 2 coords)
    mockGetSource.mockReturnValue({ setData: mockSetData });
    await screen.rerender(
      <NavigationMapView
        destination={{ id: 'd1', coordinate: [106.72, 10.79], title: 'Chợ', subtitle: '', category: 'recent' }}
        routeCoordinates={[[106.7, 10.77]]}
        routeStart={[106.7, 10.77]}
        vehicleMode="WALKING"
      />,
    );
    expect(mockSetData).toHaveBeenCalled();
    expect(mockSetPaintProperty).toHaveBeenCalledWith('selected-route-line', 'line-color', '#10B981');

    // Destination without routeStart when style not yet loaded -> flyTo destination & register once('load')
    mockStyleLoaded = false;
    await screen.rerender(
      <NavigationMapView
        destination={{ id: 'd1', coordinate: [106.72, 10.79], title: 'Chợ', subtitle: '', category: 'recent' }}
        routeStart={[106.7, 10.77]}
        routeCoordinates={[[106.7, 10.77], [106.72, 10.79]]}
        vehicleMode="BIKE"
      />,
    );
    expect(mockOnce).toHaveBeenCalledWith('load', expect.any(Function));

    await screen.rerender(
      <NavigationMapView
        destination={{ id: 'd1', coordinate: [106.72, 10.79], title: 'Chợ', subtitle: '', category: 'recent' }}
      />,
    );
    expect(mockFlyTo).toHaveBeenCalled();
  });
});
