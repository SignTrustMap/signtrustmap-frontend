import React from 'react';
import { Animated } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`ant-${props.name}`} {...props} />;
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFF6FF',
    border: '#CBD5E1',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    danger: '#EF4444',
  }),
}));

import {
  NavigationBottomSheet,
  type NavigationBottomSheetProps,
} from '@/feature/navigation/components/navigation-bottom-sheet';

describe('NavigationBottomSheet Branch Coverage', () => {
  const baseProps: NavigationBottomSheetProps = {
    sheetHeightAnim: new Animated.Value(300),
    sheetSnapIndex: 1,
    bottomInset: 0,
    panHandlers: {},
    onCycleSnap: jest.fn(),
    onSnapTo: jest.fn(),
    plannedRouteOrigin: [106.7, 10.77],
    selectedDestination: {
      id: 'd1',
      coordinate: [106.72, 10.79],
      title: 'Chợ Bến Thành',
      subtitle: 'Quận 1, TP.HCM',
    },
    isNavigating: false,
    vehicleMode: 'DRIVING',
    isMotorcycleMode: false,
    onSwitchVehicleMode: jest.fn(),
    carDuration: 600,
    motorcycleDuration: 480,
    cyclingDuration: 900,
    walkingDuration: 2400,
    routeDuration: 600,
    routeDistance: 3500,
    activeDuration: 600,
    expandableContentOpacity: new Animated.Value(1),
    filteredSignsCount: 2,
    visibleSignsCount: 2,
    routeMatchingPresets: [
      {
        id: 'preset-1',
        name: 'Tuyến sáng',
        categories: ['PROHIBITORY'],
        onlyFixedSigns: true,
        createdAt: 1,
        savedRoute: {
          id: 'preset-1',
          originName: 'Nhà',
          destinationName: 'Công ty',
        } as any,
      },
    ],
    filterViewMode: 'lists',
    onToggleFilterViewMode: jest.fn(),
    manualCategories: new Set(['PROHIBITORY', 'WARNING']),
    onToggleManualCategory: jest.fn(),
    onSelectAllManualCategories: jest.fn(),
    activePresetId: null,
    onSelectPreset: jest.fn(),
    visibleSigns: [
      { id: 's1', coordinate: [106.71, 10.78], imageUrl: '', name: 'Cấm rẽ', signCode: 'P.123' },
    ],
    isStartingNavigation: false,
    isRouteBookmarked: false,
    onBeginNavigation: jest.fn(),
    onOpenBookmarkModal: jest.fn(),
    onCloseRoute: jest.fn(),
    onGo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no destination is selected, and handles destination-only state without origin', async () => {
    const empty = await render(<NavigationBottomSheet {...baseProps} selectedDestination={undefined} />);
    expect(empty.toJSON()).toBeNull();

    const destOnly = await render(
      <NavigationBottomSheet
        {...baseProps}
        navigationError="Chưa có GPS"
        plannedRouteOrigin={undefined}
      />,
    );
    expect(destOnly.getByText('Chợ Bến Thành')).toBeTruthy();
    expect(destOnly.getByText('Quận 1, TP.HCM')).toBeTruthy();
    expect(destOnly.getByText('Chưa có GPS')).toBeTruthy();

    await fireEvent.press(destOnly.getByTestId('btn-start-route-plan'));
    expect(baseProps.onGo).toHaveBeenCalled();
  });

  it('covers route planning preview across vehicle modes, list/category toggles, bookmarks, and errors', async () => {
    const screen = await render(<NavigationBottomSheet {...baseProps} />);

    // Vehicle switching tabs
    await fireEvent.press(screen.getByTestId('vehicle-tab-car'));
    await fireEvent.press(screen.getByTestId('vehicle-tab-bike'));
    await fireEvent.press(screen.getByTestId('vehicle-tab-cycling'));
    await fireEvent.press(screen.getByTestId('vehicle-tab-walking'));
    expect(baseProps.onSwitchVehicleMode).toHaveBeenCalledTimes(4);

    // Preset radio selection & switching to category view
    await fireEvent.press(screen.getByLabelText(/Danh sách Tuyến sáng/));
    expect(baseProps.onSelectPreset).toHaveBeenCalledWith('preset-1');

    await fireEvent.press(screen.getByLabelText('Chuyển sang lọc theo danh mục'));
    expect(baseProps.onToggleFilterViewMode).toHaveBeenCalled();

    await screen.rerender(
      <NavigationBottomSheet
        {...baseProps}
        activePresetId="preset-1"
        filterViewMode="categories"
        isRouteBookmarked={true}
        isStartDisabled={true}
        sheetSnapIndex={2}
      />,
    );

    await fireEvent.press(screen.getByLabelText(/Biển báo cấm/));
    expect(baseProps.onToggleManualCategory).toHaveBeenCalled();

    await screen.rerender(
      <NavigationBottomSheet
        {...baseProps}
        filterViewMode="categories"
        isRouteBookmarked={true}
        isStartDisabled={true}
        routeMatchingPresets={[]}
        sheetSnapIndex={2}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Chọn tất cả danh mục'));
    expect(baseProps.onSelectAllManualCategories).toHaveBeenCalledWith(true);

    await fireEvent.press(screen.getByTestId('btn-bookmark-route'));
    expect(baseProps.onOpenBookmarkModal).toHaveBeenCalled();
  });

  it('covers loading vehicle durations, free navigation mode, and active navigating header/stop controls', async () => {
    const screen = await render(
      <NavigationBottomSheet
        {...baseProps}
        carDuration={undefined}
        cyclingDuration={undefined}
        isCarRouteLoading={true}
        isCyclingRouteLoading={true}
        isFreeNavigation={true}
        isMotorcycleMode={true}
        isMotorcycleRouteLoading={false}
        isStartingNavigation={true}
        isWalkingRouteLoading={true}
        motorcycleDuration={undefined}
        sheetSnapIndex={0}
        vehicleMode="MOTORCYCLE"
        walkingDuration={undefined}
      />,
    );
    expect(screen.getByText('Đang bắt đầu...')).toBeTruthy();

    await screen.rerender(
      <NavigationBottomSheet
        {...baseProps}
        isNavigating={true}
        remainingNavDistance={1200}
        remainingNavDuration={180}
        vehicleMode="CYCLING"
      />,
    );

    await fireEvent.press(screen.getByLabelText('Thu nhỏ bảng điều hướng'));
    expect(baseProps.onSnapTo).toHaveBeenCalledWith(0);

    await fireEvent.press(screen.getByLabelText('Tùy chọn lộ trình'));
    expect(baseProps.onCycleSnap).toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('btn-stop-navigation'));
    expect(baseProps.onCloseRoute).toHaveBeenCalled();
  });
});
