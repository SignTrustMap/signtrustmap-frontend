import type { MapCoordinate } from '@/feature/navigation/data/navigation-locations';

export function getRouteStopCoordinates(
  routeCoordinates: MapCoordinate[] | undefined,
  markerCount = 5,
): MapCoordinate[] {
  if (!routeCoordinates || routeCoordinates.length < 2 || markerCount < 1) return [];

  const segmentLengths: number[] = [];
  let routeLength = 0;

  for (let index = 1; index < routeCoordinates.length; index += 1) {
    const [previousLongitude, previousLatitude] = routeCoordinates[index - 1];
    const [longitude, latitude] = routeCoordinates[index];
    const segmentLength = Math.hypot(
      longitude - previousLongitude,
      latitude - previousLatitude,
    );

    segmentLengths.push(segmentLength);
    routeLength += segmentLength;
  }

  if (routeLength === 0) return [];

  return Array.from({ length: markerCount }, (_, markerIndex) => {
    const targetDistance = routeLength * ((markerIndex + 1) / (markerCount + 1));
    let travelledDistance = 0;

    for (let segmentIndex = 0; segmentIndex < segmentLengths.length; segmentIndex += 1) {
      const segmentLength = segmentLengths[segmentIndex];

      if (travelledDistance + segmentLength >= targetDistance) {
        const start = routeCoordinates[segmentIndex];
        const end = routeCoordinates[segmentIndex + 1];
        const progress = (targetDistance - travelledDistance) / segmentLength;

        return [
          start[0] + (end[0] - start[0]) * progress,
          start[1] + (end[1] - start[1]) * progress,
        ];
      }

      travelledDistance += segmentLength;
    }

    return routeCoordinates[routeCoordinates.length - 1];
  });
}
