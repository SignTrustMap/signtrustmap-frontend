import React from 'react';
import { render } from '@testing-library/react-native';
import {
  NavigationUpcomingSigns,
  type UpcomingSignItem,
} from '@/feature/navigation/components/navigation-upcoming-signs';

jest.mock('expo-image', () => ({
  Image: ({ testID, accessibilityLabel, ...props }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      testID: testID || 'expo-image',
      accessibilityLabel,
      ...props,
    });
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, { testID: 'safe-area-view', ...props }, children),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#FFFFFF',
    border: '#E2E8F0',
    grey: '#64748B',
    text: '#0F172A',
  }),
}));

describe('NavigationUpcomingSigns Component', () => {
  it('returns null when signs array is empty', async () => {
    const { toJSON } = await render(<NavigationUpcomingSigns signs={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders panel label and signs with meter distances (< 1000m)', async () => {
    const mockSigns: any[] = [
      {
        id: 'sign-1',
        name: 'Biển báo tốc độ 60',
        signCode: 'P.127',
        coordinate: [106.7009, 10.7769],
        distanceMeters: 350.4,
        imageUrl: 'https://example.com/p127.png',
      },
      {
        id: 'sign-2',
        name: 'Biển cấm đỗ xe',
        signCode: 'P.131a',
        coordinate: [106.7015, 10.7775],
        distanceMeters: 80,
        imageUrl: undefined,
        actualCropUrl: 'https://example.com/crop.jpg',
      },
    ];

    const { getByText, getAllByTestId } = await render(
      <NavigationUpcomingSigns signs={mockSigns} />
    );

    expect(getByText('Phía trước')).toBeTruthy();
    expect(getByText('Biển báo tốc độ 60')).toBeTruthy();
    expect(getByText('350 m')).toBeTruthy();

    expect(getByText('Biển cấm đỗ xe')).toBeTruthy();
    expect(getByText('80 m')).toBeTruthy();

    // First sign has imageUrl so renders ExpoImage
    const images = getAllByTestId('expo-image');
    expect(images.length).toBe(1);
    expect(images[0].props.accessibilityLabel).toBe('Biển báo tốc độ 60');
  });

  it('renders kilometer distances (>= 1000m) and default name fallback', async () => {
    const mockSigns: UpcomingSignItem[] = [
      {
        id: 'sign-far',
        name: undefined as any,
        signCode: 'W.201',
        coordinate: [106.705, 10.781],
        distanceMeters: 2450,
        imageUrl: 'https://example.com/w201.png',
      },
    ];

    const { getByText, getByTestId } = await render(
      <NavigationUpcomingSigns signs={mockSigns} />
    );

    expect(getByText('Biển báo')).toBeTruthy();
    expect(getByText('2.5 km')).toBeTruthy();
    expect(getByTestId('expo-image').props.accessibilityLabel).toBe('Biển báo');
  });
});
