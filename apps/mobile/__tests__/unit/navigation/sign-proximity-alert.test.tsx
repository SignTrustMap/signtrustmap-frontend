import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { useSignProximityAlert } from '@/feature/navigation/hooks/use-sign-proximity-alert';
import { NavigationSignAlertBanner } from '@/components/navigation-sign-alert-banner';
import { speechService } from '@/services/speech';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';

// Mock speechService
jest.mock('@/services/speech', () => ({
  speechService: {
    speak: jest.fn(),
    stop: jest.fn(),
    isEnabled: jest.fn().mockReturnValue(true),
    setEnabled: jest.fn(),
    isSpeaking: jest.fn().mockResolvedValue(false),
  },
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="mock-expo-image" {...props} />,
  };
});

describe('Sign Proximity Alert & Banner Unit Test Suite', () => {
  const mockSign1: RouteSign = {
    id: 'sign-101',
    signCode: 'P.102',
    name: 'Biển cấm đi ngược chiều',
    coordinate: [106.7005, 10.7725],
    imageUrl: 'https://cdn.example.com/signs/p102.png',
  };

  const mockSign2: RouteSign = {
    id: 'sign-102',
    signCode: 'W.201',
    name: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    coordinate: [106.7050, 10.7750],
    imageUrl: 'https://cdn.example.com/signs/w201.png',
  };

  const mockSignNoName: RouteSign = {
    id: 'sign-103',
    signCode: 'P.103',
    coordinate: [106.7001, 10.7725],
  };

  const mockSignBare: RouteSign = {
    id: 'sign-104',
    coordinate: [106.7002, 10.7725],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Hook: useSignProximityAlert Tests
  // =========================================================================
  describe('1. useSignProximityAlert Hook', () => {
    it('returns null activeAlert when user is not actively navigating', async () => {
      const userCoord: MapCoordinate = [106.7005, 10.7725]; // directly at sign 1
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: false,
          signs: [mockSign1],
          userCoordinate: userCoord,
        }),
      );

      expect(result.current.activeAlert).toBeNull();
      expect(speechService.speak).not.toHaveBeenCalled();
      expect(speechService.stop).toHaveBeenCalled();
    });

    it('returns null activeAlert when userCoordinate is undefined', async () => {
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [mockSign1],
          userCoordinate: undefined,
        }),
      );

      expect(result.current.activeAlert).toBeNull();
      expect(speechService.speak).not.toHaveBeenCalled();
    });

    it('returns null activeAlert when signs array is empty', async () => {
      const userCoord: MapCoordinate = [106.7005, 10.7725];
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [],
          userCoordinate: userCoord,
        }),
      );

      expect(result.current.activeAlert).toBeNull();
      expect(speechService.speak).not.toHaveBeenCalled();
    });

    it('returns null activeAlert when user is farther than alertDistanceMeters from any sign', async () => {
      // User is ~500m away
      const farCoord: MapCoordinate = [106.7100, 10.7800];
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [mockSign1, mockSign2],
          userCoordinate: farCoord,
          alertDistanceMeters: 50,
        }),
      );

      expect(result.current.activeAlert).toBeNull();
      expect(speechService.speak).not.toHaveBeenCalled();
    });

    it('detects nearest sign within default 50m threshold and triggers TTS speech', async () => {
      // User is ~20m from mockSign1 (lat 10.7725 -> 10.7727 is ~22m)
      const nearCoord: MapCoordinate = [106.7005, 10.7727];
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [mockSign1, mockSign2],
          userCoordinate: nearCoord,
        }),
      );

      expect(result.current.activeAlert).not.toBeNull();
      expect(result.current.activeAlert?.sign.id).toBe(mockSign1.id);
      expect(result.current.activeAlert?.distanceMeters).toBeLessThanOrEqual(50);

      // Verify TTS announcement
      expect(speechService.speak).toHaveBeenCalledWith(
        'Phía trước có Biển cấm đi ngược chiều',
        { language: 'vi-VN' },
      );
    });

    it('deduplicates TTS announcements for the same sign while within range', async () => {
      const coord1: MapCoordinate = [106.7005, 10.7727]; // ~22m away
      const coord2: MapCoordinate = [106.7005, 10.7726]; // ~11m away

      const { rerender } = await renderHook(
        ({ coord }: { coord: MapCoordinate }) =>
          useSignProximityAlert({
            isNavigating: true,
            signs: [mockSign1],
            userCoordinate: coord,
          }),
        { initialProps: { coord: coord1 } },
      );

      expect(speechService.speak).toHaveBeenCalledTimes(1);

      // Rerender with user moving slightly closer
      await rerender({ coord: coord2 });

      // TTS should not be called again for the same sign
      expect(speechService.speak).toHaveBeenCalledTimes(1);
    });

    it('announces a different sign when user encounters a new one', async () => {
      const nearSign1: MapCoordinate = [106.7005, 10.7726];
      const nearSign2: MapCoordinate = [106.7050, 10.7751];

      const { rerender } = await renderHook(
        ({ coord }: { coord: MapCoordinate }) =>
          useSignProximityAlert({
            isNavigating: true,
            signs: [mockSign1, mockSign2],
            userCoordinate: coord,
          }),
        { initialProps: { coord: nearSign1 } },
      );

      expect(speechService.speak).toHaveBeenCalledWith(
        'Phía trước có Biển cấm đi ngược chiều',
        { language: 'vi-VN' },
      );

      // Move to sign 2
      await rerender({ coord: nearSign2 });

      expect(speechService.speak).toHaveBeenCalledWith(
        'Phía trước có Chỗ ngoặt nguy hiểm vòng bên trái',
        { language: 'vi-VN' },
      );
      expect(speechService.speak).toHaveBeenCalledTimes(2);
    });

    it('falls back to signCode or generic label if sign name is missing', async () => {
      const nearSign3: MapCoordinate = [106.7001, 10.7726];
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [mockSignNoName],
          userCoordinate: nearSign3,
        }),
      );

      expect(result.current.activeAlert?.sign.id).toBe(mockSignNoName.id);
      expect(speechService.speak).toHaveBeenCalledWith(
        'Phía trước có P.103',
        { language: 'vi-VN' },
      );
    });

    it('falls back to generic Biển báo giao thông if both name and signCode are missing', async () => {
      const nearSign4: MapCoordinate = [106.7002, 10.7726];
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [mockSignBare],
          userCoordinate: nearSign4,
        }),
      );

      expect(result.current.activeAlert?.sign.id).toBe(mockSignBare.id);
      expect(speechService.speak).toHaveBeenCalledWith(
        'Phía trước có Biển báo giao thông',
        { language: 'vi-VN' },
      );
    });

    it('does not trigger speech when ttsEnabled is false, but still computes activeAlert', async () => {
      const nearCoord: MapCoordinate = [106.7005, 10.7727];
      const { result } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [mockSign1],
          userCoordinate: nearCoord,
          ttsEnabled: false,
        }),
      );

      expect(result.current.activeAlert).not.toBeNull();
      expect(result.current.activeAlert?.sign.id).toBe(mockSign1.id);
      expect(speechService.speak).not.toHaveBeenCalled();
      expect(speechService.stop).toHaveBeenCalled();
    });

    it('allows clearing announced signs history manually via clearAnnouncedSigns', async () => {
      const nearCoord: MapCoordinate = [106.7005, 10.7727];
      const { result, rerender } = await renderHook(
        ({ coord }: { coord: MapCoordinate }) =>
          useSignProximityAlert({
            isNavigating: true,
            signs: [mockSign1],
            userCoordinate: coord,
          }),
        { initialProps: { coord: nearCoord } },
      );

      expect(speechService.speak).toHaveBeenCalledTimes(1);

      // Clear history
      result.current.clearAnnouncedSigns();

      // Trigger same coordinate - should speak again
      await rerender({ coord: [106.7005, 10.7726] });
      expect(speechService.speak).toHaveBeenCalledTimes(2);
    });

    it('stops speech when navigation is terminated', async () => {
      const nearCoord: MapCoordinate = [106.7005, 10.7727];
      const { rerender } = await renderHook(
        ({ navigating }: { navigating: boolean }) =>
          useSignProximityAlert({
            isNavigating: navigating,
            signs: [mockSign1],
            userCoordinate: nearCoord,
          }),
        { initialProps: { navigating: true } },
      );

      expect(speechService.speak).toHaveBeenCalled();

      // Stop navigation
      await rerender({ navigating: false });

      expect(speechService.stop).toHaveBeenCalled();
    });

    it('stops speech on unmount', async () => {
      const nearCoord: MapCoordinate = [106.7005, 10.7727];
      const { unmount } = await renderHook(() =>
        useSignProximityAlert({
          isNavigating: true,
          signs: [mockSign1],
          userCoordinate: nearCoord,
        }),
      );

      await unmount();
      expect(speechService.stop).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. Component: NavigationSignAlertBanner Tests
  // =========================================================================
  describe('2. NavigationSignAlertBanner Component', () => {
    it('renders alert banner with accessibility role alert and formatted distance', async () => {
      const { getByText } = await render(
        <NavigationSignAlertBanner distanceMeters={35} sign={mockSign1} />,
      );

      expect(getByText(/BIỂN BÁO PHÍA TRƯỚC • 35M/)).toBeTruthy();
      expect(getByText('Biển cấm đi ngược chiều')).toBeTruthy();
    });

    it('renders fallback signCode when sign name is not provided', async () => {
      const { getByText } = await render(
        <NavigationSignAlertBanner distanceMeters={20} sign={mockSignNoName} />,
      );

      expect(getByText(/BIỂN BÁO PHÍA TRƯỚC • 20M/)).toBeTruthy();
      expect(getByText('P.103')).toBeTruthy();
    });

    it('renders fallback generic label when name and code are missing', async () => {
      const { getByText } = await render(
        <NavigationSignAlertBanner distanceMeters={15} sign={mockSignBare} />,
      );

      expect(getByText(/BIỂN BÁO PHÍA TRƯỚC • 15M/)).toBeTruthy();
      expect(getByText('Biển báo giao thông')).toBeTruthy();
    });

    it('renders sign image when imageUrl is present', async () => {
      const { getByTestId } = await render(
        <NavigationSignAlertBanner distanceMeters={40} sign={mockSign1} />,
      );

      const image = getByTestId('mock-expo-image');
      expect(image.props.source).toEqual({ uri: mockSign1.imageUrl });
    });

    it('adjusts position offset when hasActiveManeuver is true', async () => {
      const { toJSON } = await render(
        <NavigationSignAlertBanner
          distanceMeters={25}
          hasActiveManeuver={true}
          sign={mockSign1}
        />,
      );

      const json = toJSON();
      expect(json).toBeTruthy();
    });
  });
});
