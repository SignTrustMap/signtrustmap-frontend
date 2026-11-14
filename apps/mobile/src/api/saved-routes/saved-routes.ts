import { API_PATHS } from '@/api/api';
import { apiRequest, jsonApiRequest } from '@/api/api-client';
import type {
  CreateSavedRouteDto,
  SavedRoute,
  SavedRouteSignsResponse,
  UpdateSavedRouteDto,
} from '@/types/savedRouteType';

export async function getSavedRoutes(
  vehicleMode?: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRoute[]> {
  const query = vehicleMode ? `?vehicleMode=${encodeURIComponent(vehicleMode)}` : '';
  const raw = await apiRequest<any>(
    `${API_PATHS.SAVED_ROUTES}${query}`,
    { signal },
    accessToken,
  );
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.routes)) return raw.routes;
  return [];
}

export async function getSavedRouteById(
  id: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRoute> {
  const raw = await apiRequest<any>(
    `${API_PATHS.SAVED_ROUTES}/${id}`,
    { signal },
    accessToken,
  );
  return (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) ? raw.data : raw;
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
): Promise<SavedRoute> {
  return jsonApiRequest<SavedRoute>(
    API_PATHS.SAVED_ROUTES,
    sanitizeSavedRouteDto(dto),
    accessToken,
    signal,
    'POST',
  );
}

export async function updateSavedRoute(
  id: string,
  dto: UpdateSavedRouteDto,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRoute> {
  return jsonApiRequest<SavedRoute>(
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
): Promise<{ success: boolean; id: string }> {
  return apiRequest<{ success: boolean; id: string }>(
    `${API_PATHS.SAVED_ROUTES}/${id}`,
    { method: 'DELETE', signal },
    accessToken,
  );
}

export async function getSavedRouteSigns(
  id: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRouteSignsResponse> {
  return apiRequest<SavedRouteSignsResponse>(
    `${API_PATHS.SAVED_ROUTES}/${id}/signs`,
    { signal },
    accessToken,
  );
}
