import type { MapCoordinate } from '@/types/navigationType';

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

/**
 * Calculates the forward bearing (azimuth) from coord1 to coord2 in degrees [0, 360).
 */
export function calculateBearing(
  coord1: MapCoordinate,
  coord2: MapCoordinate,
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(bearing);
}

/**
 * Calculates the forward route bearing (azimuth in degrees [0, 360))
 * for the route segment at or ahead of the given coordinate.
 */
export function getRouteForwardBearing(
  coordinate: MapCoordinate | undefined,
  routeCoordinates: MapCoordinate[] | undefined,
): number {
  if (!routeCoordinates || routeCoordinates.length < 2) return 0;

  // If no coordinate provided, take initial segment
  if (!coordinate) {
    for (let i = 1; i < routeCoordinates.length; i++) {
      const d = calculateDistanceMeters(routeCoordinates[0], routeCoordinates[i]);
      if (d >= 8) {
        return calculateBearing(routeCoordinates[0], routeCoordinates[i]);
      }
    }
    return calculateBearing(routeCoordinates[0], routeCoordinates[1]);
  }

  // Find the closest point index on the route
  let closestIndex = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < routeCoordinates.length; i++) {
    const d = calculateDistanceMeters(coordinate, routeCoordinates[i]);
    if (d < minDistance) {
      minDistance = d;
      closestIndex = i;
    }
  }

  // Look ahead from closestIndex along the route (at least 8 meters)
  for (let i = closestIndex + 1; i < routeCoordinates.length; i++) {
    const d = calculateDistanceMeters(routeCoordinates[closestIndex], routeCoordinates[i]);
    if (d >= 8) {
      return calculateBearing(routeCoordinates[closestIndex], routeCoordinates[i]);
    }
  }

  if (closestIndex < routeCoordinates.length - 1) {
    return calculateBearing(
      routeCoordinates[closestIndex],
      routeCoordinates[closestIndex + 1],
    );
  }

  // If near the end of the route, use the final segment's bearing
  if (closestIndex > 0) {
    return calculateBearing(
      routeCoordinates[closestIndex - 1],
      routeCoordinates[closestIndex],
    );
  }

  return 0;
}

/**
 * Returns the minimum perpendicular distance (in meters) from a coordinate
 * to the nearest segment of a route polyline. Used for off-route detection.
 */
export function getDistanceToRouteMeters(
  coordinate: MapCoordinate,
  routeCoordinates: MapCoordinate[],
): number {
  if (routeCoordinates.length === 0) return 0;
  if (routeCoordinates.length === 1) {
    return calculateDistanceMeters(coordinate, routeCoordinates[0]);
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [pLon, pLat] = coordinate;
  const cosLat = Math.cos(toRad(pLat));

  let minDistMeters = Number.POSITIVE_INFINITY;

  for (let i = 1; i < routeCoordinates.length; i++) {
    const [aLon, aLat] = routeCoordinates[i - 1];
    const [bLon, bLat] = routeCoordinates[i];

    // Project to a flat metre-space centred on segment midpoint
    const scale = EARTH_RADIUS_METERS * toRad(1);
    const ax = (aLon - pLon) * cosLat * scale;
    const ay = (aLat - pLat) * scale;
    const bx = (bLon - pLon) * cosLat * scale;
    const by = (bLat - pLat) * scale;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    let dist: number;
    if (lenSq === 0) {
      dist = Math.hypot(ax, ay);
    } else {
      const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq));
      dist = Math.hypot(ax + t * dx, ay + t * dy);
    }

    if (dist < minDistMeters) minDistMeters = dist;
  }

  return minDistMeters;
}
