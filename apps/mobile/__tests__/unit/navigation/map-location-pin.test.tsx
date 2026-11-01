import React from 'react';
import { render } from '@testing-library/react-native';
import { MapLocationPin } from '@/feature/navigation/components/map-location-pin';

describe('MapLocationPin', () => {
  it('renders default red location pin with shadow and testID', async () => {
    const { getByTestId } = await render(<MapLocationPin />);
    const pin = getByTestId('map-location-pin');
    expect(pin).toBeTruthy();
  });

  it('renders custom color, size and custom testID', async () => {
    const { getByTestId } = await render(
      <MapLocationPin color="#EF4444" size={46} testID="custom-pin" />
    );
    const pin = getByTestId('custom-pin');
    expect(pin).toBeTruthy();
  });

  it('renders without shadow when showShadow is false', async () => {
    const { getByTestId } = await render(
      <MapLocationPin showShadow={false} testID="no-shadow-pin" />
    );
    expect(getByTestId('no-shadow-pin')).toBeTruthy();
  });
});
