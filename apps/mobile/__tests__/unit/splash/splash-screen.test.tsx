import React from 'react';
import { render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppSplashScreen } from '@/feature/splash/pages/splash-screen';
import * as Reanimated from 'react-native-reanimated';

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn().mockResolvedValue(true),
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: any) => <View testID="animated-view" {...props} />,
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((fn) => fn()),
    useReducedMotion: jest.fn(() => false),
    withTiming: jest.fn((toValue, config) => toValue),
    cancelAnimation: jest.fn(),
    interpolateColor: jest.fn(() => '#2563EB'),
    Easing: {
      linear: jest.fn(),
      cubic: jest.fn(),
      out: jest.fn((e) => e),
    },
    Keyframe: jest.fn().mockImplementation(() => ({
      duration: jest.fn().mockReturnThis(),
    })),
  };
});

describe('AppSplashScreen Unit Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders splash screen logo, title, and progress bar', async () => {
    const { getByLabelText, getByText, getByRole } = await render(<AppSplashScreen />);

    // Logo image
    expect(getByLabelText('Logo SignTrustMap')).toBeTruthy();

    // App title
    expect(getByText('SignTrustMap')).toBeTruthy();

    // Loading progress bar
    const progressTrack = getByLabelText('Đang tải SignTrustMap');
    expect(progressTrack).toBeTruthy();
    expect(progressTrack.props.accessibilityRole).toBe('progressbar');
  });

  it('hides native splash screen upon mounting', async () => {
    await render(<AppSplashScreen />);

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('initiates progress animation with timing on mount', async () => {
    await render(<AppSplashScreen />);

    expect(Reanimated.useSharedValue).toHaveBeenCalledWith(0);
    expect(Reanimated.withTiming).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        duration: expect.any(Number),
      }),
    );
  });

  it('sets animation duration to 0 when user prefers reduced motion', async () => {
    (Reanimated.useReducedMotion as jest.Mock).mockReturnValueOnce(true);

    await render(<AppSplashScreen />);

    expect(Reanimated.withTiming).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        duration: 0,
      }),
    );
  });

  it('cancels animation on unmount', async () => {
    const { unmount } = await render(<AppSplashScreen />);

    await unmount();

    expect(Reanimated.cancelAnimation).toHaveBeenCalledTimes(1);
  });
});
