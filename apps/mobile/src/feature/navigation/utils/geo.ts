import type { MapCoordinate } from '@/feature/navigation/data/navigation-locations';

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Calculates the great-circle distance between two [longitude, latitude] coordinates in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  coord1: MapCoordinate,
  coord2: MapCoordinate,
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Checks if coordinate A is within a given threshold distance (in meters) of coordinate B.
 */
export function isWithinDistance(
  coord1: MapCoordinate,
  coord2: MapCoordinate,
  thresholdMeters: number,
): boolean {
  return calculateDistanceMeters(coord1, coord2) <= thresholdMeters;
}
