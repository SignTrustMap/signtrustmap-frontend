import type { MapCoordinate } from '@/types/navigationType';

const METERS_PER_DEGREE = 111_320;

export interface RouteProgressInfo {
  progress: number;
  distanceToRoute: number;
}

export function getRouteProgressInfo(
  coordinate: MapCoordinate,
  routeCoordinates: MapCoordinate[],
): RouteProgressInfo {
  if (routeCoordinates.length < 2) {
    return { progress: 0, distanceToRoute: Number.POSITIVE_INFINITY };
  }

  let bestDistanceToRoute = Number.POSITIVE_INFINITY;
  let bestProgress = 0;
  let travelledDistance = 0;

  for (let index = 1; index < routeCoordinates.length; index += 1) {
    const start = routeCoordinates[index - 1];
    const end = routeCoordinates[index];
    const latitudeScale = METERS_PER_DEGREE;
    const longitudeScale =
      METERS_PER_DEGREE * Math.cos((((start[1] + end[1]) / 2) * Math.PI) / 180);
    const segmentX = (end[0] - start[0]) * longitudeScale;
    const segmentY = (end[1] - start[1]) * latitudeScale;
    const pointX = (coordinate[0] - start[0]) * longitudeScale;
    const pointY = (coordinate[1] - start[1]) * latitudeScale;
    const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;
    const segmentProgress = segmentLengthSquared
      ? Math.max(0, Math.min(1, (pointX * segmentX + pointY * segmentY) / segmentLengthSquared))
      : 0;
    const projectedX = segmentX * segmentProgress;
    const projectedY = segmentY * segmentProgress;
    const distanceToRoute = Math.hypot(pointX - projectedX, pointY - projectedY);
    const segmentLength = Math.sqrt(segmentLengthSquared);

    if (distanceToRoute < bestDistanceToRoute) {
      bestDistanceToRoute = distanceToRoute;
      bestProgress = travelledDistance + segmentLength * segmentProgress;
    }

    travelledDistance += segmentLength;
  }

  return { progress: bestProgress, distanceToRoute: bestDistanceToRoute };
}

export function getRouteProgressMeters(
  coordinate: MapCoordinate,
  routeCoordinates: MapCoordinate[],
): number {
  return getRouteProgressInfo(coordinate, routeCoordinates).progress;
}
