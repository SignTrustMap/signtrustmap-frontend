import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SurveyRouteMapScreen } from '@/feature/upload/pages/survey-route-map-screen';

const mockBack = jest.fn();
const mockPush = jest.fn();
let mockSearchParams: Record<string, string | undefined> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  AntDesign: 'AntDesign',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#000000',
    textSecondary: '#666666',
    placeholder: '#999999',
    backgroundElement: '#F0F0F0',
    card: '#FFFFFF',
    border: '#E0E0E0',
    primary: '#1767D2',
    neutral: '#E5E7EB',
  }),
}));

const mockExtractGpxGpsData = jest.fn().mockResolvedValue(null);
jest.mock('@/feature/upload/utils/gpx', () => ({
  extractGpxGpsData: (...args: any[]) => mockExtractGpxGpsData(...args),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: (coords: any) => ({
    data: coords
      ? {
          displayAddress: `Address for ${coords.latitude}, ${coords.longitude}`,
          roadName: `Road near ${coords.latitude.toFixed(3)}`,
        }
      : null,
    isLoading: false,
  }),
}));

let lastNavigationMapViewProps: any = null;
jest.mock('@/feature/navigation/components/navigation-map-view', () => ({
  NavigationMapView: (props: any) => {
    lastNavigationMapViewProps = props;
    const { View, Text } = require('react-native');
    return (
      <View testID="mock-navigation-map-view">
        <Text testID="map-route-start">
          {props.routeStart ? `${props.routeStart[0]},${props.routeStart[1]}` : 'none'}
        </Text>
        <Text testID="map-destination">
          {props.destination?.coordinate
            ? `${props.destination.coordinate[0]},${props.destination.coordinate[1]}`
            : 'none'}
        </Text>
        <Text testID="map-points-count">
          {props.routeCoordinates?.length ?? 0}
        </Text>
      </View>
    );
  },
}));

describe('SurveyRouteMapScreen - Read-only route map view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastNavigationMapViewProps = null;
    mockSearchParams = {};
    mockExtractGpxGpsData.mockResolvedValue(null);
  });

  it('renders route from GPX data with start (S), destination (D), and polyline', async () => {
    mockSearchParams = {
      gpxUri: 'file:///data/track-123.gpx',
      title: 'Khảo sát đường Nguyễn Huệ',
      duration: '120',
    };

    mockExtractGpxGpsData.mockResolvedValueOnce({
      coordinates: [
        [106.7009, 10.7769],
        [106.7020, 10.7780],
        [106.7035, 10.7795],
      ],
      firstPoint: { latitude: 10.7769, longitude: 106.7009 },
      lastPoint: { latitude: 10.7795, longitude: 106.7035 },
    });

    const { getByText, getByTestId, queryByPlaceholderText } = await render(<SurveyRouteMapScreen />);

    // Title and read-only badge are rendered
    expect(getByText('Khảo sát đường Nguyễn Huệ')).toBeTruthy();
    expect(getByText('Chỉ xem lộ trình • Không chỉnh sửa')).toBeTruthy();

    await waitFor(() => {
      expect(mockExtractGpxGpsData).toHaveBeenCalledWith('file:///data/track-123.gpx');
      expect(getByTestId('mock-navigation-map-view')).toBeTruthy();
    });

    // Check NavigationMapView props
    expect(lastNavigationMapViewProps.isCustomStart).toBe(true);
    expect(lastNavigationMapViewProps.isNavigatingFeature).toBe(true);
    expect(lastNavigationMapViewProps.showCurrentLocation).toBe(false);
    expect(lastNavigationMapViewProps.routeStart).toEqual([106.7009, 10.7769]);
    expect(lastNavigationMapViewProps.destination.coordinate).toEqual([106.7035, 10.7795]);
    expect(lastNavigationMapViewProps.routeCoordinates).toHaveLength(3);

    // Confirm that NO search input is rendered anywhere
    expect(queryByPlaceholderText(/tìm kiếm/i)).toBeNull();
    expect(queryByPlaceholderText(/search/i)).toBeNull();

    // Check route card info
    expect(getByText('3 điểm GPS')).toBeTruthy();
    expect(getByText('Điểm xuất phát (S)')).toBeTruthy();
    expect(getByText('Điểm kết thúc (D)')).toBeTruthy();
    expect(getByText('Tệp GPX cố định')).toBeTruthy();
  });

  it('renders fallback straight-line route when GPX parsing returns no points but start and end coordinates are passed', async () => {
    mockSearchParams = {
      startLat: '10.7769',
      startLon: '106.7009',
      endLat: '10.7812',
      endLon: '106.7051',
      title: 'Video Survey Route',
    };

    const { getByTestId, queryByPlaceholderText } = await render(<SurveyRouteMapScreen />);

    await waitFor(() => {
      expect(getByTestId('mock-navigation-map-view')).toBeTruthy();
    });

    expect(lastNavigationMapViewProps.routeStart).toEqual([106.7009, 10.7769]);
    expect(lastNavigationMapViewProps.destination.coordinate).toEqual([106.7051, 10.7812]);
    expect(lastNavigationMapViewProps.routeCoordinates).toEqual([
      [106.7009, 10.7769],
      [106.7051, 10.7812],
    ]);

    // No search input rendered
    expect(queryByPlaceholderText(/search/i)).toBeNull();
  });

  it('navigates back when clicking the back arrow button', async () => {
    mockSearchParams = {
      startLat: '10.7769',
      startLon: '106.7009',
    };

    const { getByLabelText } = await render(<SurveyRouteMapScreen />);

    const backBtn = getByLabelText('Quay lại chi tiết khảo sát');
    fireEvent.press(backBtn);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('increments focusRequestId to re-fit route camera when clicking fit route button', async () => {
    mockSearchParams = {
      startLat: '10.7769',
      startLon: '106.7009',
      endLat: '10.7812',
      endLon: '106.7051',
    };

    const { getByLabelText } = await render(<SurveyRouteMapScreen />);

    await waitFor(() => {
      expect(lastNavigationMapViewProps.focusRequestId).toBe(1);
    });

    const fitBtn = getByLabelText('Căn chỉnh lại lộ trình');
    fireEvent.press(fitBtn);

    await waitFor(() => {
      expect(lastNavigationMapViewProps.focusRequestId).toBe(2);
    });
  });

  it('displays empty state message when no coordinates and no GPX are available', async () => {
    mockSearchParams = {};

    const { getByText, queryByTestId } = await render(<SurveyRouteMapScreen />);

    expect(getByText('Không có dữ liệu lộ trình')).toBeTruthy();
    expect(queryByTestId('mock-navigation-map-view')).toBeNull();
  });
});
