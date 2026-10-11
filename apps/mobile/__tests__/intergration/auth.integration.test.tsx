import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Real Application Code Under Test (No mocking of auth or apiClient!)
import LoginScreen from '@/app/(public)/login';
import RegisterScreen from '@/app/(public)/register';
import { SessionProvider, useSession } from '@/context/session-provider';
import { authExpiredEmitter } from '@/api/api-client';

// MSW Server, Handlers, and Fixtures
import {
  server,
  mockUsers,
  mockLoginRequests,
  mockRegisterRequests,
  authScenarioHandlers,
} from '../mocks/msw';

// ---------------------------------------------------------------------------
// External Infrastructure Mocks (Expo Router, SecureStore, Theme)
// ---------------------------------------------------------------------------

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

jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View: RNView } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      R.createElement(RNView, props, children),
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
    secondary: '#38BDF8',
    danger: '#EF4444',
  }),
}));

// In-Memory Storage to inspect real SessionProvider persistence
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

// ---------------------------------------------------------------------------
// Helper: Render Component with Real Providers (Session + React Query)
// ---------------------------------------------------------------------------
function createIntegrationQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

async function renderWithAuthProviders(ui: React.ReactElement) {
  const queryClient = createIntegrationQueryClient();
  return await render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{ui}</SessionProvider>
    </QueryClientProvider>
  );
}

// Minimal Session Consumer Component to observe real SessionProvider state and auto-logout
function SessionConsumer() {
  const { session, isInitializing, logOut } = useSession();

  React.useEffect(() => {
    const unsubscribe = authExpiredEmitter.subscribe(() => {
      void logOut();
    });
    return () => {
      unsubscribe();
    };
  }, [logOut]);

  if (isInitializing) return <Text testID="session-initializing">Initializing...</Text>;
  if (!session) return <Text testID="session-guest">Guest</Text>;
  return (
    <View testID="session-active">
      <Text testID="session-token">{session.accessToken}</Text>
      <Text testID="session-user-id">{session.account.id}</Text>
      <Text testID="session-roles">{session.account.roles.join(',')}</Text>
      <Text testID="session-display-name">{session.account.displayName}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MSW Server Lifecycle
// ---------------------------------------------------------------------------
beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  mockStorage.clear();
  jest.clearAllMocks();
  mockSearchParams = {};
});

afterAll(() => {
  server.close();
});

// ---------------------------------------------------------------------------
// Integration Test Suite: Authentication Flow with MSW
// ---------------------------------------------------------------------------
describe('Authentication Flow Integration Tests (MSW)', () => {
  // =========================================================================
  // TEST 1: Full Login Flow (Happy Path with Demo User)
  // =========================================================================
  it('authenticates user end-to-end, normalizes backend roles, saves session to storage, and navigates to root', async () => {
    const { getByPlaceholderText, getByText } = await renderWithAuthProviders(<LoginScreen />);

    // 1. Fill in valid demo credentials
    const emailInput = getByPlaceholderText('demo@stm.dev');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Login');

    await fireEvent.changeText(emailInput, mockLoginRequests.validDemo.email);
    await fireEvent.changeText(passwordInput, mockLoginRequests.validDemo.password);

    await waitFor(() => {
      expect(emailInput.props.value).toBe(mockLoginRequests.validDemo.email);
      expect(passwordInput.props.value).toBe(mockLoginRequests.validDemo.password);
    });

    // 2. Submit form -> Real login() -> Real apiClient -> MSW intercepts
    await fireEvent.press(submitButton);

    // 3. Verify successful navigation
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });

    // 4. Verify that real SessionProvider saved session to SecureStore
    const storedSessionRaw = mockStorage.get('session');
    expect(storedSessionRaw).toBeTruthy();

    const storedSession = JSON.parse(storedSessionRaw!);
    expect(storedSession.accessToken).toBe('mock-jwt-token-demo-all-roles');
    expect(storedSession.account.email).toBe(mockUsers.demo.email);
    expect(storedSession.account.displayName).toBe(mockUsers.demo.fullName);

    // 5. Verify role normalization: ['DRIVER', 'REVIEWER', 'SURVEYOR'] -> ['driver', 'reviewer', 'surveyor']
    expect(storedSession.account.roles).toEqual(
      expect.arrayContaining(['driver', 'reviewer', 'surveyor'])
    );
  });

  // =========================================================================
  // TEST 2: Dev Quick Login Chip (Reviewer 1 Persona)
  // =========================================================================
  it('authenticates via quick chip and establishes reviewer permissions in session', async () => {
    const { getByText } = await renderWithAuthProviders(<LoginScreen />);

    // Click "Reviewer 1" preset chip
    const reviewerChip = getByText(/Reviewer\s*1/);
    await fireEvent.press(reviewerChip);

    // Verify redirection
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });

    // Verify session contains reviewer role
    const storedSession = JSON.parse(mockStorage.get('session')!);
    expect(storedSession.accessToken).toBe('mock-jwt-token-reviewer-1');
    expect(storedSession.account.roles).toContain('reviewer');
  });

  // =========================================================================
  // TEST 3: Login Failure - 401 Unauthorized (Invalid Password)
  // =========================================================================
  it('displays 401 Unauthorized error message and does not create a session', async () => {
    const { getByPlaceholderText, getByText } = await renderWithAuthProviders(
      <LoginScreen />
    );

    const emailInput = getByPlaceholderText('demo@stm.dev');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Login');

    // Fill with wrong password
    await fireEvent.changeText(emailInput, mockLoginRequests.invalidWrongPassword.email);
    await fireEvent.changeText(passwordInput, mockLoginRequests.invalidWrongPassword.password);

    await waitFor(() => {
      expect(emailInput.props.value).toBe(mockLoginRequests.invalidWrongPassword.email);
      expect(passwordInput.props.value).toBe(mockLoginRequests.invalidWrongPassword.password);
    });

    await fireEvent.press(submitButton);

    // Verify 401 error message from backend wire response appears on screen
    await waitFor(() => {
      expect(getByText('Invalid email or password')).toBeTruthy();
    });

    // Verify no navigation and no stored session
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockStorage.get('session')).toBeUndefined();
  });

  // =========================================================================
  // TEST 4: Login Failure - 403 Forbidden (Deactivated Account)
  // =========================================================================
  it('handles 403 Forbidden when deactivated user attempts to log in', async () => {
    const { getByPlaceholderText, getByText } = await renderWithAuthProviders(
      <LoginScreen />
    );

    const emailInput = getByPlaceholderText('demo@stm.dev');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Login');

    await fireEvent.changeText(emailInput, mockLoginRequests.invalidDeactivatedUser.email);
    await fireEvent.changeText(passwordInput, mockLoginRequests.invalidDeactivatedUser.password);

    await waitFor(() => {
      expect(emailInput.props.value).toBe(mockLoginRequests.invalidDeactivatedUser.email);
      expect(passwordInput.props.value).toBe(mockLoginRequests.invalidDeactivatedUser.password);
    });

    await fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Account is deactivated')).toBeTruthy();
    });

    expect(mockStorage.get('session')).toBeUndefined();
  });

  // =========================================================================
  // TEST 5: Network Disconnection & Recovery on Login
  // =========================================================================
  it('shows network error on connection failure and succeeds on retry', async () => {
    const { getByPlaceholderText, getByText } = await renderWithAuthProviders(<LoginScreen />);

    const emailInput = getByPlaceholderText('demo@stm.dev');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Login');

    // Step 1: Trigger simulated network drop
    await fireEvent.changeText(emailInput, mockLoginRequests.networkErrorTrigger.email);
    await fireEvent.changeText(passwordInput, mockLoginRequests.networkErrorTrigger.password);

    await waitFor(() => {
      expect(emailInput.props.value).toBe(mockLoginRequests.networkErrorTrigger.email);
      expect(passwordInput.props.value).toBe(mockLoginRequests.networkErrorTrigger.password);
    });

    await fireEvent.press(submitButton);

    // Network error message caught by apiClient
    await waitFor(() => {
      expect(getByText(/Failed to connect to backend/i)).toBeTruthy();
    });

    // Step 2: User fixes connection/credentials and retries
    await fireEvent.changeText(emailInput, mockLoginRequests.validDemo.email);
    await fireEvent.changeText(passwordInput, mockLoginRequests.validDemo.password);

    await waitFor(() => {
      expect(emailInput.props.value).toBe(mockLoginRequests.validDemo.email);
      expect(passwordInput.props.value).toBe(mockLoginRequests.validDemo.password);
    });

    await fireEvent.press(submitButton);

    // Verify recovery and successful login
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
    expect(mockStorage.get('session')).toBeTruthy();
  });

  // =========================================================================
  // TEST 6: Registration Happy Path (201 Created)
  // =========================================================================
  it('registers new user end-to-end and redirects to login page with prefilled email', async () => {
    const { getByPlaceholderText, getByRole } = await renderWithAuthProviders(
      <RegisterScreen />
    );

    const nameInput = getByPlaceholderText('Your full name');
    const emailInput = getByPlaceholderText('you@example.com');
    const phoneInput = getByPlaceholderText('Your phone number');
    const passwordInput = getByPlaceholderText('At least 8 characters');

    // Fill all registration inputs matching RegisterScreen placeholders
    await fireEvent.changeText(nameInput, mockRegisterRequests.validNewUser.fullName);
    await fireEvent.changeText(emailInput, mockRegisterRequests.validNewUser.email);
    await fireEvent.changeText(phoneInput, mockRegisterRequests.validNewUser.phone);
    await fireEvent.changeText(passwordInput, mockRegisterRequests.validNewUser.password);

    await waitFor(() => {
      expect(nameInput.props.value).toBe(mockRegisterRequests.validNewUser.fullName);
      expect(emailInput.props.value).toBe(mockRegisterRequests.validNewUser.email);
      expect(phoneInput.props.value).toBe(mockRegisterRequests.validNewUser.phone);
      expect(passwordInput.props.value).toBe(mockRegisterRequests.validNewUser.password);
    });

    const submitButton = getByRole('button', { name: 'Create account' });
    await fireEvent.press(submitButton);

    // Verify navigation to login screen with registered parameter
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/login',
        params: { registered: 'true' },
      });
    });
  });

  // =========================================================================
  // TEST 7: Registration Conflict - 409 Duplicate Email
  // =========================================================================
  it('displays 409 Conflict error when email is already registered', async () => {
    const { getByPlaceholderText, getByRole, getByText } = await renderWithAuthProviders(
      <RegisterScreen />
    );

    const nameInput = getByPlaceholderText('Your full name');
    const emailInput = getByPlaceholderText('you@example.com');
    const phoneInput = getByPlaceholderText('Your phone number');
    const passwordInput = getByPlaceholderText('At least 8 characters');

    // Fill with existing demo user email
    await fireEvent.changeText(nameInput, mockRegisterRequests.invalidExistingEmail.fullName);
    await fireEvent.changeText(emailInput, mockRegisterRequests.invalidExistingEmail.email);
    await fireEvent.changeText(phoneInput, mockRegisterRequests.invalidExistingEmail.phone);
    await fireEvent.changeText(passwordInput, mockRegisterRequests.invalidExistingEmail.password);

    await waitFor(() => {
      expect(nameInput.props.value).toBe(mockRegisterRequests.invalidExistingEmail.fullName);
      expect(emailInput.props.value).toBe(mockRegisterRequests.invalidExistingEmail.email);
      expect(phoneInput.props.value).toBe(mockRegisterRequests.invalidExistingEmail.phone);
      expect(passwordInput.props.value).toBe(mockRegisterRequests.invalidExistingEmail.password);
    });

    const submitButton = getByRole('button', { name: 'Create account' });
    await fireEvent.press(submitButton);

    // Verify MSW 409 conflict error message appears
    await waitFor(() => {
      expect(getByText('Email is already registered')).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  // =========================================================================
  // TEST 8: Session Persistence & Rehydration
  // =========================================================================
  it('rehydrates persisted session from storage on startup without network request', async () => {
    // Pre-populate storage with an existing valid session
    const existingSession = {
      accessToken: 'persisted-jwt-token-xyz',
      account: {
        id: 'persisted-user-99',
        displayName: 'Persisted User',
        email: 'persisted@stm.dev',
        roles: ['driver', 'surveyor'],
      },
    };
    mockStorage.set('session', JSON.stringify(existingSession));

    const { getByTestId } = await renderWithAuthProviders(<SessionConsumer />);

    // Verify consumer immediately displays the persisted credentials
    await waitFor(() => {
      expect(getByTestId('session-active')).toBeTruthy();
      expect(getByTestId('session-token').props.children).toBe('persisted-jwt-token-xyz');
      expect(getByTestId('session-user-id').props.children).toBe('persisted-user-99');
      expect(getByTestId('session-roles').props.children).toBe('driver,surveyor');
    });
  });

  // =========================================================================
  // TEST 9: Auto-Logout via authExpiredEmitter
  // =========================================================================
  it('clears active session and storage when authExpiredEmitter fires on 401 response', async () => {
    // Pre-populate active session
    mockStorage.set(
      'session',
      JSON.stringify({
        accessToken: 'active-session-token',
        account: {
          id: 'user-to-expire',
          displayName: 'Expiring User',
          email: 'expire@stm.dev',
          roles: ['driver'],
        },
      })
    );

    const { getByTestId } = await renderWithAuthProviders(<SessionConsumer />);

    await waitFor(() => {
      expect(getByTestId('session-active')).toBeTruthy();
    });

    // Simulate an API call returning 401 which emits authExpiredEmitter
    await act(async () => {
      authExpiredEmitter.emit();
    });

    // Verify session is cleared in React state and in storage
    await waitFor(() => {
      expect(getByTestId('session-guest')).toBeTruthy();
    });
    expect(mockStorage.get('session')).toBeUndefined();
  });
});
