import {
  getSignsInBounds,
  createVerifiedSign,
  getSignsAlongRoute,
  updateVerifiedSign,
  getNearbySignCandidates,
  confirmSignPresence,
} from '@/api/sign-map/sign-map';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Sign Map API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSignsInBounds', () => {
    it('calls GET /signs with minLat, minLon, maxLat, maxLon parameters', async () => {
      const mockSigns = { signs: [{ id: 's1' }] };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockSigns);

      const bounds = { minLat: 10.7, minLon: 106.6, maxLat: 10.8, maxLon: 106.7 };
      const res = await getSignsInBounds(bounds as any);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/signs?minLat=10.7&minLon=106.6&maxLat=10.8&maxLon=106.7',
        { signal: undefined },
      );
      expect(res).toEqual(mockSigns);
    });
  });

  describe('createVerifiedSign', () => {
    it('calls POST /signs with sign data and accessToken', async () => {
      const dto = { signTypeId: 1, latitude: 10.77, longitude: 106.69 };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 's-created' });

      const res = await createVerifiedSign(dto as any, 'admin-token');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/signs',
        dto,
        'admin-token',
        undefined,
      );
      expect(res).toEqual({ id: 's-created' });
    });
  });

  describe('getSignsAlongRoute', () => {
    it('calls POST /signs/along-route with polyline/coordinate parameters', async () => {
      const dto = { polyline: 'enc123', corridorRadiusMeters: 30 };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ signs: [] });

      const res = await getSignsAlongRoute(dto as any);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/signs/along-route',
        dto,
        undefined,
        undefined,
      );
      expect(res).toEqual({ signs: [] });
    });
  });

  describe('updateVerifiedSign', () => {
    it('calls PATCH /signs/:id with updated properties and accessToken', async () => {
      const dto = { status: 'DECOMMISSIONED' };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      const res = await updateVerifiedSign('sign-abc', dto as any, 'staff-token');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/signs/sign-abc',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(dto),
        }),
        'staff-token',
      );
      expect(res).toEqual({ success: true });
    });
  });

  describe('getNearbySignCandidates', () => {
    it('calls GET /signs/nearby-candidates with lat, lon, radius, and heading', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ signs: [] });

      await getNearbySignCandidates({
        latitude: 10.772,
        longitude: 106.698,
        radiusMeters: 50,
        headingDegrees: 90,
      });

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        expect.stringMatching(
          /\/signs\/nearby-candidates\?latitude=10\.772&longitude=106\.698&radiusMeters=50&headingDegrees=90/,
        ),
        { signal: undefined },
      );
    });
  });

  describe('confirmSignPresence', () => {
    it('calls POST /signs/:id/confirm with confirmation body', async () => {
      const body = { isPresent: true, latitude: 10.77, longitude: 106.69 };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ success: true, message: 'Confirmed' });

      const res = await confirmSignPresence('sign-xyz', body, 'token-123');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/signs/sign-xyz/confirm',
        body,
        'token-123',
        undefined,
        'POST',
      );
      expect(res.success).toBe(true);
    });
  });
});
