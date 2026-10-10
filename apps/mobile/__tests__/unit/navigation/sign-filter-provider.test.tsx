import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import {
  SIGN_FILTER_STORAGE_KEY,
  SignFilterProvider,
  useSignFilter,
} from '@/context/sign-filter-provider';
import * as storage from '@/hooks/use-storage';
import * as sessionModule from '@/context/session-provider';
import * as savedRoutesApi from '@/api/saved-routes/saved-routes';

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

describe('SignFilterProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty presets and purges local storage on mount when not authenticated', async () => {
    jest.spyOn(sessionModule, 'useOptionalSession').mockReturnValue(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    expect(storage.removeStorageItemAsync).toHaveBeenCalledWith(SIGN_FILTER_STORAGE_KEY);
    expect(result.current.presets).toEqual([]);
    expect(result.current.activePresetId).toBeNull();
    expect(result.current.activePreset).toBeNull();
    expect(result.current.activeCategories).toBeNull();
    expect(result.current.activeOnlyFixedSigns).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('creates, renames, selects, and deletes filter lists in-memory without saving to local storage', async () => {
    jest.spyOn(sessionModule, 'useOptionalSession').mockReturnValue(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    await act(async () => {});

    // 1. Create List 1
    let created1: any;
    await act(async () => {
      created1 = await result.current.createPreset('List 1: Mandatory', ['MANDATORY'], {
        onlyFixedSigns: true,
      });
    });

    expect(result.current.presets).toHaveLength(1);
    expect(result.current.activePresetId).toBe(created1.id);
    expect(result.current.activeOnlyFixedSigns).toBe(true);
    expect(storage.setStorageItemAsync).not.toHaveBeenCalled();

    // 2. Create List 2
    let created2: any;
    await act(async () => {
      created2 = await result.current.createPreset(
        'List 2: Prohibitory & Mandatory',
        ['PROHIBITORY', 'MANDATORY'],
        { onlyFixedSigns: false }
      );
    });

    expect(result.current.presets).toHaveLength(2);
    expect(result.current.activePresetId).toBe(created2.id);
    expect(result.current.activeOnlyFixedSigns).toBe(false);

    // 3. Rename List 1
    await act(async () => {
      await result.current.renamePreset(created1.id, 'Renamed List 1');
    });

    expect(result.current.presets.find((p) => p.id === created1.id)?.name).toBe('Renamed List 1');
    expect(storage.setStorageItemAsync).not.toHaveBeenCalled();

    // 4. Switch active list (only one active at a time)
    await act(async () => {
      await result.current.setActivePresetId(created1.id);
    });

    expect(result.current.activePresetId).toBe(created1.id);
    expect(result.current.activePreset?.name).toBe('Renamed List 1');
    expect(result.current.activeOnlyFixedSigns).toBe(true);

    // 5. Delete List 1
    await act(async () => {
      await result.current.deletePreset(created1.id);
    });

    expect(result.current.presets).toHaveLength(1);
    // Since active preset was deleted, activePresetId resets to null
    expect(result.current.activePresetId).toBeNull();
    expect(result.current.activeOnlyFixedSigns).toBe(false);
  });

  it('syncs with backend Saved Routes API when authenticated session is present', async () => {
    const mockSession = {
      accessToken: 'test-jwt-token',
      account: { id: 'u1', email: 'user@example.com', displayName: 'Driver User', roles: ['driver' as const] },
    };
    jest.spyOn(sessionModule, 'useOptionalSession').mockReturnValue({
      session: mockSession,
      isLoading: false,
      isInitializing: false,
      logIn: jest.fn(),
      logOut: jest.fn(),
      setRoleEnabled: jest.fn(),
    });

    const mockSavedRoute = {
      id: 'sr-100',
      userId: 'u1',
      title: 'Tuyến đường đi làm',
      vehicleMode: 'MOTORCYCLE',
      originName: 'Nhà',
      originLatitude: 10.7769,
      originLongitude: 106.7009,
      destinationName: 'Công ty',
      destinationLatitude: 10.85,
      destinationLongitude: 106.772,
      distanceMeters: 4500,
      durationSeconds: 800,
      encodedPolyline: 'mock-poly',
      filterRules: {
        onlyFixedSigns: true,
        categories: ['P', 'W'],
      },
      createdAt: '2026-03-01T08:00:00Z',
      updatedAt: '2026-03-01T08:00:00Z',
    };

    (savedRoutesApi.getSavedRoutes as jest.Mock).mockResolvedValueOnce([mockSavedRoute]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SignFilterProvider>{children}</SignFilterProvider>
    );

    const { result } = await renderHook(() => useSignFilter(), { wrapper });

    await act(async () => {});

    expect(savedRoutesApi.getSavedRoutes).toHaveBeenCalledWith(undefined, 'test-jwt-token');
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].id).toBe('sr-100');
    expect(result.current.presets[0].name).toBe('Tuyến đường đi làm');
    expect(result.current.presets[0].onlyFixedSigns).toBe(true);
    expect(result.current.presets[0].categories).toEqual(['PROHIBITORY', 'WARNING']);

    // Create via API
    const createdFromBackend = {
      ...mockSavedRoute,
      id: 'sr-200',
      title: 'Tuyến đường cao tốc',
      filterRules: {
        onlyFixedSigns: false,
        categories: ['R'],
      },
    };
    (savedRoutesApi.createSavedRoute as jest.Mock).mockResolvedValueOnce(createdFromBackend);

    await act(async () => {
      await result.current.createPreset('Tuyến đường cao tốc', ['MANDATORY'], {
        onlyFixedSigns: false,
      });
    });

    expect(savedRoutesApi.createSavedRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Tuyến đường cao tốc',
        filterRules: {
          onlyFixedSigns: false,
          categories: ['R'],
        },
      }),
      'test-jwt-token'
    );
    expect(result.current.presets).toHaveLength(2);

    // Update via API
    (savedRoutesApi.updateSavedRoute as jest.Mock).mockResolvedValueOnce({
      ...mockSavedRoute,
      title: 'Đi làm mới',
      filterRules: {
        onlyFixedSigns: true,
        categories: ['P'],
      },
    });

    await act(async () => {
      await result.current.updatePreset('sr-100', {
        name: 'Đi làm mới',
        categories: ['PROHIBITORY'],
        onlyFixedSigns: true,
      });
    });

    expect(savedRoutesApi.updateSavedRoute).toHaveBeenCalledWith(
      'sr-100',
      expect.objectContaining({
        title: 'Đi làm mới',
        filterRules: {
          onlyFixedSigns: true,
          categories: ['P'],
        },
      }),
      'test-jwt-token'
    );

    // Delete via API
    (savedRoutesApi.deleteSavedRoute as jest.Mock).mockResolvedValueOnce({
      success: true,
      id: 'sr-100',
    });

    await act(async () => {
      await result.current.deletePreset('sr-100');
    });

    expect(savedRoutesApi.deleteSavedRoute).toHaveBeenCalledWith('sr-100', 'test-jwt-token');
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].id).toBe('sr-200');
  });
});
