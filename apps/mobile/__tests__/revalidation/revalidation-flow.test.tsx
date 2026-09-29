import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import {
  getFreshnessInfo,
  RevalidationSignMarker,
} from '@/feature/revalidation/components/revalidation-sign-marker';
import { RevalidationSignDetailsCard } from '@/feature/revalidation/components/revalidation-sign-details-card';
import {
  getFreshnessStyle,
  calculateDistanceMeters,
  isValidGpsCoordinates,
} from '@/feature/revalidation/pages/inspect-revalidate-screen';
import { isRealWorldTaskBounds } from '@/feature/revalidation/hooks/use-revalidation';
import type { RouteSign } from '@/api/navigation/navigation';

// Mocks
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const R = require('react');
    return R.createElement('SafeAreaView', props, children);
  },
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      primary: '#0671EB',
    },
  }),
}));

describe('Revalidation Flow: Business Logic & UI Verification', () => {
  const createMockSign = (overrides?: Partial<RouteSign>): RouteSign => ({
    id: 'sign-test-1',
    coordinate: [106.7009, 10.7769],
    signCode: 'P.102',
    name: 'Cấm đi ngược chiều',
    nameVi: 'Cấm đi ngược chiều',
    nameEn: 'No Entry',
    freshnessScore: 0.55,
    status: 'STALE',
    roadName: 'Đường Nguyễn Huệ',
    displayAddress: 'Đường Nguyễn Huệ, Quận 1',
    lastVerifiedAt: '2026-01-01',
    imageUrl: 'https://example.com/p102.png',
    actualCropUrl: 'https://example.com/crop.jpg',
    ...overrides,
  });

  describe('getFreshnessInfo threshold classification', () => {
    it('classifies score < 50 as STALE', () => {
      const sign49 = createMockSign({ freshnessScore: 0.49 });
      const info49 = getFreshnessInfo(sign49);
      expect(info49.scorePercent).toBe(49);
      expect(info49.isStale).toBe(true);
      expect(info49.isModerate).toBe(false);
      expect(info49.isFresh).toBe(false);

      const sign30 = createMockSign({ freshnessScore: 30 });
      const info30 = getFreshnessInfo(sign30);
      expect(info30.scorePercent).toBe(30);
      expect(info30.isStale).toBe(true);
      expect(info30.isModerate).toBe(false);
      expect(info30.isFresh).toBe(false);
    });

    it('classifies score 50–79 (including score 55) as MODERATE and NOT stale', () => {
      // 55% score test (vital bug fix check: was previously wrongly marked red/stale)
      const sign55 = createMockSign({ freshnessScore: 0.55, status: 'STALE' });
      const info55 = getFreshnessInfo(sign55);
      expect(info55.scorePercent).toBe(55);
      expect(info55.isStale).toBe(false);
      expect(info55.isModerate).toBe(true);
      expect(info55.isFresh).toBe(false);

      // Boundary: exactly 50
      const sign50 = createMockSign({ freshnessScore: 0.50 });
      const info50 = getFreshnessInfo(sign50);
      expect(info50.scorePercent).toBe(50);
      expect(info50.isStale).toBe(false);
      expect(info50.isModerate).toBe(true);
      expect(info50.isFresh).toBe(false);

      // Upper moderate boundary: 79
      const sign79 = createMockSign({ freshnessScore: 0.79 });
      const info79 = getFreshnessInfo(sign79);
      expect(info79.scorePercent).toBe(79);
      expect(info79.isStale).toBe(false);
      expect(info79.isModerate).toBe(true);
      expect(info79.isFresh).toBe(false);
    });

    it('classifies score >= 80 as FRESH', () => {
      // Boundary: exactly 80
      const sign80 = createMockSign({ freshnessScore: 0.80 });
      const info80 = getFreshnessInfo(sign80);
      expect(info80.scorePercent).toBe(80);
      expect(info80.isStale).toBe(false);
      expect(info80.isModerate).toBe(false);
      expect(info80.isFresh).toBe(true);

      const sign95 = createMockSign({ freshnessScore: 95 });
      const info95 = getFreshnessInfo(sign95);
      expect(info95.scorePercent).toBe(95);
      expect(info95.isStale).toBe(false);
      expect(info95.isModerate).toBe(false);
      expect(info95.isFresh).toBe(true);
    });

    it('forces isStale = true when status is RETIRED regardless of score', () => {
      const retiredSign = createMockSign({ freshnessScore: 0.92, status: 'RETIRED' });
      const info = getFreshnessInfo(retiredSign);
      expect(info.isStale).toBe(true);
      expect(info.isModerate).toBe(false);
      expect(info.isFresh).toBe(false);
    });

    it('handles STALE status with undefined score as stale', () => {
      const noScoreSign = createMockSign({ freshnessScore: undefined, status: 'STALE' });
      const info = getFreshnessInfo(noScoreSign);
      expect(info.scorePercent).toBeUndefined();
      expect(info.isStale).toBe(true);
      expect(info.isModerate).toBe(false);
      expect(info.isFresh).toBe(false);
    });
  });

  describe('getFreshnessStyle color and icon resolution', () => {
    it('returns healthy green palette for score >= 80', () => {
      const style85 = getFreshnessStyle(85);
      expect(style85.text).toBe('#047857');
      expect(style85.bg).toBe('#ECFDF5');
      expect(style85.border).toBe('#6EE7B7');
      expect(style85.icon).toBe('check-circle-outline');
    });

    it('returns moderate amber palette for score 50–79 (e.g. 55)', () => {
      const style55 = getFreshnessStyle(55);
      expect(style55.text).toBe('#C2410C');
      expect(style55.bg).toBe('#FFF7ED');
      expect(style55.border).toBe('#FDBA74');
      expect(style55.icon).toBe('clock-alert-outline');
    });

    it('returns warning deep orange palette for score 31–49', () => {
      const style45 = getFreshnessStyle(45);
      expect(style45.text).toBe('#BE123C');
      expect(style45.bg).toBe('#FFF1F2');
      expect(style45.border).toBe('#FDA4AF');
      expect(style45.icon).toBe('alert-circle-outline');
    });

    it('returns critical red palette for score <= 30', () => {
      const style25 = getFreshnessStyle(25);
      expect(style25.text).toBe('#B91C1C');
      expect(style25.bg).toBe('#FEF2F2');
      expect(style25.border).toBe('#FCA5A5');
      expect(style25.icon).toBe('shield-alert-outline');
    });
  });

  describe('calculateDistanceMeters (Haversine formula)', () => {
    it('returns 0 for identical coordinates', () => {
      const dist = calculateDistanceMeters(10.7769, 106.7009, 10.7769, 106.7009);
      expect(dist).toBe(0);
    });

    it('accurately computes distance between two real-world coordinates in HCMC', () => {
      // Ben Thanh Market (10.7725, 106.6980) to Bitexco Tower (10.7716, 106.7047) ~ 740m
      const dist = calculateDistanceMeters(10.7725, 106.6980, 10.7716, 106.7047);
      expect(dist).toBeGreaterThan(650);
      expect(dist).toBeLessThan(850);
    });
  });

  describe('isValidGpsCoordinates', () => {
    it('accepts valid geographic coordinates', () => {
      expect(isValidGpsCoordinates({ latitude: 10.7769, longitude: 106.7009 })).toBe(true);
      expect(isValidGpsCoordinates({ latitude: -23.5505, longitude: -46.6333 })).toBe(true);
    });

    it('rejects null, undefined, (0, 0), and out-of-bounds coordinates', () => {
      expect(isValidGpsCoordinates(null)).toBe(false);
      expect(isValidGpsCoordinates(undefined)).toBe(false);
      expect(isValidGpsCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
      expect(isValidGpsCoordinates({ latitude: 95, longitude: 106 })).toBe(false);
      expect(isValidGpsCoordinates({ latitude: 10, longitude: 190 })).toBe(false);
      expect(isValidGpsCoordinates({ latitude: NaN, longitude: 106 })).toBe(false);
    });
  });

  describe('isRealWorldTaskBounds', () => {
    it('accepts valid localized task bounding boxes', () => {
      expect(
        isRealWorldTaskBounds({
          minLat: 10.7,
          maxLat: 10.8,
          minLon: 106.6,
          maxLon: 106.8,
        }),
      ).toBe(true);
    });

    it('rejects undefined or global fallback bounds', () => {
      expect(isRealWorldTaskBounds(undefined)).toBe(false);
      // Default world bounds [-90, -180, 90, 180]
      expect(
        isRealWorldTaskBounds({
          minLat: -85,
          maxLat: 85,
          minLon: -170,
          maxLon: 170,
        }),
      ).toBe(false);
    });
  });

  describe('RevalidationSignMarker component', () => {
    it('renders marker for moderate sign with dot and no exclamation badge', async () => {
      const moderateSign = createMockSign({ freshnessScore: 0.55 });
      const { queryByText } = await render(
        <RevalidationSignMarker sign={moderateSign} isSelected={false} />,
      );

      // Stale exclamation badge '!' should NOT be rendered
      expect(queryByText('!')).toBeNull();
    });

    it('renders marker for stale sign with exclamation badge (!)', async () => {
      const staleSign = createMockSign({ freshnessScore: 0.40 });
      const { getByText } = await render(
        <RevalidationSignMarker sign={staleSign} isSelected={false} />,
      );

      // Stale exclamation badge should be rendered
      expect(getByText('!')).toBeTruthy();
    });
  });

  describe('RevalidationSignDetailsCard component', () => {
    it('renders sign information, score badge, and triggers onRevalidate when button pressed', async () => {
      const mockSign = createMockSign({
        signCode: 'P.102',
        name: 'Cấm đi ngược chiều',
        roadName: 'Đường Nguyễn Huệ, Quận 1',
        freshnessScore: 0.55,
      });

      const onRevalidateMock = jest.fn();
      const onCloseMock = jest.fn();

      const { getByText, getAllByText } = await render(
        <RevalidationSignDetailsCard
          sign={mockSign}
          onClose={onCloseMock}
          onRevalidate={onRevalidateMock}
        />,
      );

      // Check sign metadata
      expect(getAllByText('Cấm đi ngược chiều').length).toBeGreaterThan(0);
      expect(getAllByText('Đường Nguyễn Huệ, Quận 1').length).toBeGreaterThan(0);
      expect(getByText('Moderate Freshness')).toBeTruthy();
      expect(getByText('55%')).toBeTruthy();

      // Find and click Inspect button
      const inspectButton = getByText('Inspect');
      fireEvent.press(inspectButton);

      expect(onRevalidateMock).toHaveBeenCalledWith(mockSign);
    });

    it('triggers onClose when close icon is pressed', async () => {
      const mockSign = createMockSign();
      const onCloseMock = jest.fn();

      const { getByLabelText } = await render(
        <RevalidationSignDetailsCard
          sign={mockSign}
          onClose={onCloseMock}
        />,
      );

      const closeButton = getByLabelText('Close sign details');
      fireEvent.press(closeButton);

      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
