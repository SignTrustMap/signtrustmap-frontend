import React from 'react';
import { AppState } from 'react-native';
import { render, act, fireEvent, screen, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('expo-blob', () => ({}));

const mockLogOut = jest.fn().mockResolvedValue(undefined);
let mockSessionState: any = {
  isInitializing: false,
  session: { accessToken: 'valid-token' },
  logOut: mockLogOut,
};

jest.mock('@/context/session-provider', () => ({
  useSession: () => mockSessionState,
  useOptionalSession: () => mockSessionState,
  SessionProvider: ({ children }: any) => children,
}));

let mockSegments: string[] = ['(authenticated)', '(tabs)', 'home'];
jest.mock('expo-router', () => {
  const { View, Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => (
      <View testID="redirect">
        <Text>{href}</Text>
      </View>
    ),
    Stack: Object.assign(({ children }: any) => <View testID="stack">{children}</View>, {
      Screen: ({ name }: any) => <View testID={`screen-${name}`} />,
      Protected: ({ children, guard }: any) => (guard ? children : null),
    }),
    Slot: () => <View testID="slot" />,
    useSegments: () => mockSegments,
    DefaultTheme: { dark: false, colors: { background: '#ffffff' } },
    ThemeProvider: ({ children }: any) => children,
  };
});

jest.mock('expo-router/stack', () => {
  const { View } = require('react-native');
  return {
    Stack: Object.assign(({ children }: any) => <View testID="stack">{children}</View>, {
      Screen: ({ name }: any) => <View testID={`screen-${name}`} />,
      Protected: ({ children, guard }: any) => (guard ? children : null),
    }),
  };
});

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
}));

jest.mock('@/constants/const', () => ({
  MINIMUM_SPLASH_DURATION_MS: 10,
  SPLASH_PROGRESS_DURATION_MS: 10,
  EXIT_ANIMATION_DURATION_MS: 10,
  NAVIGATION_COMPLETE_MODAL_AUTO_DISMISS_MS: 10,
}));

const mockCheckMandatoryGpsStatus = jest
  .fn()
  .mockResolvedValue({ status: 'granted', reason: null });
const mockOpenLocationSettings = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/location-permission', () => ({
  requestLocationPermissionOnFirstLaunch: jest.fn().mockResolvedValue(undefined),
  checkMandatoryGpsStatus: (...args: any[]) => mockCheckMandatoryGpsStatus(...args),
  openLocationSettings: (...args: any[]) => mockOpenLocationSettings(...args),
}));

jest.mock('@/feature/upload/utils/crop-sync-manager', () => ({
  reconcilePendingCrops: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/api/saved-routes/saved-routes', () => ({
  getSavedRoutes: jest.fn().mockResolvedValue([]),
  createSavedRoute: jest.fn(),
  updateSavedRoute: jest.fn(),
  deleteSavedRoute: jest.fn(),
}));

jest.mock('@/feature/splash/pages/splash-screen', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    AppSplashScreen: ({ gpsStatus, gpsDenialReason, onRetryGps, onOpenSettings }: any) => (
      <View testID="app-splash-screen">
        <Text testID="splash-gps-status">{gpsStatus ?? 'checking'}</Text>
        <Text testID="splash-gps-reason">{gpsDenialReason ?? 'none'}</Text>
        {gpsStatus === 'denied' ? (
          <View>
            <Pressable testID="mock-splash-retry" onPress={onRetryGps} />
            <Pressable testID="mock-splash-settings" onPress={onOpenSettings} />
          </View>
        ) : null}
      </View>
    ),
  };
});

jest.mock('@/feature/notifications/pages/notifications-screen', () => {
  const { View } = require('react-native');
  return {
    NotificationsScreen: () => <View testID="notifications-screen" />,
  };
});

jest.mock('@/components/app-bottom-tabs', () => {
  const { View, Text } = require('react-native');
  return {
    AppBottomTabs: ({ activeRoute }: any) => (
      <View testID="app-bottom-tabs">
        <Text>{activeRoute}</Text>
      </View>
    ),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    text: '#0F172A',
    primary: '#2563EB',
    border: '#E2E8F0',
  }),
}));

import TabLayout from '@/app/_layout';
import IndexRoute from '@/app/index';
import AuthenticatedLayout from '@/app/(authenticated)/_layout';
import NotificationsRoute from '@/app/(authenticated)/notifications';
import AppTabsLayout from '@/app/(authenticated)/(tabs)/_layout';
import { Divider } from '@/components/divider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

describe('App Layouts & Navigation Roots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionState = {
      isInitializing: false,
      session: { accessToken: 'valid-token' },
      logOut: mockLogOut,
    };
    mockSegments = ['(authenticated)', '(tabs)', 'home'];
  });

  describe('Root TabLayout (_layout.tsx)', () => {
    beforeEach(() => {
      mockCheckMandatoryGpsStatus.mockResolvedValue({ status: 'granted', reason: null });
    });

    it('renders root TabLayout successfully and hides splash once timer elapsed and GPS granted', async () => {
      await render(<TabLayout />);
      expect(screen.getByTestId('stack')).toBeTruthy();
      expect(mockCheckMandatoryGpsStatus).toHaveBeenCalledWith({ promptPermission: true });

      await waitFor(() => {
        expect(screen.queryByTestId('app-splash-screen')).toBeNull();
      });
    });

    it('keeps splash screen visible with GPS prompt when device GPS is turned off, and hides after retry enables it', async () => {
      mockCheckMandatoryGpsStatus.mockResolvedValueOnce({ status: 'denied', reason: 'service' });

      await render(<TabLayout />);

      await waitFor(() => {
        expect(screen.getByText('denied')).toBeTruthy();
        expect(screen.getByText('service')).toBeTruthy();
      });

      // Wait longer than SPLASH_PROGRESS_DURATION_MS (10ms) to confirm splash still blocks
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
      expect(screen.getByTestId('app-splash-screen')).toBeTruthy();

      await fireEvent.press(screen.getByTestId('mock-splash-settings'));
      expect(mockOpenLocationSettings).toHaveBeenCalledWith('service');

      mockCheckMandatoryGpsStatus.mockResolvedValueOnce({ status: 'granted', reason: null });
      await fireEvent.press(screen.getByTestId('mock-splash-retry'));

      await waitFor(() => {
        expect(screen.queryByTestId('app-splash-screen')).toBeNull();
      });
    });

    it('dismisses splash screen when returning from Settings with GPS enabled', async () => {
      mockCheckMandatoryGpsStatus.mockResolvedValueOnce({ status: 'denied', reason: 'permission' });
      let appStateListener: ((state: any) => void) | undefined;
      const removeMock = jest.fn();
      const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, cb) => {
        appStateListener = cb;
        return { remove: removeMock } as any;
      });

      await render(<TabLayout />);

      await waitFor(() => {
        expect(screen.getByText('denied')).toBeTruthy();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
      });

      mockCheckMandatoryGpsStatus.mockResolvedValueOnce({ status: 'granted', reason: null });
      await act(async () => {
        appStateListener?.('active');
      });

      await waitFor(() => {
        expect(screen.queryByTestId('app-splash-screen')).toBeNull();
      });
      expect(mockCheckMandatoryGpsStatus).toHaveBeenLastCalledWith({ promptPermission: false });
      expect(removeMock).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('IndexRoute (index.tsx)', () => {
    it('returns null when isInitializing is true', async () => {
      mockSessionState = { isInitializing: true, session: null };
      const { toJSON } = await render(<IndexRoute />);
      expect(toJSON()).toBeNull();
    });

    it('redirects to /(public)/login when no access token exists', async () => {
      mockSessionState = { isInitializing: false, session: null };
      const { getByTestId, getByText } = await render(<IndexRoute />);
      expect(getByTestId('redirect')).toBeTruthy();
      expect(getByText('/(public)/login')).toBeTruthy();
    });

    it('redirects to /home when access token is present', async () => {
      mockSessionState = { isInitializing: false, session: { accessToken: 'valid' } };
      const { getByTestId, getByText } = await render(<IndexRoute />);
      expect(getByTestId('redirect')).toBeTruthy();
      expect(getByText('/home')).toBeTruthy();
    });
  });

  describe('AuthenticatedLayout and notifications.tsx', () => {
    it('renders AuthenticatedLayout', async () => {
      const { getByTestId } = await render(<AuthenticatedLayout />);
      expect(getByTestId('stack')).toBeTruthy();
    });

    it('renders NotificationsRoute', async () => {
      const { getByTestId } = await render(<NotificationsRoute />);
      expect(getByTestId('notifications-screen')).toBeTruthy();
    });
  });

  describe('AppTabsLayout and LivestreamRoute', () => {
    it('renders AppTabsLayout with bottom tabs on /home', async () => {
      mockSegments = ['(authenticated)', '(tabs)', 'home'];
      const { getByTestId, getByText } = await render(<AppTabsLayout />);
      expect(getByTestId('slot')).toBeTruthy();
      expect(getByTestId('app-bottom-tabs')).toBeTruthy();
      expect(getByText('/home')).toBeTruthy();
    });

    it('renders AppTabsLayout without bottom tabs on non-tab routes', async () => {
      mockSegments = ['(authenticated)', '(tabs)', 'custom-detail'];
      const { getByTestId, queryByTestId } = await render(<AppTabsLayout />);
      expect(getByTestId('slot')).toBeTruthy();
      expect(queryByTestId('app-bottom-tabs')).toBeNull();
    });
  });

  describe('UI Base Components: Divider, ThemedText, ThemedView', () => {
    it('renders Divider with custom style', async () => {
      const { toJSON } = await render(<Divider style={{ marginVertical: 20 }} />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders ThemedText with all variants', async () => {
      const { getByText } = await render(
        <>
          <ThemedText type="default">Default Text</ThemedText>
          <ThemedText type="title">Title Text</ThemedText>
          <ThemedText type="subtitle">Subtitle Text</ThemedText>
          <ThemedText type="small">Small Text</ThemedText>
          <ThemedText type="smallBold">Small Bold Text</ThemedText>
          <ThemedText type="link">Link Text</ThemedText>
          <ThemedText type="linkPrimary">Primary Link Text</ThemedText>
          <ThemedText type="code">Code Text</ThemedText>
        </>,
      );
      expect(getByText('Default Text')).toBeTruthy();
      expect(getByText('Title Text')).toBeTruthy();
      expect(getByText('Subtitle Text')).toBeTruthy();
      expect(getByText('Code Text')).toBeTruthy();
    });

    it('renders ThemedView with custom type', async () => {
      const { Text } = require('react-native');
      const { toJSON } = await render(
        <ThemedView type="background">
          <Text>View Content</Text>
        </ThemedView>,
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
