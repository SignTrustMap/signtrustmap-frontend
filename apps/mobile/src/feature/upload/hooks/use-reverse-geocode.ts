import { skipToken, useQuery } from '@tanstack/react-query';

import { resolveLocation, type ResolvedLocation } from '@/api/spatial/spatial';
import { useSession } from '@/context/session-provider';

export const spatialKeys = {
  all: ['spatial'] as const,
  resolve: (lat?: number, lon?: number) => [
    'spatial',
    'resolve',
    lat != null && Number.isFinite(lat) ? Number(lat.toFixed(5)) : null,
    lon != null && Number.isFinite(lon) ? Number(lon.toFixed(5)) : null,
  ] as const,
};

export function useReverseGeocode(
  coordinates: { latitude?: number | null; longitude?: number | null } | null | undefined,
  enabled = true,
) {
  const { session } = useSession();
  const lat = coordinates?.latitude;
  const lon = coordinates?.longitude;

  const isValid =
    lat != null &&
    lon != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    (lat !== 0 || lon !== 0);

  return useQuery<ResolvedLocation | null>({
    queryKey: spatialKeys.resolve(lat ?? undefined, lon ?? undefined),
    queryFn: isValid
      ? ({ signal }) => resolveLocation(lat, lon, session?.accessToken, signal)
      : skipToken,
    enabled: Boolean(enabled && isValid),
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    gcTime: 1000 * 60 * 60, // Keep unused cache for 1 hour
  });
}
