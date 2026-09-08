import { useQuery } from '@tanstack/react-query';

import { getSignsInBounds } from '@/api/navigation/signs';
import type { MapCoordinate } from '@/types/navigation/navigationType';

export function useGetSignsInBounds(
  southWest: MapCoordinate,
  northEast: MapCoordinate,
  enabled = true,
) {
  return useQuery({
    queryKey: ['signs-in-bounds', southWest, northEast],
    queryFn: ({ signal }) => getSignsInBounds(southWest, northEast, signal),
    enabled,
  });
}
