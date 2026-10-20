import { API_PATHS } from '@/api/api';
import { apiRequest, apiBaseUrl } from '@/api/api-client';
import type { OfflineMapPacksResponse } from '@/types/navigationType';

/**
 * Fetch available PMTiles offline map packs catalog from the backend.
 */
export async function fetchOfflineMapPacks(
  accessToken?: string,
  signal?: AbortSignal,
): Promise<OfflineMapPacksResponse> {
  return apiRequest<OfflineMapPacksResponse>(
    API_PATHS.SPATIAL_OFFLINE_PACKS,
    { method: 'GET', signal },
    accessToken,
  );
}

/**
 * Resolves the full URL to stream or download a PMTiles map pack archive.
 */
export function getOfflineMapPackDownloadUrl(packId: string): string {
  const base = apiBaseUrl();
  return `${base}${API_PATHS.SPATIAL_OFFLINE_DOWNLOAD}/${encodeURIComponent(packId)}`;
}
