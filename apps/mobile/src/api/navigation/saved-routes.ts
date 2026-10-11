import { API_PATHS } from "@/api/api";
import { apiRequest, jsonApiRequest } from "@/api/api-client";
import type { RouteSign } from "./navigation";

export interface SavedRouteItem {
  id: string;
  userId: string;
  name: string;
  originName: string;
  originLatitude: number;
  originLongitude: number;
  destinationName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  vehicleMode: 'MOTORCYCLE' | 'DRIVING' | 'CYCLING' | 'WALKING';
  filterFixedSignsOnly: boolean;
  encodedPolyline?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedRouteDto {
  name: string;
  originName: string;
  originLatitude: number;
  originLongitude: number;
  destinationName: string;
  destinationLatitude: number;
  destinationLongitude: number;
  vehicleMode?: 'MOTORCYCLE' | 'DRIVING' | 'CYCLING' | 'WALKING';
  filterFixedSignsOnly?: boolean;
  encodedPolyline?: string;
  distanceMeters?: number;
  durationSeconds?: number;
}

export async function getSavedRoutes(
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRouteItem[]> {
  return apiRequest<SavedRouteItem[]>(
    API_PATHS.SAVED_ROUTES,
    { signal },
    accessToken,
  );
}

export async function createSavedRoute(
  dto: CreateSavedRouteDto,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRouteItem> {
  return jsonApiRequest<SavedRouteItem>(
    API_PATHS.SAVED_ROUTES,
    dto,
    accessToken,
    signal,
    'POST',
  );
}

export async function updateSavedRoute(
  id: string,
  dto: Partial<CreateSavedRouteDto>,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRouteItem> {
  return jsonApiRequest<SavedRouteItem>(
    `${API_PATHS.SAVED_ROUTES}/${id}`,
    dto,
    accessToken,
    signal,
    'PATCH',
  );
}

export async function deleteSavedRoute(
  id: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `${API_PATHS.SAVED_ROUTES}/${id}`,
    { method: 'DELETE', signal },
    accessToken,
  );
}

export async function getSavedRouteSigns(
  id: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<RouteSign[]> {
  return apiRequest<RouteSign[]>(
    `${API_PATHS.SAVED_ROUTES}/${id}/signs`,
    { signal },
    accessToken,
  );
}
