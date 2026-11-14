import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';

// Mock route targets
jest.mock('@/feature/navigation/pages/navigation-map-screen', () => {
  const { Text } = require('react-native');
  return {
    NavigationMapScreen: () => <Text testID="navigation-map-screen">Mock Map Screen</Text>,
  };
});

jest.mock('@/feature/notifications/pages/notifications-screen', () => {
  const { Text } = require('react-native');
  return {
    NotificationsScreen: () => <Text testID="notifications-screen">Mock Notifications Screen</Text>,
  };
});

jest.mock('@/feature/navigation/pages/route-search-screen', () => {
  const { Text } = require('react-native');
  return {
    RouteSearchScreen: () => <Text testID="route-search-screen">Mock Search Screen</Text>,
  };
});

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="mock-redirect">{href}</Text>,
  };
});

import {
  NavigationActiveProvider,
  useNavigationActive,
} from '@/context/navigation-active-provider';
import HomeRoute from '@/app/(authenticated)/(tabs)/home/index';
import HomeNotificationsRoute from '@/app/(authenticated)/(tabs)/home/notifications';
import SearchRoute from '@/app/(authenticated)/(tabs)/home/search';
import NavigationStartRoute from '@/app/(authenticated)/(tabs)/home/start';

function NavigationActiveConsumer() {
  const { isNavigationActive, setNavigationActive } = useNavigationActive();
  return (
    <>
      <Text testID="nav-active-status">{isNavigationActive ? 'ACTIVE' : 'INACTIVE'}</Text>
      <Pressable
        testID="toggle-active-btn"
        onPress={() => setNavigationActive(!isNavigationActive)}
      >
        <Text>Toggle</Text>
      </Pressable>
    </>
  );
}

describe('Home Routes and Navigation Active Provider', () => {
  describe('NavigationActiveProvider & useNavigationActive', () => {
    it('provides default inactive state and allows toggling navigation active state', async () => {
      const { getByTestId } = await render(
        <NavigationActiveProvider>
          <NavigationActiveConsumer />
        </NavigationActiveProvider>
      );

      expect(getByTestId('nav-active-status').props.children).toBe('INACTIVE');
      await act(async () => {
        fireEvent.press(getByTestId('toggle-active-btn'));
      });
      expect(getByTestId('nav-active-status').props.children).toBe('ACTIVE');
    });

    it('returns default context value if rendered outside provider', async () => {
      const { getByTestId } = await render(<NavigationActiveConsumer />);
      expect(getByTestId('nav-active-status').props.children).toBe('INACTIVE');
      // calling setter outside provider triggers noop safely
      fireEvent.press(getByTestId('toggle-active-btn'));
    });
  });

  describe('Home Route Entry Points', () => {
    it('renders NavigationMapScreen in HomeRoute', async () => {
      const { getByTestId } = await render(<HomeRoute />);
      expect(getByTestId('navigation-map-screen')).toBeTruthy();
    });

    it('renders NotificationsScreen in HomeNotificationsRoute', async () => {
      const { getByTestId } = await render(<HomeNotificationsRoute />);
      expect(getByTestId('notifications-screen')).toBeTruthy();
    });

    it('renders RouteSearchScreen in SearchRoute', async () => {
      const { getByTestId } = await render(<SearchRoute />);
      expect(getByTestId('route-search-screen')).toBeTruthy();
    });

    it('redirects to /home in NavigationStartRoute', async () => {
      const { getByTestId } = await render(<NavigationStartRoute />);
      expect(getByTestId('mock-redirect').props.children).toBe('/home');
    });
  });
});
