import { API_PATHS } from '@/api/api';
import { apiRequest, apiBaseUrl } from '@/api/api-client';
import { useQuery } from '@tanstack/react-query';
import type { OfflineMapPack, OfflineMapPacksResponse } from '@/types/navigationType';

/**
 * Predefined offline PMTiles map packs for Vietnam.
 * Used as fallback catalog when the backend API endpoint is unreachable or in transition.
 */
export const DEFAULT_OFFLINE_MAP_PACKS: OfflineMapPack[] = [
  {
    id: 'vietnam-osm',
    name: 'Bản đồ Việt Nam (PMTiles Offline)',
    description: 'Dữ liệu bản đồ vector đường bộ và biển báo toàn lãnh thổ Việt Nam',
    region: 'Toàn quốc',
    countryCode: 'VN',
    format: 'pmtiles',
    fileName: 'vietnam.pmtiles',
    sizeBytes: 439804651,
    sizeMb: 419.43,
    minZoom: 0,
    maxZoom: 15,
    bounds: [102.14, 8.18, 109.46, 23.39],
    isAvailable: true,
    lastModified: '2026-10-01T00:00:00Z',
    downloadUrl: '/spatial/tiles/offline/download/vietnam-osm',
  },
  {
    id: 'hanoi-north-osm',
    name: 'Khu vực Miền Bắc & Hà Nội',
    description: 'Bản đồ vector chi tiết Thủ đô Hà Nội và các tỉnh Đồng bằng sông Hồng',
    region: 'Miền Bắc',
    countryCode: 'VN',
    format: 'pmtiles',
    fileName: 'hanoi-north.pmtiles',
    sizeBytes: 149422080,
    sizeMb: 142.5,
    minZoom: 6,
    maxZoom: 16,
    bounds: [105.2, 20.5, 106.5, 21.6],
    isAvailable: true,
    lastModified: '2026-10-01T00:00:00Z',
    downloadUrl: '/spatial/tiles/offline/download/hanoi-north-osm',
  },
  {
    id: 'hcmc-south-osm',
    name: 'Khu vực Miền Nam & TP. Hồ Chí Minh',
    description: 'Bản đồ vector chi tiết TP. Hồ Chí Minh, Bình Dương và Đồng Nai',
    region: 'Miền Nam',
    countryCode: 'VN',
    format: 'pmtiles',
    fileName: 'hcmc-south.pmtiles',
    sizeBytes: 165888000,
    sizeMb: 158.2,
    minZoom: 6,
    maxZoom: 16,
    bounds: [106.3, 10.3, 107.1, 11.2],
    isAvailable: true,
    lastModified: '2026-10-01T00:00:00Z',
    downloadUrl: '/spatial/tiles/offline/download/hcmc-south-osm',
  },
  {
    id: 'danang-central-osm',
    name: 'Khu vực Miền Trung & Đà Nẵng',
    description: 'Bản đồ vector chi tiết Đà Nẵng, Huế, Hội An và trục ven biển',
    region: 'Miền Trung',
    countryCode: 'VN',
    format: 'pmtiles',
    fileName: 'danang-central.pmtiles',
    sizeBytes: 88080384,
    sizeMb: 84.0,
    minZoom: 6,
    maxZoom: 16,
    bounds: [107.8, 15.8, 108.6, 16.5],
    isAvailable: true,
    lastModified: '2026-10-01T00:00:00Z',
    downloadUrl: '/spatial/tiles/offline/download/danang-central-osm',
  },
];

/**
 * Fetch available PMTiles offline map packs catalog from the backend.
 * Falls back to DEFAULT_OFFLINE_MAP_PACKS if the backend endpoint is unavailable or returns 404.
 */
export async function fetchOfflineMapPacks(
  accessToken?: string,
  signal?: AbortSignal,
): Promise<OfflineMapPacksResponse> {
  try {
    const data = await apiRequest<OfflineMapPacksResponse>(
      API_PATHS.SPATIAL_OFFLINE_PACKS,
      { method: 'GET', signal },
      accessToken,
    );

    if (data && Array.isArray(data.packs) && data.packs.length > 0) {
      return data;
    }
  } catch (error) {
    // When the backend endpoint is not yet deployed or returns 404, fallback gracefully
    console.warn('[OfflineTiles] Backend API unavailable or 404, using fallback packs:', error);
  }

  return {
    packs: DEFAULT_OFFLINE_MAP_PACKS,
    total: DEFAULT_OFFLINE_MAP_PACKS.length,
  };
}

/**
 * Resolves the full URL to stream or download a PMTiles map pack archive.
 */
export function getOfflineMapPackDownloadUrl(packId: string): string {
  const base = apiBaseUrl();
  return `${base}${API_PATHS.SPATIAL_OFFLINE_DOWNLOAD}/${encodeURIComponent(packId)}`;
}

/**
 * React Query hook to fetch offline map packs.
 */
export function useGetOfflineMapPacks(accessToken?: string) {
  return useQuery({
    queryKey: ['offline-map-packs', accessToken],
    queryFn: ({ signal }) => fetchOfflineMapPacks(accessToken, signal),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
