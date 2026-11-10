import {
  getSavedRoutes,
  getSavedRouteById,
  createSavedRoute,
  updateSavedRoute,
  deleteSavedRoute,
  getSavedRouteSigns,
} from '@/api/saved-routes/saved-routes';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Saved Routes Standalone API Module', () => {
  const mockToken = 'user-saved-route-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSavedRoutes', () => {
    it('queries /saved-routes with optional vehicleMode', async () => {
      const mockRoutes = [{ id: 'sr-1', name: 'Đi làm hàng ngày' }];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockRoutes);

      const res = await getSavedRoutes('MOTORCYCLE', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes?vehicleMode=MOTORCYCLE',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(mockRoutes);
    });

    it('queries /saved-routes without query string if vehicleMode is omitted', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce([]);

      await getSavedRoutes(undefined, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes',
        { signal: undefined },
        mockToken,
      );
    });
  });

  describe('getSavedRouteById', () => {
    it('fetches single saved route by id', async () => {
      const mockRoute = { id: 'sr-100', name: 'Về quê' };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockRoute);

      const res = await getSavedRouteById('sr-100', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes/sr-100',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(mockRoute);
    });
  });

  describe('createSavedRoute', () => {
    it('rounds floating distance and duration before POST', async () => {
      const dto = {
        name: 'Tuyến thử nghiệm',
        originName: 'A',
        originLatitude: 10.7,
        originLongitude: 106.6,
        destinationName: 'B',
        destinationLatitude: 10.8,
        destinationLongitude: 106.7,
        distanceMeters: 1234.56,
        durationSeconds: 456.78,
      };

      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 'sr-new', ...dto });

      const res = await createSavedRoute(dto as any, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/saved-routes',
        expect.objectContaining({
          distanceMeters: 1235,
          durationSeconds: 457,
        }),
        mockToken,
        undefined,
        'POST',
      );
      expect(res.id).toBe('sr-new');
    });
  });

  describe('updateSavedRoute', () => {
    it('sends PATCH to /saved-routes/:id with update payload', async () => {
      const updateDto = { name: 'Tên tuyến mới' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 'sr-1', name: 'Tên tuyến mới' });

      const res = await updateSavedRoute('sr-1', updateDto as any, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/saved-routes/sr-1',
        updateDto,
        mockToken,
        undefined,
        'PATCH',
      );
      expect(res.name).toBe('Tên tuyến mới');
    });
  });

  describe('deleteSavedRoute', () => {
    it('sends DELETE to /saved-routes/:id', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true, id: 'sr-1' });

      const res = await deleteSavedRoute('sr-1', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes/sr-1',
        { method: 'DELETE', signal: undefined },
        mockToken,
      );
      expect(res.success).toBe(true);
    });
  });

  describe('getSavedRouteSigns', () => {
    it('fetches verified signs along saved route corridor', async () => {
      const mockSigns = { signs: [{ id: 'sign-1' }] };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockSigns);

      const res = await getSavedRouteSigns('sr-1', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/saved-routes/sr-1/signs',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(mockSigns);
    });
  });
});
