import { skipToken, useQuery } from '@tanstack/react-query';

import { getSignsAlongRoute, getSignsInBounds } from '@/api/sign-map/sign-map';
import type { MapCoordinate } from '@/types/navigationType';
import type { FindSignsInBoundsParams, RoutePointDto } from '@/types/signMapType';
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
) {
  return useQuery({
    queryKey: ['signs-along-route', start, destination, geometry],
    queryFn: start && destination && geometry && geometry.length >= 2
      ? ({ signal }) => getSignsAlongRoute({ geometry }, signal)
      : skipToken,
    select: (response) => response.signs.map(({ sign }) => toRouteSign(sign)),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
