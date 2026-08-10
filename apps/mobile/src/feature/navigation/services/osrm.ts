import type { MapCoordinate } from '@/data/driverLocations';

type OsrmRouteResponse = {
  code: string;
  routes?: {
    geometry?: {
      coordinates?: MapCoordinate[];
      type: 'LineString';
    };
  }[];
};

export async function getDrivingRoute(
  start: MapCoordinate,
  destination: MapCoordinate,
  signal?: AbortSignal,
) {
  const startParam = `${start[0]},${start[1]}`;
  const destinationParam = `${destination[0]},${destination[1]}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${startParam};${destinationParam}?overview=full&geometries=geojson`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`OSRM route request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const coordinates = data.routes?.[0]?.geometry?.coordinates;

  if (data.code !== 'Ok' || !coordinates?.length) {
    throw new Error('OSRM did not return a route geometry');
  }

  return coordinates;
}
