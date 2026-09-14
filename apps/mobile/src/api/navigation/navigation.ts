import type { MapCoordinate, VehicleMode } from "@/types/navigation/navigationType";
import { apiRequest, jsonApiRequest } from "@/api/api-client";
import { API_PATHS } from "@/api/api";


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

function throwIfAborted(signal?: AbortSignal) {
    if (!signal?.aborted) return;
    const error = new Error("Request aborted");
    error.name = "AbortError";
    throw error;
}

export async function getVehicleModes(signal?: AbortSignal): Promise<VehicleMode[]> {
    try {
        const response = await apiRequest<{ modes: VehicleMode[] }>(
            API_PATHS.VEHICLE_MODES,
            { signal },
        );
        return response.modes;
    } catch (error) {
        if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
            throw error;
        }
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
        API_PATHS.NAVIGATION_ROUTING,
        {
            destinationLatitude: destination[1],
            destinationLongitude: destination[0],
            maxAlternatives: 0,
            originLatitude: start[1],
            originLongitude: start[0],
        },
        undefined,
        signal,
    );
    throwIfAborted(signal);

    const coordinates = directions.shortestPath.geometry.map(
        (point): MapCoordinate => [point.longitude, point.latitude],
    );
    return {
        coordinates,
        geometry: directions.shortestPath.geometry,
        distance: directions.shortestPath.distanceMeters,
        duration: directions.shortestPath.durationSeconds,
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
