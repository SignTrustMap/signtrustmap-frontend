import { API_PATHS } from "@/api/api";
import { apiRequest, jsonApiRequest } from "@/api/api-client";
import type { RouteSign } from "./navigation";

export interface SavedRouteItem {
  id: string;
  userId: string;
  name: string;
  title?: string;
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
  const routes = await apiRequest<any[]>(
    API_PATHS.SAVED_ROUTES,
    { signal },
    accessToken,
  );
  return (routes || []).map((r) => ({
    ...r,
    name: r.name || r.title || `${r.originName || 'Xuất phát'} ➔ ${r.destinationName || 'Điểm đến'}`,
  }));
}

function sanitizeSavedRouteDto<T extends Partial<CreateSavedRouteDto>>(dto: T): T {
  const sanitized = { ...dto };
  if (sanitized.distanceMeters != null && !Number.isNaN(sanitized.distanceMeters)) {
    sanitized.distanceMeters = Math.round(sanitized.distanceMeters);
  }
  if (sanitized.durationSeconds != null && !Number.isNaN(sanitized.durationSeconds)) {
    sanitized.durationSeconds = Math.round(sanitized.durationSeconds);
  }
  return sanitized;
}

export async function createSavedRoute(
  dto: CreateSavedRouteDto,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRouteItem> {
  return jsonApiRequest<SavedRouteItem>(
    API_PATHS.SAVED_ROUTES,
    sanitizeSavedRouteDto(dto),
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
    sanitizeSavedRouteDto(dto),
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
