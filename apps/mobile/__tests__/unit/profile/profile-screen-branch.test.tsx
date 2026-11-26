import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockCanGoBack = true;
let mockParams: any = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, canGoBack: () => mockCanGoBack }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (cb: any) => {
    const ReactActual = require('react');
    ReactActual.useEffect(() => cb?.(), [cb]);
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
  };
});

jest.mock('@/components/primary-gradient-backdrop', () => ({ PrimaryGradientBackdrop: () => null }));
jest.mock('@/components/update-modal', () => ({ UpdateModal: () => null }));
jest.mock('@/components/offline-map-modal', () => ({ OfflineMapModal: () => null }));

const mockGetProfile = jest.fn();
jest.mock('@/api/auth/auth', () => ({
  getProfile: (...args: any[]) => mockGetProfile(...args),
}));

const mockCheckForUpdates = jest.fn();
jest.mock('@/hooks/use-app-update', () => ({
  useAppUpdate: () => ({
    checkForUpdates: mockCheckForUpdates,
    closeModal: jest.fn(),
    currentCommit: 'abc',
    currentVersion: '1.0.0',
    errorMessage: undefined,
    isModalOpen: false,
    releaseInfo: null,
    status: 'checking',
  }),
}));

const mockLogOut = jest.fn();
const mockSetRoleEnabled = jest.fn();
let mockSessionState: any = {
  session: {
    accessToken: 'tok-p',
    account: { id: 'u1', displayName: 'Tài xế', email: 'd@signmap.vn', roles: ['DRIVER', 'SURVEYOR'] },
  },
  logOut: mockLogOut,
  setRoleEnabled: mockSetRoleEnabled,
};
jest.mock('@/context/session-provider', () => ({
  ACCOUNT_ROLES: ['driver', 'surveyor', 'reviewer'],
  useSession: () => mockSessionState,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    primary: '#0671EB',
    danger: '#EF4444',
    text: '#0F172A',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFF6FF',
    border: '#CBD5E1',
  }),
}));

import { ProfileScreen } from '@/feature/profile/pages/profile-screen';

describe('ProfileScreen Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack = true;
    mockParams = {};
    mockGetProfile.mockResolvedValue({
      fullName: 'Người Dùng Pro',
      email: 'pro@signmap.vn',
      avatarUrl: null,
      roles: ['SURVEYOR', 'reviewer'],
    });
    mockSetRoleEnabled.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('covers profile fetch, role toggling, menu dropdown actions, back fallback, scrollTo param, and logout alert error path', async () => {
    const screen = await render(<ProfileScreen />);
    await waitFor(() => expect(screen.getByText('Người Dùng Pro')).toBeTruthy());

    // Toggle collapsible roles card & toggle role switch
    await fireEvent.press(screen.getByLabelText('Tắt vai trò Thẩm định viên'));
    expect(mockSetRoleEnabled).toHaveBeenCalledWith('reviewer', false, { throwOnError: true });

    await fireEvent.press(screen.getByLabelText('Thu gọn vai trò tài khoản'));
    await fireEvent.press(screen.getByLabelText('Mở rộng vai trò tài khoản'));

    // Navigation buttons
    await fireEvent.press(screen.getByLabelText('Chỉnh sửa thông tin'));
    expect(mockPush).toHaveBeenCalledWith('/(authenticated)/(tabs)/profile/edit');

    await fireEvent.press(screen.getByLabelText('Mở màn hình bộ lọc biển báo'));
    expect(mockPush).toHaveBeenCalledWith('/(authenticated)/(tabs)/profile/sign-filters');

    await fireEvent.press(screen.getByLabelText('Mở quản lý bản đồ ngoại tuyến'));

    // Back with canGoBack vs fallback
    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockBack).toHaveBeenCalled();
    mockCanGoBack = false;
    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockReplace).toHaveBeenCalledWith('/(authenticated)/(tabs)/home');

    // Open dropdown menu -> check update -> reopen -> logout failure Alert
    await fireEvent.press(screen.getByLabelText('Tùy chọn tài khoản'));
    await fireEvent.press(screen.getByLabelText('Cập nhật ứng dụng'));
    expect(mockCheckForUpdates).toHaveBeenCalled();

    mockLogOut.mockRejectedValueOnce(new Error('Logout err'));
    await fireEvent.press(screen.getAllByLabelText('Đăng xuất')[0]);
    const alertBtns = (Alert.alert as jest.Mock).mock.calls.at(-1)?.[2];
    await alertBtns?.[1]?.onPress?.();
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Đăng xuất thất bại', expect.any(String)));

    // scrollTo param auto-navigates to sign-filters
    mockParams = { scrollTo: 'signFilter' };
    await screen.rerender(<ProfileScreen />);
    expect(mockPush).toHaveBeenCalledWith('/(authenticated)/(tabs)/profile/sign-filters');
  });
});
