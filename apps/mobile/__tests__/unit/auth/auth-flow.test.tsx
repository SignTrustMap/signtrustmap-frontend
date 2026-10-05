import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components under test
import LoginScreen from '@/app/(public)/login';
import RegisterScreen from '@/app/(public)/register';
import { authExpiredEmitter } from '@/api/api-client';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// 1. Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

// 2. Mock Safe Area & Themes
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

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
    neutral: '#F1F5F9',
  }),
}));

// 3. Mock Storage (in-memory)
const mockStorage = new Map<string, string>();

jest.mock('@/hooks/use-storage', () => ({
  setStorageItemAsync: jest.fn((key: string, val: string) => {
    mockStorage.set(key, val);
    return Promise.resolve();
  }),
  getStorageItemAsync: jest.fn((key: string) => {
    return Promise.resolve(mockStorage.get(key) ?? null);
  }),
  removeStorageItemAsync: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

// 4. Mock Session Provider & Auth Hooks for Screens
const mockLogIn = jest.fn();
const mockLogOut = jest.fn();
const mockSetRoleEnabled = jest.fn();
let mockSessionValue: any = null;

jest.mock('@/context/session-provider', () => {
  const actual = jest.requireActual('@/context/session-provider');
  return {
    ...actual,
    useSession: () => ({
      session: mockSessionValue,
      isLoading: false,
      isInitializing: false,
      logIn: mockLogIn,
      logOut: mockLogOut,
      setRoleEnabled: mockSetRoleEnabled,
    }),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// 5. Mock Auth API methods
const mockApiLogin = jest.fn();
const mockApiRegister = jest.fn();

jest.mock('@/api/auth/auth', () => ({
  login: (...args: any[]) => mockApiLogin(...args),
  register: (...args: any[]) => mockApiRegister(...args),
}));

// 6. Test Screen Render Helper with QueryClientProvider
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

async function renderScreen(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return await render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Authentication Flow: Comprehensive Unit Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockSearchParams = {};
    mockSessionValue = null;
    mockLogIn.mockImplementation(async (session: any) => {
      mockStorage.set('session', JSON.stringify(session));
    });
    mockLogOut.mockImplementation(async () => {
      mockStorage.delete('session');
    });
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  // =========================================================================
  // CASE 1: Render Login Page
  // =========================================================================
  describe('Case 1: Render Login Page', () => {
    it('renders logo, titles, email and password inputs, submit button, google button, and sign up link', async () => {
      const { getByText, getByPlaceholderText } = await renderScreen(<LoginScreen />);

      // Brand headers
      expect(getByText('SignTrustMap')).toBeTruthy();
      expect(getByText('Welcome back. Please enter your details.')).toBeTruthy();

      // Form inputs
      expect(getByPlaceholderText('demo@stm.dev')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();

      // Action buttons & links
      expect(getByText('Forgot Password?')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
      expect(getByText('Log in with google')).toBeTruthy();
      expect(getByText("Don't have an account?")).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();

      // Dev quick login shortcuts (since __DEV__ is true in Jest)
      expect(getByText('DEV QUICK LOGIN')).toBeTruthy();
      expect(getByText('Demo (All Roles)')).toBeTruthy();
      expect(getByText('Reviewer 1')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 2: Fill Form
  // =========================================================================
  describe('Case 2: Fill Form', () => {
    it('updates email and password fields when user enters credentials', async () => {
      const { getByPlaceholderText } = await renderScreen(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('demo@stm.dev'), 'surveyor@signtrust.org');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'SecurePass123!');

      await waitFor(() => {
        expect(getByPlaceholderText('demo@stm.dev').props.value).toBe('surveyor@signtrust.org');
        expect(getByPlaceholderText('Enter your password').props.value).toBe('SecurePass123!');
      });
    });
  });

  // =========================================================================
  // CASE 3: Form Error & Clear On Valid Input
  // =========================================================================
  describe('Case 3: Form Error and Real-time Recovery', () => {
    it('validates email format and password length, then clears errors when filled correctly', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderScreen(<LoginScreen />);

      // 1. Submit with empty fields
      fireEvent.press(getByText('Login'));

      // Validation errors should appear
      await waitFor(() => {
        expect(getByText('Must be a valid email address.')).toBeTruthy();
        expect(getByText('Password must be greater than 1 character.')).toBeTruthy();
      });
      expect(mockApiLogin).not.toHaveBeenCalled();

      // 2. Correct the email field -> email error should disappear
      fireEvent.changeText(getByPlaceholderText('demo@stm.dev'), 'valid@stm.dev');
      await waitFor(() => {
        expect(queryByText('Must be a valid email address.')).toBeNull();
        expect(getByText('Password must be greater than 1 character.')).toBeTruthy();
      });

      // 3. Correct the password field -> password error should disappear
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'ValidPassword');
      await waitFor(() => {
        expect(queryByText('Password must be greater than 1 character.')).toBeNull();
      });
    });
  });

  // =========================================================================
  // CASE 4: Submit Form Successfully
  // =========================================================================
  describe('Case 4: Submit Login Form', () => {
    it('submits credentials, triggers session storage, and navigates to home route', async () => {
      mockApiLogin.mockResolvedValueOnce({
        accessToken: 'access-token-jwt-999',
        account: {
          id: 'user-id-999',
          email: 'surveyor@stm.dev',
          displayName: 'John Surveyor',
          roles: ['driver', 'surveyor'],
        },
      });

      const { getByPlaceholderText, getByText } = await renderScreen(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('demo@stm.dev'), 'surveyor@stm.dev');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'SurveyorPass123');

      await waitFor(() => {
        expect(getByPlaceholderText('demo@stm.dev').props.value).toBe('surveyor@stm.dev');
        expect(getByPlaceholderText('Enter your password').props.value).toBe('SurveyorPass123');
      });

      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockApiLogin).toHaveBeenCalledWith({
          email: 'surveyor@stm.dev',
          password: 'SurveyorPass123',
        });
        expect(mockLogIn).toHaveBeenCalledWith(
          expect.objectContaining({ accessToken: 'access-token-jwt-999' }),
        );
        expect(mockReplace).toHaveBeenCalledWith('/');
      });

      // Storage should have the saved session
      await waitFor(() => {
        const stored = mockStorage.get('session');
        expect(stored).toBeDefined();
        expect(JSON.parse(stored!).accessToken).toBe('access-token-jwt-999');
      });
    });
  });

  // =========================================================================
  // CASE 5: Network Error & Error Gone on Retry
  // =========================================================================
  describe('Case 5: Login Network Error and Retry Recovery', () => {
    it('displays error message on failed request and clears it on correction and successful retry', async () => {
      mockApiLogin.mockRejectedValueOnce(new Error('Invalid email or password.'));

      const { getByPlaceholderText, getByText, queryByText } = await renderScreen(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('demo@stm.dev'), 'wrong@stm.dev');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'WrongPass');

      await waitFor(() => {
        expect(getByPlaceholderText('demo@stm.dev').props.value).toBe('wrong@stm.dev');
        expect(getByPlaceholderText('Enter your password').props.value).toBe('WrongPass');
      });

      fireEvent.press(getByText('Login'));

      // Error alert should be displayed
      await waitFor(() => {
        expect(getByText('Invalid email or password.')).toBeTruthy();
      });

      // Editing the email clears the error banner
      fireEvent.changeText(getByPlaceholderText('demo@stm.dev'), 'correct@stm.dev');
      await waitFor(() => {
        expect(getByPlaceholderText('demo@stm.dev').props.value).toBe('correct@stm.dev');
        expect(queryByText('Invalid email or password.')).toBeNull();
      });

      // Retry with mock success
      mockApiLogin.mockResolvedValueOnce({
        accessToken: 'valid-token',
        account: { id: 'u1', email: 'correct@stm.dev', displayName: 'Correct User', roles: ['driver'] },
      });

      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'CorrectPass');
      await waitFor(() => {
        expect(getByPlaceholderText('Enter your password').props.value).toBe('CorrectPass');
      });

      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });
  });

  // =========================================================================
  // CASE 6: Render Sign Up Page
  // =========================================================================
  describe('Case 6: Render Sign Up Page', () => {
    it('renders STM branding, title, input fields for full name, email, phone, password, and login link', async () => {
      const { getByText, getByPlaceholderText } = await renderScreen(<RegisterScreen />);

      expect(getByText('STM')).toBeTruthy();
      expect(getByText('Create your account')).toBeTruthy();
      expect(getByText('Register to start using SignTrustMap.')).toBeTruthy();

      expect(getByPlaceholderText('Your full name')).toBeTruthy();
      expect(getByPlaceholderText('you@example.com')).toBeTruthy();
      expect(getByPlaceholderText('Your phone number')).toBeTruthy();
      expect(getByPlaceholderText('At least 8 characters')).toBeTruthy();

      expect(getByText('Create account')).toBeTruthy();
      expect(getByText('Already have an account?')).toBeTruthy();
      expect(getByText('Log in')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 7: Fill Form & Validation Check
  // =========================================================================
  describe('Case 7: Sign Up Form Validation and Real-time Recovery', () => {
    it('validates empty and short inputs, and clears errors individually as user enters values', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await renderScreen(<RegisterScreen />);

      // Click create account with empty fields
      fireEvent.press(getByText('Create account'));

      // Check all validation error messages
      await waitFor(() => {
        expect(getByText('Enter your full name.')).toBeTruthy();
        expect(getByText('Enter a valid email address.')).toBeTruthy();
        expect(getByText('Enter your phone number.')).toBeTruthy();
        expect(getByText('Use at least 8 characters.')).toBeTruthy();
      });
      expect(mockApiRegister).not.toHaveBeenCalled();

      // Clear full name error on input
      fireEvent.changeText(getByPlaceholderText('Your full name'), 'Jane Doe');
      await waitFor(() => {
        expect(getByPlaceholderText('Your full name').props.value).toBe('Jane Doe');
        expect(queryByText('Enter your full name.')).toBeNull();
        expect(getByText('Enter a valid email address.')).toBeTruthy();
      });

      // Clear email error on valid input
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'jane@stm.dev');
      await waitFor(() => {
        expect(getByPlaceholderText('you@example.com').props.value).toBe('jane@stm.dev');
        expect(queryByText('Enter a valid email address.')).toBeNull();
      });

      // Clear phone error
      fireEvent.changeText(getByPlaceholderText('Your phone number'), '+84901234567');
      await waitFor(() => {
        expect(getByPlaceholderText('Your phone number').props.value).toBe('+84901234567');
        expect(queryByText('Enter your phone number.')).toBeNull();
      });

      // Password with < 8 chars still shows error
      fireEvent.changeText(getByPlaceholderText('At least 8 characters'), '12345');
      await waitFor(() => {
        expect(getByPlaceholderText('At least 8 characters').props.value).toBe('12345');
      });
      fireEvent.press(getByText('Create account'));
      await waitFor(() => {
        expect(getByText('Use at least 8 characters.')).toBeTruthy();
      });

      // Provide >= 8 chars password
      fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'Pass12345678');
      await waitFor(() => {
        expect(getByPlaceholderText('At least 8 characters').props.value).toBe('Pass12345678');
        expect(queryByText('Use at least 8 characters.')).toBeNull();
      });
    });
  });

  // =========================================================================
  // CASE 8: Submit Form
  // =========================================================================
  describe('Case 8: Submit Sign Up Form', () => {
    it('submits valid registration request with trimmed form fields', async () => {
      mockApiRegister.mockResolvedValueOnce({ message: 'User registered successfully.' });

      const { getByPlaceholderText, getByText } = await renderScreen(<RegisterScreen />);

      fireEvent.changeText(getByPlaceholderText('Your full name'), 'Alex Morgan');
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alex@stm.dev');
      fireEvent.changeText(getByPlaceholderText('Your phone number'), '0987654321');
      fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'StrongSecretPassword');

      await waitFor(() => {
        expect(getByPlaceholderText('Your full name').props.value).toBe('Alex Morgan');
        expect(getByPlaceholderText('you@example.com').props.value).toBe('alex@stm.dev');
        expect(getByPlaceholderText('Your phone number').props.value).toBe('0987654321');
        expect(getByPlaceholderText('At least 8 characters').props.value).toBe('StrongSecretPassword');
      });

      fireEvent.press(getByText('Create account'));

      await waitFor(() => {
        expect(mockApiRegister).toHaveBeenCalledWith({
          fullName: 'Alex Morgan',
          email: 'alex@stm.dev',
          phone: '0987654321',
          password: 'StrongSecretPassword',
        });
      });
    });
  });

  // =========================================================================
  // CASE 9: Network Error & Error Gone on Retry
  // =========================================================================
  describe('Case 9: Sign Up Network Error and Retry Recovery', () => {
    it('displays error alert on server failure and clears it on modification and successful retry', async () => {
      mockApiRegister.mockRejectedValueOnce(new Error('Email is already registered.'));

      const { getByPlaceholderText, getByText, queryByText } = await renderScreen(<RegisterScreen />);

      fireEvent.changeText(getByPlaceholderText('Your full name'), 'Existing User');
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'existing@stm.dev');
      fireEvent.changeText(getByPlaceholderText('Your phone number'), '0900000000');
      fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'ExistingPass123');

      await waitFor(() => {
        expect(getByPlaceholderText('Your full name').props.value).toBe('Existing User');
        expect(getByPlaceholderText('you@example.com').props.value).toBe('existing@stm.dev');
        expect(getByPlaceholderText('Your phone number').props.value).toBe('0900000000');
        expect(getByPlaceholderText('At least 8 characters').props.value).toBe('ExistingPass123');
      });

      fireEvent.press(getByText('Create account'));

      await waitFor(() => {
        expect(getByText('Email is already registered.')).toBeTruthy();
      });

      // Typing into email clears the server error
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'new_unique@stm.dev');
      await waitFor(() => {
        expect(getByPlaceholderText('you@example.com').props.value).toBe('new_unique@stm.dev');
        expect(queryByText('Email is already registered.')).toBeNull();
      });

      // Next attempt succeeds
      mockApiRegister.mockResolvedValueOnce({ message: 'Registered' });
      fireEvent.press(getByText('Create account'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith({
          pathname: '/login',
          params: { registered: 'true' },
        });
      });
    });
  });

  // =========================================================================
  // CASE 10: Sign Up Success Navigation to Login Page
  // =========================================================================
  describe('Case 10: Navigation to Login on Successful Registration', () => {
    it('redirects to /login with registered: true parameter upon successful account creation', async () => {
      mockApiRegister.mockResolvedValueOnce({ message: 'Success' });

      const { getByPlaceholderText, getByText } = await renderScreen(<RegisterScreen />);

      fireEvent.changeText(getByPlaceholderText('Your full name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('you@example.com'), 'newuser@stm.dev');
      fireEvent.changeText(getByPlaceholderText('Your phone number'), '0912345678');
      fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'Password123');

      await waitFor(() => {
        expect(getByPlaceholderText('Your full name').props.value).toBe('Test User');
        expect(getByPlaceholderText('you@example.com').props.value).toBe('newuser@stm.dev');
        expect(getByPlaceholderText('Your phone number').props.value).toBe('0912345678');
        expect(getByPlaceholderText('At least 8 characters').props.value).toBe('Password123');
      });

      fireEvent.press(getByText('Create account'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith({
          pathname: '/login',
          params: { registered: 'true' },
        });
      });
    });
  });

  // =========================================================================
  // CASE 11: Google Sign-in Fallback Notice
  // =========================================================================
  describe('Case 11: Google Sign-in Fallback Notice', () => {
    it('displays notice when user attempts to log in with Google', async () => {
      const { getByText } = await renderScreen(<LoginScreen />);

      fireEvent.press(getByText('Log in with google'));

      await waitFor(() => {
        expect(getByText('Google sign-in is not available in the mobile app yet.')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 12: Dev Quick Login Presets
  // =========================================================================
  describe('Case 12: Dev Quick Login Presets', () => {
    it('logs in immediately with Demo credentials when "Demo (All Roles)" chip is pressed', async () => {
      mockApiLogin.mockResolvedValueOnce({
        accessToken: 'demo-token',
        account: { id: 'demo-id', email: 'demo@stm.dev', displayName: 'Demo User', roles: ['driver', 'surveyor', 'reviewer'] },
      });

      const { getByText } = await renderScreen(<LoginScreen />);

      fireEvent.press(getByText('Demo (All Roles)'));

      await waitFor(() => {
        expect(mockApiLogin).toHaveBeenCalledWith({
          email: 'demo@stm.dev',
          password: 'Demo@123',
        });
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });

    it('logs in immediately with Reviewer credentials when "Reviewer 1" chip is pressed', async () => {
      mockApiLogin.mockResolvedValueOnce({
        accessToken: 'reviewer-token-1',
        account: { id: 'rev-1', email: 'reviewer1@stm.dev', displayName: 'Reviewer 1', roles: ['driver', 'reviewer'] },
      });

      const { getByText } = await renderScreen(<LoginScreen />);

      fireEvent.press(getByText('Reviewer 1'));

      await waitFor(() => {
        expect(mockApiLogin).toHaveBeenCalledWith({
          email: 'reviewer1@stm.dev',
          password: 'Reviewer@123',
        });
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });
  });

  // =========================================================================
  // CASE 13: Password Visibility Toggle
  // =========================================================================
  describe('Case 13: Password Visibility Toggle in Inputs', () => {
    it('toggles password visibility between secure and plain text', async () => {
      const { getByPlaceholderText, getByLabelText, queryByLabelText } = await renderScreen(<LoginScreen />);

      expect(getByPlaceholderText('Enter your password').props.secureTextEntry).toBe(true);
      const showButton = getByLabelText('Show password');
      expect(showButton).toBeTruthy();

      fireEvent.press(showButton);

      await waitFor(() => {
        expect(getByPlaceholderText('Enter your password').props.secureTextEntry).toBe(false);
        expect(queryByLabelText('Show password')).toBeNull();
        expect(getByLabelText('Hide password')).toBeTruthy();
      });

      fireEvent.press(getByLabelText('Hide password'));

      await waitFor(() => {
        expect(getByPlaceholderText('Enter your password').props.secureTextEntry).toBe(true);
      });
    });
  });

  // =========================================================================
  // CASE 14: Cross-Screen Navigation Links
  // =========================================================================
  describe('Case 14: Screen Navigation Transitions', () => {
    it('navigates to /register when clicking Sign Up on LoginScreen', async () => {
      const { getByText } = await renderScreen(<LoginScreen />);

      fireEvent.press(getByText('Sign Up'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/register');
      });
    });

    it('navigates to /login when clicking Log in on RegisterScreen', async () => {
      const { getByText } = await renderScreen(<RegisterScreen />);

      fireEvent.press(getByText('Log in'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });
  });

  // =========================================================================
  // CASE 15: SessionProvider Lifecycle, Persistence & Role Normalization
  // =========================================================================
  describe('Case 15: SessionProvider Lifecycle and Persistence', () => {
    const { SessionProvider: RealSessionProvider, useSession: useRealSession } =
      jest.requireActual('@/context/session-provider');

    function SessionConsumer() {
      const { session, isLoading, isInitializing, logIn, logOut, setRoleEnabled } = useRealSession();
      return (
        <View>
          <Text testID="is-loading">{String(isLoading)}</Text>
          <Text testID="is-initializing">{String(isInitializing)}</Text>
          <Text testID="user-email">{session?.account?.email ?? 'no-user'}</Text>
          <Text testID="user-roles">{session?.account?.roles ? session.account.roles.join(',') : 'no-roles'}</Text>
          <Pressable
            testID="login-btn"
            onPress={() =>
              logIn({
                accessToken: 'jwt-persistent-token',
                account: {
                  id: 'usr-persisted',
                  email: 'persisted@stm.dev',
                  displayName: 'Persisted User',
                  roles: ['surveyor'],
                },
              })
            }
          />
          <Pressable testID="toggle-reviewer-on" onPress={() => setRoleEnabled('reviewer', true)} />
          <Pressable testID="toggle-surveyor-off" onPress={() => setRoleEnabled('surveyor', false)} />
          <Pressable testID="logout-btn" onPress={() => logOut()} />
        </View>
      );
    }

    it('bootstraps existing session from storage, normalizes driver role, and allows role toggling and logout', async () => {
      mockStorage.set(
        'session',
        JSON.stringify({
          accessToken: 'stored-jwt-token',
          account: {
            id: 'stored-id',
            displayName: 'Stored User',
            email: 'stored@stm.dev',
            roles: ['surveyor'],
          },
        }),
      );

      const testQueryClient = new QueryClient();
      const { getByTestId } = await render(
        <QueryClientProvider client={testQueryClient}>
          <RealSessionProvider>
            <SessionConsumer />
          </RealSessionProvider>
        </QueryClientProvider>,
      );

      // Awaits initialization
      await waitFor(() => {
        expect(getByTestId('is-initializing').props.children).toBe('false');
        expect(getByTestId('user-email').props.children).toBe('stored@stm.dev');
        expect(getByTestId('user-roles').props.children).toContain('driver');
        expect(getByTestId('user-roles').props.children).toContain('surveyor');
      });

      // 2. Toggle 'reviewer' role on
      fireEvent.press(getByTestId('toggle-reviewer-on'));
      await waitFor(() => {
        expect(getByTestId('user-roles').props.children).toContain('reviewer');
      });

      // 3. Toggle 'surveyor' role off
      fireEvent.press(getByTestId('toggle-surveyor-off'));
      await waitFor(() => {
        const roles = getByTestId('user-roles').props.children;
        expect(roles).not.toContain('surveyor');
        expect(roles).toContain('driver');
        expect(roles).toContain('reviewer');
      });

      // 4. Log out
      fireEvent.press(getByTestId('logout-btn'));
      await waitFor(() => {
        expect(getByTestId('user-email').props.children).toBe('no-user');
        expect(mockStorage.get('session')).toBeUndefined();
      });
    });
  });

  // =========================================================================
  // CASE 16: Auto-logout on Auth Expired Event
  // =========================================================================
  describe('Case 16: Auto-Logout via authExpiredEmitter', () => {
    const { SessionProvider: RealSessionProvider, useSession: useRealSession } =
      jest.requireActual('@/context/session-provider');

    function AutoLogoutConsumer() {
      const { session, logOut } = useRealSession();

      React.useEffect(() => {
        const unsubscribe = authExpiredEmitter.subscribe(() => {
          logOut().catch(() => { });
        });
        return () => {
          unsubscribe();
        };
      }, [logOut]);

      return (
        <View>
          <Text testID="auth-state">{session ? 'LOGGED_IN' : 'LOGGED_OUT'}</Text>
        </View>
      );
    }

    it('triggers logOut and transitions session to null when authExpiredEmitter emits', async () => {
      mockStorage.set(
        'session',
        JSON.stringify({
          accessToken: 'will-expire-token',
          account: { id: 'u-exp', displayName: 'Exp User', email: 'exp@stm.dev', roles: ['driver'] },
        }),
      );

      const testQueryClient = new QueryClient();
      const { getByTestId } = await render(
        <QueryClientProvider client={testQueryClient}>
          <RealSessionProvider>
            <AutoLogoutConsumer />
          </RealSessionProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(getByTestId('auth-state').props.children).toBe('LOGGED_IN');
      });

      // 401/403 event triggered by API client
      await act(async () => {
        authExpiredEmitter.emit();
      });

      await waitFor(() => {
        expect(getByTestId('auth-state').props.children).toBe('LOGGED_OUT');
        expect(mockStorage.get('session')).toBeUndefined();
      });
    });
  });
});
