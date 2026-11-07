import React from 'react';
import { Animated, BackHandler, Platform } from 'react-native';
import { render, fireEvent, renderHook, act, cleanup } from '@testing-library/react-native';
import { useNavigationSheetGesture } from '@/feature/navigation/hooks/use-navigation-sheet-gesture';
import { NavigationBottomSheet } from '@/feature/navigation/components/navigation-bottom-sheet';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} />,
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`ant-icon-${props.name}`} />;
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0FDFA',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#0D9488',
    onPrimary: '#FFFFFF',
    placeholder: '#94A3B8',
    danger: '#EF4444',
  }),
}));

describe('useNavigationSheetGesture and NavigationBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('useNavigationSheetGesture', () => {
    it('initializes sheet snap index and supports snapTo and cycleSnap', async () => {
      const { result } = await renderHook(() =>
        useNavigationSheetGesture({
          hasPlannedRouteOrigin: true,
          isNavigating: false,
          windowHeight: 800,
          bottomInset: 20,
        })
      );

      expect(result.current.sheetSnapIndex).toBe(1);

      await act(async () => {
        result.current.snapTo(2);
      });
      expect(result.current.sheetSnapIndex).toBe(2);

      await act(async () => {
        result.current.cycleSnap();
      });
      expect(result.current.sheetSnapIndex).toBe(0);

      await act(async () => {
        result.current.cycleSnap();
      });
      expect(result.current.sheetSnapIndex).toBe(1);
    });

    it('creates pan responder handlers', async () => {
      const { result } = await renderHook(() =>
        useNavigationSheetGesture({
          hasPlannedRouteOrigin: false,
          isNavigating: false,
          windowHeight: 800,
          bottomInset: 0,
        })
      );

      expect(result.current.sheetPanResponder.panHandlers).toBeDefined();
      expect(result.current.expandableContentOpacity).toBeDefined();
    });

    it('attaches android hardware back press handler when snapIndex is 2', async () => {
      const originalPlatform = Platform.OS;
      Platform.OS = 'android';

      let backPressHandler: (() => boolean) | null = null;
      const addEventListenerSpy = jest
        .spyOn(BackHandler, 'addEventListener')
        .mockImplementation((_, handler) => {
          backPressHandler = handler;
          return { remove: jest.fn() } as any;
        });

      const { result } = await renderHook(() =>
        useNavigationSheetGesture({
          hasPlannedRouteOrigin: true,
          isNavigating: false,
          destinationId: 'dest-1',
          windowHeight: 800,
          bottomInset: 0,
        })
      );

      await act(async () => {
        result.current.snapTo(2);
      });

      if (backPressHandler) {
        await act(async () => {
          const consumed = (backPressHandler as any)();
          expect(consumed).toBe(true);
        });
        expect(result.current.sheetSnapIndex).toBe(1);
      }

      addEventListenerSpy.mockRestore();
      Platform.OS = originalPlatform;
    });
  });

  describe('NavigationBottomSheet Component', () => {
    const mockOnCycleSnap = jest.fn();
    const mockOnSnapTo = jest.fn();
    const mockOnSwitchVehicleMode = jest.fn();
    const mockOnBeginNavigation = jest.fn();
    const mockOnOpenBookmarkModal = jest.fn();
    const mockOnCloseRoute = jest.fn();
    const mockOnGo = jest.fn();
    const mockOnToggleFilterViewMode = jest.fn();
    const mockOnToggleManualCategory = jest.fn();
    const mockOnSelectAllManualCategories = jest.fn();
    const mockOnSelectPreset = jest.fn();

    const baseProps = {
      sheetHeightAnim: new Animated.Value(200),
      sheetSnapIndex: 1 as const,
      bottomInset: 0,
      panHandlers: {},
      onCycleSnap: mockOnCycleSnap,
      onSnapTo: mockOnSnapTo,
      vehicleMode: 'MOTORCYCLE' as const,
      isMotorcycleMode: true,
      onSwitchVehicleMode: mockOnSwitchVehicleMode,
      activeDuration: 600,
      routeDuration: 600,
      routeDistance: 3500,
      filteredSignsCount: 5,
      visibleSignsCount: 5,
      routeMatchingPresets: [],
      filterViewMode: 'categories' as const,
      onToggleFilterViewMode: mockOnToggleFilterViewMode,
      manualCategories: new Set(),
      onToggleManualCategory: mockOnToggleManualCategory,
      onSelectAllManualCategories: mockOnSelectAllManualCategories,
      activePresetId: null,
      onSelectPreset: mockOnSelectPreset,
      visibleSigns: [],
      isStartingNavigation: false,
      isRouteBookmarked: false,
      onBeginNavigation: mockOnBeginNavigation,
      onOpenBookmarkModal: mockOnOpenBookmarkModal,
      onCloseRoute: mockOnCloseRoute,
      onGo: mockOnGo,
      expandableContentOpacity: new Animated.Value(1),
    };

    it('renders null when selectedDestination is undefined', async () => {
      const { toJSON } = await render(
        <NavigationBottomSheet {...baseProps} isNavigating={false} />
      );
      expect(toJSON()).toBeNull();
    });

    it('renders destination preview mode with Go button when plannedRouteOrigin is not set', async () => {
      const destination = {
        id: 'dest-1',
        coordinate: [106.70, 10.78] as [number, number],
        title: 'Chợ Bến Thành',
        subtitle: 'Quận 1, TP. Hồ Chí Minh',
      };

      const { getByText, getByTestId } = await render(
        <NavigationBottomSheet
          {...baseProps}
          selectedDestination={destination}
          isNavigating={false}
        />
      );

      expect(getByText('Chợ Bến Thành')).toBeTruthy();
      expect(getByText('Quận 1, TP. Hồ Chí Minh')).toBeTruthy();

      const goBtn = getByTestId('btn-start-route-plan');
      await act(async () => {
        fireEvent.press(goBtn);
      });
      expect(mockOnGo).toHaveBeenCalled();
    });

    it('renders planned route sheet with vehicle modes, duration, and bookmark button', async () => {
      const destination = {
        id: 'dest-1',
        coordinate: [106.70, 10.78] as [number, number],
        title: 'Chợ Bến Thành',
      };

      const { getByText, getByLabelText, getByTestId } = await render(
        <NavigationBottomSheet
          {...baseProps}
          plannedRouteOrigin={[106.68, 10.77]}
          selectedDestination={destination}
          isNavigating={false}
        />
      );

      expect(getByText('Xe máy')).toBeTruthy();
      expect(getByText('(3.5 km)')).toBeTruthy();

      // Bookmark button press
      const bookmarkBtn = getByTestId('btn-bookmark-route');
      await act(async () => {
        fireEvent.press(bookmarkBtn);
      });
      expect(mockOnOpenBookmarkModal).toHaveBeenCalled();

      // Minimize route preview
      const closeBtn = getByLabelText('Thu nhỏ xem trước lộ trình');
      await act(async () => {
        fireEvent.press(closeBtn);
      });
      expect(mockOnSnapTo).toHaveBeenCalledWith(0);

      // Start Navigation
      const startBtn = getByTestId('btn-start-navigation');
      await act(async () => {
        fireEvent.press(startBtn);
      });
      expect(mockOnBeginNavigation).toHaveBeenCalled();
    });

    it('renders active navigation sheet view with remaining time and close button', async () => {
      const destination = {
        id: 'dest-1',
        coordinate: [106.70, 10.78] as [number, number],
        title: 'Chợ Bến Thành',
      };

      const { getByLabelText, getByTestId } = await render(
        <NavigationBottomSheet
          {...baseProps}
          plannedRouteOrigin={[106.68, 10.77]}
          selectedDestination={destination}
          isNavigating={true}
          remainingNavDuration={300}
          remainingNavDistance={1500}
        />
      );

      const minimizeNavBtn = getByLabelText('Thu nhỏ bảng điều hướng');
      await act(async () => {
        fireEvent.press(minimizeNavBtn);
      });
      expect(mockOnSnapTo).toHaveBeenCalledWith(0);

      const stopBtn = getByTestId('btn-stop-navigation');
      await act(async () => {
        fireEvent.press(stopBtn);
      });
      expect(mockOnCloseRoute).toHaveBeenCalled();
    });
  });
});
