import type {
    CreateAlertProfileDto,
    CustomAlertProfile,
    EndNavigationSessionResponse,
    InitiateNavigationSessionDto,
    InitiateNavigationSessionResponse,
    MapCoordinate,
    NavigationPreferences,
    NavigationResponseDto,
    RouteDirectionsRequestDto,
    UpdateNavigationPreferencesDto,
    VehicleMode,
    VehicleModeId,
    VehicleType,
} from "@/types/navigationType";
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
    actualCropUrl?: string;
    frameUrl?: string;
    name: string;
    nameVi?: string;
    nameEn?: string;
    signCode: string;
    freshnessScore?: number;
    status?: string;
    roadName?: string;
    displayAddress?: string;
    lastVerifiedAt?: string;
    createdAt?: string;
    taskId?: string;
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
    alternatives?: {
        distanceMeters: number;
        durationSeconds: number;
        geometry: { latitude: number; longitude: number }[];
    }[];
};

function throwIfAborted(signal?: AbortSignal) {
    if (!signal?.aborted) return;
    const error = new Error("Request aborted");
    error.name = "AbortError";
    throw error;
}

export function resolveRoutingModeAndType(mode: VehicleModeId = 'DRIVING'): {
    vehicleMode: 'DRIVING' | 'CYCLING' | 'WALKING' | 'MOTORCYCLE' | 'BIKE';
    vehicleType: VehicleType;
} {
    const upper = (mode || 'DRIVING').toUpperCase();
    if (upper === 'MOTORCYCLE') {
        return { vehicleMode: 'MOTORCYCLE', vehicleType: 'MOTORCYCLE' };
    }
    if (upper === 'BIKE') {
        return { vehicleMode: 'BIKE', vehicleType: 'MOTORCYCLE' };
    }
    if (upper === 'CYCLING') {
        return { vehicleMode: 'CYCLING', vehicleType: 'BICYCLE' };
    }
    if (upper === 'WALKING') {
        return { vehicleMode: 'WALKING', vehicleType: 'PEDESTRIAN' };
    }
    return { vehicleMode: 'DRIVING', vehicleType: 'CAR' };
}

export async function getVehicleModes(signal?: AbortSignal): Promise<VehicleMode[]> {
    try {
        const response = await apiRequest<{ defaultMode?: string; modes: VehicleMode[] }>(
            API_PATHS.VEHICLE_MODES,
            { signal },
        );
        return response.modes;
    } catch (error) {
        if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
            throw error;
        }
        return [
            { id: "MOTORCYCLE", label: "Xe máy (Motorcycle)" },
            { id: "DRIVING", label: "Ô tô (Car)" },
            { id: "CYCLING", label: "Xe đạp (Bicycle)" },
            { id: "WALKING", label: "Đi bộ (Walking)" },
        ];
    }
}

export type RoutingOptions = {
    enabledCategoryCodes?: string[];
    maxAlternatives?: number;
    alternativeThresholdPercent?: number;
    snapRadiusMeters?: number;
};

/** Calculate route directions: POST /routing/directions */
export async function getNavigationRoute(
    start: MapCoordinate,
    destination: MapCoordinate,
    vehicleMode: VehicleMode["id"] = "DRIVING",
    signal?: AbortSignal,
    options?: RoutingOptions,
) {
    const { vehicleMode: resolvedMode, vehicleType: resolvedType } = resolveRoutingModeAndType(vehicleMode);

    console.log('[Routing] Sending coords:', {
        origin: [start[1], start[0]],
        destination: [destination[1], destination[0]],
        vehicleMode: resolvedMode,
        vehicleType: resolvedType,
    });

    const payload: RouteDirectionsRequestDto = {
        destinationLatitude: destination[1],
        destinationLongitude: destination[0],
        maxAlternatives: options?.maxAlternatives ?? 2,
        originLatitude: start[1],
        originLongitude: start[0],
        vehicleMode: resolvedMode,
        vehicleType: resolvedType,
        ...(options?.enabledCategoryCodes ? { enabledCategoryCodes: options.enabledCategoryCodes } : {}),
        ...(options?.alternativeThresholdPercent != null ? { alternativeThresholdPercent: options.alternativeThresholdPercent } : {}),
        ...(options?.snapRadiusMeters != null ? { snapRadiusMeters: options.snapRadiusMeters } : {}),
    };

    const directions = await jsonApiRequest<DirectionsResponse>(
        API_PATHS.NAVIGATION_ROUTING,
        payload,
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

/** Preview route geometry and verified signs along the corridor in one request: POST /navigation/route-preview */
export async function previewNavigationRoute(
    start: MapCoordinate,
    destination: MapCoordinate,
    vehicleMode: VehicleMode["id"] = "DRIVING",
    options?: RoutingOptions,
    signal?: AbortSignal,
): Promise<NavigationResponseDto> {
    const { vehicleMode: resolvedMode, vehicleType: resolvedType } = resolveRoutingModeAndType(vehicleMode);

    const payload: RouteDirectionsRequestDto = {
        destinationLatitude: destination[1],
        destinationLongitude: destination[0],
        maxAlternatives: options?.maxAlternatives ?? 2,
        originLatitude: start[1],
        originLongitude: start[0],
        vehicleMode: resolvedMode,
        vehicleType: resolvedType,
        ...(options?.enabledCategoryCodes ? { enabledCategoryCodes: options.enabledCategoryCodes } : {}),
        ...(options?.alternativeThresholdPercent != null ? { alternativeThresholdPercent: options.alternativeThresholdPercent } : {}),
        ...(options?.snapRadiusMeters != null ? { snapRadiusMeters: options.snapRadiusMeters } : {}),
    };

    return jsonApiRequest<NavigationResponseDto>(
        API_PATHS.NAVIGATION_ROUTE_PREVIEW,
        payload,
        undefined,
        signal,
    );
}

/** Retrieve current driver preferences for vehicle type & enabled categories: GET /navigation/preferences */
export async function getNavigationPreferences(
    accessToken: string,
    signal?: AbortSignal,
): Promise<NavigationPreferences> {
    return apiRequest<NavigationPreferences>(
        API_PATHS.NAVIGATION_PREFERENCES,
        { signal },
        accessToken,
    );
}

/** Update driver preferences: PUT /navigation/preferences */
export async function updateNavigationPreferences(
    preferences: UpdateNavigationPreferencesDto,
    accessToken: string,
    signal?: AbortSignal,
): Promise<NavigationPreferences> {
    return jsonApiRequest<NavigationPreferences>(
        API_PATHS.NAVIGATION_PREFERENCES,
        preferences,
        accessToken,
        signal,
        'PUT',
    );
}

/** Initiate navigation session with credit gate (5 credits deduction): POST /navigation/sessions/initiate */
export async function initiateNavigationSession(
    dto: InitiateNavigationSessionDto,
    accessToken: string,
    signal?: AbortSignal,
): Promise<InitiateNavigationSessionResponse> {
    return jsonApiRequest<InitiateNavigationSessionResponse>(
        API_PATHS.NAVIGATION_SESSIONS_INITIATE,
        dto,
        accessToken,
        signal,
        'POST',
    );
}

/** Conclude active navigation session: POST /navigation/sessions/:id/end */
export async function endNavigationSession(
    sessionId: string,
    accessToken: string,
    signal?: AbortSignal,
): Promise<EndNavigationSessionResponse> {
    return apiRequest<EndNavigationSessionResponse>(
        `${API_PATHS.NAVIGATION_SESSIONS}/${encodeURIComponent(sessionId)}/end`,
        { method: 'POST', signal },
        accessToken,
    );
}

/** List custom alert profiles: GET /navigation/profiles */
export async function getCustomAlertProfiles(
    accessToken: string,
    signal?: AbortSignal,
): Promise<CustomAlertProfile[]> {
    return apiRequest<CustomAlertProfile[]>(
        API_PATHS.NAVIGATION_PROFILES,
        { signal },
        accessToken,
    );
}

/** Create custom alert profile (20 credits deduction): POST /navigation/profiles */
export async function createCustomAlertProfile(
    dto: CreateAlertProfileDto,
    accessToken: string,
    signal?: AbortSignal,
): Promise<CustomAlertProfile> {
    return jsonApiRequest<CustomAlertProfile>(
        API_PATHS.NAVIGATION_PROFILES,
        dto,
        accessToken,
        signal,
        'POST',
    );
}

/** Activate a custom alert profile: PUT /navigation/profiles/:id/activate */
export async function activateCustomAlertProfile(
    profileId: string,
    accessToken: string,
    signal?: AbortSignal,
): Promise<void> {
    return apiRequest<void>(
        `${API_PATHS.NAVIGATION_PROFILES}/${encodeURIComponent(profileId)}/activate`,
        { method: 'PUT', signal },
        accessToken,
    );
}

/** Delete a custom alert profile: DELETE /navigation/profiles/:id */
export async function deleteCustomAlertProfile(
    profileId: string,
    accessToken: string,
    signal?: AbortSignal,
): Promise<void> {
    return apiRequest<void>(
        `${API_PATHS.NAVIGATION_PROFILES}/${encodeURIComponent(profileId)}`,
        { method: 'DELETE', signal },
        accessToken,
    );
}
