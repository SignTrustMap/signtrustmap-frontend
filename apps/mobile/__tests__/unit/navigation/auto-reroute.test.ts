import { renderHook, act } from '@testing-library/react-native';
import {
  calculateDistanceMeters,
  calculateBearing,
  getDistanceToRouteMeters,
  isValidCoordinate,
} from '@/feature/navigation/utils/geo';
import { useAutoReroute } from '@/feature/navigation/hooks/use-auto-reroute';
import type { MapCoordinate } from '@/types/navigationType';

describe('Navigation Geo & Auto-Reroute Unit Test Suite', () => {
  // =========================================================================
  // 1. Geo Utilities Tests
  // =========================================================================
  describe('1. Geo Utility Calculations', () => {
    it('validates coordinates accurately', () => {
      expect(isValidCoordinate([106.7009, 10.7769])).toBe(true);
      expect(isValidCoordinate([0, 0])).toBe(false);
      expect(isValidCoordinate(null)).toBe(false);
      expect(isValidCoordinate([200, 10])).toBe(false);
      expect(isValidCoordinate([106, 95])).toBe(false);
    });

    it('calculates distance between two known coordinates (District 1 to District 3)', () => {
      // Ben Thanh Market: [106.6983, 10.7725]
      // Turtle Lake: [106.6961, 10.7828]
      const d1: MapCoordinate = [106.6983, 10.7725];
      const d3: MapCoordinate = [106.6961, 10.7828];
      const distance = calculateDistanceMeters(d1, d3);

      // Distance is ~1.17 km (1100m - 1250m)
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1250);
    });

    it('calculates forward bearing from South to North as ~0 or ~360 degrees', () => {
      const south: MapCoordinate = [106.7000, 10.7000];
      const north: MapCoordinate = [106.7000, 10.8000];
      const bearing = calculateBearing(south, north);

      expect(bearing).toBe(0);
    });

    it('calculates forward bearing from West to East as ~90 degrees', () => {
      const west: MapCoordinate = [106.6000, 10.7000];
      const east: MapCoordinate = [106.7000, 10.7000];
      const bearing = calculateBearing(west, east);

      expect(bearing).toBe(90);
    });

    it('calculates perpendicular distance to route segment accurately', () => {
      const route: MapCoordinate[] = [
        [106.7000, 10.7700],
        [106.7000, 10.7800],
      ];
      // Point directly on route
      expect(getDistanceToRouteMeters([106.7000, 10.7750], route)).toBeCloseTo(0, 0);

      // Point 0.001 deg (~109m) East of route midpoint
      const offRoutePoint: MapCoordinate = [106.7010, 10.7750];
      const dist = getDistanceToRouteMeters(offRoutePoint, route);
      expect(dist).toBeGreaterThan(90);
      expect(dist).toBeLessThan(120);
    });
  });

  // =========================================================================
  // 2. useAutoReroute Hook Tests
  // =========================================================================
  describe('2. useAutoReroute Hook Behavior', () => {
    const plannedRoute: MapCoordinate[] = [
      [106.7000, 10.7700],
      [106.7000, 10.7750],
      [106.7000, 10.7800],
    ];

    it('does not trigger reroute when user is within 45m threshold of route', async () => {
      const onRerouteTriggered = jest.fn();
      const userOnRoute: MapCoordinate = [106.7000, 10.7725];

      const { result } = await renderHook(() =>
        useAutoReroute({
          isNavigating: true,
          isCustomStart: false,
          hasLiveLocation: true,
          userCoordinate: userOnRoute,
          routeCoordinates: plannedRoute,
          onRerouteTriggered,
        }),
      );

      expect(result.current.rerouteOrigin).toBeUndefined();
      expect(onRerouteTriggered).not.toHaveBeenCalled();
    });

    it('does not trigger reroute on isolated GPS glitches (fewer than 3 readings > 45m)', async () => {
      const onRerouteTriggered = jest.fn();
      // Point ~100m East of route
      const offRouteUser: MapCoordinate = [106.7010, 10.7725];

      const { rerender } = await renderHook(
        (props: { coord: MapCoordinate }) =>
          useAutoReroute({
            isNavigating: true,
            isCustomStart: false,
            hasLiveLocation: true,
            userCoordinate: props.coord,
            routeCoordinates: plannedRoute,
            onRerouteTriggered,
          }),
        { initialProps: { coord: offRouteUser } },
      );

      // Reading 1: not triggered yet
      expect(onRerouteTriggered).not.toHaveBeenCalled();

      // Reading 2: not triggered yet
      await rerender({ coord: [106.7011, 10.7726] });
      expect(onRerouteTriggered).not.toHaveBeenCalled();
    });

    it('triggers reroute after consecutive off-route readings (> 45m)', async () => {
      const onRerouteTriggered = jest.fn();
      const onRouteStart: MapCoordinate = [106.7000, 10.7725];
      const offRoute1: MapCoordinate = [106.7005, 10.7735];
      const offRoute2: MapCoordinate = [106.7005, 10.7736];
      const offRoute3: MapCoordinate = [106.7005, 10.7737];

      const { rerender, result } = await renderHook(
        (props: { coord: MapCoordinate }) =>
          useAutoReroute({
            isNavigating: true,
            isCustomStart: false,
            hasLiveLocation: true,
            userCoordinate: props.coord,
            routeCoordinates: plannedRoute,
            onRerouteTriggered,
          }),
        { initialProps: { coord: onRouteStart } },
      );

      // Off-route reading 1
      await rerender({ coord: offRoute1 });
      expect(onRerouteTriggered).not.toHaveBeenCalled();

      // Off-route reading 2
      await rerender({ coord: offRoute2 });
      expect(onRerouteTriggered).not.toHaveBeenCalled();

      // Off-route reading 3 -> triggers reroute
      await rerender({ coord: offRoute3 });
      expect(onRerouteTriggered).toHaveBeenCalledWith(offRoute3);
      expect(result.current.rerouteOrigin).toEqual(offRoute3);
    });

    it('resets off-route count when user rejoins planned route before 3rd reading', async () => {
      const onRerouteTriggered = jest.fn();
      const onRouteStart: MapCoordinate = [106.7000, 10.7725];
      const offRoute1: MapCoordinate = [106.7005, 10.7735];
      const offRoute2: MapCoordinate = [106.7005, 10.7736];
      const backOnRoute: MapCoordinate = [106.7000, 10.7725];
      const offRouteAgain: MapCoordinate = [106.7005, 10.7735];

      const { rerender } = await renderHook(
        (props: { coord: MapCoordinate }) =>
          useAutoReroute({
            isNavigating: true,
            isCustomStart: false,
            hasLiveLocation: true,
            userCoordinate: props.coord,
            routeCoordinates: plannedRoute,
            onRerouteTriggered,
          }),
        { initialProps: { coord: onRouteStart } },
      );

      await rerender({ coord: offRoute1 });
      await rerender({ coord: offRoute2 });

      // Rejoined route
      await rerender({ coord: backOnRoute });

      // Off-route again - count starts over
      await rerender({ coord: offRouteAgain });
      expect(onRerouteTriggered).not.toHaveBeenCalled();
    });

    it('resets reroute state when resetReroute() is called manually', async () => {
      const onRerouteTriggered = jest.fn();
      const onRouteStart: MapCoordinate = [106.7000, 10.7725];

      const { rerender, result } = await renderHook(
        (props: { coord: MapCoordinate }) =>
          useAutoReroute({
            isNavigating: true,
            isCustomStart: false,
            hasLiveLocation: true,
            userCoordinate: props.coord,
            routeCoordinates: plannedRoute,
            onRerouteTriggered,
          }),
        { initialProps: { coord: onRouteStart } },
      );

      await rerender({ coord: [106.7005, 10.7735] });
      await rerender({ coord: [106.7005, 10.7736] });
      await rerender({ coord: [106.7005, 10.7737] });
      expect(result.current.rerouteOrigin).toBeDefined();

      await act(async () => {
        result.current.resetReroute();
      });

      expect(result.current.rerouteOrigin).toBeUndefined();
    });
  });
});
