import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import * as SplashScreen from 'expo-splash-screen';

import {
  ErrorBoundary,
  ErrorFallbackView,
  RouteErrorBoundary,
} from '@/components/error-boundary';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    text: '#0F172A',
    placeholder: '#64748B',
    border: '#E2E8F0',
    primary: '#0671EB',
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

const originalConsoleError = console.error;
beforeEach(() => {
  jest.clearAllMocks();
  console.error = jest.fn();
});

afterEach(() => {
  cleanup();
  console.error = originalConsoleError;
});

// A component that can conditionally throw to test ErrorBoundary
function ProblemChild({ shouldThrow = true, message = 'Test crash occurred' }: { shouldThrow?: boolean; message?: string }) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <Text>Normal Child Rendered</Text>;
}

// ---------------------------------------------------------------------------
// Test Suite: ErrorBoundary & ErrorFallbackView
// ---------------------------------------------------------------------------

describe('ErrorBoundary Component', () => {
  it('renders children normally when no error is thrown', async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <Text>Hello World Safe Component</Text>
      </ErrorBoundary>,
    );

    expect(getByText('Hello World Safe Component')).toBeTruthy();
  });

  it('catches uncaught errors from child component and renders fallback UI', async () => {
    const { getByText, queryByText } = await render(
      <ErrorBoundary>
        <ProblemChild message="Critical rendering crash" />
      </ErrorBoundary>,
    );

    // Child should not be visible
    expect(queryByText('Normal Child Rendered')).toBeNull();

    // Default ErrorFallbackView should be visible
    expect(getByText('Something Went Wrong')).toBeTruthy();
    expect(getByText('Application Error')).toBeTruthy();
  });

  it('triggers SplashScreen.hideAsync when an error is caught', async () => {
    await render(
      <ErrorBoundary>
        <ProblemChild message="Splash error" />
      </ErrorBoundary>,
    );

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('calls onError callback with the error and component stack', async () => {
    const onErrorMock = jest.fn();

    await render(
      <ErrorBoundary onError={onErrorMock}>
        <ProblemChild message="Logged error" />
      </ErrorBoundary>,
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Logged error' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('supports custom ReactNode fallback', async () => {
    const { getByText } = await render(
      <ErrorBoundary fallback={<Text>Custom Node Fallback</Text>}>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(getByText('Custom Node Fallback')).toBeTruthy();
  });

  it('supports custom function fallback with resetError capability', async () => {
    function ResettableApp() {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary
          fallback={({ error, resetError }) => (
            <View>
              <Text>Custom Fn: {error.message}</Text>
              <Text
                testID="custom-reset-btn"
                onPress={() => {
                  setShouldThrow(false);
                  resetError();
                }}
              >
                Reset
              </Text>
            </View>
          )}
        >
          <ProblemChild shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    const { getByText, findByText } = await render(<ResettableApp />);

    expect(getByText('Custom Fn: Test crash occurred')).toBeTruthy();

    fireEvent.press(getByText('Reset'));

    expect(await findByText('Normal Child Rendered')).toBeTruthy();
  });
});

describe('ErrorFallbackView Component', () => {
  it('renders default error fallback view with title and description', async () => {
    const mockError = new Error('Database connection failed');
    const { getByText } = await render(
      <ErrorFallbackView error={mockError} />,
    );

    expect(getByText('Something Went Wrong')).toBeTruthy();
    expect(getByText(/An unexpected error occurred/)).toBeTruthy();
  });

  it('calls onRetry callback when Try Again button is pressed', async () => {
    const onRetryMock = jest.fn();
    const { getByLabelText } = await render(
      <ErrorFallbackView error={new Error('Network error')} onRetry={onRetryMock} />,
    );

    const retryBtn = getByLabelText('Try again');
    fireEvent.press(retryBtn);

    await waitFor(() => {
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates to home when Return to Home button is pressed', async () => {
    const onGoHomeMock = jest.fn();
    const { getByLabelText } = await render(
      <ErrorFallbackView error={new Error('Broken screen')} onGoHome={onGoHomeMock} />,
    );

    const homeBtn = getByLabelText('Return to home screen');
    fireEvent.press(homeBtn);

    expect(onGoHomeMock).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('toggles technical details and allows copying error to clipboard', async () => {
    const mockError = new Error('Syntax parsing failure');
    mockError.stack = 'Error at ProblemChild:12:3';

    const { getByLabelText, getByText, queryByText } = await render(
      <ErrorFallbackView error={mockError} />,
    );

    // Details should be collapsed by default
    expect(queryByText('Syntax parsing failure')).toBeNull();

    // Press accordion toggle to expand
    const toggleBtn = getByLabelText('Show technical details');
    fireEvent.press(toggleBtn);

    // Message and stack should now be visible within waitFor
    await waitFor(() => {
      expect(getByText('Syntax parsing failure')).toBeTruthy();
      expect(getByText('Error at ProblemChild:12:3')).toBeTruthy();
    });

    // Copy button
    const copyBtn = getByLabelText('Copy error details');
    fireEvent.press(copyBtn);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('Syntax parsing failure'),
      );
      expect(getByText('Copied to clipboard')).toBeTruthy();
    });
  });
});

describe('RouteErrorBoundary Adapter', () => {
  it('renders ErrorFallbackView using Expo Router props', async () => {
    const mockRetry = jest.fn(() => Promise.resolve());
    const mockError = new Error('Expo Router Route Error');

    const { getByText } = await render(
      <RouteErrorBoundary error={mockError} retry={mockRetry} />,
    );

    expect(getByText('Something Went Wrong')).toBeTruthy();
  });
});
