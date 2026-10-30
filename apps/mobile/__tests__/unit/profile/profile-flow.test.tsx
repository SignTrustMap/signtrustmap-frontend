import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '@/feature/profile/pages/profile-screen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// 1. Mock session provider
const mockLogOut = jest.fn();
const mockSetRoleEnabled = jest.fn();
let mockSessionData: any = {
  accessToken: 'mock-access-token',
  account: {
    id: 'user-profile-test',
    email: 'alex.rivera@stm.dev',
    displayName: 'Alex Rivera',
    roles: ['driver', 'reviewer'],
  },
};

jest.mock('@/context/session-provider', () => {
  const actual = jest.requireActual('@/context/session-provider');
  return {
    ...actual,
    useSession: () => ({
      session: mockSessionData,
      isLoading: false,
      isInitializing: false,
      logIn: jest.fn(),
      logOut: mockLogOut,
      setRoleEnabled: mockSetRoleEnabled,
    }),
  };
});

// 2. Mock Theme
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    secondary: '#38BDF8',
    danger: '#EF4444',
  }),
}));

// 3. Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      R.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

// 4. Mock Vector Icons
jest.mock('@expo/vector-icons', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      R.createElement(View, { testID: `icon-${props.name}` }),
  };
});

// 5. Mock expo-router
let mockLocalSearchParams: Record<string, string> = {};
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockLocalSearchParams,
  useRouter: () => mockRouter,
}));

// 6. Mock SignFilterManager component
jest.mock('@/feature/profile/components/sign-filter-manager', () => {
  const R = require('react');
  const { Text, View } = require('react-native');
  return {
    SignFilterManager: () =>
      R.createElement(
        View,
        { testID: 'sign-filter-manager' },
        R.createElement(Text, null, 'Sign Filter Manager Section')
      ),
  };
});

// 7. Mock useAppUpdate hook
const mockCheckForUpdates = jest.fn();
const mockCloseModal = jest.fn();
let mockAppUpdateState = {
  status: 'idle',
  releaseInfo: null,
  errorMessage: null,
  currentVersion: '1.4.0',
  currentCommit: '9f8e7d6c5b4a',
  isModalOpen: false,
  checkForUpdates: mockCheckForUpdates,
  closeModal: mockCloseModal,
};

jest.mock('@/hooks/use-app-update', () => ({
  useAppUpdate: () => mockAppUpdateState,
}));

// 8. Mock UpdateModal component
jest.mock('@/components/update-modal', () => {
  const R = require('react');
  const { Text, View } = require('react-native');
  return {
    UpdateModal: ({ visible }: any) =>
      visible
        ? R.createElement(
            View,
            { testID: 'update-modal' },
            R.createElement(Text, null, 'Update Modal Open')
          )
        : null,
  };
});

// ---------------------------------------------------------------------------
// Unit Test Suite: ProfileScreen
// ---------------------------------------------------------------------------

describe('ProfileScreen Unit Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSearchParams = {};
    mockSessionData = {
      accessToken: 'mock-access-token',
      account: {
        id: 'user-profile-test',
        email: 'alex.rivera@stm.dev',
        displayName: 'Alex Rivera',
        roles: ['driver', 'reviewer'],
      },
    };
    mockAppUpdateState = {
      status: 'idle',
      releaseInfo: null,
      errorMessage: null,
      currentVersion: '1.4.0',
      currentCommit: '9f8e7d6c5b4a',
      isModalOpen: false,
      checkForUpdates: mockCheckForUpdates,
      closeModal: mockCloseModal,
    };
  });

  // =========================================================================
  // CASE 1: User Profile & Identity Display
  // =========================================================================
  describe('Case 1: User Identity and Avatar Rendering', () => {
    it('renders the user full name, email, and initials avatar badge', async () => {
      const { getByText, getByLabelText } = await render(<ProfileScreen />);

      // Identity
      expect(getByText('Alex Rivera')).toBeTruthy();
      expect(getByText('alex.rivera@stm.dev')).toBeTruthy();

      // Initials: "Alex Rivera" -> "AR"
      expect(getByText('AR')).toBeTruthy();

      // Accessibility label for avatar
      expect(getByLabelText('Ảnh đại diện của Alex Rivera')).toBeTruthy();
    });

    it('renders fallback display name and NS initials when user name is undefined', async () => {
      mockSessionData = {
        accessToken: 'mock-access-token',
        account: {
          id: 'user-anonymous',
          email: 'anon@stm.dev',
          displayName: undefined,
          roles: ['driver'],
        },
      };

      const { getByText, getByLabelText } = await render(<ProfileScreen />);

      // Fallback display name
      expect(getByText('Người dùng SignTrustMap')).toBeTruthy();
      expect(getByText('anon@stm.dev')).toBeTruthy();

      // Fallback initials "ND" for "Người dùng SignTrustMap"
      expect(getByText('ND')).toBeTruthy();
      expect(getByLabelText('Ảnh đại diện của Người dùng SignTrustMap')).toBeTruthy();
    });

    it('navigates to edit screen when clicking Chỉnh sửa', async () => {
      const { getByLabelText } = await render(<ProfileScreen />);

      const editButton = getByLabelText('Chỉnh sửa thông tin');
      fireEvent.press(editButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/(authenticated)/(tabs)/profile/edit');
    });
  });

  // =========================================================================
  // CASE 2: Role Management & Toggles
  // =========================================================================
  describe('Case 2: Role Management and Role Toggles', () => {
    it('displays Driver role as always enabled without a toggle switch', async () => {
      const { getByText, queryByLabelText } = await render(<ProfileScreen />);

      expect(getByText('Vai trò tài khoản')).toBeTruthy();
      expect(getByText('Quyền Tài xế luôn được kích hoạt mặc định')).toBeTruthy();
      expect(getByText('Tài xế')).toBeTruthy();
      expect(getByText('Quyền điều hướng bản đồ')).toBeTruthy();

      // Driver cannot be toggled (no switch button)
      expect(queryByLabelText(/vai trò Tài xế/i)).toBeNull();
    });

    it('displays Reviewer role as On when user has reviewer role and toggles it Off', async () => {
      const { getByLabelText, getByText } = await render(<ProfileScreen />);

      expect(getByText('Thẩm định viên')).toBeTruthy();
      expect(getByText('Công cụ Thẩm định viên')).toBeTruthy();

      // Switch should have label "Tắt vai trò Thẩm định viên"
      const reviewerSwitch = getByLabelText('Tắt vai trò Thẩm định viên');
      expect(reviewerSwitch.props.accessibilityRole).toBe('switch');
      expect(reviewerSwitch.props.accessibilityState).toEqual({ checked: true });

      // Toggle off
      fireEvent.press(reviewerSwitch);
      expect(mockSetRoleEnabled).toHaveBeenCalledTimes(1);
      expect(mockSetRoleEnabled).toHaveBeenCalledWith('reviewer', false);
    });

    it('displays Surveyor role as Off when not in user roles and toggles it On', async () => {
      const { getByLabelText, getByText } = await render(<ProfileScreen />);

      expect(getByText('Khảo sát viên')).toBeTruthy();
      expect(getByText('Công cụ Khảo sát viên')).toBeTruthy();

      // Switch should have label "Bật vai trò Khảo sát viên"
      const surveyorSwitch = getByLabelText('Bật vai trò Khảo sát viên');
      expect(surveyorSwitch.props.accessibilityRole).toBe('switch');
      expect(surveyorSwitch.props.accessibilityState).toEqual({ checked: false });

      // Toggle on
      fireEvent.press(surveyorSwitch);
      expect(mockSetRoleEnabled).toHaveBeenCalledTimes(1);
      expect(mockSetRoleEnabled).toHaveBeenCalledWith('surveyor', true);
    });
  });

  // =========================================================================
  // CASE 3: Sign Filter Manager Section
  // =========================================================================
  describe('Case 3: Sign Filter Manager Section', () => {
    it('renders the embedded SignFilterManager component when section is opened', async () => {
      const { getByTestId, getByText, getByLabelText } = await render(<ProfileScreen />);

      const openFilterButton = getByLabelText('Mở rộng bộ lọc biển báo');
      fireEvent.press(openFilterButton);

      await waitFor(() => {
        expect(getByTestId('sign-filter-manager')).toBeTruthy();
        expect(getByText('Sign Filter Manager Section')).toBeTruthy();
      });
    });

    it('handles scrollTo="signFilter" param and automatically expands section', async () => {
      mockLocalSearchParams = { scrollTo: 'signFilter' };

      const { getByTestId } = await render(<ProfileScreen />);
      await waitFor(() => {
        expect(getByTestId('sign-filter-manager')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 4: App Updates Section
  // =========================================================================
  describe('Case 4: Application Updates', () => {
    it('triggers update check on press of the cog update button', async () => {
      const { getByLabelText } = await render(<ProfileScreen />);

      const updateButton = getByLabelText('Kiểm tra cập nhật');
      fireEvent.press(updateButton);

      expect(mockCheckForUpdates).toHaveBeenCalledTimes(1);
    });

    it('renders UpdateModal when isModalOpen is true', async () => {
      mockAppUpdateState = {
        ...mockAppUpdateState,
        isModalOpen: true,
      };

      const { getByTestId, getByText } = await render(<ProfileScreen />);

      expect(getByTestId('update-modal')).toBeTruthy();
      expect(getByText('Update Modal Open')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 5: Logout Action via Dropdown Menu
  // =========================================================================
  describe('Case 5: Log out Flow', () => {
    it('opens dropdown menu and invokes logOut callback upon click', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
        const logoutAction = buttons?.find((b: any) => b.text === 'Đăng xuất');
        logoutAction?.onPress?.();
      });

      const { getByLabelText, findByLabelText } = await render(<ProfileScreen />);

      // Open 3-dots dropdown menu
      const menuButton = getByLabelText('Tùy chọn tài khoản');
      fireEvent.press(menuButton);

      // Find the logout button in the dropdown
      const logOutButton = await findByLabelText('Đăng xuất');
      fireEvent.press(logOutButton);

      expect(alertSpy).toHaveBeenCalled();
      expect(mockLogOut).toHaveBeenCalledTimes(1);

      alertSpy.mockRestore();
    });
  });
});
