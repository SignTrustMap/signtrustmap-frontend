import {
  DEFAULT_OFFLINE_MAP_PACKS,
  fetchOfflineMapPacks,
  getOfflineMapPackDownloadUrl,
  useGetOfflineMapPacks,
} from '@/api/spatial/offline-tiles';
import * as apiClient from '@/api/api-client';
import { useQuery } from '@tanstack/react-query';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  apiBaseUrl: jest.fn(() => 'https://api.signmap.site/api/v1'),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn((options: any) => options),
}));

describe('Offline Tiles API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchOfflineMapPacks', () => {
    it('fetches offline map packs catalog from the API endpoint', async () => {
      const mockResponse = {
        packs: [
          {
            id: 'vietnam-osm',
            name: 'Bản đồ Việt Nam (PMTiles Offline)',
            sizeMb: 419.43,
          },
        ],
        total: 1,
      };

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await fetchOfflineMapPacks('mock-token');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/spatial/tiles/offline/packs',
        expect.objectContaining({ method: 'GET' }),
        'mock-token',
      );
      expect(result.packs).toHaveLength(1);
      expect(result.packs[0].id).toBe('vietnam-osm');
    });

    it('falls back to default offline map packs when API throws', async () => {
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network error 404'));

      const result = await fetchOfflineMapPacks();

      expect(result.packs).toEqual(DEFAULT_OFFLINE_MAP_PACKS);
      expect(result.total).toBe(DEFAULT_OFFLINE_MAP_PACKS.length);
    });

    it('falls back to default offline map packs if response packs array is empty', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ packs: [], total: 0 });

      const result = await fetchOfflineMapPacks();

      expect(result.packs).toEqual(DEFAULT_OFFLINE_MAP_PACKS);
    });
  });

  describe('getOfflineMapPackDownloadUrl', () => {
    it('constructs absolute download URL using apiBaseUrl and encoded packId', () => {
      const url = getOfflineMapPackDownloadUrl('hanoi north/pack');
      expect(url).toBe(
        'https://api.signmap.site/api/v1/spatial/tiles/offline/download/hanoi%20north%2Fpack',
      );
    });
  });

  describe('useGetOfflineMapPacks hook', () => {
    it('configures useQuery with queryKey, staleTime, and queryFn', async () => {
      const queryOptions = useGetOfflineMapPacks('token-123') as any;

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['offline-map-packs', 'token-123'],
          staleTime: 1000 * 60 * 30,
        }),
      );

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({
        packs: DEFAULT_OFFLINE_MAP_PACKS,
        total: DEFAULT_OFFLINE_MAP_PACKS.length,
      });

      const data = await queryOptions.queryFn({ signal: undefined });
      expect(data.packs).toEqual(DEFAULT_OFFLINE_MAP_PACKS);
    });
  });
});
