import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockCanGoBack = true;
let mockStartParams: Record<string, string | undefined> = {
  destinationId: 'dest-1',
  destinationLat: '10.7725',
  destinationLng: '106.6980',
  destinationSubtitle: 'Q1, TP.HCM',
  destinationTitle: 'Chợ Bến Thành',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => mockCanGoBack,
  }),
  useLocalSearchParams: () => mockStartParams,
}));

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`ant-${props.name}`} {...props} />;
});

let mockSessionValue: any = { session: { accessToken: 'tok-1', account: { id: 'u-1' } } };
jest.mock('@/context/session-provider', () => ({
  useSession: () => mockSessionValue,
  useOptionalSession: () => mockSessionValue,
}));

const mockSaveRecent = jest.fn();
let mockPlacesResult: any = { data: [], isLoading: false, error: undefined };
jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: () => mockPlacesResult,
  useSaveRecentPlace: () => ({ mutate: mockSaveRecent }),
}));

const mockFetchFreshGpsPosition = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: (...args: any[]) => mockFetchFreshGpsPosition(...args),
}));

jest.mock('@/hooks/use-storage', () => ({
  removeStorageItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockGetSavedRoutes = jest.fn();
const mockCreateSavedRoute = jest.fn();
const mockUpdateSavedRoute = jest.fn();
const mockDeleteSavedRoute = jest.fn();
jest.mock('@/api/saved-routes/saved-routes', () => ({
  getSavedRoutes: (...args: any[]) => mockGetSavedRoutes(...args),
  createSavedRoute: (...args: any[]) => mockCreateSavedRoute(...args),
  updateSavedRoute: (...args: any[]) => mockUpdateSavedRoute(...args),
  deleteSavedRoute: (...args: any[]) => mockDeleteSavedRoute(...args),
}));

const mockResolveLocation = jest.fn();
jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: (...args: any[]) => mockResolveLocation(...args),
  formatResolvedLocationTitle: (r: any) => r?.roadName ?? null,
}));

import { NavigationStartScreen } from '@/feature/navigation/pages/navigation-start-screen';
import {
  SignFilterProvider,
  parseRouteCategories,
  useSignFilter,
} from '@/context/sign-filter-provider';

describe('NavigationStartScreen & SignFilterProvider Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack = true;
    mockSessionValue = { session: { accessToken: 'tok-1', account: { id: 'u-1' } } };
    mockStartParams = {
      destinationId: 'dest-1',
      destinationLat: '10.7725',
      destinationLng: '106.6980',
      destinationSubtitle: 'Q1, TP.HCM',
      destinationTitle: 'Chợ Bến Thành',
    };
    mockPlacesResult = { data: [], isLoading: false, error: undefined };
    mockGetSavedRoutes.mockResolvedValue([]);
  });

  describe('NavigationStartScreen', () => {
    it('handles back navigation across canGoBack, destination fallback, and bare /home fallback', async () => {
      const screen = await render(<NavigationStartScreen />);
      await fireEvent.press(screen.getByLabelText('Quay lại'));
      expect(mockBack).toHaveBeenCalledTimes(1);

      mockCanGoBack = false;
      await fireEvent.press(screen.getByLabelText('Quay lại'));
      expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/home' }));

      mockStartParams = {};
      await screen.rerender(<NavigationStartScreen />);
      await fireEvent.press(screen.getByLabelText('Quay lại'));
      expect(mockReplace).toHaveBeenCalledWith('/home');
    });

    it('handles current location selection for unavailable GPS, same location, and valid coordinate', async () => {
      mockFetchFreshGpsPosition.mockResolvedValueOnce(null);
      const screen = await render(<NavigationStartScreen />);

      await act(async () => {
        await fireEvent.press(screen.getByLabelText('Sử dụng vị trí hiện tại'));
      });
      expect(screen.getByText(/Không thể lấy vị trí hiện tại/)).toBeTruthy();

      // Same location as destination
      mockFetchFreshGpsPosition.mockResolvedValueOnce([106.6980, 10.7725]);
      await act(async () => {
        await fireEvent.press(screen.getByLabelText('Sử dụng vị trí hiện tại'));
      });
      expect(screen.getByText(/Không thể chọn cùng một vị trí/)).toBeTruthy();

      // Different location -> navigates to /home
      mockFetchFreshGpsPosition.mockResolvedValueOnce([106.7100, 10.7800]);
      await act(async () => {
        await fireEvent.press(screen.getByLabelText('Sử dụng vị trí hiện tại'));
      });
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/home',
          params: expect.objectContaining({ startTitle: 'Vị trí hiện tại' }),
        }),
      );
    });

    it('handles search states (loading, error, empty, results), swap, and start selection', async () => {
      mockPlacesResult = { data: [], isLoading: true, error: undefined };
      const screen = await render(<NavigationStartScreen />);
      await fireEvent.changeText(screen.getByLabelText('Tìm điểm xuất phát'), 'Bến');
      expect(screen.getByText('Kết quả tìm kiếm')).toBeTruthy();

      mockPlacesResult = { data: [], isLoading: false, error: 'Lỗi tìm kiếm' };
      await screen.rerender(<NavigationStartScreen />);
      expect(screen.getByText('Lỗi tìm kiếm')).toBeTruthy();

      mockPlacesResult = {
        data: [
          { id: 'bad', title: 'No Coords', address: 'NA', latitude: null, longitude: null },
          { id: 'same', title: 'Same Dest', address: 'Q1', latitude: 10.7725, longitude: 106.6980 },
          { id: 'ok', title: 'Landmark 81', address: 'Bình Thạnh', latitude: 10.7950, longitude: 106.7218 },
        ],
        isLoading: false,
        error: undefined,
      };
      await screen.rerender(<NavigationStartScreen />);

      await fireEvent.press(screen.getByLabelText('No Coords'));
      expect(mockReplace).not.toHaveBeenCalled();

      await fireEvent.press(screen.getByLabelText('Same Dest'));
      expect(screen.getByText(/Không thể chọn cùng một vị trí/)).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Landmark 81'));
      expect(mockSaveRecent).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/home',
          params: expect.objectContaining({ startTitle: 'Landmark 81' }),
        }),
      );

      await fireEvent.press(screen.getByLabelText('Đổi chiều điểm đi và đến'));
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/home/search' }),
      );
    });
  });

  describe('SignFilterProvider & parseRouteCategories', () => {
    it('parses all formats in parseRouteCategories', () => {
      expect(parseRouteCategories(null)).toHaveLength(4);
      expect(parseRouteCategories(['P', { code: 'W' }, 123])).toEqual(['PROHIBITORY', 'WARNING']);
      expect(parseRouteCategories('["R","I"]')).toEqual(['MANDATORY', 'INFORMATION']);
      expect(parseRouteCategories('["M"]')).toEqual(['WARNING']);
      expect(parseRouteCategories('[P, invalid_bracket]')).toEqual(['PROHIBITORY', 'WARNING']);
      expect(parseRouteCategories('TEMPORARY')).toEqual(['TEMPORARY']);
      expect(parseRouteCategories('T')).toEqual(['WARNING']);
      expect(parseRouteCategories('unknown')).toEqual(['WARNING']);
      expect(parseRouteCategories('[]')).toHaveLength(4);
    });

    it('returns default context safely outside provider', async () => {
      const { result } = await renderHook(() => useSignFilter());
      expect(result.current.presets).toEqual([]);
      expect((await result.current.createPreset('a', [])).id).toBe('');
      await result.current.deletePreset('1');
      await result.current.updatePreset('1', {});
      await result.current.renamePreset('1', 'x');
      await result.current.setActivePresetId(null);
      await result.current.refetchPresets();
    });

    it('supports authenticated create/update/rename/delete/refetch and guest local presets', async () => {
      mockGetSavedRoutes.mockResolvedValueOnce({
        routes: [
          {
            id: 'r-1',
            title: 'Tuyến 1',
            originName: 'A',
            destinationName: 'B',
            filterRules: { categories: ['P'], onlyFixedSigns: false },
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      mockResolveLocation.mockResolvedValueOnce({ roadName: 'Đường Nguyễn Huệ' });
      mockCreateSavedRoute.mockResolvedValueOnce({
        id: 'r-2',
        title: 'Đường Nguyễn Huệ ➔ Chợ',
        createdAt: '2026-01-02T00:00:00Z',
      });
      mockUpdateSavedRoute.mockResolvedValueOnce({ id: 'r-2', title: 'Đã đổi tên' });
      mockDeleteSavedRoute.mockRejectedValueOnce(new Error('Delete error'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SignFilterProvider>{children}</SignFilterProvider>
      );
      const { result, rerender } = await renderHook(() => useSignFilter(), { wrapper });

      await waitFor(() => expect(result.current.presets).toHaveLength(1));

      await act(async () => {
        await result.current.createPreset('Vị trí hiện tại ➔ Chợ', ['WARNING'], {
          originName: 'Vị trí hiện tại',
          originLatitude: 10.77,
          originLongitude: 106.7,
          destinationName: 'Chợ',
          distanceMeters: 1200.4,
          durationSeconds: 300.2,
        });
      });
      expect(result.current.activePreset?.name).toBe('Đường Nguyễn Huệ ➔ Chợ');
      expect(result.current.activeOnlyFixedSigns).toBe(true);
      expect(result.current.activeCategories?.has('WARNING')).toBe(true);

      await act(async () => {
        await result.current.renamePreset('r-2', '   ');
        await result.current.renamePreset('r-2', 'Đã đổi tên');
      });
      expect(mockUpdateSavedRoute).toHaveBeenCalled();

      await act(async () => {
        await result.current.deletePreset('r-2');
      });
      expect(result.current.activePresetId).toBeNull();

      await act(async () => {
        await result.current.refetchPresets();
      });

      // Guest mode (no accessToken)
      mockSessionValue = { session: null };
      await rerender({});
      await act(async () => {
        const local = await result.current.createPreset('', [], {
          originName: 'Xuất phát',
          destinationName: 'Đích',
        });
        await result.current.updatePreset(local.id, { categories: ['TEMPORARY'], onlyFixedSigns: false });
        await result.current.setActivePresetId(local.id);
      });
      expect(result.current.activeOnlyFixedSigns).toBe(false);
    });
  });
});
