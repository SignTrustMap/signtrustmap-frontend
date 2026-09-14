import { skipToken, useQuery } from '@tanstack/react-query';

import { getSignsAlongRoute, getSignsInBounds } from '@/api/sign-map/sign-map';
import type { MapCoordinate } from '@/types/navigation/navigationType';
import type { FindSignsInBoundsParams, RoutePointDto } from '@/types/sign-map/signMapType';
import { toRouteSign } from '../utils/signs';

export function useGetSignsInBounds(
  bounds: FindSignsInBoundsParams | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['signs-in-bounds', bounds],
    queryFn: enabled && bounds
      ? ({ signal }) => getSignsInBounds(bounds, signal)
      : skipToken,
    select: (response) => response.signs.map(toRouteSign),
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
