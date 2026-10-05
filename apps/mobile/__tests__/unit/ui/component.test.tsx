import React from 'react';
import { Animated } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppBottomTabs } from '@/components/app-bottom-tabs';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

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

jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      R.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

// Mock expo-symbols SymbolView to render fallback letter or symbol component
jest.mock('expo-symbols', () => {
  const R = require('react');
  const { Text, View } = require('react-native');
  return {
    SymbolView: ({ fallback, name, size, tintColor }: any) =>
      R.createElement(
        View,
        { testID: `symbol-${name?.android ?? 'unknown'}` },
        fallback ?? R.createElement(Text, { style: { color: tintColor, fontSize: size } }, name?.android)
      ),
  };
});

// ---------------------------------------------------------------------------
// Unit Test Suite: AppBottomTabs UI Component
// ---------------------------------------------------------------------------

describe('AppBottomTabs UI Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: (callback?: any) => callback?.({ finished: true }),
      stop: () => {},
      reset: () => {},
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // CASE 1: Render All Tab Elements and Verify Default Active Tab
  // =========================================================================
  describe('Case 1: Initial Render', () => {
    it('renders all three tabs (Home, Work, Profile) with correct accessibility roles', async () => {
      const { getByLabelText, getByText } = await render(<AppBottomTabs activeRoute="/home" />);

      // Verify Tab Labels exist
      expect(getByText('Home')).toBeTruthy();
      expect(getByText('Work')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();

      // Verify accessibility roles and initial selected state
      const homeTab = getByLabelText('Home');
      const workTab = getByLabelText('Work');
      const profileTab = getByLabelText('Profile');

      expect(homeTab.props.accessibilityRole).toBe('tab');
      expect(homeTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true })
      );

      expect(workTab.props.accessibilityRole).toBe('tab');
      expect(workTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false })
      );

      expect(profileTab.props.accessibilityRole).toBe('tab');
      expect(profileTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false })
      );
    });

    it('renders fallback icon letters for all tabs', async () => {
      const { getByText } = await render(<AppBottomTabs activeRoute="/home" />);

      // Home fallback: 'H', Work fallback: 'T', Profile fallback: 'P'
      expect(getByText('H')).toBeTruthy();
      expect(getByText('T')).toBeTruthy();
      expect(getByText('P')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 2: Active Tab Variations
  // =========================================================================
  describe('Case 2: Active Route Variants', () => {
    it('marks Work tab as selected when activeRoute is /work', async () => {
      const { getByLabelText } = await render(<AppBottomTabs activeRoute="/work" />);

      const homeTab = getByLabelText('Home');
      const workTab = getByLabelText('Work');
      const profileTab = getByLabelText('Profile');

      expect(homeTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false })
      );
      expect(workTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true })
      );
      expect(profileTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false })
      );
    });

    it('marks Profile tab as selected when activeRoute is /profile', async () => {
      const { getByLabelText } = await render(<AppBottomTabs activeRoute="/profile" />);

      const homeTab = getByLabelText('Home');
      const workTab = getByLabelText('Work');
      const profileTab = getByLabelText('Profile');

      expect(homeTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false })
      );
      expect(workTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false })
      );
      expect(profileTab.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true })
      );
    });
  });

  // =========================================================================
  // CASE 3: Tab Press and Navigation Transitions
  // =========================================================================
  describe('Case 3: Tab Selection and Navigation', () => {
    it('navigates to /work when Work tab is pressed', async () => {
      const { getByLabelText } = await render(<AppBottomTabs activeRoute="/home" />);

      const initialWorkTab = getByLabelText('Work');
      fireEvent.press(initialWorkTab);

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/work');

      await waitFor(() => {
        expect(getByLabelText('Work').props.accessibilityState).toEqual(
          expect.objectContaining({ selected: true })
        );
      });
    });

    it('navigates to /profile when Profile tab is pressed', async () => {
      const { getByLabelText } = await render(<AppBottomTabs activeRoute="/home" />);

      const initialProfileTab = getByLabelText('Profile');
      fireEvent.press(initialProfileTab);

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/profile');

      await waitFor(() => {
        expect(getByLabelText('Profile').props.accessibilityState).toEqual(
          expect.objectContaining({ selected: true })
        );
      });
    });

    it('navigates back to /home when Home tab is pressed from another tab', async () => {
      const { getByLabelText } = await render(<AppBottomTabs activeRoute="/work" />);

      const initialHomeTab = getByLabelText('Home');
      fireEvent.press(initialHomeTab);

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/home');

      await waitFor(() => {
        expect(getByLabelText('Home').props.accessibilityState).toEqual(
          expect.objectContaining({ selected: true })
        );
      });
    });
  });

  // =========================================================================
  // CASE 4: Container Layout and Width Measurement
  // =========================================================================
  describe('Case 4: Container Layout', () => {
    it('handles container onLayout event without errors to calculate indicator width', async () => {
      const { getByLabelText } = await render(<AppBottomTabs activeRoute="/home" />);
      const homeTab = getByLabelText('Home');
      const containerView = homeTab.parent;
      expect(containerView).toBeTruthy();

      // Trigger onLayout with mock screen width
      fireEvent(containerView!, 'layout', {
        nativeEvent: { layout: { width: 375, height: 58, x: 0, y: 0 } },
      });

      // Assert tabs remain accessible and selectable
      const profileTab = getByLabelText('Profile');
      fireEvent.press(profileTab);
      expect(mockReplace).toHaveBeenCalledWith('/profile');
    });
  });
});
