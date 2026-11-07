import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const { View } = require('react-native');
  return {
    NavigationMapView: (props: any) => <View testID="navigation-map-view" {...props} />,
    MapLocationPin: () => <View testID="map-location-pin" />,
  };
});

jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: () => ({ suggestions: [], isLoading: false }),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => ({
    data: { displayAddress: 'Nguyen Hue, Ben Nghe, District 1, HCMC', roadName: 'Nguyen Hue' },
    isLoading: false,
  }),
}));

jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => ({
    LocationManager: {
      requestPermissions: jest.fn().mockResolvedValue(true),
      getLastKnownLocation: jest.fn().mockResolvedValue({
        coords: { longitude: 106.7009, latitude: 10.7769 },
      }),
    },
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
  }),
}));

import { LocationPickerModal } from '@/feature/upload/components/location-picker-modal';

describe('LocationPickerModal', () => {
  afterEach(async () => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders modal with search input, map, and confirms selected coordinate', async () => {
    const mockConfirm = jest.fn();
    const mockClose = jest.fn();

    const { getByPlaceholderText, getByText, getByTestId, getByLabelText } = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7009, 10.7769]}
        onConfirm={mockConfirm}
        onClose={mockClose}
      />
    );

    expect(getByPlaceholderText('Tìm kiếm vị trí, địa chỉ...')).toBeTruthy();
    expect(getByTestId('navigation-map-view')).toBeTruthy();
    expect(getByText('Nguyen Hue')).toBeTruthy();

    const closeBtn = getByLabelText('Đóng');
    fireEvent.press(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);

    const confirmBtn = getByText('Xác nhận vị trí này');
    fireEvent.press(confirmBtn);
    expect(mockConfirm).toHaveBeenCalledWith([106.7009, 10.7769], 'Nguyen Hue, Ben Nghe, District 1, HCMC');
  });
});
