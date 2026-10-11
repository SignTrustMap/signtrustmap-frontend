import {
  categoryToCode,
  codeToCategory,
} from '@/types/savedRouteType';
import {
  encodePolyline,
  decodePolyline,
} from '@/feature/saved-routes/utils/polyline';
import {
  createSavedRoute,
  deleteSavedRoute,
  getSavedRouteById,
  getSavedRoutes,
  getSavedRouteSigns,
  updateSavedRoute,
} from '@/api/saved-routes/saved-routes';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Saved Routes API & Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Category mappings', () => {
    it('correctly maps SignCategory enum to backend single-letter codes', () => {
      expect(categoryToCode('PROHIBITORY')).toBe('P');
      expect(categoryToCode('WARNING')).toBe('W');
      expect(categoryToCode('MANDATORY')).toBe('R');
      expect(categoryToCode('INFORMATION')).toBe('I');
      expect(categoryToCode('TEMPORARY')).toBe('TEMPORARY');
    });

    it('correctly maps backend codes to SignCategory enum', () => {
      expect(codeToCategory('P')).toBe('PROHIBITORY');
      expect(codeToCategory('PROHIBITORY')).toBe('PROHIBITORY');
      expect(codeToCategory('W')).toBe('WARNING');
      expect(codeToCategory('WARNING')).toBe('WARNING');
      expect(codeToCategory('R')).toBe('MANDATORY');
      expect(codeToCategory('MANDATORY')).toBe('MANDATORY');
      expect(codeToCategory('I')).toBe('INFORMATION');
      expect(codeToCategory('INFO')).toBe('INFORMATION');
      expect(codeToCategory('TEMPORARY')).toBe('TEMPORARY');
      expect(codeToCategory('UNKNOWN')).toBe('WARNING');
    });
  });

  describe('Polyline encoding and decoding', () => {
    it('encodes and decodes coordinates reversibly', () => {
      const coords: Array<[number, number]> = [
        [106.7009, 10.7769],
        [106.772, 10.85],
      ];

      const encoded = encodePolyline(coords);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodePolyline(encoded);
      expect(decoded).toHaveLength(2);
      expect(decoded[0][0]).toBeCloseTo(106.7009, 4);
      expect(decoded[0][1]).toBeCloseTo(10.7769, 4);
      expect(decoded[1][0]).toBeCloseTo(106.772, 4);
      expect(decoded[1][1]).toBeCloseTo(10.85, 4);
    });

    it('handles empty input safely', () => {
      expect(encodePolyline([])).toBe('');
      expect(decodePolyline('')).toEqual([]);
    });
  });

  describe('API client functions', () => {
    it('calls getSavedRoutes with optional vehicleMode and accessToken', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce([]);

      await getSavedRoutes('MOTORCYCLE', 'token-abc');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes?vehicleMode=MOTORCYCLE',
        expect.any(Object),
        'token-abc'
      );
    });

    it('calls getSavedRouteById with route ID', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ id: 'r1' });

      const res = await getSavedRouteById('r1', 'token-abc');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes/r1',
        expect.any(Object),
        'token-abc'
      );
      expect(res).toEqual({ id: 'r1' });
    });

    it('calls createSavedRoute with payload', async () => {
      const dto = {
        title: 'New Route',
        originName: 'A',
        originLatitude: 10,
        originLongitude: 106,
        destinationName: 'B',
        destinationLatitude: 11,
        destinationLongitude: 107,
        filterRules: { onlyFixedSigns: true, categories: ['P', 'W'] },
      };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 'created-id', ...dto });

      const res = await createSavedRoute(dto, 'token-abc');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/saved-routes',
        dto,
        'token-abc',
        undefined,
        'POST'
      );
      expect(res.id).toBe('created-id');
    });

    it('calls updateSavedRoute with payload and route ID', async () => {
      const updateDto = {
        title: 'Updated Title',
        filterRules: { onlyFixedSigns: false },
      };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 'r1', ...updateDto });

      const res = await updateSavedRoute('r1', updateDto, 'token-abc');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/saved-routes/r1',
        updateDto,
        'token-abc',
        undefined,
        'PATCH'
      );
      expect(res.title).toBe('Updated Title');
    });

    it('calls deleteSavedRoute with route ID', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true, id: 'r1' });

      const res = await deleteSavedRoute('r1', 'token-abc');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes/r1',
        { method: 'DELETE', signal: undefined },
        'token-abc'
      );
      expect(res).toEqual({ success: true, id: 'r1' });
    });

    it('calls getSavedRouteSigns to fetch corridor signs', async () => {
      const mockSignsResponse = {
        routeId: 'r1',
        routeTitle: 'Work',
        vehicleMode: 'MOTORCYCLE',
        distanceMeters: 5000,
        signCount: 3,
        signs: [],
      };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockSignsResponse);

      const res = await getSavedRouteSigns('r1', 'token-abc');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes/r1/signs',
        expect.any(Object),
        'token-abc'
      );
      expect(res).toEqual(mockSignsResponse);
    });
  });
});
