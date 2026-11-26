import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockStorage = new Map<string, string>();
jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(async (k: string) => mockStorage.get(k) ?? null),
  setStorageItemAsync: jest.fn(async (k: string, v: string) => {
    mockStorage.set(k, v);
  }),
  removeStorageItemAsync: jest.fn(async (k: string) => {
    mockStorage.delete(k);
  }),
}));

const mockToggleRole = jest.fn();
jest.mock('@/api/auth/auth', () => ({
  toggleRole: (...args: any[]) => mockToggleRole(...args),
  backendRoleToAccountRole: { DRIVER: 'driver', SURVEYOR: 'surveyor', REVIEWER: 'reviewer' },
}));

const mockApiRequest = jest.fn();
const mockJsonApiRequest = jest.fn();
jest.mock('@/api/api-client', () => ({
  apiRequest: (...args: any[]) => mockApiRequest(...args),
  jsonApiRequest: (...args: any[]) => mockJsonApiRequest(...args),
}));

import { SessionProvider, useSession } from '@/context/session-provider';
import {
  getNavigationSessions,
  getVehicleModes,
  resolveRoutingModeAndType,
} from '@/api/navigation/navigation';
import { formatResolvedLocationTitle, resolveLocation } from '@/api/spatial/spatial';

describe('SessionProvider, Navigation API & Spatial API Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
  });

  const makeWrapper = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    );
  };

  it('covers SessionProvider fake-token rejection, legacy token upgrade, role toggle fallback, updateAccount, and logOut', async () => {
    mockStorage.set('session', 'legacy-jwt-string');
    const { result, unmount } = await renderHook(() => useSession(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.session?.accessToken).toBe('legacy-jwt-string');

    // Toggle role network failure -> local fallback
    mockToggleRole.mockRejectedValueOnce(new Error('Offline'));
    await act(async () => {
      await result.current.setRoleEnabled('reviewer', false);
    });
    expect(result.current.session?.account.roles).not.toContain('reviewer');

    // Toggle role API success with registeredRoles sync
    mockToggleRole.mockResolvedValueOnce({
      accessToken: 'jwt-new',
      user: {
        roles: ['DRIVER', 'SURVEYOR', 'REVIEWER'],
        registeredRoles: ['DRIVER', 'SURVEYOR', 'REVIEWER'],
      },
    });
    await act(async () => {
      await result.current.setRoleEnabled('reviewer', true);
    });
    expect(result.current.session?.accessToken).toBe('jwt-new');
    expect(result.current.session?.account.registeredRoles).toEqual([
      'driver',
      'surveyor',
      'reviewer',
    ]);

    // Toggle role with throwOnError: true propagates error
    mockToggleRole.mockRejectedValueOnce(new Error('Server unavailable'));
    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.setRoleEnabled('surveyor', false, { throwOnError: true });
      } catch (err) {
        thrownError = err;
      }
    });
    expect(thrownError).toBeInstanceOf(Error);
    expect((thrownError as Error).message).toBe('Server unavailable');

    await act(async () => {
      await result.current.updateAccount?.({ displayName: 'Tên Mới' });
    });
    expect(result.current.session?.account.displayName).toBe('Tên Mới');

    await act(async () => {
      await result.current.logOut();
    });
    expect(result.current.session).toBeNull();
    await unmount();

    // Rejects 'fake-session-token'
    mockStorage.set('session', JSON.stringify({ accessToken: 'fake-session-token', account: { id: '1' } }));
    const { result: res2 } = await renderHook(() => useSession(), { wrapper: makeWrapper() });
    await waitFor(() => expect(res2.current.isInitializing).toBe(false));
    expect(res2.current.session).toBeNull();
  });

  it('covers navigation API mode mapping, fallback vehicle modes, and array vs object sessions response', async () => {
    expect(resolveRoutingModeAndType('MOTORCYCLE').vehicleType).toBe('MOTORCYCLE');
    expect(resolveRoutingModeAndType('BIKE').vehicleMode).toBe('BIKE');
    expect(resolveRoutingModeAndType('CYCLING').vehicleType).toBe('BICYCLE');
    expect(resolveRoutingModeAndType('WALKING').vehicleType).toBe('PEDESTRIAN');
    expect(resolveRoutingModeAndType('DRIVING').vehicleType).toBe('CAR');

    mockApiRequest.mockRejectedValueOnce(new Error('503'));
    const modes = await getVehicleModes();
    expect(modes.map((m) => m.id)).toEqual(['MOTORCYCLE', 'DRIVING', 'CYCLING', 'WALKING']);

    mockApiRequest.mockResolvedValueOnce([{ id: 's1' }]);
    const arrRes = await getNavigationSessions({ page: 1, pageSize: 10 }, 'tok');
    expect(arrRes.items).toHaveLength(1);
    expect(arrRes.totalPages).toBe(1);

    mockApiRequest.mockResolvedValueOnce({ items: [{ id: 's2' }], total: 25 });
    const objRes = await getNavigationSessions({ page: 2, pageSize: 10 }, 'tok');
    expect(objRes.totalPages).toBe(3);
  });

  it('covers spatial API backend generic fallback to Nominatim fallback & formatResolvedLocationTitle edge cases', async () => {
    expect(formatResolvedLocationTitle({ latitude: 10, longitude: 106, roadName: null, displayAddress: '123.45, Không xác định' })).toBe('123.45, Không xác định');
    expect(formatResolvedLocationTitle({ latitude: 10, longitude: 106, roadName: null, displayAddress: 'Việt Nam' })).toBeNull();

    // Backend returns generic 'Việt Nam', fallback resolves street name
    mockApiRequest
      .mockResolvedValueOnce({ latitude: 10.77, longitude: 106.7, roadName: null, displayAddress: 'Việt Nam' })
      .mockResolvedValueOnce({
        address: { street: 'Đường Lê Lợi' },
        display_name: 'Đường Lê Lợi, Q1',
      });
    const res = await resolveLocation(10.77, 106.7, 'tok');
    expect(res?.roadName).toBe('Đường Lê Lợi');

    // Primary backend call fails, fallback also fails -> returns null
    mockApiRequest
      .mockRejectedValueOnce(new Error('Down'))
      .mockRejectedValueOnce(new Error('Also down'));
    expect(await resolveLocation(10.77, 106.7, 'tok')).toBeNull();
  });
});
