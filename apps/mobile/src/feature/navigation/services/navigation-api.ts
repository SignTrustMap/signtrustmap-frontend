import type { MapCoordinate } from "@/feature/navigation/data/navigation-locations";
import { apiRequest, jsonApiRequest } from "@/services/api-client";

export type VehicleMode = { id: "DRIVING"; label: string };

export type NavigationStep = {
  distance: number;
  duration: number;
  instruction: string;
  maneuver: {
    location?: MapCoordinate;
    type: string;
  };
  name: string;
};

export type RouteSign = {
  coordinate: MapCoordinate;
  id: string;
  imageUrl: string;
  name: string;
  signCode: string;
};

type DirectionsResponse = {
  shortestPath: {
    distanceMeters: number;
    durationSeconds: number;
    geometry: { latitude: number; longitude: number }[];
    steps: {
      distanceMeters: number;
      durationSeconds: number;
      geometry: { latitude: number; longitude: number }[];
      instruction: string;
      roadName: string | null;
      type: string;
    }[];
  };
};

type AlongRouteResponse = {
  signs: {
    sign: {
      id: string;
      latitude: number;
      longitude: number;
      signCropUrl: string;
      signType: { nameEn: string; signCode: string };
    };
  }[];
};

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  const error = new Error("Request aborted");
  error.name = "AbortError";
  throw error;
}

export async function getVehicleModes(): Promise<VehicleMode[]> {
  try {
    const response = await apiRequest<{ modes: VehicleMode[] }>(
      "/routing/vehicle-modes",
    );
    return response.modes;
  } catch {
    return [{ id: "DRIVING", label: "Driving" }];
  }
}

export async function getNavigationRoute(
  start: MapCoordinate,
  destination: MapCoordinate,
  _vehicleMode: VehicleMode["id"] = "DRIVING",
  signal?: AbortSignal,
) {
  const directions = await jsonApiRequest<DirectionsResponse>(
    "/routing/directions",
    {
      destinationLatitude: destination[1],
      destinationLongitude: destination[0],
      maxAlternatives: 0,
      originLatitude: start[1],
      originLongitude: start[0],
    },
  );
  throwIfAborted(signal);

  const coordinates = directions.shortestPath.geometry.map(
    (point): MapCoordinate => [point.longitude, point.latitude],
  );
  let signs: AlongRouteResponse = { signs: [] };
  try {
    signs = await jsonApiRequest<AlongRouteResponse>("/signs/along-route", {
      geometry: directions.shortestPath.geometry,
    });
  } catch {
    // If sign querying fails or geometry payload is large, proceed with route calculation
    signs = { signs: [] };
  }
  throwIfAborted(signal);

  return {
    coordinates,
    distance: directions.shortestPath.distanceMeters,
    duration: directions.shortestPath.durationSeconds,
    signs: signs.signs.map(
      ({ sign }): RouteSign => ({
        coordinate: [sign.longitude, sign.latitude],
        id: sign.id,
        imageUrl: sign.signCropUrl,
        name: sign.signType.nameEn,
        signCode: sign.signType.signCode,
      }),
    ),
    steps: directions.shortestPath.steps.map(
      (step): NavigationStep => ({
        distance: step.distanceMeters,
        duration: step.durationSeconds,
        instruction: step.instruction,
        maneuver: {
          location: step.geometry[0]
            ? [step.geometry[0].longitude, step.geometry[0].latitude]
            : undefined,
          type: step.type,
        },
        name: step.roadName ?? "",
      }),
    ),
  };
}
