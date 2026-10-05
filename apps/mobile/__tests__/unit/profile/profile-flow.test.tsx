import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockLocalSearchParams,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
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

      // Headers & identity
      expect(getByText('Profile')).toBeTruthy();
      expect(getByText('Alex Rivera')).toBeTruthy();
      expect(getByText('alex.rivera@stm.dev')).toBeTruthy();

      // Initials: "Alex Rivera" -> "AR"
      expect(getByText('AR')).toBeTruthy();

      // Accessibility label for avatar
      expect(getByLabelText('Alex Rivera profile picture')).toBeTruthy();
    });

    it('renders fallback display name and ST initials when user name is undefined', async () => {
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
      expect(getByText('SignTrustMap user')).toBeTruthy();
      expect(getByText('anon@stm.dev')).toBeTruthy();

      // Fallback initials "SU" for "SignTrustMap user"
      expect(getByText('SU')).toBeTruthy();
      expect(getByLabelText('SignTrustMap user profile picture')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 2: Role Management & Toggles
  // =========================================================================
  describe('Case 2: Role Management and Role Toggles', () => {
    it('displays Driver role as always enabled without a toggle switch', async () => {
      const { getByText, queryByLabelText } = await render(<ProfileScreen />);

      expect(getByText('Account roles')).toBeTruthy();
      expect(getByText('Driver access is always included')).toBeTruthy();
      expect(getByText('Driver')).toBeTruthy();
      expect(getByText('Navigation access')).toBeTruthy();

      // Driver cannot be toggled (no switch button)
      expect(queryByLabelText(/Enable Driver role/i)).toBeNull();
      expect(queryByLabelText(/Disable Driver role/i)).toBeNull();
    });

    it('displays Reviewer role as On when user has reviewer role and toggles it Off', async () => {
      // mockSessionData has roles: ['driver', 'reviewer']
      const { getByLabelText, getByText } = await render(<ProfileScreen />);

      expect(getByText('Reviewer')).toBeTruthy();
      expect(getByText('Reviewer tools')).toBeTruthy();

      // Switch should have label "Disable Reviewer role"
      const reviewerSwitch = getByLabelText('Disable Reviewer role');
      expect(reviewerSwitch.props.accessibilityRole).toBe('switch');
      expect(reviewerSwitch.props.accessibilityState).toEqual({ checked: true });

      // Toggle off
      fireEvent.press(reviewerSwitch);
      expect(mockSetRoleEnabled).toHaveBeenCalledTimes(1);
      expect(mockSetRoleEnabled).toHaveBeenCalledWith('reviewer', false);
    });

    it('displays Surveyor role as Off when not in user roles and toggles it On', async () => {
      // mockSessionData has roles: ['driver', 'reviewer'] (surveyor is not present)
      const { getByLabelText, getByText } = await render(<ProfileScreen />);

      expect(getByText('Surveyor')).toBeTruthy();
      expect(getByText('Surveyor tools')).toBeTruthy();

      // Switch should have label "Enable Surveyor role"
      const surveyorSwitch = getByLabelText('Enable Surveyor role');
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
    it('renders the embedded SignFilterManager component', async () => {
      const { getByTestId, getByText } = await render(<ProfileScreen />);

      expect(getByTestId('sign-filter-manager')).toBeTruthy();
      expect(getByText('Sign Filter Manager Section')).toBeTruthy();
    });

    it('handles scrollTo="signFilter" param without errors', async () => {
      mockLocalSearchParams = { scrollTo: 'signFilter' };

      // Render with mock layout measurements
      const { getByTestId } = await render(<ProfileScreen />);
      expect(getByTestId('sign-filter-manager')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 4: App Updates Section
  // =========================================================================
  describe('Case 4: Application Updates', () => {
    it('renders current app version and triggers update check on press', async () => {
      const { getByText, getByLabelText } = await render(<ProfileScreen />);

      expect(getByText('Application')).toBeTruthy();
      expect(getByText('App updates')).toBeTruthy();
      // Version 1.4.0 · 9f8e7d6
      expect(getByText('Version 1.4.0 · 9f8e7d6')).toBeTruthy();

      const updateButton = getByLabelText('Check for application updates');
      fireEvent.press(updateButton);

      expect(mockCheckForUpdates).toHaveBeenCalledTimes(1);
    });

    it('disables update button and shows checking state when checking', async () => {
      mockAppUpdateState = {
        ...mockAppUpdateState,
        status: 'checking',
      };

      const { getByText, getByLabelText } = await render(<ProfileScreen />);

      expect(getByText('Checking for updates…')).toBeTruthy();
      const updateButton = getByLabelText('Check for application updates');
      expect(updateButton.props.accessibilityState).toEqual({ disabled: true });
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
  // CASE 5: Logout Action
  // =========================================================================
  describe('Case 5: Log out Flow', () => {
    it('renders Log out button and invokes logOut callback upon click', async () => {
      const { getByText, getAllByLabelText } = await render(<ProfileScreen />);

      expect(getByText('Sign out of this device')).toBeTruthy();

      // Find the logout button
      const logOutButtons = getAllByLabelText('Log out');
      expect(logOutButtons.length).toBeGreaterThan(0);

      fireEvent.press(logOutButtons[0]);
      expect(mockLogOut).toHaveBeenCalledTimes(1);
    });
  });
});
