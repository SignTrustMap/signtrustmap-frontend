import { resolveLocation } from '../spatial';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  apiBaseUrl: jest.fn(() => 'https://api.signmap.site/api/v1'),
}));

describe('resolveLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when given invalid coordinates', async () => {
    const result = await resolveLocation(NaN, 106.7);
    expect(result).toBeNull();
    expect(apiClient.apiRequest).not.toHaveBeenCalled();
  });

  it('returns backend resolved location when valid address is returned', async () => {
    (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({
      latitude: 10.737485,
      longitude: 106.73026,
      roadName: 'Đường Nguyễn Hữu Thọ',
      communeName: 'Phường Tân Phong',
      provinceName: 'Thành phố Hồ Chí Minh',
      displayAddress: 'Đường Nguyễn Hữu Thọ, Phường Tân Phong, Thành phố Hồ Chí Minh',
      source: 'INTERNAL_SPATIAL',
    });

    const result = await resolveLocation(10.737485, 106.73026);
    expect(result).not.toBeNull();
    expect(result?.roadName).toBe('Đường Nguyễn Hữu Thọ');
    expect(result?.displayAddress).toContain('Nguyễn Hữu Thọ');
    expect(apiClient.apiRequest).toHaveBeenCalledWith(
      '/spatial/resolve?lat=10.737485&lon=106.73026',
      expect.objectContaining({ method: 'GET' }),
      undefined,
    );
  });

  it('falls back to Nominatim when backend returns generic placeholder address', async () => {
    (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({
      latitude: 10.737485,
      longitude: 106.73026,
      roadName: null,
      communeName: 'Không xác định',
      provinceName: 'Việt Nam',
      displayAddress: 'Không xác định, Việt Nam',
      source: 'INTERNAL_SPATIAL',
    });

    // Mock global fetch for Nominatim fallback
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        display_name: '2 Nguyễn Hữu Thọ, Tân Phong, Quận 7, TP Hồ Chí Minh',
        address: { road: 'Nguyễn Hữu Thọ' },
      }),
    } as any);

    try {
      const result = await resolveLocation(10.737485, 106.73026);
      expect(result).not.toBeNull();
      expect(result?.displayAddress).toBe('2 Nguyễn Hữu Thọ, Tân Phong, Quận 7, TP Hồ Chí Minh');
      expect(result?.roadName).toBe('Nguyễn Hữu Thọ');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
