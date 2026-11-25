import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Animated, Platform } from 'react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockSetNavigationActive = jest.fn();
const mockSetActivePresetId = jest.fn().mockResolvedValue(undefined);
const mockRefetchPresets = jest.fn().mockResolvedValue(undefined);
const mockRefetchWallet = jest.fn().mockResolvedValue(undefined);
const mockSnapTo = jest.fn();
const mockCycleSnap = jest.fn();
const mockResetReroute = jest.fn();
const mockStartGpsListening = jest.fn().mockResolvedValue(undefined);
const mockSetUserCoordinate = jest.fn();
const mockInitiateSessionMutate = jest.fn();
const mockConfirmSignPresence = jest.fn();
const mockResolveLocation = jest.fn();
const mockGetNavigationRoute = jest.fn();
const mockGetStorageItemAsync = jest.fn();
const mockSetStorageItemAsync = jest.fn();
const mockSpeechSetEnabled = jest.fn();
const mockEnsureLocationPermission = jest.fn();
const mockFetchFreshGpsPosition = jest.fn();
const mockGetMapLibre = jest.fn();

let mockParams: Record<string, string | undefined> = {};
let mockSessionObj: any = { accessToken: 'nav-token', account: { id: 'u-nav' } };
let mockSavedRouteData: any = null;
let mockSavedRouteSignsData: any = null;
let mockWalletBalance = 100;
let mockUserCoordinate: [number, number] | undefined = undefined;
let mockPresets: any[] = [];
let mockActivePresetId: string | null = null;
let mockActiveCategories: Set<any> = new Set(['WARNING', 'MANDATORY', 'PROHIBITORY', 'INFORMATION', 'TEMPORARY']);
let mockRouteMap: Record<string, any> = {};
let mockBoundsSigns: any[] = [];
let mockBoundsError: any = null;
let mockPlannedSigns: any[] = [];
let mockRouteSignsError: any = null;
let mockActiveSignAlert: any = null;
let capturedAutoRerouteOpts: any = null;
let capturedBottomSheetProps: any = null;
let capturedTopControlsProps: any = null;
let capturedFilterCardProps: any = null;
let capturedBookmarkProps: any = null;
let capturedCompleteModalProps: any = null;
let capturedMapProps: any = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      cb();
    }, [cb]);
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View: RNView } = require('react-native');
  return {
    SafeAreaView: (props: any) => <RNView {...props}>{props.children}</RNView>,
    useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const { View: RNView } = require('react-native');
  return {
    Ionicons: (p: any) => <RNView testID={`ion-${p.name}`} {...p} />,
    MaterialCommunityIcons: (p: any) => <RNView testID={`mc-${p.name}`} {...p} />,
    MaterialIcons: (p: any) => <RNView testID={`mi-${p.name}`} {...p} />,
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    neutral: '#F1F5F9',
  }),
}));

jest.mock('@/context/session-provider', () => ({
  useOptionalSession: () => ({ session: mockSessionObj }),
}));

jest.mock('@/context/navigation-active-provider', () => ({
  useNavigationActive: () => ({ setNavigationActive: mockSetNavigationActive }),
}));

jest.mock('@/context/sign-filter-provider', () => ({
  useSignFilter: () => ({
    activeCategories: mockActiveCategories,
    activePreset: mockPresets.find((p) => p.id === mockActivePresetId) ?? null,
    activePresetId: mockActivePresetId,
    presets: mockPresets,
    refetchPresets: mockRefetchPresets,
    setActivePresetId: mockSetActivePresetId,
  }),
}));

jest.mock('@/feature/saved-routes/hooks/use-saved-routes', () => ({
  useGetSavedRoute: () => ({ data: mockSavedRouteData }),
  useGetSavedRouteSigns: () => ({ data: mockSavedRouteSignsData }),
}));

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useGetWallet: () => ({
    data: { wallet: { balance: mockWalletBalance } },
    refetch: mockRefetchWallet,
  }),
}));

jest.mock('@/feature/notifications/hooks/use-notifications', () => ({
  useGetUnreadNotificationCount: () => ({ data: 0 }),
}));

jest.mock('@/feature/navigation/hooks/use-native-gps', () => ({
  useNativeGps: () => ({
    userCoordinate: mockUserCoordinate,
    setUserCoordinate: mockSetUserCoordinate,
    startGpsListening: mockStartGpsListening,
  }),
}));

jest.mock('@/feature/navigation/hooks/use-auto-reroute', () => ({
  useAutoReroute: (opts: any) => {
    capturedAutoRerouteOpts = opts;
    return { resetReroute: mockResetReroute };
  },
}));

jest.mock('@/feature/navigation/hooks/use-navigation-sheet-gesture', () => {
  const { Animated: RNAnimated } = require('react-native');
  return {
    useNavigationSheetGesture: () => ({
      sheetSnapIndex: 1,
      snapTo: mockSnapTo,
      cycleSnap: mockCycleSnap,
      sheetHeightAnim: new RNAnimated.Value(200),
      sheetPanResponder: { panHandlers: {} },
      expandableContentOpacity: new RNAnimated.Value(1),
    }),
  };
});

jest.mock('@/feature/navigation/hooks/use-navigation', () => ({
  useGetNavigationRoute: (origin: any, dest: any, mode: string) => {
    if (!origin || !dest) return { data: undefined, isLoading: false, error: null };
    return mockRouteMap[mode] ?? { data: undefined, isLoading: false, error: null };
  },
  useInitiateNavigationSession: () => ({
    mutateAsync: mockInitiateSessionMutate,
  }),
}));

jest.mock('@/feature/navigation/hooks/use-signs', () => ({
  useGetSignsInBounds: () => ({ data: mockBoundsSigns, error: mockBoundsError }),
  useGetSignsAlongRoute: () => ({ data: mockPlannedSigns, error: mockRouteSignsError }),
}));

jest.mock('@/feature/navigation/hooks/use-sign-proximity-alert', () => ({
  useSignProximityAlert: () => ({ activeAlert: mockActiveSignAlert }),
}));

jest.mock('@/api/navigation/navigation', () => ({
  ...jest.requireActual('@/api/navigation/navigation'),
  getNavigationRoute: (...args: any[]) => mockGetNavigationRoute(...args),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: (...args: any[]) => mockResolveLocation(...args),
  formatResolvedLocationTitle: (res: any) => res?.displayName || 'Vị trí đã phân giải',
}));

jest.mock('@/api/sign-map/sign-map', () => ({
  confirmSignPresence: (...args: any[]) => mockConfirmSignPresence(...args),
}));

jest.mock('@/services/speech', () => ({
  speechService: {
    setEnabled: (...args: any[]) => mockSpeechSetEnabled(...args),
  },
}));

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: (...args: any[]) => mockGetStorageItemAsync(...args),
  setStorageItemAsync: (...args: any[]) => mockSetStorageItemAsync(...args),
}));

jest.mock('@/feature/navigation/utils/gps', () => ({
  ensureLocationPermission: (...args: any[]) => mockEnsureLocationPermission(...args),
  fetchFreshGpsPosition: (...args: any[]) => mockFetchFreshGpsPosition(...args),
}));

jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => mockGetMapLibre(),
}));

jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const { View: RNView } = require('react-native');
  return {
    NavigationMapView: (props: any) => {
      capturedMapProps = props;
      return <RNView testID="nav-map-view" {...props} />;
    },
  };
});

jest.mock('@/feature/navigation/components/navigation-bottom-sheet', () => {
  const { View: RNView, Pressable: RNPressable, Text: RNText } = require('react-native');
  return {
    NavigationBottomSheet: (props: any) => {
      capturedBottomSheetProps = props;
      return (
        <RNView testID="nav-bottom-sheet">
          <RNPressable testID="bs-begin-nav" onPress={() => void props.onBeginNavigation?.()}>
            <RNText>Begin</RNText>
          </RNPressable>
          <RNPressable testID="bs-close-route" onPress={() => void props.onCloseRoute?.()}>
            <RNText>Close</RNText>
          </RNPressable>
          <RNPressable testID="bs-go" onPress={() => void props.onGo?.()}>
            <RNText>Go</RNText>
          </RNPressable>
        </RNView>
      );
    },
  };
});

jest.mock('@/feature/navigation/components/navigation-top-controls', () => {
  const { View: RNView } = require('react-native');
  return {
    NavigationTopControls: (props: any) => {
      capturedTopControlsProps = props;
      return <RNView testID="nav-top-controls" />;
    },
  };
});

jest.mock('@/feature/navigation/components/home-sign-filter-card', () => {
  const { View: RNView } = require('react-native');
  return {
    HomeSignFilterCard: (props: any) => {
      capturedFilterCardProps = props;
      return <RNView testID="home-sign-filter-card" />;
    },
  };
});

jest.mock('@/feature/navigation/components/bookmark-route-modal', () => {
  const { View: RNView } = require('react-native');
  return {
    BookmarkRouteModal: (props: any) => {
      capturedBookmarkProps = props;
      return <RNView testID="bookmark-route-modal" />;
    },
  };
});

jest.mock('@/feature/navigation/components/navigation-complete-modal', () => {
  const { View: RNView } = require('react-native');
  return {
    NavigationCompleteModal: (props: any) => {
      capturedCompleteModalProps = props;
      return <RNView testID="complete-modal" />;
    },
  };
});

jest.mock('@/feature/navigation/components/navigation-upcoming-signs', () => {
  const { View: RNView } = require('react-native');
  return {
    NavigationUpcomingSigns: (props: any) => <RNView testID="upcoming-signs" {...props} />,
  };
});

jest.mock('@/components/navigation-maneuver-banner', () => {
  const { View: RNView } = require('react-native');
  return {
    NavigationManeuverBanner: (props: any) => <RNView testID="maneuver-banner" {...props} />,
  };
});

jest.mock('@/components/navigation-sign-verify-card', () => {
  const { View: RNView, Pressable: RNPressable, Text: RNText } = require('react-native');
  return {
    NavigationSignVerifyCard: (props: any) => (
      <RNView testID="verify-card">
        <RNPressable testID="verify-present" onPress={() => props.onVerify(props.sign, 'present')}>
          <RNText>Present</RNText>
        </RNPressable>
        <RNPressable testID="verify-absent" onPress={() => props.onVerify(props.sign, 'absent')}>
          <RNText>Absent</RNText>
        </RNPressable>
        <RNPressable testID="verify-dismiss" onPress={() => props.onDismiss()}>
          <RNText>Dismiss</RNText>
        </RNPressable>
      </RNView>
    ),
  };
});

jest.mock('@/components/toast', () => {
  const { Text: RNText } = require('react-native');
  return {
    AppToast: (props: any) => <RNText testID="app-toast">{props.message}</RNText>,
  };
});

import { NavigationMapScreen } from '@/feature/navigation/pages/navigation-map-screen';

describe('NavigationMapScreen branch coverage', () => {
  const sampleRoute = {
    coordinates: [
      [106.7, 10.77],
      [106.702, 10.77],
      [106.705, 10.77],
    ],
    distance: 1000,
    duration: 300,
    geometry: 'geom',
    steps: [
      { maneuver: { type: 'depart', location: [106.7, 10.77] }, distance: 100, duration: 30 },
      { maneuver: { type: 'turn', modifier: 'right', location: [106.702, 10.77] }, distance: 400, duration: 120 },
    ],
  };

  const sampleSigns = [
    {
      id: 'sig-1',
      coordinate: [106.701, 10.77],
      signCode: 'P.102',
      name: 'Cấm đi ngược chiều',
      category: 'PROHIBITORY',
      status: 'VERIFIED',
      imageUrl: 'mock/local.png',
      actualCropUrl: 's3://crop/1.jpg',
    },
    {
      id: 'sig-2',
      coordinate: [106.7015, 10.77],
      signCode: 'W.201',
      name: 'Chỗ ngoặt',
      category: 'WARNING',
      status: 'VERIFIED',
      actualFrameURl: 's3://frame/2.jpg',
      imageUrl: 'https://cdn.example.com/2.jpg',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    mockParams = {};
    mockSessionObj = { accessToken: 'nav-token', account: { id: 'u-nav' } };
    mockSavedRouteData = null;
    mockSavedRouteSignsData = null;
    mockWalletBalance = 100;
    mockUserCoordinate = undefined;
    mockPresets = [];
    mockActivePresetId = null;
    mockActiveCategories = new Set(['WARNING', 'MANDATORY', 'PROHIBITORY', 'INFORMATION', 'TEMPORARY']);
    mockRouteMap = {};
    mockBoundsSigns = [];
    mockBoundsError = null;
    mockPlannedSigns = [];
    mockRouteSignsError = null;
    mockActiveSignAlert = null;
    mockGetStorageItemAsync.mockResolvedValue('false');
    mockSetStorageItemAsync.mockResolvedValue(undefined);
    mockResolveLocation.mockResolvedValue({ displayName: 'Bến Thành' });
    mockGetMapLibre.mockReturnValue({});
    mockEnsureLocationPermission.mockResolvedValue(true);
    mockFetchFreshGpsPosition.mockResolvedValue([106.7, 10.77]);
    mockInitiateSessionMutate.mockResolvedValue({});
    mockConfirmSignPresence.mockResolvedValue({ creditsAwarded: 2, revalidationTaskId: 'rt-1' });
  });

  afterEach(() => {
    cleanup();
  });

  it('covers savedRoute hydration (CYCLING/WALKING/BIKE), preset matching, category filtering, bounds error toast, and handleCurrentLocation errors', async () => {
    mockParams = { savedRouteId: 'sr-1', vehicleMode: 'PEDESTRIAN' };
    mockSavedRouteData = {
      id: 'sr-1',
      title: 'Tuyến lưu',
      originLatitude: 10.77,
      originLongitude: 106.7,
      originName: 'Điểm A',
      destinationLatitude: 10.775,
      destinationLongitude: 106.705,
      destinationName: 'Điểm B',
      vehicleMode: 'CYCLING',
    };
    mockSavedRouteSignsData = { signs: sampleSigns };
    mockPresets = [
      { id: 'sr-1', savedRoute: mockSavedRouteData },
      {
        id: 'p-match-coord',
        savedRoute: {
          id: 'p-match-coord',
          originLatitude: 10.7701,
          originLongitude: 106.7001,
          destinationLatitude: 10.7751,
          destinationLongitude: 106.7051,
        },
      },
      { id: 'p-no-sr' },
    ];
    mockActivePresetId = 'sr-1';
    mockRouteMap = { CYCLING: { data: sampleRoute, isLoading: false, error: null } };

    const screen = await render(<NavigationMapScreen />);
    expect(mockSetActivePresetId).toHaveBeenCalledWith('sr-1');
    expect(mockSnapTo).toHaveBeenCalledWith(1);

    // Filter card toggle mode, manual category toggle, select preset, selectAll
    await act(async () => {
      capturedFilterCardProps.onToggleFilterViewMode();
    });
    await act(async () => {
      capturedFilterCardProps.onToggleManualCategory('WARNING');
    });
    await act(async () => {
      capturedFilterCardProps.onSelectPreset('sr-1');
      capturedFilterCardProps.onSelectPreset(null);
      capturedFilterCardProps.onNavigateToProfileFilter();
      capturedFilterCardProps.onClose();
    });
    expect(mockPush).toHaveBeenCalledWith('/profile/sign-filters');

    // BottomSheet selectAllManualCategories & bookmark modal callbacks
    await act(async () => {
      capturedBottomSheetProps.onSelectAllManualCategories(false);
      capturedBottomSheetProps.onSelectAllManualCategories(true);
      capturedBottomSheetProps.onOpenBookmarkModal();
    });
    await act(async () => {
      capturedBookmarkProps.onSaved('sr-new');
      capturedBookmarkProps.onShowToast('Đã lưu tuyến');
      capturedBookmarkProps.onClose();
    });

    // Home location button when MapLibre unavailable, then permission denied, then GPS unavailable
    cleanup();
    mockParams = {};
    mockSavedRouteData = null;
    mockSavedRouteSignsData = null;
    mockBoundsError = new Error('bounds err');
    mockGetMapLibre.mockReturnValue(null);

    const homeScreen = await render(<NavigationMapScreen />);
    expect(homeScreen.getByText('Không thể tải danh sách biển báo giao thông.')).toBeTruthy();

    await fireEvent.press(homeScreen.getByLabelText('Về vị trí hiện tại'));
    await waitFor(() => {
      expect(homeScreen.getAllByText(/cần bản dựng gốc|MapLibre/i).length).toBeGreaterThan(0);
    });

    mockGetMapLibre.mockReturnValue({});
    mockEnsureLocationPermission.mockResolvedValueOnce(false);
    await fireEvent.press(homeScreen.getByLabelText('Về vị trí hiện tại'));

    mockEnsureLocationPermission.mockResolvedValueOnce(true);
    mockFetchFreshGpsPosition.mockResolvedValueOnce(null);
    await fireEvent.press(homeScreen.getByLabelText('Về vị trí hiện tại'));
  });

  it('covers reviewer return flow, insufficient credits gate, session API 400 error, sign verify present/absent/error, and navigation complete modal', async () => {
    mockParams = {
      destinationId: 'd-rev',
      destinationLat: '10.77',
      destinationLng: '106.705',
      destinationTitle: 'Đích R',
      startLat: '10.77',
      startLng: '106.7',
      vehicleMode: 'MOTORCYCLE',
      returnToReviewer: 'true',
      reviewerSubmissionId: 'rev-sub-9',
      reviewerReturnPath: '/work/revalidation-review',
    };
    mockWalletBalance = 1; // insufficient credits (< 5)
    mockRouteMap = { BIKE: { data: sampleRoute, isLoading: false, error: null } };

    const screen = await render(<NavigationMapScreen />);

    // Attempt begin navigation with < 5 credits
    await fireEvent.press(screen.getByTestId('bs-begin-nav'));
    expect(mockInitiateSessionMutate).not.toHaveBeenCalled();

    // Update balance >= 5 and fail session initiation with 400
    mockWalletBalance = 50;
    await screen.rerender(<NavigationMapScreen />);
    mockInitiateSessionMutate.mockRejectedValueOnce({ status: 400, message: 'Insufficient credit' });
    await fireEvent.press(screen.getByTestId('bs-begin-nav'));

    // Succeed initiation & render maneuver banner + sign verify card
    mockUserCoordinate = [106.7005, 10.77];
    mockPlannedSigns = sampleSigns;
    mockActiveSignAlert = { sign: sampleSigns[0], distanceMeters: 40 };
    mockInitiateSessionMutate.mockResolvedValueOnce({});

    await screen.rerender(<NavigationMapScreen />);
    await fireEvent.press(screen.getByTestId('bs-begin-nav'));

    await waitFor(() => {
      expect(screen.getByTestId('maneuver-banner')).toBeTruthy();
      expect(screen.getByTestId('verify-card')).toBeTruthy();
    });

    // Reroute callbacks
    await act(async () => {
      capturedAutoRerouteOpts.onRerouteTriggered([106.7008, 10.7701]);
      capturedAutoRerouteOpts.onRerouteApplied([106.7008, 10.7701]);
      capturedAutoRerouteOpts.onClearNavigationError();
    });

    // Verify present -> invalidate wallet + signs
    await fireEvent.press(screen.getByTestId('verify-present'));
    expect(mockConfirmSignPresence).toHaveBeenCalledWith(
      'sig-1',
      expect.objectContaining({ isPresent: true }),
      'nav-token',
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['wallet-balance'] });

    // Trigger absent verify & error catch branch on second sign
    mockActiveSignAlert = { sign: sampleSigns[1], distanceMeters: 25 };
    await screen.rerender(<NavigationMapScreen />);
    await fireEvent.press(screen.getByTestId('verify-absent'));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['revalidation-tasks-in-bounds'],
    });

    mockConfirmSignPresence.mockRejectedValueOnce(new Error('vote error'));
    mockActiveSignAlert = {
      sign: { ...sampleSigns[1], id: 'sig-3', coordinate: [106.702, 10.77] },
      distanceMeters: 20,
    };
    await screen.rerender(<NavigationMapScreen />);
    await fireEvent.press(screen.getByTestId('verify-absent'));

    // Dismiss verify card on another sign
    mockActiveSignAlert = {
      sign: { ...sampleSigns[1], id: 'sig-4', coordinate: [106.7025, 10.77] },
      distanceMeters: 15,
    };
    await screen.rerender(<NavigationMapScreen />);
    await fireEvent.press(screen.getByTestId('verify-dismiss'));

    // Floating recenter + TTS toggle during nav
    await fireEvent.press(screen.getByTestId('btn-recenter-map'));
    await fireEvent.press(screen.getByTestId('btn-toggle-tts-nav'));

    // Close active navigation -> stops nav, then close route returns to reviewer
    await fireEvent.press(screen.getByTestId('bs-close-route'));
    await fireEvent.press(screen.getByTestId('bs-close-route'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/work/revalidation-review',
      params: { targetSubmissionId: 'rev-sub-9' },
    });

    // Dismiss complete modal
    await act(async () => {
      capturedCompleteModalProps.onDismiss();
    });
  });

  it('covers handleGo permission denied/success/failure and direct route fetch fallback in handleBeginNavigation', async () => {
    mockParams = {
      destinationId: 'd-go',
      destinationLat: '10.77',
      destinationLng: '106.705',
      startLat: '10.77',
      startLng: '106.7',
      vehicleMode: 'WALKING',
      isFreeNavigation: 'true',
    };
    const screen = await render(<NavigationMapScreen />);

    // handleBeginNavigation when activeRouteResult is undefined tries getNavigationRoute fallback
    mockGetNavigationRoute.mockResolvedValueOnce(sampleRoute);
    await fireEvent.press(screen.getByTestId('bs-begin-nav'));
    await waitFor(() => {
      expect(mockGetNavigationRoute).toHaveBeenCalled();
    });

    // handleGo branches
    mockEnsureLocationPermission.mockResolvedValueOnce(false);
    await fireEvent.press(screen.getByTestId('bs-go'));

    mockEnsureLocationPermission.mockResolvedValueOnce(true);
    mockFetchFreshGpsPosition.mockResolvedValueOnce([106.7, 10.77]);
    await fireEvent.press(screen.getByTestId('bs-go'));
    expect(mockSetUserCoordinate).toHaveBeenCalledWith([106.7, 10.77]);

    mockEnsureLocationPermission.mockResolvedValueOnce(true);
    mockFetchFreshGpsPosition.mockResolvedValueOnce(null);
    await fireEvent.press(screen.getByTestId('bs-go'));
  });
});
