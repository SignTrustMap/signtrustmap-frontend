import { formatResolvedLocationTitle, resolveLocation } from '@/api/spatial/spatial';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  apiBaseUrl: jest.fn(() => 'https://api.signmap.site'),
}));

describe('Spatial API & Location Resolution Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatResolvedLocationTitle', () => {
    it('returns null for null or undefined input', () => {
      expect(formatResolvedLocationTitle(null)).toBeNull();
      expect(formatResolvedLocationTitle(undefined)).toBeNull();
    });

    it('prioritizes roadName when present', () => {
      const resolved = {
        latitude: 10.7285,
        longitude: 106.7187,
        roadName: 'Đường Tôn Dật Tiên',
        displayAddress: '101 Tôn Dật Tiên, Phường Tân Phú, Quận 7',
      };
      expect(formatResolvedLocationTitle(resolved)).toBe('Đường Tôn Dật Tiên');
    });

    it('extracts leading address part when roadName is missing', () => {
      const resolved = {
        latitude: 10.7285,
        longitude: 106.7187,
        roadName: null,
        displayAddress: 'Crescent Mall, Phường Tân Phú, Quận 7',
      };
      expect(formatResolvedLocationTitle(resolved)).toBe('Crescent Mall');
    });

    it('falls back to commune and province if displayAddress is generic', () => {
      const resolved = {
        latitude: 10.7285,
        longitude: 106.7187,
        roadName: null,
        communeName: 'Phường Tân Phú',
        provinceName: 'Quận 7',
        displayAddress: 'Không xác định, Việt Nam',
      };
      expect(formatResolvedLocationTitle(resolved)).toBe('Phường Tân Phú, Quận 7');
    });

    it('returns commune alone when province is missing', () => {
      const resolved = {
        latitude: 10.7285,
        longitude: 106.7187,
        roadName: null,
        communeName: 'Phường Bến Nghé',
        displayAddress: 'Việt Nam',
      };
      expect(formatResolvedLocationTitle(resolved)).toBe('Phường Bến Nghé');
    });
  });

  describe('resolveLocation', () => {
    it('returns null for invalid coordinates', async () => {
      expect(await resolveLocation(NaN, 106)).toBeNull();
      expect(await resolveLocation(10, Infinity)).toBeNull();
    });

    it('returns backend spatial result when available', async () => {
      const mockResult = {
        latitude: 10.7731,
        longitude: 106.7005,
        roadName: 'Đường Lê Lợi',
        displayAddress: 'Takashimaya, Đường Lê Lợi, Quận 1',
        source: 'INTERNAL_SPATIAL' as const,
      };

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await resolveLocation(10.7731, 106.7005, 'token-xyz');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/spatial/resolve?lat=10.7731&lon=106.7005',
        { method: 'GET', signal: undefined },
        'token-xyz'
      );
      expect(result).toEqual(mockResult);
    });
  });
});
