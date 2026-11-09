import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PermissionsAndroid, Platform, TurboModuleRegistry } from 'react-native';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'user-1' },
    },
  }),
  useOptionalSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'user-1' },
    },
  }),
}));

jest.mock('@/api/navigation/navigation', () => ({
  getVehicleModes: jest.fn().mockResolvedValue([{ id: 'DRIVING', name: 'Car' }]),
  getNavigationRoute: jest.fn().mockResolvedValue({ route: { distanceMeters: 100 } }),
  previewNavigationRoute: jest.fn().mockResolvedValue({ route: { distanceMeters: 100 } }),
  getNavigationPreferences: jest.fn().mockResolvedValue({ voiceEnabled: true }),
  updateNavigationPreferences: jest.fn().mockResolvedValue({ success: true }),
  getNavigationSessions: jest.fn().mockResolvedValue({ sessions: [] }),
  initiateNavigationSession: jest.fn().mockResolvedValue({ sessionId: 's-1' }),
  endNavigationSession: jest.fn().mockResolvedValue({ success: true }),
  getCustomAlertProfiles: jest.fn().mockResolvedValue([]),
  createCustomAlertProfile: jest.fn().mockResolvedValue({ id: 'p-1' }),
  activateCustomAlertProfile: jest.fn().mockResolvedValue({ success: true }),
  deleteCustomAlertProfile: jest.fn().mockResolvedValue({ success: true }),
  resolveRoutingModeAndType: jest.fn().mockReturnValue({ vehicleType: 'car', routingMode: 'driving' }),
}));

jest.mock('@/api/navigation/places', () => ({
  getUserPlaces: jest.fn().mockResolvedValue([{ id: 'pl-1', title: 'Home' }]),
  searchPlaces: jest.fn().mockResolvedValue([{ id: 'pl-2', title: 'Work' }]),
  saveRecentPlace: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/api/sign-map/sign-map', () => ({
  getSignsInBounds: jest.fn().mockResolvedValue({ signs: [] }),
  getSignsAlongRoute: jest.fn().mockResolvedValue({ signs: [] }),
  getNearbySignCandidates: jest.fn().mockResolvedValue({ signs: [] }),
}));

jest.mock('@/api/navigation/saved-routes', () => ({
  getSavedRoutes: jest.fn().mockResolvedValue([{ id: 'sr-1', name: 'Route 1' }]),
  createSavedRoute: jest.fn().mockResolvedValue({ id: 'sr-new' }),
  updateSavedRoute: jest.fn().mockResolvedValue({ id: 'sr-1' }),
  deleteSavedRoute: jest.fn().mockResolvedValue(true),
  getSavedRouteSigns: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/api/saved-routes/saved-routes', () => ({
  getSavedRoutes: jest.fn().mockResolvedValue([{ id: 'sr-1', name: 'Route 1' }]),
  getSavedRouteById: jest.fn().mockResolvedValue({ id: 'sr-1', name: 'Route 1' }),
  getSavedRouteSigns: jest.fn().mockResolvedValue({ routeId: 'sr-1', signs: [] }),
  createSavedRoute: jest.fn().mockResolvedValue({ id: 'sr-new' }),
  updateSavedRoute: jest.fn().mockResolvedValue({ id: 'sr-1' }),
  deleteSavedRoute: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/services/maplibre', () => {
  const actual = jest.requireActual('@/services/maplibre');
  return {
    ...actual,
    getMapLibre: jest.fn().mockReturnValue({
      LocationManager: {
        requestPermissions: jest.fn().mockResolvedValue(true),
        getCurrentPosition: jest.fn().mockResolvedValue({
          coords: { latitude: 10.7769, longitude: 106.7009, accuracy: 10 },
          timestamp: Date.now(),
        }),
      },
    }),
  };
});

// Import modules to test
import {
  ensureLocationPermission,
  isValidGpsLocation,
  isFreshGpsLocation,
  fetchFreshGpsPosition,
} from '@/feature/navigation/utils/gps';
import { areSameLocation } from '@/feature/navigation/utils/location';
import { requestLocationPermissionOnFirstLaunch } from '@/services/location-permission';
import { isMapLibreAvailable, getMapLibre } from '@/services/maplibre';

import {
  useGetVehicleModes,
  useGetNavigationRoute,
  usePreviewNavigationRoute,
  useGetNavigationPreferences,
  useUpdateNavigationPreferences,
  useGetNavigationSessions,
  useInitiateNavigationSession,
  useEndNavigationSession,
  useCustomAlertProfiles,
  useCreateCustomAlertProfile,
  useActivateCustomAlertProfile,
  useDeleteCustomAlertProfile,
} from '@/feature/navigation/hooks/use-navigation';

import {
  useGetUserPlaces,
  useSearchPlaces,
  usePlaceSuggestions,
  useSaveRecentPlace,
} from '@/feature/navigation/hooks/use-places';

import {
  isRealWorldBounds,
  useGetSignsInBounds,
  useGetSignsAlongRoute,
  useGetNearbySigns,
} from '@/feature/navigation/hooks/use-signs';

import {
  useSavedRoutes,
  useSavedRouteSigns,
} from '@/feature/navigation/hooks/use-saved-routes';

import {
  useGetSavedRoutes,
  useGetSavedRoute,
  useGetSavedRouteSigns,
  useCreateSavedRoute,
  useUpdateSavedRoute,
  useDeleteSavedRoute,
} from '@/feature/saved-routes/hooks/use-saved-routes';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('Navigation Utils, Services, and Hooks', () => {
  describe('gps.ts', () => {
    it('validates GPS coordinates correctly with isValidGpsLocation', () => {
      expect(isValidGpsLocation(null)).toBe(false);
      expect(isValidGpsLocation({})).toBe(false);
      expect(isValidGpsLocation({ coords: { latitude: 'invalid', longitude: 106 } })).toBe(false);
      expect(isValidGpsLocation({ coords: { latitude: 95, longitude: 106 } })).toBe(false);
      expect(isValidGpsLocation({ coords: { latitude: 10, longitude: 190 } })).toBe(false);
      expect(isValidGpsLocation({ coords: { latitude: 10, longitude: 106, accuracy: 500 } })).toBe(false);
      expect(isValidGpsLocation({ coords: { latitude: 10.77, longitude: 106.7, accuracy: 15 } })).toBe(true);
    });

    it('checks timestamp freshness with isFreshGpsLocation', () => {
      expect(isFreshGpsLocation({})).toBe(true);
      expect(isFreshGpsLocation({ timestamp: Date.now() - 5000 }, 10000)).toBe(true);
      expect(isFreshGpsLocation({ timestamp: Date.now() - 20000 }, 10000)).toBe(false);
    });

    it('handles ensureLocationPermission on different platforms', async () => {
      Platform.OS = 'web';
      expect(await ensureLocationPermission()).toBe(false);

      Platform.OS = 'ios';
      expect(await ensureLocationPermission()).toBe(true);

      Platform.OS = 'android';
      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
      expect(await ensureLocationPermission()).toBe(true);

      jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
      jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
        [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]: PermissionsAndroid.RESULTS.GRANTED,
        [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]: PermissionsAndroid.RESULTS.DENIED,
      });
      expect(await ensureLocationPermission()).toBe(true);
    });

    it('fetches fresh GPS position via fetchFreshGpsPosition', async () => {
      Platform.OS = 'ios';
      const coords = await fetchFreshGpsPosition(1000);
      expect(coords).toEqual([106.7009, 10.7769]);
    });
  });

  describe('location.ts', () => {
    it('compares coordinate equality within epsilon', () => {
      expect(areSameLocation(undefined, [106, 10])).toBe(false);
      expect(areSameLocation([106, 10], undefined)).toBe(false);
      expect(areSameLocation([106.0000001, 10.0000001], [106.0000002, 10.0000002])).toBe(true);
      expect(areSameLocation([106.1, 10.1], [106.2, 10.2])).toBe(false);
    });
  });

  describe('services/maplibre.ts & services/location-permission.ts', () => {
    it('checks maplibre availability and returns module or null', () => {
      Platform.OS = 'web';
      expect(isMapLibreAvailable()).toBe(false);

      Platform.OS = 'android';
      (Constants as any).appOwnership = 'expo';
      expect(isMapLibreAvailable()).toBe(false);

      (Constants as any).appOwnership = 'standalone';
      jest.spyOn(TurboModuleRegistry, 'get').mockReturnValueOnce({} as any);
      expect(isMapLibreAvailable()).toBe(true);
    });

    it('requests location permission on launch', async () => {
      Platform.OS = 'web';
      await expect(requestLocationPermissionOnFirstLaunch()).resolves.toBeUndefined();

      Platform.OS = 'android';
      await expect(requestLocationPermissionOnFirstLaunch()).resolves.toBeUndefined();
    });
  });

  describe('use-navigation.ts queries and mutations', () => {
    it('executes vehicle modes, route, preferences, and sessions queries', async () => {
      const wrapper = createWrapper();

      const { result: vmRes } = await renderHook(() => useGetVehicleModes(), { wrapper });
      await waitFor(() => expect(vmRes.current.isSuccess).toBe(true));
      expect(vmRes.current.data).toHaveLength(1);

      const { result: routeRes } = await renderHook(
        () => useGetNavigationRoute([106, 10], [106.1, 10.1]),
        { wrapper }
      );
      await waitFor(() => expect(routeRes.current.isSuccess).toBe(true));

      const { result: previewRes } = await renderHook(
        () => usePreviewNavigationRoute([106, 10], [106.1, 10.1]),
        { wrapper }
      );
      await waitFor(() => expect(previewRes.current.isSuccess).toBe(true));

      const { result: prefRes } = await renderHook(
        () => useGetNavigationPreferences('test-token'),
        { wrapper }
      );
      await waitFor(() => expect(prefRes.current.isSuccess).toBe(true));

      const { result: sessRes } = await renderHook(
        () => useGetNavigationSessions(),
        { wrapper }
      );
      await waitFor(() => expect(sessRes.current.isSuccess).toBe(true));

      const { result: profRes } = await renderHook(
        () => useCustomAlertProfiles('test-token'),
        { wrapper }
      );
      await waitFor(() => expect(profRes.current.isSuccess).toBe(true));
    });

    it('executes navigation mutations', async () => {
      const wrapper = createWrapper();

      const { result: updatePref } = await renderHook(
        () => useUpdateNavigationPreferences('test-token'),
        { wrapper }
      );
      await act(async () => {
        await updatePref.current.mutateAsync({ voiceGuidanceEnabled: true });
      });
      await waitFor(() => expect(updatePref.current.isSuccess).toBe(true));

      const { result: initSession } = await renderHook(
        () => useInitiateNavigationSession('test-token'),
        { wrapper }
      );
      await act(async () => {
        await initSession.current.mutateAsync({
          route: { distanceMeters: 500 },
          vehicleMode: 'DRIVING',
        } as any);
      });
      await waitFor(() => expect(initSession.current.isSuccess).toBe(true));

      const { result: endSession } = await renderHook(
        () => useEndNavigationSession('test-token'),
        { wrapper }
      );
      await act(async () => {
        await endSession.current.mutateAsync('s-1');
      });
      await waitFor(() => expect(endSession.current.isSuccess).toBe(true));

      const { result: createProf } = await renderHook(
        () => useCreateCustomAlertProfile('test-token'),
        { wrapper }
      );
      await act(async () => {
        await createProf.current.mutateAsync({ name: 'Speed' } as any);
      });
      await waitFor(() => expect(createProf.current.isSuccess).toBe(true));

      const { result: actProf } = await renderHook(
        () => useActivateCustomAlertProfile('test-token'),
        { wrapper }
      );
      await act(async () => {
        await actProf.current.mutateAsync('p-1');
      });
      await waitFor(() => expect(actProf.current.isSuccess).toBe(true));

      const { result: delProf } = await renderHook(
        () => useDeleteCustomAlertProfile('test-token'),
        { wrapper }
      );
      await act(async () => {
        await delProf.current.mutateAsync('p-1');
      });
      await waitFor(() => expect(delProf.current.isSuccess).toBe(true));
    });
  });

  describe('use-places.ts', () => {
    it('executes user places, search places, and save place', async () => {
      const wrapper = createWrapper();

      const { result: placesRes } = await renderHook(() => useGetUserPlaces(), { wrapper });
      await waitFor(() => expect(placesRes.current.isSuccess).toBe(true));

      const { result: searchRes } = await renderHook(() => useSearchPlaces('Bến Thành'), { wrapper });
      await waitFor(() => expect(searchRes.current.isSuccess).toBe(true));

      const { result: suggestRes } = await renderHook(() => usePlaceSuggestions('Bến Thành'), { wrapper });
      expect(suggestRes.current.data).toBeDefined();

      const { result: savePlace } = await renderHook(() => useSaveRecentPlace(), { wrapper });
      await act(async () => {
        await savePlace.current.mutateAsync({ id: 'p-1', name: 'Market' } as any);
      });
      await waitFor(() => expect(savePlace.current.isSuccess).toBe(true));
    });
  });

  describe('use-signs.ts', () => {
    it('validates bounds with isRealWorldBounds and queries signs in bounds and route', async () => {
      expect(isRealWorldBounds(undefined)).toBe(false);
      expect(isRealWorldBounds({ minLat: -85, maxLat: 85, minLon: -85, maxLon: 85 })).toBe(false);
      expect(isRealWorldBounds({ minLat: 10.7, maxLat: 10.8, minLon: 106.6, maxLon: 106.7 })).toBe(true);

      const wrapper = createWrapper();

      const { result: inBoundsRes } = await renderHook(
        () => useGetSignsInBounds({ minLat: 10.7, maxLat: 10.8, minLon: 106.6, maxLon: 106.7 }),
        { wrapper }
      );
      await waitFor(() => expect(inBoundsRes.current.isSuccess).toBe(true));

      const { result: routeSignsRes } = await renderHook(
        () => useGetSignsAlongRoute([106.6, 10.7], [106.7, 10.8], [{ latitude: 10.7, longitude: 106.6 }, { latitude: 10.8, longitude: 106.7 }]),
        { wrapper }
      );
      await waitFor(() => expect(routeSignsRes.current.isSuccess).toBe(true));

      const { result: nearbyRes } = await renderHook(
        () => useGetNearbySigns({ latitude: 10.77, longitude: 106.7, radiusMeters: 50 }),
        { wrapper }
      );
      await waitFor(() => expect(nearbyRes.current.isSuccess).toBe(true));
    });
  });

  describe('Saved Routes Hooks (feature/navigation and feature/saved-routes)', () => {
    it('tests useSavedRoutes and useSavedRouteSigns from navigation feature', async () => {
      const wrapper = createWrapper();

      const { result } = await renderHook(() => useSavedRoutes(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.savedRoutes).toHaveLength(1);

      await act(async () => {
        await result.current.saveRoute({ name: 'New' } as any);
        await result.current.updateRoute({ id: 'sr-1', dto: { name: 'Updated' } });
        await result.current.deleteRoute('sr-1');
      });

      const { result: signsRes } = await renderHook(() => useSavedRouteSigns('sr-1'), { wrapper });
      await waitFor(() => expect(signsRes.current.isSuccess).toBe(true));
    });

    it('tests hooks from feature/saved-routes', async () => {
      const wrapper = createWrapper();

      const { result: listRes } = await renderHook(() => useGetSavedRoutes('DRIVING'), { wrapper });
      await waitFor(() => expect(listRes.current.isSuccess).toBe(true));

      const { result: singleRes } = await renderHook(() => useGetSavedRoute('sr-1'), { wrapper });
      await waitFor(() => expect(singleRes.current.isSuccess).toBe(true));

      const { result: signsRes } = await renderHook(() => useGetSavedRouteSigns('sr-1'), { wrapper });
      await waitFor(() => expect(signsRes.current.isSuccess).toBe(true));

      const { result: createM } = await renderHook(() => useCreateSavedRoute(), { wrapper });
      await act(async () => {
        await createM.current.mutateAsync({ name: 'Route' } as any);
      });
      await waitFor(() => expect(createM.current.isSuccess).toBe(true));

      const { result: updateM } = await renderHook(() => useUpdateSavedRoute(), { wrapper });
      await act(async () => {
        await updateM.current.mutateAsync({ id: 'sr-1', dto: { name: 'Route Updated' } } as any);
      });
      await waitFor(() => expect(updateM.current.isSuccess).toBe(true));

      const { result: delM } = await renderHook(() => useDeleteSavedRoute(), { wrapper });
      await act(async () => {
        await delM.current.mutateAsync('sr-1');
      });
      await waitFor(() => expect(delM.current.isSuccess).toBe(true));
    });
  });
});
