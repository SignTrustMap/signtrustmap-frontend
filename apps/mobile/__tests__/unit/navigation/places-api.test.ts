import {
  getUserPlaces,
  searchPlaces,
  saveRecentPlace,
} from '@/api/navigation/places';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
  apiBaseUrl: jest.fn(() => 'https://api.signmap.site/api/v1'),
}));

describe('Places API Module', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getUserPlaces', () => {
    it('combines saved places and recent searches, filtering out invalid coordinates', async () => {
      const mockSaved = [
        { id: 's-1', label: 'Nhà riêng', address: '123 CMT8', latitude: 10.77, longitude: 106.68 },
        { id: 's-2', label: 'Không tọa độ', address: 'Unknown', latitude: null, longitude: null },
      ];
      const mockRecent = [
        { id: 'r-1', query: 'Chợ Bến Thành', address: 'Quận 1', latitude: 10.772, longitude: 106.698 },
      ];

      (apiClient.apiRequest as jest.Mock)
        .mockResolvedValueOnce(mockSaved)
        .mockResolvedValueOnce(mockRecent);

      const places = await getUserPlaces('token-123');

      expect(apiClient.apiRequest).toHaveBeenCalledWith('/places/saved', { signal: undefined }, 'token-123');
      expect(apiClient.apiRequest).toHaveBeenCalledWith('/places/recent-searches?limit=20', { signal: undefined }, 'token-123');
      expect(places).toHaveLength(2);
      expect(places[0]).toEqual({
        id: 's-1',
        title: 'Nhà riêng',
        address: '123 CMT8',
        latitude: 10.77,
        longitude: 106.68,
        type: 'saved',
      });
      expect(places[1]).toEqual({
        id: 'r-1',
        title: 'Chợ Bến Thành',
        address: 'Quận 1',
        latitude: 10.772,
        longitude: 106.698,
        type: 'recent',
      });
    });
  });

  describe('searchPlaces', () => {
    it('returns empty array when search query is shorter than 2 characters', async () => {
      const places = await searchPlaces(' a ');
      expect(places).toEqual([]);
    });

    it('resolves places via internal backend spatial address search if available', async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            communeCode: '79001',
            communeName: 'Phường Bến Nghé',
            displayName: 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
            latitude: 10.776,
            longitude: 106.702,
          },
        ],
      });

      const results = await searchPlaces('Bến Nghé');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'spatial-79001',
        title: 'Phường Bến Nghé',
        address: 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        latitude: 10.776,
        longitude: 106.702,
        type: 'recent',
      });
    });

    it('falls back to Photon OSM geocoder if internal search returns empty', async () => {
      globalThis.fetch = jest
        .fn()
        // 1. Backend /addresses/search -> returns []
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        // 2. Photon geocoder -> returns features
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: { type: 'Point', coordinates: [106.698, 10.772] },
                properties: {
                  name: 'Chợ Bến Thành',
                  street: 'Lê Lợi',
                  district: 'Quận 1',
                  city: 'TP Hồ Chí Minh',
                  osm_id: 12345,
                },
              },
            ],
          }),
        });

      const results = await searchPlaces('Bến Thành');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('photon-12345');
      expect(results[0].title).toBe('Chợ Bến Thành');
      expect(results[0].latitude).toBe(10.772);
      expect(results[0].longitude).toBe(106.698);
    });

    it('falls back to Nominatim when Photon fails', async () => {
      globalThis.fetch = jest
        .fn()
        // 1. Backend spatial -> returns []
        .mockResolvedValueOnce({ ok: false })
        // 2. Photon -> fails
        .mockRejectedValueOnce(new Error('Photon timeout'))
        // 3. Nominatim -> returns results
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              place_id: 9988,
              lat: '10.77',
              lon: '106.69',
              name: 'Landmark 81',
              display_name: 'Landmark 81, Bình Thạnh, TP HCM',
            },
          ],
        });

      const results = await searchPlaces('Landmark 81');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('nominatim-9988');
      expect(results[0].title).toBe('Landmark 81');
      expect(results[0].latitude).toBe(10.77);
      expect(results[0].longitude).toBe(106.69);
    });
  });

  describe('saveRecentPlace', () => {
    it('posts recent place query to /places/recent-searches', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      const place = {
        id: 'p-1',
        title: 'Hồ Con Rùa',
        address: 'Quận 3, TP HCM',
        latitude: 10.782,
        longitude: 106.696,
        type: 'recent' as const,
      };

      await saveRecentPlace(place, 'token-123');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/places/recent-searches',
        {
          address: 'Quận 3, TP HCM',
          latitude: 10.782,
          longitude: 106.696,
          query: 'Hồ Con Rùa',
        },
        'token-123',
      );
    });
  });
});
