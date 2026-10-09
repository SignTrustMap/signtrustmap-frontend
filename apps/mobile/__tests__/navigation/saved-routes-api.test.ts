import {
  getSavedRoutes,
  createSavedRoute,
  updateSavedRoute,
  deleteSavedRoute,
  getSavedRouteSigns,
} from '@/api/navigation/saved-routes';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client');

describe('Saved Routes API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches saved routes with auth token and signal', async () => {
    const mockRoutes = [
      {
        id: 'route-1',
        name: 'Home to Office',
        originName: 'Home',
        originLatitude: 10.762,
        originLongitude: 106.66,
        destinationName: 'Office',
        destinationLatitude: 10.772,
        destinationLongitude: 106.698,
        vehicleMode: 'MOTORCYCLE',
        filterFixedSignsOnly: true,
      },
    ];

    (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockRoutes);

    const result = await getSavedRoutes('token-123');

    expect(apiClient.apiRequest).toHaveBeenCalledWith(
      '/saved-routes',
      { signal: undefined },
      'token-123',
    );
    expect(result).toEqual(mockRoutes);
  });

  it('creates a saved route with vehicle mode and fixed sign filter', async () => {
    const dto = {
      name: 'Weekend Trip',
      originName: 'HCMC',
      originLatitude: 10.76,
      originLongitude: 106.66,
      destinationName: 'Vung Tau',
      destinationLatitude: 10.34,
      destinationLongitude: 107.08,
      vehicleMode: 'MOTORCYCLE' as const,
      filterFixedSignsOnly: true,
      encodedPolyline: 'abcd1234',
    };

    const created = { id: 'route-new', ...dto };
    (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(created);

    const result = await createSavedRoute(dto, 'token-123');

    expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
      '/saved-routes',
      dto,
      'token-123',
      undefined,
      'POST',
    );
    expect(result.id).toBe('route-new');
    expect(result.vehicleMode).toBe('MOTORCYCLE');
    expect(result.filterFixedSignsOnly).toBe(true);
  });

  it('updates an existing saved route', async () => {
    const patchDto = {
      name: 'Updated Route Name',
      filterFixedSignsOnly: false,
    };
    const updated = { id: 'route-1', name: 'Updated Route Name', filterFixedSignsOnly: false };
    (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(updated);

    const result = await updateSavedRoute('route-1', patchDto, 'token-123');

    expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
      '/saved-routes/route-1',
      patchDto,
      'token-123',
      undefined,
      'PATCH',
    );
    expect(result.name).toBe('Updated Route Name');
  });

  it('deletes a saved route', async () => {
    (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await deleteSavedRoute('route-1', 'token-123');

    expect(apiClient.apiRequest).toHaveBeenCalledWith(
      '/saved-routes/route-1',
      { method: 'DELETE', signal: undefined },
      'token-123',
    );
    expect(result).toEqual({ success: true });
  });

  it('retrieves traffic signs along a saved route', async () => {
    const mockSigns = [
      {
        id: 'sign-1',
        signCode: 'P.102',
        name: 'No Entry',
        coordinate: [106.66, 10.76],
      },
    ];
    (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockSigns);

    const result = await getSavedRouteSigns('route-1', 'token-123');

    expect(apiClient.apiRequest).toHaveBeenCalledWith(
      '/saved-routes/route-1/signs',
      { signal: undefined },
      'token-123',
    );
    expect(result).toEqual(mockSigns);
  });
});
