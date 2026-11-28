import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    text: '#000000',
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, left: 0, right: 0, bottom: 34 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

describe('ScreenContainer component', () => {
  it('renders static content when scrollable is false (default)', async () => {
    const { getByText } = await render(
      <ScreenContainer>
        <Text>Static Content</Text>
      </ScreenContainer>,
      { wrapper },
    );

    expect(getByText('Static Content')).toBeTruthy();
  });

  it('renders scrollable content when scrollable is true with bottom inset', async () => {
    const { getByText } = await render(
      <ScreenContainer scrollable includeBottomInset={false} backgroundColor="#F0F0F0">
        <Text>Scrollable Content</Text>
      </ScreenContainer>,
      { wrapper },
    );

    expect(getByText('Scrollable Content')).toBeTruthy();
  });

  it('handles platform behavior and custom offsets', async () => {
    const originalPlatform = Platform.OS;
    Platform.OS = 'ios';

    const { getByText } = await render(
      <ScreenContainer keyboardOffset={20} edges={['top', 'bottom']}>
        <Text>iOS Layout</Text>
      </ScreenContainer>,
      { wrapper },
    );

    expect(getByText('iOS Layout')).toBeTruthy();
    Platform.OS = originalPlatform;
  });
});
