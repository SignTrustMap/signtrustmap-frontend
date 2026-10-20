import { fetchOfflineMapPacks, getOfflineMapPackDownloadUrl } from '../offline-tiles';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  apiBaseUrl: jest.fn(() => 'https://api.signmap.site/api/v1'),
}));

describe('Offline Tiles API', () => {
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
            description: 'Bản đồ giao thông toàn lãnh thổ Việt Nam',
            region: 'Vietnam',
            countryCode: 'VN',
            format: 'pmtiles',
            fileName: 'vietnam.pmtiles',
            sizeBytes: 439804651,
            sizeMb: 419.43,
            minZoom: 0,
            maxZoom: 15,
            bounds: [102.14, 8.18, 109.46, 23.39] as [number, number, number, number],
            isAvailable: true,
            downloadUrl: '/api/v1/spatial/tiles/offline/download/vietnam-osm',
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
      expect(result.packs[0].sizeMb).toBe(419.43);
    });
  });

  describe('getOfflineMapPackDownloadUrl', () => {
    it('generates correct download url including base and pack id', () => {
      const url = getOfflineMapPackDownloadUrl('vietnam-osm');
      expect(url).toBe('https://api.signmap.site/api/v1/spatial/tiles/offline/download/vietnam-osm');
    });

    it('encodes special characters in pack id', () => {
      const url = getOfflineMapPackDownloadUrl('pack with spaces');
      expect(url).toBe('https://api.signmap.site/api/v1/spatial/tiles/offline/download/pack%20with%20spaces');
    });
  });
});
