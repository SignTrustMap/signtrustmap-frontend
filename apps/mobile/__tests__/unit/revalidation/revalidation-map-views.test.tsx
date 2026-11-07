import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
let mockMapLibre: any = null;
jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => mockMapLibre,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    primary: '#2563EB',
    neutral: '#F1F5F9',
  }),
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
    remove = mockRemove;
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

import { RevalidationMapView as NativeRevalidationMapView } from '@/feature/revalidation/components/revalidation-map-view';
import { RevalidationMapView as WebRevalidationMapView } from '@/feature/revalidation/components/revalidation-map-view.web';

describe('Revalidation Map Views (Native & Web)', () => {
  const sampleSigns = [
    {
      id: 'sign-1',
      name: 'Biển Cấm rẽ phải',
      signCode: 'P.123',
      coordinate: [106.7009, 10.7769] as [number, number],
      imageUrl: 'https://example.com/p123.png',
      lastVerifiedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'sign-2',
      name: 'Biển Dừng lại',
      signCode: 'P.122',
      coordinate: [106.702, 10.778] as [number, number],
      imageUrl: 'https://example.com/p122.png',
      lastVerifiedAt: '2026-05-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockMapLibre = null;
  });

  describe('Native RevalidationMapView', () => {
    it('renders fallback screen when MapLibre native module is null', async () => {
      mockMapLibre = null;
      const { getByText } = await render(
        <NativeRevalidationMapView signs={sampleSigns as any} />
      );

      expect(getByText('Bản đồ tương tác')).toBeTruthy();
    });

    it('renders interactive map with markers when MapLibre module is loaded', async () => {
      const { View } = require('react-native');
      mockMapLibre = {
        Map: ({ children, ...props }: any) => <View testID="native-map" {...props}>{children}</View>,
        Camera: (props: any) => <View testID="native-camera" {...props} />,
        Marker: ({ children, ...props }: any) => <View testID="native-marker" {...props}>{children}</View>,
      };

      const mockSignPress = jest.fn();
      const { getByTestId, getAllByTestId } = await render(
        <NativeRevalidationMapView
          signs={sampleSigns as any}
          userCoordinate={[106.7009, 10.7769]}
          selectedSignId="sign-1"
          onSignPress={mockSignPress}
        />
      );

      expect(getByTestId('native-map')).toBeTruthy();
      expect(getByTestId('native-camera')).toBeTruthy();
      expect(getAllByTestId('native-marker').length).toBe(2);
    });
  });

  describe('Web RevalidationMapView', () => {
    it('renders web map container successfully', async () => {
      const mockBoundsChange = jest.fn();
      const { toJSON } = await render(
        <WebRevalidationMapView
          signs={sampleSigns as any}
          userCoordinate={[106.7009, 10.7769]}
          focusCoordinate={[106.702, 10.778]}
          onBoundsChange={mockBoundsChange}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });
});
