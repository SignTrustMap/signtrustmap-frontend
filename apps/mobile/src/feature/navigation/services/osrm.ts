import type { MapCoordinate } from '@/data/driverLocations';

type OsrmRouteResponse = {
  code: string;
  routes?: {
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: MapCoordinate[];
      type: 'LineString';
    };
    legs?: {
      steps?: OsrmRouteStep[];
    }[];
  }[];
};

export type OsrmRouteStep = {
  distance: number;
  duration: number;
  maneuver: {
    location?: MapCoordinate;
    modifier?: string;
    type: string;
  };
  name: string;
};

export type OsrmRouteResult = {
  coordinates: MapCoordinate[];
  distance: number;
  duration: number;
  steps: OsrmRouteStep[];
};

export async function getDrivingRoute(
  start: MapCoordinate,
  destination: MapCoordinate,
  signal?: AbortSignal,
): Promise<OsrmRouteResult> {
  const startParam = `${start[0]},${start[1]}`;
  const destinationParam = `${destination[0]},${destination[1]}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${startParam};${destinationParam}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`OSRM route request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const route = data.routes?.[0];
  const coordinates = route?.geometry?.coordinates;

  if (data.code !== 'Ok' || !coordinates?.length) {
    throw new Error('OSRM did not return a route geometry');
  }

  const steps = route?.legs?.flatMap((leg) => leg.steps ?? []) ?? [];

  return {
    coordinates,
    distance: route?.distance ?? steps.reduce((total, step) => total + step.distance, 0),
    duration: route?.duration ?? steps.reduce((total, step) => total + step.duration, 0),
    steps,
  };
}
