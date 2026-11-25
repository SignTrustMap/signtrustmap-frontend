import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string | undefined> = { role: 'reviewer' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@shopify/flash-list', () => {
  const ReactActual = require('react');
  const { FlatList } = require('react-native');
  return {
    FlashList: ReactActual.forwardRef((props: any, ref: any) =>
      ReactActual.createElement(FlatList, { ...props, ref }),
    ),
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="catalog-expo-image" {...props} />,
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: (props: any) => {
    const { View } = require('react-native');
    return <View testID="symbol-view" {...props} />;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('@/hooks/use-back-button', () => ({
  useBackButton: jest.fn(),
}));

jest.mock('@/hooks/use-work-route', () => ({
  useWorkRoute: () => '/work',
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    border: '#CBD5E1',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    neutral: '#F1F5F9',
  }),
}));

jest.mock('@/feature/review/components/review-bottom-tabs', () => ({
  ReviewBottomTabs: () => null,
}));

let mockCatalogQuery: any = { data: undefined, isPending: false, error: null };
const mockRefreshCatalog = jest.fn();
jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetCatalog: () => mockCatalogQuery,
  useRefreshCatalog: () => ({ mutateAsync: mockRefreshCatalog, isPending: false }),
}));

let mockNotificationsState: any = { data: { items: [] }, isLoading: false, isRefetching: false, refetch: jest.fn() };
let mockUnreadCount = 0;
const mockMarkAllRead = jest.fn();
jest.mock('@/feature/notifications/hooks/use-notifications', () => ({
  useGetNotifications: () => mockNotificationsState,
  useGetUnreadNotificationCount: () => ({ data: mockUnreadCount }),
  useMarkAllNotificationsAsRead: () => ({ mutate: mockMarkAllRead, isPending: false }),
}));

const mockSearchPlaces = jest.fn();
jest.mock('@/api/navigation/places', () => ({
  searchPlaces: (...args: any[]) => mockSearchPlaces(...args),
}));

import { SignCatalogScreen } from '@/feature/review/pages/sign-catalog-screen';
import { NotificationsScreen } from '@/feature/notifications/pages/notifications-screen';
import { useAddressAutocomplete } from '@/feature/profile/hooks/use-address-autocomplete';

describe('SignCatalogScreen, NotificationsScreen & useAddressAutocomplete Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { role: 'reviewer' };
    mockCatalogQuery = {
      data: {
        categories: [
          { id: 1, code: 'WARN', nameVi: 'Cảnh báo', nameEn: 'Warning' },
          { id: 2, code: 'PROHIB', nameEn: 'Prohibition' },
          { id: 3, code: 'GUIDE', nameEn: 'Guide' },
          { id: 4, code: 'REGUL', nameEn: 'Regulatory' },
          { id: 5, code: 'TEMP', nameEn: 'Temporary' },
        ],
        signs: [
          {
            id: 10,
            categoryId: 1,
            signCode: 'W.201',
            nameVi: 'Nguy hiểm',
            nameEn: 'Curve',
            description: 'Đường cong',
            representativeImageKey: 'https://cdn.example.com/w201.png',
            category: { id: 1, code: 'WARN', nameVi: 'Cảnh báo', nameEn: 'Warning' },
          },
          {
            id: 11,
            categoryId: 2,
            signCode: 'P.102',
            nameEn: 'No Entry',
            representativeImageKey: 'https://signtrustmap.vn/skip.png',
            category: { id: 2, code: 'PROHIB', nameEn: 'Prohibition' },
          },
          {
            id: 12,
            categoryId: 3,
            signCode: 'I.401',
            nameEn: 'Guide',
            category: { id: 3, code: 'GUIDE', nameEn: 'Guide' },
          },
          {
            id: 13,
            categoryId: 4,
            signCode: 'R.301',
            nameEn: 'Right',
            category: { id: 4, code: 'REGUL', nameEn: 'Regulatory' },
          },
          {
            id: 14,
            categoryId: 5,
            signCode: 'T.1',
            nameEn: 'Temp',
            category: { id: 5, code: 'TEMP', nameEn: 'Temporary' },
          },
        ],
      },
      isPending: false,
      error: null,
    };
    mockUnreadCount = 0;
    mockNotificationsState = { data: { items: [] }, isLoading: false, isRefetching: false, refetch: jest.fn() };
  });

  it('covers SignCatalogScreen filtering, search, image inspect modal, back navigation, and error state', async () => {
    const screen = await render(<SignCatalogScreen />);
    expect(screen.getByText('Tra cứu biển báo')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Xem biển báo Nguy hiểm'));
    await fireEvent.changeText(screen.getByLabelText('Tìm kiếm biển báo'), 'nguy hiem');
    expect(screen.getAllByText('Nguy hiểm').length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByText('Prohibition'));
    expect(screen.getByText('Không tìm thấy biển báo')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockReplace).toHaveBeenCalledWith('/work');

    mockCatalogQuery = {
      data: { categories: [], signs: [] },
      isPending: false,
      error: new Error('Catalog timeout'),
    };
    await screen.rerender(<SignCatalogScreen />);
    expect(screen.getByText('Catalog timeout')).toBeTruthy();
  });

  it('covers NotificationsScreen loading, empty, unread mark-all, and all notification types', async () => {
    mockNotificationsState = { data: undefined, isLoading: true, isRefetching: false, refetch: jest.fn() };
    const screen = await render(<NotificationsScreen />);
    expect(screen.getByText('Đang tải thông báo...')).toBeTruthy();

    mockNotificationsState = { data: { items: [] }, isLoading: false, isRefetching: false, refetch: jest.fn() };
    await screen.rerender(<NotificationsScreen />);
    expect(screen.getByText('Chưa có thông báo nào')).toBeTruthy();

    mockUnreadCount = 12;
    mockNotificationsState = {
      data: {
        items: [
          { id: 'n1', type: 'SIGN_MISSING_DISPATCH', title: 'T1', message: 'Msg 1', isRead: false, createdAt: new Date().toISOString() },
          { id: 'n2', type: 'REVALIDATION_RECAPTURE_REQUESTED', title: 'T2', isRead: true, createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
          { id: 'n3', type: 'REVALIDATION_CLOSED', title: 'T3', isRead: true, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
          { id: 'n4', type: 'HAZARD_VERIFIED', title: 'T4', isRead: true, createdAt: new Date(Date.now() - 25 * 3600000).toISOString() },
          { id: 'n5', type: 'REWARD_CREDITED', title: 'T5', isRead: true, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
          { id: 'n6', type: 'OTHER_UNKNOWN', title: 'T6', isRead: true, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
        ],
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    };
    await screen.rerender(<NotificationsScreen />);
    expect(screen.getByText('9+')).toBeTruthy();
    await fireEvent.press(screen.getByText('Đọc tất cả'));
    expect(mockMarkAllRead).toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('covers useAddressAutocomplete typing, search success/error, place select, clear, hydrate, and map confirm', async () => {
    const onSyncAddress = jest.fn();
    const onFormField = jest.fn();
    mockSearchPlaces.mockResolvedValue([
      { id: 'p1', title: 'Quận 1', address: 'Quận 1, TP.HCM', latitude: 10.77, longitude: 106.7, type: 'recent' },
    ]);

    const { result, unmount } = await renderHook(() =>
      useAddressAutocomplete({ initialAddress: '', onSyncAddress }),
    );

    await act(async () => {
      result.current.hydrateFromInitialAddress('Quận 1');
    });
    await waitFor(() => expect(result.current.selectedCoordinate).toEqual([106.7, 10.77]));

    await act(async () => {
      result.current.handleAddressTextChange('Bến Thành', onFormField);
    });
    expect(onFormField).toHaveBeenCalledWith('Bến Thành');
    await waitFor(() => expect(result.current.addressSuggestions).toHaveLength(1));

    await act(async () => {
      result.current.handleSelectPlace(
        { id: 'p2', title: 'Hồ Con Rùa', address: null, latitude: 10.78, longitude: 106.69, type: 'recent' },
        onFormField,
      );
    });
    expect(result.current.addressInput).toBe('Hồ Con Rùa');

    await act(async () => {
      result.current.handleClearAddress(onFormField);
      result.current.handleMapConfirm([106.71, 10.79], 'Địa chỉ từ bản đồ');
    });
    expect(result.current.addressInput).toBe('Địa chỉ từ bản đồ');
    await unmount();
  });
});
