import { skipToken, useQuery } from '@tanstack/react-query';
import {
  getNearbySignCandidates,
  getSignsAlongRoute,
  getSignsInBounds,
} from '@/api/sign-map/sign-map';
import type { MapCoordinate, NearbySignsQuery, VehicleMode } from '@/types/navigationType';
import type { FindSignsInBoundsParams, RoutePointDto } from '@/types/signMapType';
import { resolveRoutingModeAndType } from '@/api/navigation/navigation';
import { toRouteSign } from '../utils/signs';

export function isRealWorldBounds(bounds: FindSignsInBoundsParams | undefined): boolean {
  if (!bounds) return false;
  const { minLat, maxLat, minLon, maxLon } = bounds;
  // Ignore uninitialized global / default fallback bounds
  if (minLat <= -80 && maxLat >= 80 && minLon <= -80 && maxLon >= 80) return false;
  return (
    Number.isFinite(minLat) &&
    Number.isFinite(maxLat) &&
    Number.isFinite(minLon) &&
    Number.isFinite(maxLon)
  );
}

export function useGetSignsInBounds(
  bounds: FindSignsInBoundsParams | undefined,
  enabled = true,
) {
  const validBounds = isRealWorldBounds(bounds);

  return useQuery({
    queryKey: ['signs-in-bounds', bounds],
    queryFn: enabled && validBounds && bounds
      ? ({ signal }) => getSignsInBounds(bounds, signal)
      : skipToken,
    select: (response) => response.signs.map(toRouteSign),
    enabled: Boolean(enabled && validBounds && bounds),
    staleTime: 30_000,
  });
}

export function useGetSignsAlongRoute(
  start: MapCoordinate | undefined,
  destination: MapCoordinate | undefined,
  geometry: RoutePointDto[] | undefined,
  vehicleMode: VehicleMode["id"] = "DRIVING",
  enabledCategoryCodes?: string[],
) {
  const { vehicleType } = resolveRoutingModeAndType(vehicleMode);
  return useQuery({
    queryKey: ['signs-along-route', start, destination, geometry, vehicleType, enabledCategoryCodes],
    queryFn: start && destination && geometry && geometry.length >= 2
      ? ({ signal }) => getSignsAlongRoute({ geometry, vehicleType, enabledCategoryCodes }, signal)
      : skipToken,
    select: (response) => response.signs.map(({ sign }) => toRouteSign(sign)),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useGetNearbySigns(
  params: NearbySignsQuery | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['nearby-signs', params],
    queryFn: enabled && params && Number.isFinite(params.latitude) && Number.isFinite(params.longitude)
      ? ({ signal }) => getNearbySignCandidates(params, signal)
      : skipToken,
    select: (response) => response.signs.map(toRouteSign),
    enabled: Boolean(enabled && params && Number.isFinite(params.latitude) && Number.isFinite(params.longitude)),
    staleTime: 10_000,
  });
}
