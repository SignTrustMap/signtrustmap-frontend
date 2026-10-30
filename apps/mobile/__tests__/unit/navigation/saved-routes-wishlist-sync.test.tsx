import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { SignFilterProvider, useSignFilter } from '@/context/sign-filter-provider';
import * as sessionModule from '@/context/session-provider';
import * as savedRoutesApi from '@/api/saved-routes/saved-routes';
import { queryClient } from '@/api/query-client';

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(),
  setStorageItemAsync: jest.fn(),
  removeStorageItemAsync: jest.fn(),
}));

jest.mock('@/api/saved-routes/saved-routes', () => ({
  getSavedRoutes: jest.fn(),
  getSavedRouteById: jest.fn(),
  createSavedRoute: jest.fn(),
  updateSavedRoute: jest.fn(),
  deleteSavedRoute: jest.fn(),
  getSavedRouteSigns: jest.fn(),
}));

describe('Saved Routes & Wishlist Sync', () => {
  const mockToken = 'mock-test-token-123';
  const mockSession = {
    accessToken: mockToken,
    account: { id: 'u1', email: 'test@signmap.site', roles: ['driver'] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    jest.spyOn(sessionModule, 'useOptionalSession').mockReturnValue({
      session: mockSession as any,
      isInitializing: false,
      isLoading: false,
      logIn: jest.fn(),
      logOut: jest.fn(),
      setRoleEnabled: jest.fn(),
    });
  });

  it('invalidates React Query ["saved-routes"] when deletePreset is called so search/saved places reflect deletion', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    (savedRoutesApi.getSavedRoutes as jest.Mock).mockResolvedValue([
      {
        id: 'route-to-delete',
        title: 'Route to Delete',
        vehicleMode: 'MOTORCYCLE',
        originName: 'A',
        originLatitude: 10.1,
        originLongitude: 106.1,
        destinationName: 'B',
        destinationLatitude: 10.2,
        destinationLongitude: 106.2,
        createdAt: '2026-03-01T00:00:00Z',
      },
    ]);
    (savedRoutesApi.deleteSavedRoute as jest.Mock).mockResolvedValue({ success: true, id: 'route-to-delete' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    await act(async () => {});

    expect(result.current.presets).toHaveLength(1);

    // Delete preset
    await act(async () => {
      await result.current.deletePreset('route-to-delete');
    });

    expect(result.current.presets).toHaveLength(0);
    expect(savedRoutesApi.deleteSavedRoute).toHaveBeenCalledWith('route-to-delete', mockToken);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['saved-routes'] })
    );
  });

  it('invalidates React Query ["saved-routes"] when createPreset is called', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    (savedRoutesApi.getSavedRoutes as jest.Mock).mockResolvedValue([]);
    (savedRoutesApi.createSavedRoute as jest.Mock).mockResolvedValue({
      id: 'route-created',
      title: 'New Route',
      vehicleMode: 'MOTORCYCLE',
      originName: 'Home',
      originLatitude: 10.1,
      originLongitude: 106.1,
      destinationName: 'Work',
      destinationLatitude: 10.2,
      destinationLongitude: 106.2,
      createdAt: '2026-03-01T00:00:00Z',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.createPreset('New Route', ['MANDATORY'], {
        originName: 'Home',
        destinationName: 'Work',
      });
    });

    expect(result.current.presets).toHaveLength(1);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['saved-routes'] })
    );
  });

  it('refetchPresets fetches latest routes from backend and updates presets', async () => {
    (savedRoutesApi.getSavedRoutes as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'route-saved-on-map',
          title: 'Route Saved From Map',
          vehicleMode: 'CAR',
          originName: 'Origin X',
          originLatitude: 10.1,
          originLongitude: 106.1,
          destinationName: 'Dest Y',
          destinationLatitude: 10.2,
          destinationLongitude: 106.2,
          createdAt: '2026-03-01T00:00:00Z',
        },
      ]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    await act(async () => {});
    expect(result.current.presets).toHaveLength(0);

    // Call refetchPresets (as triggered when entering Profile tab or after saving bookmark on map)
    await act(async () => {
      await result.current.refetchPresets();
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].id).toBe('route-saved-on-map');
    expect(result.current.presets[0].name).toBe('Route Saved From Map');
  });
});
