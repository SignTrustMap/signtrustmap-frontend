import {
  resolveRoutingModeAndType,
  getVehicleModes,
  getNavigationRoute,
  previewNavigationRoute,
  getNavigationPreferences,
  updateNavigationPreferences,
  initiateNavigationSession,
  endNavigationSession,
  getNavigationSessions,
  getCustomAlertProfiles,
  createCustomAlertProfile,
  activateCustomAlertProfile,
  deleteCustomAlertProfile,
} from '@/api/navigation/navigation';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Navigation API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveRoutingModeAndType', () => {
    it('correctly maps various vehicle modes to mode and vehicle type', () => {
      expect(resolveRoutingModeAndType('MOTORCYCLE')).toEqual({
        vehicleMode: 'MOTORCYCLE',
        vehicleType: 'MOTORCYCLE',
      });
      expect(resolveRoutingModeAndType('BIKE')).toEqual({
        vehicleMode: 'BIKE',
        vehicleType: 'MOTORCYCLE',
      });
      expect(resolveRoutingModeAndType('CYCLING')).toEqual({
        vehicleMode: 'CYCLING',
        vehicleType: 'BICYCLE',
      });
      expect(resolveRoutingModeAndType('WALKING')).toEqual({
        vehicleMode: 'WALKING',
        vehicleType: 'PEDESTRIAN',
      });
      expect(resolveRoutingModeAndType('DRIVING')).toEqual({
        vehicleMode: 'DRIVING',
        vehicleType: 'CAR',
      });
      expect(resolveRoutingModeAndType(undefined as any)).toEqual({
        vehicleMode: 'DRIVING',
        vehicleType: 'CAR',
      });
    });
  });

  describe('getVehicleModes', () => {
    it('fetches supported vehicle modes from backend', async () => {
      const mockModes = [
        { id: 'MOTORCYCLE', label: 'Xe máy' },
        { id: 'DRIVING', label: 'Ô tô' },
      ];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ modes: mockModes });

      const modes = await getVehicleModes();

      expect(apiClient.apiRequest).toHaveBeenCalledWith('/routing/vehicle-modes', { signal: undefined });
      expect(modes).toEqual(mockModes);
    });

    it('returns default fallback vehicle modes when request fails gracefully', async () => {
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      const modes = await getVehicleModes();

      expect(modes).toHaveLength(4);
      expect(modes[0].id).toBe('MOTORCYCLE');
      expect(modes[1].id).toBe('DRIVING');
    });

    it('rethrows when AbortError occurs', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(abortError);

      const controller = new AbortController();
      controller.abort();

      await expect(getVehicleModes(controller.signal)).rejects.toThrow('Aborted');
    });
  });

  describe('getNavigationRoute', () => {
    it('sends route calculation request and formats coordinates, distance, and maneuver steps', async () => {
      const directionsResponse = {
        shortestPath: {
          distanceMeters: 1500,
          durationSeconds: 300,
          geometry: [
            { latitude: 10.772, longitude: 106.698 },
            { latitude: 10.775, longitude: 106.701 },
          ],
          steps: [
            {
              distanceMeters: 500,
              durationSeconds: 100,
              instruction: 'Đi thẳng về phía Bắc trên Đường Lê Lợi',
              roadName: 'Đường Lê Lợi',
              type: 'depart',
              geometry: [{ latitude: 10.772, longitude: 106.698 }],
            },
          ],
        },
      };

      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(directionsResponse);

      const route = await getNavigationRoute(
        [106.698, 10.772],
        [106.701, 10.775],
        'MOTORCYCLE',
        undefined,
        { snapRadiusMeters: 50, maxAlternatives: 1 },
      );

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/routing/directions',
        expect.objectContaining({
          originLatitude: 10.772,
          originLongitude: 106.698,
          destinationLatitude: 10.775,
          destinationLongitude: 106.701,
          vehicleMode: 'MOTORCYCLE',
          vehicleType: 'MOTORCYCLE',
          snapRadiusMeters: 50,
          maxAlternatives: 1,
        }),
        undefined,
        undefined,
      );

      expect(route.distance).toBe(1500);
      expect(route.duration).toBe(300);
      expect(route.coordinates).toEqual([
        [106.698, 10.772],
        [106.701, 10.775],
      ]);
      expect(route.steps[0].instruction).toBe('Đi thẳng về phía Bắc trên Đường Lê Lợi');
      expect(route.steps[0].maneuver.location).toEqual([106.698, 10.772]);
    });
  });

  describe('previewNavigationRoute', () => {
    it('sends preview request to /navigation/route-preview', async () => {
      const mockPreview = { route: { distanceMeters: 2000 }, signs: [] };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce(mockPreview);

      const res = await previewNavigationRoute([106.6, 10.7], [106.7, 10.8], 'DRIVING');

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/navigation/route-preview',
        expect.objectContaining({
          originLatitude: 10.7,
          originLongitude: 106.6,
          destinationLatitude: 10.8,
          destinationLongitude: 106.7,
          vehicleMode: 'DRIVING',
          vehicleType: 'CAR',
        }),
        undefined,
        undefined,
      );
      expect(res).toEqual(mockPreview);
    });
  });

  describe('preferences and sessions', () => {
    it('gets and updates navigation preferences', async () => {
      const mockPrefs = { defaultVehicleMode: 'DRIVING', ttsEnabled: true };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockPrefs);

      const prefs = await getNavigationPreferences('token-1');
      expect(apiClient.apiRequest).toHaveBeenCalledWith('/navigation/preferences', { signal: undefined }, 'token-1');
      expect(prefs).toEqual(mockPrefs);

      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ ...mockPrefs, ttsEnabled: false });
      const updated = await updateNavigationPreferences({ ttsEnabled: false } as any, 'token-1');
      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/navigation/preferences',
        { ttsEnabled: false },
        'token-1',
        undefined,
        'PUT',
      );
      expect(updated.ttsEnabled).toBe(false);
    });

    it('initiates and ends navigation sessions', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ sessionId: 'sess-1' });
      const init = await initiateNavigationSession({ routeId: 'r-1' } as any, 'token-1');
      expect(init.sessionId).toBe('sess-1');

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true, endedAt: 'now' });
      const end = await endNavigationSession('sess-1', 'token-1');
      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/navigation/sessions/sess-1/end',
        { method: 'POST', signal: undefined },
        'token-1',
      );
      expect(end.success).toBe(true);
    });

    it('formats navigation sessions when response is an array', async () => {
      const mockList = [{ id: 'sess-1' }, { id: 'sess-2' }];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockList);

      const res = await getNavigationSessions({ page: 1, pageSize: 20 }, 'token-1');
      expect(res.items).toEqual(mockList);
      expect(res.total).toBe(2);
      expect(res.totalPages).toBe(1);
    });

    it('formats navigation sessions when response is paginated object', async () => {
      const mockPaged = { items: [{ id: 'sess-3' }], total: 25, page: 2, pageSize: 10, totalPages: 3 };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockPaged);

      const res = await getNavigationSessions({ page: 2, pageSize: 10 }, 'token-1');
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(25);
      expect(res.totalPages).toBe(3);
    });
  });

  describe('custom alert profiles', () => {
    it('manages custom alert profiles lifecycle (get, create, activate, delete)', async () => {
      const mockProfiles = [{ id: 'prof-1', name: 'Cao tốc' }];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockProfiles);
      const list = await getCustomAlertProfiles('token-1');
      expect(list).toEqual(mockProfiles);

      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 'prof-2', name: 'Ngoại thành' });
      const created = await createCustomAlertProfile({ name: 'Ngoại thành' } as any, 'token-1');
      expect(created.id).toBe('prof-2');

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(undefined);
      await activateCustomAlertProfile('prof-2', 'token-1');
      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/navigation/profiles/prof-2/activate',
        { method: 'PUT', signal: undefined },
        'token-1',
      );

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(undefined);
      await deleteCustomAlertProfile('prof-2', 'token-1');
      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/navigation/profiles/prof-2',
        { method: 'DELETE', signal: undefined },
        'token-1',
      );
    });
  });
});
