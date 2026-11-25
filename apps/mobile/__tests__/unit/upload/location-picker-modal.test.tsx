import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

let capturedOnBoundsChange: ((bounds: any) => void) | null = null;
jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const { View } = require('react-native');
  return {
    NavigationMapView: (props: any) => {
      capturedOnBoundsChange = props.onBoundsChange;
      return <View testID="navigation-map-view" {...props} />;
    },
    MapLocationPin: () => <View testID="map-location-pin" />,
  };
});

let mockSuggestions: any[] = [];
let mockIsSearching = false;
jest.mock('@/feature/navigation/hooks/use-places', () => ({
  usePlaceSuggestions: () => ({
    suggestions: mockSuggestions,
    data: mockSuggestions,
    isLoading: mockIsSearching,
  }),
}));

let mockReverseGeocodeData: any = {
  displayAddress: 'Nguyen Hue, Ben Nghe, District 1, HCMC',
  roadName: 'Nguyen Hue',
};
jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => ({
    data: mockReverseGeocodeData,
    isLoading: false,
  }),
}));

const mockRequestPermissions = jest.fn();
const mockGetCurrentPosition = jest.fn();

let mockMapLibreInstance: any = {
  LocationManager: {
    requestPermissions: mockRequestPermissions,
    getCurrentPosition: mockGetCurrentPosition,
  },
};

jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => mockMapLibreInstance,
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
  beforeEach(() => {
    mockRequestPermissions.mockResolvedValue(true);
    mockGetCurrentPosition.mockResolvedValue({
      coords: { longitude: 106.7009, latitude: 10.7769 },
    });
    mockSuggestions = [];
    mockIsSearching = false;
    mockReverseGeocodeData = {
      displayAddress: 'Nguyen Hue, Ben Nghe, District 1, HCMC',
      roadName: 'Nguyen Hue',
    };
    mockMapLibreInstance = {
      LocationManager: {
        requestPermissions: mockRequestPermissions,
        getCurrentPosition: mockGetCurrentPosition,
      },
    };
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
    jest.clearAllMocks();
  });

  it('renders modal with search input, map, and confirms selected coordinate', async () => {
    const mockConfirm = jest.fn();
    const mockClose = jest.fn();

    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7009, 10.7769]}
        onConfirm={mockConfirm}
        onClose={mockClose}
      />,
    );

    expect(screen.getByPlaceholderText('Tìm kiếm vị trí, địa chỉ...')).toBeTruthy();
    expect(screen.getByTestId('navigation-map-view')).toBeTruthy();
    expect(screen.getByText('Nguyen Hue')).toBeTruthy();

    const closeBtn = screen.getByLabelText('Đóng');
    await act(async () => {
      fireEvent.press(closeBtn);
    });
    expect(mockClose).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByText('Xác nhận vị trí này');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });
    expect(mockConfirm).toHaveBeenCalledWith(
      [106.7009, 10.7769],
      'Nguyen Hue, Ben Nghe, District 1, HCMC',
    );
  });

  it('fetches current device location automatically when initialCoordinate is not provided', async () => {
    const mockConfirm = jest.fn();
    const mockClose = jest.fn();

    mockGetCurrentPosition.mockResolvedValueOnce({
      coords: { longitude: 106.8, latitude: 10.85 },
    });

    const screen = await render(
      <LocationPickerModal visible={true} onConfirm={mockConfirm} onClose={mockClose} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRequestPermissions).toHaveBeenCalled();
    expect(mockGetCurrentPosition).toHaveBeenCalled();

    const confirmBtn = screen.getByText('Xác nhận vị trí này');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });
    expect(mockConfirm).toHaveBeenCalledWith([106.8, 10.85], expect.any(String));
  });

  it('handles GPS button click to refresh current location', async () => {
    mockGetCurrentPosition.mockResolvedValueOnce({
      coords: { longitude: 106.75, latitude: 10.8 },
    });

    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7, 10.7]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const gpsBtn = screen.getByLabelText('Đến vị trí hiện tại');
    await act(async () => {
      fireEvent.press(gpsBtn);
    });

    expect(mockGetCurrentPosition).toHaveBeenCalled();
  });

  it('displays error message when GPS permission is denied or location fails', async () => {
    mockRequestPermissions.mockResolvedValueOnce(false);

    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7, 10.7]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const gpsBtn = screen.getByLabelText('Đến vị trí hiện tại');
    await act(async () => {
      fireEvent.press(gpsBtn);
    });

    const errorMsg = await screen.findByText(
      /Vui lòng cấp quyền truy cập vị trí để sử dụng vị trí hiện tại của bạn/i,
    );
    expect(errorMsg).toBeTruthy();
  });

  it('displays error message when getMapLibre returns null on native', async () => {
    mockMapLibreInstance = null;

    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7, 10.7]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const gpsBtn = screen.getByLabelText('Đến vị trí hiện tại');
    await act(async () => {
      fireEvent.press(gpsBtn);
    });

    const errorMsg = await screen.findByText(/Tính năng tìm vị trí yêu cầu bản build native/i);
    expect(errorMsg).toBeTruthy();
  });

  it('displays error message when position is null', async () => {
    mockGetCurrentPosition.mockResolvedValueOnce(null);

    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7, 10.7]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const gpsBtn = screen.getByLabelText('Đến vị trí hiện tại');
    await act(async () => {
      fireEvent.press(gpsBtn);
    });

    const errorMsg = await screen.findByText(/Bật dịch vụ định vị và thử lại/i);
    expect(errorMsg).toBeTruthy();
  });

  it('allows searching and selecting a place suggestion', async () => {
    mockSuggestions = [
      {
        id: 'place-1',
        title: 'Chợ Bến Thành',
        address: 'Quận 1, TP.HCM',
        longitude: 106.6983,
        latitude: 10.7725,
      },
    ];

    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7, 10.7]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Tìm kiếm vị trí, địa chỉ...');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Ben Thanh');
    });

    const suggestionItem = await screen.findByText('Chợ Bến Thành');
    expect(suggestionItem).toBeTruthy();

    await act(async () => {
      fireEvent.press(suggestionItem);
    });

    expect(screen.getByText('10.772500, 106.698300')).toBeTruthy();
  });

  it('shows empty search state and clears search input when clear button pressed', async () => {
    mockSuggestions = [];

    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7, 10.7]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Tìm kiếm vị trí, địa chỉ...');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Unknown Place xyz');
    });

    expect(await screen.findByText('Không tìm thấy địa điểm phù hợp')).toBeTruthy();

    const clearBtn = screen.getByTestId('mc-icon-close-circle');
    await act(async () => {
      fireEvent.press(clearBtn);
    });

    expect(screen.queryByText('Không tìm thấy địa điểm phù hợp')).toBeNull();
  });

  it('updates centerCoordinate when map bounds change', async () => {
    const screen = await render(
      <LocationPickerModal
        visible={true}
        initialCoordinate={[106.7, 10.7]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(capturedOnBoundsChange).toBeDefined();
    await act(async () => {
      capturedOnBoundsChange?.({
        minLon: 106.68,
        minLat: 10.76,
        maxLon: 106.72,
        maxLat: 10.78,
      });
    });

    expect(screen.getByText('10.770000, 106.700000')).toBeTruthy();
  });

  it('supports web platform geolocation', async () => {
    const originalPlatform = Platform.OS;
    Platform.OS = 'web';

    const originalNavigator = (global as any).navigator;
    (global as any).navigator = {
      geolocation: {
        getCurrentPosition: jest.fn((success) =>
          success({
            coords: { longitude: 106.71, latitude: 10.79 },
          }),
        ),
      },
    };

    try {
      const screen = await render(
        <LocationPickerModal
          visible={true}
          initialCoordinate={[106.7, 10.7]}
          onConfirm={jest.fn()}
          onClose={jest.fn()}
        />,
      );

      const gpsBtn = screen.getByLabelText('Đến vị trí hiện tại');
      await act(async () => {
        fireEvent.press(gpsBtn);
      });

      expect(screen.getByText('10.790000, 106.710000')).toBeTruthy();
    } finally {
      Platform.OS = originalPlatform;
      (global as any).navigator = originalNavigator;
    }
  });
});
