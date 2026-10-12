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
  return apiRequest<SavedRoute[]>(
    `${API_PATHS.SAVED_ROUTES}${query}`,
    { signal },
    accessToken,
  );
}

export async function getSavedRouteById(
  id: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRoute> {
  return apiRequest<SavedRoute>(
    `${API_PATHS.SAVED_ROUTES}/${id}`,
    { signal },
    accessToken,
  );
}

export async function createSavedRoute(
  dto: CreateSavedRouteDto,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SavedRoute> {
  return jsonApiRequest<SavedRoute>(
    API_PATHS.SAVED_ROUTES,
    dto,
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
