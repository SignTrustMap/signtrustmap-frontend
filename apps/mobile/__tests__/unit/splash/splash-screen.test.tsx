import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppSplashScreen } from '@/feature/splash/pages/splash-screen';
import * as Reanimated from 'react-native-reanimated';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialIcons: (props: any) => <View testID={`icon-${props.name}`} />,
  };
});

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

  it('does not show GPS required prompt while checking or granted', async () => {
    const { rerender } = await render(<AppSplashScreen gpsStatus="checking" />);
    expect(screen.queryByTestId('splash-gps-required-prompt')).toBeNull();

    await rerender(<AppSplashScreen gpsStatus="granted" />);
    expect(screen.queryByTestId('splash-gps-required-prompt')).toBeNull();
  });

  it('renders mandatory GPS prompt with retry and settings actions when denied', async () => {
    const onRetryGps = jest.fn();
    const onOpenSettings = jest.fn();

    await render(
      <AppSplashScreen
        gpsStatus="denied"
        onRetryGps={onRetryGps}
        onOpenSettings={onOpenSettings}
      />,
    );

    expect(screen.getByTestId('splash-gps-required-prompt')).toBeTruthy();
    expect(screen.getByText('Yêu cầu bật định vị (GPS)')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('splash-gps-retry-button'));
    expect(onRetryGps).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('splash-gps-settings-button'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('disables retry button while retrying GPS permission', async () => {
    const onRetryGps = jest.fn();

    await render(
      <AppSplashScreen
        gpsStatus="denied"
        isRetryingGps
        onRetryGps={onRetryGps}
      />,
    );

    expect(screen.getByText('Đang kiểm tra...')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('splash-gps-retry-button'));
    expect(onRetryGps).not.toHaveBeenCalled();
  });

  it('renders device GPS disabled copy and location settings button when reason is service', async () => {
    const onRetryGps = jest.fn();
    const onOpenSettings = jest.fn();

    await render(
      <AppSplashScreen
        gpsStatus="denied"
        gpsDenialReason="service"
        onRetryGps={onRetryGps}
        onOpenSettings={onOpenSettings}
      />,
    );

    expect(screen.getByText('Định vị GPS đang tắt')).toBeTruthy();
    expect(screen.getByText('Thử lại')).toBeTruthy();
    expect(screen.getByText('Mở Cài đặt vị trí')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('splash-gps-retry-button'));
    expect(onRetryGps).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('splash-gps-settings-button'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
